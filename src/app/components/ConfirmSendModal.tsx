"use client"

import React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmSendModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  recordCount: number
  month?: string
  year?: string
}

export function ConfirmSendModal({
  isOpen,
  onOpenChange,
  onConfirm,
  recordCount,
  month,
  year,
}: ConfirmSendModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Mass Emailing</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to send payslips to{" "}
            <span className="font-semibold text-foreground">
              {recordCount} recipient{recordCount > 1 ? "s" : ""}
            </span>{" "}
            {month && year && (
              <>
                for{" "}
                <span className="font-semibold text-foreground">
                  {month} {year}
                </span>
              </>
            )}
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirm & Send
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
