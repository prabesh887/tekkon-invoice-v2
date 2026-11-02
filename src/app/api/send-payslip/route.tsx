import React from "react"
import { NextRequest, NextResponse } from "next/server"
import emailTemplate from "@/template/email-template"
import PayslipPDF from "@/template/PayslipPDF"
import { pdf } from "@react-pdf/renderer"
import nodemailer from "nodemailer"

import { SalaryRow } from "@/types/types"
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

  // Enable detailed SMTP logs only during development.
  logger: process.env.NODE_ENV !== "production",
  debug: process.env.NODE_ENV !== "production",

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

function rateLimitedResponse(windowMs: number) {
  return NextResponse.json(
    {
      success: false,
      message: "Too many payslip requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(windowMs / 1000)),
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    // Block early before doing any work.
    if (ipSendLimiter.isBlocked(ip)) {
      return rateLimitedResponse(IP_SEND_WINDOW_MS)
    }

    // ---------------------------------------------------------
    // Parse + validate request body
    // ---------------------------------------------------------

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      )
    }

    const parsed = payslipRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          issues: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      )
    }

    const { userData, month, year, recipientEmail } = parsed.data

    // ---------------------------------------------------------
    // Make sure recipient matches employee record
    // ---------------------------------------------------------

    if (
      userData.email &&
      userData.email.toLowerCase() !== recipientEmail.toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Recipient email does not match employee record.",
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
      return NextResponse.json(
        {
          success: false,
          message: sanityErrors.join(". "),
        },
        { status: 400 }
      )
    }

    // Cap how often the same address can be emailed.
    if (recipientSendLimiter.isBlocked(recipientEmail)) {
      return rateLimitedResponse(RECIPIENT_SEND_WINDOW_MS)
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

    const pdfBlob = await pdf(<PayslipPDF userData={payslipData} />).toBlob()

    // React PDF gives us a Blob.
    // Convert it to a Node.js Buffer for Nodemailer.
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    // ---------------------------------------------------------
    // Generate email HTML
    // ---------------------------------------------------------

    const html = await emailTemplate(payslipData)

    // ---------------------------------------------------------
    // Send email
    // ---------------------------------------------------------

    await transporter.sendMail({
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

    return NextResponse.json(
      {
        success: true,
        message: "Payslip sent successfully",
        recipientEmail,
      },
      { status: 200 }
    )
  } catch (error) {
    // Log the detailed error on the server (server-only, no PII exposed).
    if (process.env.NODE_ENV !== "production") {
      console.error("Payslip sending failed:", error)
    }

    // Never expose SMTP/internal errors to the browser.
    return NextResponse.json(
      {
        success: false,
        message: "Unable to send payslip. Please try again.",
      },
      { status: 500 }
    )
  }
}
