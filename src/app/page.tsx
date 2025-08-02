"use client"

import React, { useCallback, useState } from "react"
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

  // Stubbed email API call
  const sendEmailToUser = useCallback(
    async (email: string, month: string): Promise<void> => {
      console.log("🚀 ~ month:", month)
      // Replace with your real API endpoint
      // await fetch(`/api/sendSalaryEmail`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, month }),
      // })
      toast.success(`Sent to ${email}`)
    },
    []
  )

  // Queue processing: send one by one
  const processQueue = useCallback(
    async (month: string) => {
      if (isProcessing) return
      setIsProcessing(true)

      const snapshot = [...tableData]
      for (const { email } of snapshot) {
        // mark sending
        setTableData((rows) =>
          rows.map((r) =>
            r.email === email
              ? { ...r, status: "pending" } // Corrected to match the SalaryRow type
              : r
          )
        )

        try {
          await sendEmailToUser(email, month)
          setTableData((rows) =>
            rows.map((r) => (r.email === email ? { ...r, status: "sent" } : r))
          )
        } catch {
          toast.error(`Failed for ${email}`)
          setTableData((rows) =>
            rows.map((r) =>
              r.email === email
                ? { ...r, status: "failed" as "pending" | "sent" }
                : r
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
          <UploadCsv onUpload={setTableData} />
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="flex justify-between mb-2 items-baseline">
              <div>
                <h1 className="text-3xl font-bold">Salary Table</h1>
                <p className="text-sm text-muted-foreground">
                  Click on the cell to edit the value
                </p>
              </div>
              <SendEmail onMonthSelect={processQueue} disabled={isProcessing} />
            </div>

            <SalaryTable data={tableData} onDataChange={setTableData} />
          </div>
        )}
      </div>
      <Toaster duration={3000} richColors position="bottom-right" />
    </main>
  )
}
