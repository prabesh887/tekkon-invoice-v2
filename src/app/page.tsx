"use client"

import React, { useCallback, useMemo, useRef, useState } from "react"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { toast } from "sonner"

import { SalaryRow } from "@/types/types"
import {
  FIELD_LABELS,
  getRowErrors,
  hasRowErrors,
  RowErrors,
} from "@/lib/payslip-validation"
import Header from "@/components/Header"

import { ConfirmSendModal } from "./components/ConfirmSendModal"
import { CsvSample } from "./components/CsvSample"
import { SalaryTable } from "./components/SalaryTable"
import SendEmail from "./components/SendEmail"
import { Button } from "./components/ui/button"
import { Toaster } from "./components/ui/sonner"
import UploadCsv from "./components/UploadCsv"

const MAX_LISTED_ERRORS = 15

export default function Home() {
  const { status } = useSession()

  const [tableData, setTableData] = useState<SalaryRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Re-validated on every edit, so errors clear as cells are fixed.
  const rowErrors = useMemo(() => tableData.map(getRowErrors), [tableData])

  const invalidRowCount = tableData.filter(
    (row, index) => row.status !== "sent" && hasRowErrors(rowErrors[index])
  ).length

  // One line per bad cell, e.g. "Row 2 (Jane) · CIT Deduction: Use 0…".
  const errorSummary = tableData.flatMap((row, index) =>
    row.status === "sent"
      ? []
      : Object.entries(rowErrors[index]).map(
          ([field, message]) =>
            `Row ${index + 1} (${row.nameOfTheEmployee || "no name"}) · ${
              FIELD_LABELS[field as keyof RowErrors]
            }: ${message}`
        )
  )

  const pendingDateRef = useRef<{
    month: string
    year: string
  } | null>(null)

  const sendEmailToUser = useCallback(
    async (email: string, month: string, year: string, user: SalaryRow) => {
      const response = await fetch("/api/send-payslip", {
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

      // Session expired
      if (response.status === 401) {
        await signOut({
          redirectTo: "/login",
        })

        throw new Error("Session expired. Please log in again.")
      }

      // Try to read the API response.
      let result: {
        success?: boolean
        message?: string
        requestId?: string
      } = {}

      try {
        result = await response.json()
      } catch {
        // API returned an empty/non-JSON response.
      }

      if (!response.ok) {
        const message =
          result.message || `Failed to send payslip (${response.status})`

        // The request ID matches the server logs, so it can be traced later.
        throw new Error(
          result.requestId ? `${message} (ref: ${result.requestId})` : message
        )
      }

      return result
    },
    []
  )

  const processQueue = useCallback(
    async (month: string, year: string, rowsToProcess: SalaryRow[]) => {
      if (isProcessing || rowsToProcess.length === 0) {
        return
      }

      setIsProcessing(true)

      let sentCount = 0
      let failedCount = 0

      try {
        for (const row of rowsToProcess) {
          setTableData((rows) =>
            rows.map((currentRow) =>
              currentRow.email === row.email
                ? {
                    ...currentRow,
                    status: "pending",
                  }
                : currentRow
            )
          )

          try {
            await sendEmailToUser(row.email, month, year, row)

            sentCount++

            setTableData((rows) =>
              rows.map((currentRow) =>
                currentRow.email === row.email
                  ? {
                      ...currentRow,
                      status: "sent",
                    }
                  : currentRow
              )
            )
          } catch (error) {
            failedCount++

            console.error(`Failed to send payslip to ${row.email}:`, error)

            setTableData((rows) =>
              rows.map((currentRow) =>
                currentRow.email === row.email
                  ? {
                      ...currentRow,
                      status: "failed",
                    }
                  : currentRow
              )
            )
          }
        }

        if (failedCount === 0) {
          toast.success(`All ${sentCount} payslips sent successfully.`)
        } else {
          toast.warning(`${sentCount} sent, ${failedCount} failed.`)
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [isProcessing, sendEmailToUser]
  )

  const handleRequestSend = useCallback(
    (month: string, year: string) => {
      if (isProcessing || tableData.length === 0) {
        return
      }

      if (invalidRowCount > 0) {
        toast.error(
          `Fix the ${invalidRowCount} highlighted row(s) before sending.`
        )
        return
      }

      pendingDateRef.current = {
        month,
        year,
      }

      setShowConfirm(true)
    },
    [isProcessing, tableData.length, invalidRowCount]
  )

  const handleConfirmSend = useCallback(() => {
    if (!pendingDateRef.current || isProcessing) {
      return
    }

    const { month, year } = pendingDateRef.current

    // Don't send records that have already succeeded.
    const rowsToProcess = tableData.filter((row) => row.status !== "sent")

    setShowConfirm(false)

    void processQueue(month, year, rowsToProcess)
  }, [isProcessing, tableData, processQueue])

  const handleRetryFailed = useCallback(() => {
    if (!pendingDateRef.current || isProcessing) {
      return
    }

    if (invalidRowCount > 0) {
      toast.error(
        `Fix the ${invalidRowCount} highlighted row(s) before retrying.`
      )
      return
    }

    const { month, year } = pendingDateRef.current

    const failedRows = tableData.filter((row) => row.status === "failed")

    if (failedRows.length === 0) {
      toast.info("There are no failed payslips to retry.")
      return
    }

    void processQueue(month, year, failedRows)
  }, [isProcessing, invalidRowCount, tableData, processQueue])

  const handleReset = useCallback(() => {
    if (isProcessing) {
      return
    }

    setTableData([])
    setShowConfirm(false)

    pendingDateRef.current = null
  }, [isProcessing])

  const sentCount = tableData.filter((row) => row.status === "sent").length

  const failedCount = tableData.filter((row) => row.status === "failed").length

  const pendingCount = tableData.filter(
    (row) => row.status === "pending"
  ).length

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    )
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Redirecting to login...</p>
      </main>
    )
  }

  return (
    <main>
      <Header />
      <ConfirmSendModal
        isOpen={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleConfirmSend}
        recordCount={tableData.filter((row) => row.status !== "sent").length}
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
              onClick={handleReset}
              disabled={isProcessing}
              title="Back to Upload"
              className="hover:bg-primary hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold lg:text-3xl">Salary Table</h1>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{tableData.length} records</span>

                  {sentCount > 0 && (
                    <span className="text-green-600">✓ {sentCount} sent</span>
                  )}

                  {failedCount > 0 && (
                    <span className="text-red-600">✕ {failedCount} failed</span>
                  )}

                  {pendingCount > 0 && (
                    <span>⏳ {pendingCount} processing</span>
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Click on any cell to edit the value
                </p>
              </div>

              <div className="flex items-center gap-3">
                {failedCount > 0 && !isProcessing && (
                  <Button
                    variant="outline"
                    onClick={handleRetryFailed}
                    disabled={invalidRowCount > 0}
                  >
                    Retry Failed ({failedCount})
                  </Button>
                )}

                <SendEmail
                  onMonthSelect={handleRequestSend}
                  disabled={isProcessing || invalidRowCount > 0}
                />
              </div>
            </div>

            {isProcessing && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

                  <span>Sending payslips...</span>

                  <span className="text-muted-foreground">
                    {sentCount + failedCount} / {tableData.length}
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Please keep this page open until sending is complete.
                </p>
              </div>
            )}

            {invalidRowCount > 0 && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">
                    {invalidRowCount} of {tableData.length} rows have data
                    problems. Sending is disabled until they are fixed.
                  </p>
                  <p className="mt-1">
                    Fix the highlighted cells below, or correct the CSV and
                    upload it again.
                  </p>
                  <ul className="mt-2 list-disc space-y-0.5 pl-5">
                    {errorSummary.slice(0, MAX_LISTED_ERRORS).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  {errorSummary.length > MAX_LISTED_ERRORS && (
                    <p className="mt-1">
                      …and {errorSummary.length - MAX_LISTED_ERRORS} more.
                    </p>
                  )}
                </div>
              </div>
            )}

            <SalaryTable
              data={tableData}
              errors={rowErrors}
              onDataChange={setTableData}
            />
          </div>
        )}
      </div>
      <Toaster duration={3000} richColors position="bottom-right" />
    </main>
  )
}
