"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
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
  const { status } = useSession()
  const router = useRouter()

  const [tableData, setTableData] = useState<SalaryRow[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

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

      // Take a snapshot of the current table data
      const snapshot = [...tableData]

      for (const row of snapshot) {
        // Set status to pending
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

  // Loading States
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
      <div className="p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
        {tableData.length === 0 ? (
          <div className="space-y-6">
            <CsvSample />
            <UploadCsv onUpload={setTableData} />
          </div>
        ) : (
          <div className="w-full overflow-x-auto space-y-4">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setTableData([])}
              title="Back to Upload"
              className="hover:bg-primary hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold lg:text-3xl">Salary Table</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {tableData.length} records
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
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
