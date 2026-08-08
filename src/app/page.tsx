"use client"

import React, { useCallback, useRef, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { toast } from "sonner"

import { SalaryRow } from "@/types/types"
import Header from "@/components/Header"

import { ConfirmSendModal } from "./components/ConfirmSendModal"
import { CsvSample } from "./components/CsvSample"
import { SalaryTable } from "./components/SalaryTable"
import SendEmail from "./components/SendEmail"
import { Button } from "./components/ui/button"
import { Toaster } from "./components/ui/sonner"
import UploadCsv from "./components/UploadCsv"

export default function Home() {
  const { status } = useSession()

  const [tableData, setTableData] = useState<SalaryRow[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const pendingDateRef = useRef<{ month: string; year: string } | null>(null)

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
            month,
            year,
            recipientEmail: email,
          }),
        })

        if (!res.ok) {
          if (res.status === 401) {
            signOut({ redirectTo: "/login" })
            throw new Error("Session expired. Please log in again.")
          }
          const errorData = await res.json()
          throw new Error(errorData.message || "Failed to send payslip")
        }

        const result = await res.json()
        toast.success(`Payslip sent to ${email}`)
        return result
      } catch (error) {
        console.error("❌ Error sending payslip:", error)
        throw error
      }
    },
    []
  )

  // Queue processing: sends row by row with a small delay to avoid rate limits
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

        // ⏱️ Small delay (500ms) between emails to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      setIsProcessing(false)
    },
    [isProcessing, tableData, sendEmailToUser]
  )

  const handleRequestSend = (month: string, year: string) => {
    pendingDateRef.current = { month, year }
    setShowConfirm(true)
  }

  const handleConfirmSend = () => {
    if (pendingDateRef.current) {
      const { month, year } = pendingDateRef.current
      processQueue(month, year)
      setShowConfirm(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <ConfirmSendModal
        isOpen={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleConfirmSend}
        recordCount={tableData.length}
        month={pendingDateRef.current?.month}
        year={pendingDateRef.current?.year}
      />

      <div className="p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
        {tableData.length === 0 ? (
          <div className="space-y-6">
            <CsvSample />
            <UploadCsv onUpload={setTableData} />
          </div>
        ) : (
          <div className="w-full space-y-4 overflow-x-auto">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setTableData([])}
              title="Back to Upload"
              className="hover:bg-primary hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold lg:text-3xl">Salary Table</h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {tableData.length} records
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click on any cell to edit the value
                </p>
              </div>

              <div className="flex items-center gap-3">
                <SendEmail
                  onMonthSelect={handleRequestSend}
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
