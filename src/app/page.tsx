"use client"

import React, { useCallback, useState } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"

import { SalaryRow } from "@/types/types"
import Header from "@/components/Header"

import { SalaryTable } from "./components/SalaryTable"
import SendEmail from "./components/SendEmail"
import { Toaster } from "./components/ui/sonner"
import UploadCsv from "./components/UploadCsv"

export default function Home() {
  const [tableData, setTableData] = useState<SalaryRow[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const downloadSampleCSV = () => {
    // Create a link element and trigger download of the static CSV file
    const link = document.createElement("a")
    link.href = "/sample.csv"
    link.download = "sample-salary-data.csv"
    link.style.display = "none"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Sample CSV downloaded successfully!")
  }

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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Need a sample CSV file?
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Download our sample CSV template to see the expected format
                  </p>
                </div>
                <button
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Download size={16} />
                  Download Sample CSV
                </button>
              </div>

              {/* Expected Columns Table */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">
                  Expected CSV Columns:
                </h4>
                <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                    {[
                      "Name of the Employee",
                      "Email",
                      "Position",
                      "PAN Number",
                      "Account No.",
                      "W.D.",
                      "P.D.",
                      "Gross Salary",
                      "Basic Salary",
                      "Lumpsum Allowance",
                      "Salary Before TDS",
                      "PF Contribution",
                      "Overtime Days",
                      "OT Amount",
                      "BYOD Incentive",
                      "Negative Days",
                      "Amount",
                      "CIT Deduction",
                      "PF Deduction",
                      "Total Tax Deduction",
                      "Adjustment",
                      "Net Salary",
                    ].map((column, index) => (
                      <div
                        key={index}
                        className={`px-3 py-2 text-xs border-b border-r border-blue-100 ${
                          index % 2 === 0 ? "bg-blue-25" : "bg-white"
                        }`}
                      >
                        <span className="font-medium text-blue-800">
                          {index + 1}.
                        </span>
                        <span className="ml-2 text-blue-700">{column}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 <strong>Tip:</strong> Make sure your CSV file has exactly
                  these column headers in the first row
                </p>
              </div>
            </div>

            <UploadCsv onUpload={setTableData} />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="flex justify-between mb-6 items-baseline">
              <div>
                <h1 className="text-3xl font-bold">Salary Table</h1>
                <p className="text-sm text-muted-foreground">
                  Click on the cell to edit the value
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
