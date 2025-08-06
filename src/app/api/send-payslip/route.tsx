import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { pdf } from "@react-pdf/renderer"
import nodemailer from "nodemailer"
import emailTemplate from "template/email-template"
import PayslipPDF from "template/PayslipPDF"

import { SalaryRow } from "@/types/types"

// 🔁 Force Node.js runtime so Buffer, toBuffer, and nodemailer work
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { userData, month, year, recipientEmail } =
      (await request.json()) as {
        userData: SalaryRow
        month: string
        year: string
        recipientEmail: string
      }

    if (!userData || !month || !recipientEmail) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Inject month and year into userData
    userData.month = month
    userData.year = year

    // 💵 Helper: parse string amounts like '25,000' to numbers
    const parseAmount = (str: string | undefined | null) =>
      Number((str ?? "0").replace(/,/g, "")) || 0

    // ✅ Calculate total deduction and format it with commas
    userData.totalDeduction = (
      parseAmount(userData.citDeduction) +
      parseAmount(userData.pfDeduction) +
      parseAmount(userData.taxDeduction) +
      parseAmount(userData.adjustment) +
      parseAmount(userData.negativeAmount)
    ).toLocaleString("en-US")

    // ✅ Generate PDF buffer using @react-pdf/renderer
    const pdfBlob = await pdf(<PayslipPDF userData={userData} />).toBlob()
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    console.log("Pdf Generated Successfully")

    // ✅ Setup nodemailer with SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.AWS_USER_ACCESS_KEY,
        pass: process.env.AWS_SECRET_ACCESS_KEY,
      },
      logger: true,
      debug: true,
    })

    // ✅ Send email with HTML + PDF attachment
    await transporter.sendMail({
      from: `"Tekkon Accounts" <${process.env.EMAIL_FROM}>`,
      to: recipientEmail,
      subject: `Payslip for ${month} - ${userData.year}`,
      html: await emailTemplate(userData),
      attachments: [
        {
          filename: `Payslip-${month}.pdf`,
          content: pdfBuffer, // now it's a valid Buffer
        },
      ],
    })

    return NextResponse.json(
      { message: "Payslip sent successfully", recipientEmail },
      { status: 200 }
    )
  } catch (err) {
    console.error("Error sending payslip:", err)
    return NextResponse.json(
      { message: "Failed to send payslip", error: (err as Error).message, err },
      { status: 500 }
    )
  }
}

// Optionally increase the response limit for large PDFs
export const config = {
  api: {
    responseLimit: "10mb",
  },
}
