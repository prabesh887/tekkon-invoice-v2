import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { pdf } from "@react-pdf/renderer"
import nodemailer from "nodemailer"
import emailTemplate from "template/email-template"
import PayslipPDF from "template/PayslipPDF"

import { SalaryRow } from "@/types/types"

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

/**
 * Convert values such as:
 *
 * "25,000" → 25000
 * "1,500.50" → 1500.50
 * undefined → 0
 */
function parseAmount(value: string | number | undefined | null): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  return (
    Number(
      String(value ?? "0")
        .replace(/,/g, "")
        .trim()
    ) || 0
  )
}

/**
 * Basic email validation.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // Parse request body
    // ---------------------------------------------------------

    const body = await request.json()

    const { userData, month, year, recipientEmail } = body as {
      userData?: SalaryRow
      month?: string
      year?: string
      recipientEmail?: string
    }

    // ---------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------

    if (!userData || !month || !year || !recipientEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      )
    }

    // ---------------------------------------------------------
    // Validate email
    // ---------------------------------------------------------

    if (!isValidEmail(recipientEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid recipient email",
        },
        { status: 400 }
      )
    }

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
    // Create a new payslip object.
    //
    // Do NOT mutate userData received from the browser.
    // ---------------------------------------------------------

    const payslipData: SalaryRow = {
      ...userData,
      month,
      year,
    }

    // ---------------------------------------------------------
    // Calculate total deductions
    // ---------------------------------------------------------

    const totalDeduction =
      parseAmount(payslipData.citDeduction) +
      parseAmount(payslipData.pfDeduction) +
      parseAmount(payslipData.taxDeduction) +
      parseAmount(payslipData.adjustment) +
      parseAmount(payslipData.negativeAmount)

    payslipData.totalDeduction = totalDeduction.toLocaleString("en-US")

    // ---------------------------------------------------------
    // Generate PDF
    // ---------------------------------------------------------

    console.time("payslip-pdf")

    const pdfBlob = await pdf(<PayslipPDF userData={payslipData} />).toBlob()

    // React PDF gives us a Blob.
    // Convert it to a Node.js Buffer for Nodemailer.
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    console.timeEnd("payslip-pdf")

    // ---------------------------------------------------------
    // Generate email HTML
    // ---------------------------------------------------------

    const html = await emailTemplate(payslipData)

    // ---------------------------------------------------------
    // Send email
    // ---------------------------------------------------------

    console.time("send-email")

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

    console.timeEnd("send-email")

    // ---------------------------------------------------------
    // Log only safe information
    // ---------------------------------------------------------

    console.log("Payslip sent successfully:", {
      recipientEmail,
      messageId: info.messageId,
    })

    // ---------------------------------------------------------
    // Return success
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Payslip sent successfully",
        recipientEmail,
      },
      { status: 200 }
    )
  } catch (error) {
    // Log the detailed error on the server.
    console.error("Payslip sending failed:", error)

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
