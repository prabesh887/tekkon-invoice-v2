import React from "react"
import { NextRequest, NextResponse } from "next/server"
import emailTemplate from "@/template/email-template"
import PayslipPDF from "@/template/PayslipPDF"
import { pdf } from "@react-pdf/renderer"
import nodemailer from "nodemailer"

import { SalaryRow } from "@/types/types"
import { logger, serializeError } from "@/lib/logger"
import {
  parseAmount,
  payslipRequestSchema,
  sanityCheckValues,
} from "@/lib/payslip-validation"
import { createInMemoryRateLimiter, getClientIp } from "@/lib/rate-limiter"

// Force Node.js runtime for Buffer, React PDF, and Nodemailer.
export const runtime = "nodejs"

/**
 * Reuse the SMTP transporter when the Vercel function
 * instance stays warm.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,

  auth: {
    user: process.env.AWS_USER_ACCESS_KEY,
    pass: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // Full SMTP traces print every email's HTML and PDF (salary data
  // included), so they are off unless SMTP_DEBUG=true is set while
  // debugging a connection problem. Each send still logs one
  // payslip.sent / payslip.failed line via @/lib/logger.
  logger: process.env.SMTP_DEBUG === "true",
  debug: process.env.SMTP_DEBUG === "true",

  // Reuse SMTP connections where possible.
  pool: true,
  maxConnections: 2,
  maxMessages: 50,
})

// ---------------------------------------------------------
// Email-send rate limiting (in-memory, single instance).
//
// - Per IP: blocks scripted abuse from a single host while
//   staying generous enough for bulk payroll sends.
// - Per recipient: an employee receives one payslip per month,
//   so a per-address cap stops the endpoint from being used as
//   an open mail relay to arbitrary addresses.
//
// Override the caps with MAX_EMAILS_PER_IP and
// MAX_EMAILS_PER_RECIPIENT if your numbers differ.
// ---------------------------------------------------------

const MAX_EMAILS_PER_IP_DEFAULT = 500
const MAX_EMAILS_PER_RECIPIENT_DEFAULT = 5
const IP_SEND_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RECIPIENT_SEND_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours
const SEND_CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

function readPositiveEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name])
  return Number.isFinite(raw) && raw > 0 ? raw : fallback
}

const MAX_EMAILS_PER_IP = readPositiveEnv(
  "MAX_EMAILS_PER_IP",
  MAX_EMAILS_PER_IP_DEFAULT
)
const MAX_EMAILS_PER_RECIPIENT = readPositiveEnv(
  "MAX_EMAILS_PER_RECIPIENT",
  MAX_EMAILS_PER_RECIPIENT_DEFAULT
)

const ipSendLimiter = createInMemoryRateLimiter({
  maxFailures: MAX_EMAILS_PER_IP,
  windowMs: IP_SEND_WINDOW_MS,
})

const recipientSendLimiter = createInMemoryRateLimiter({
  maxFailures: MAX_EMAILS_PER_RECIPIENT,
  windowMs: RECIPIENT_SEND_WINDOW_MS,
})

// Avoid holding onto stale entries indefinitely.
const sendCleanupInterval = setInterval(() => {
  ipSendLimiter.cleanup()
  recipientSendLimiter.cleanup()
}, SEND_CLEANUP_INTERVAL_MS)

sendCleanupInterval.unref?.()

function rateLimitedResponse(windowMs: number, requestId: string) {
  return NextResponse.json(
    {
      success: false,
      message: "Too many payslip requests. Please try again later.",
      requestId,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(windowMs / 1000)),
      },
    }
  )
}

/** Which step of the send was running, so failures say where they broke. */
type SendStage = "parse" | "validate" | "pdf" | "template" | "smtp"

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startedAt = Date.now()
  const ip = getClientIp(request)
  let log = logger.child({
    requestId,
    vercelId: request.headers.get("x-vercel-id") ?? undefined,
    ip,
  })
  let stage: SendStage = "parse"

  try {
    // Block early before doing any work.
    if (ipSendLimiter.isBlocked(ip)) {
      log.warn("payslip.rejected", { reason: "ip_rate_limited" })
      return rateLimitedResponse(IP_SEND_WINDOW_MS, requestId)
    }

    // ---------------------------------------------------------
    // Parse + validate request body
    // ---------------------------------------------------------

    let body: unknown
    try {
      body = await request.json()
    } catch {
      log.warn("payslip.rejected", { reason: "invalid_json" })
      return NextResponse.json(
        { success: false, message: "Invalid JSON body", requestId },
        { status: 400 }
      )
    }

    stage = "validate"
    const parsed = payslipRequestSchema.safeParse(body)

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.message)
      log.warn("payslip.rejected", { reason: "validation_failed", issues })
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          issues,
          requestId,
        },
        { status: 400 }
      )
    }

    const { userData, month, year, recipientEmail } = parsed.data

    // Every log line from here on can be found by email or period.
    log = log.child({
      recipientEmail,
      employee: userData.nameOfTheEmployee,
      period: `${month}-${year}`,
    })

    // ---------------------------------------------------------
    // Make sure recipient matches employee record
    // ---------------------------------------------------------

    if (
      userData.email &&
      userData.email.toLowerCase() !== recipientEmail.toLowerCase()
    ) {
      log.warn("payslip.rejected", {
        reason: "recipient_mismatch",
        recordEmail: userData.email,
      })
      return NextResponse.json(
        {
          success: false,
          message: "Recipient email does not match employee record.",
          requestId,
        },
        { status: 400 }
      )
    }

    // ---------------------------------------------------------
    // Verify financial sanity
    // ---------------------------------------------------------

    const totalDeduction =
      parseAmount(userData.citDeduction) +
      parseAmount(userData.pfDeduction) +
      parseAmount(userData.taxDeduction) +
      parseAmount(userData.adjustment) +
      parseAmount(userData.negativeAmount)

    const sanityErrors = sanityCheckValues(userData)

    if (sanityErrors.length > 0) {
      log.warn("payslip.rejected", {
        reason: "sanity_check_failed",
        issues: sanityErrors,
      })
      return NextResponse.json(
        {
          success: false,
          message: sanityErrors.join(". "),
          requestId,
        },
        { status: 400 }
      )
    }

    // Cap how often the same address can be emailed.
    if (recipientSendLimiter.isBlocked(recipientEmail)) {
      log.warn("payslip.rejected", { reason: "recipient_rate_limited" })
      return rateLimitedResponse(RECIPIENT_SEND_WINDOW_MS, requestId)
    }

    // Count this send against both windows before contacting SMTP.
    ipSendLimiter.recordFailure(ip)
    recipientSendLimiter.recordFailure(recipientEmail)

    // ---------------------------------------------------------
    // Create the payslip object
    // ---------------------------------------------------------

    const payslipData = {
      ...userData,
      month,
      year,
      totalDeduction: totalDeduction.toLocaleString("en-US"),
    } as SalaryRow

    // ---------------------------------------------------------
    // Generate PDF
    // ---------------------------------------------------------

    stage = "pdf"
    const pdfBlob = await pdf(<PayslipPDF userData={payslipData} />).toBlob()

    // React PDF gives us a Blob.
    // Convert it to a Node.js Buffer for Nodemailer.
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    // ---------------------------------------------------------
    // Generate email HTML
    // ---------------------------------------------------------

    stage = "template"
    const html = await emailTemplate(payslipData)

    // ---------------------------------------------------------
    // Send email
    // ---------------------------------------------------------

    stage = "smtp"
    const info = await transporter.sendMail({
      from: `"Tekkon Accounts" <${process.env.EMAIL_FROM}>`,
      to: recipientEmail,

      subject: `Payslip for ${month} - ${year}`,

      html,

      attachments: [
        {
          filename: `Payslip-${month}-${year}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })

    // "Sent" means SES accepted the message. Bounces or spam-folder
    // delivery happen later and are only visible in SES itself.
    log.info("payslip.sent", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      smtpResponse: info.response,
      pdfBytes: pdfBuffer.length,
      durationMs: Date.now() - startedAt,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Payslip sent successfully",
        recipientEmail,
        requestId,
      },
      { status: 200 }
    )
  } catch (error) {
    log.error("payslip.failed", {
      stage,
      durationMs: Date.now() - startedAt,
      error: serializeError(error),
    })

    // Never expose SMTP/internal errors to the browser.
    return NextResponse.json(
      {
        success: false,
        message: "Unable to send payslip. Please try again.",
        requestId,
      },
      { status: 500 }
    )
  }
}
