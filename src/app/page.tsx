"use client"

import React, { useCallback, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { SalaryRow } from "@/types/types"
import Header from "@/components/Header"

import { CsvSample } from "./components/CsvSample"
import { SalaryTable } from "./components/SalaryTable"
import SendEmail from "./components/SendEmail"
import { Button } from "./components/ui/button"
import { Toaster } from "./components/ui/sonner"
import UploadCsv from "./components/UploadCsv"

export default function Home() {
  const [tableData, setTableData] = useState<SalaryRow[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const sendEmailToUser = useCallback(
    async (email: string, month: string, year: string, user: SalaryRow) => {
      try {
        const res = await fetch("/api/send-payslip", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userData: user,
            month: month,
            year: year,
            recipientEmail: email,
          }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(`Failed to send payslip: ${errorData.message}`)
        }

        const result = await res.json()
        console.log("✅ Payslip sent successfully:", result)
        toast.success(`Payslip sent to ${email}`)
        return result
      } catch (error) {
        console.error("❌ Error sending payslip:", error)
        throw error
      }
    },
    []
  )

  // Queue processing: send one by one
  const processQueue = useCallback(
    async (month: string, year: string) => {
      if (isProcessing) return
      setIsProcessing(true)

      const snapshot = [...tableData]
      for (const row of snapshot) {
        setTableData((rows) =>
          rows.map((r) =>
            r.email === row.email ? { ...r, status: "pending" } : r
          )
        )

        try {
          await sendEmailToUser(row.email, month, year, row)
          setTableData((rows) =>
            rows.map((r) =>
              r.email === row.email ? { ...r, status: "sent" } : r
            )
          )
        } catch {
          toast.error(`Failed for ${row.email}`)
          setTableData((rows) =>
            rows.map((r) =>
              r.email === row.email ? { ...r, status: "failed" } : r
            )
          )
        }
      }

      setIsProcessing(false)
    },
    [isProcessing, tableData, sendEmailToUser]
  )

  return (
    <main>
      <Header />
      <div className="min-h-screen p-8 pb-20 font-[family-name:var(--font-geist-sans)] gap-16">
        {tableData.length === 0 ? (
          <div className="space-y-6">
            {/* Sample CSV Download Section */}
            <CsvSample />
            <UploadCsv onUpload={setTableData} />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setTableData([])}
              title="Back to Upload"
              className="mb-2 hover:bg-primary hover:text-white"
            >
              <ArrowLeft />
            </Button>
            <div className="flex justify-between mb-6 items-baseline">
              {/* Back Button */}
              <div>
                {/* Heading */}
                <h1 className="text-2xl lg:text-3xl font-bold leading-tight shrink-0">
                  Salary Table
                </h1>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {tableData.length} records
                  </span>
                </div>

                {/* Instruction Text */}
                <p className="text-sm text-muted-foreground lg:flex-1">
                  Click on any cell to edit the value
                </p>
              </div>
              <div className="flex items-center gap-3">
                <SendEmail
                  onMonthSelect={processQueue}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <SalaryTable data={tableData} onDataChange={setTableData} />
          </div>
        )}
      </div>
      <Toaster duration={3000} richColors position="bottom-right" />
    </main>
  )
}
