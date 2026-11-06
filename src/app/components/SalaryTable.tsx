"use client"

import { SalaryRow } from "@/types/types"
import { hasRowErrors, RowErrors } from "@/lib/payslip-validation"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function SalaryTable({
  data,
  errors = [],
  onDataChange,
}: {
  data: SalaryRow[]
  /** Validation problems per row, in the same order as `data`. */
  errors?: RowErrors[]
  onDataChange: (newData: SalaryRow[]) => void
}) {
  const handleEdit = (
    index: number,
    field: keyof SalaryRow,
    value: string | number
  ) => {
    const newData = [...data]
    newData[index] = { ...newData[index], [field]: value }
    onDataChange(newData)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>S.N.</TableHead>
            <TableHead>Name of the Employee</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>PAN Number</TableHead>
            <TableHead>Account No.</TableHead>
            <TableHead>W.D.</TableHead>
            <TableHead>P.D.</TableHead>
            <TableHead>Gross Salary</TableHead>
            <TableHead>Basic Salary</TableHead>
            <TableHead>Lumpsum Allowance</TableHead>
            <TableHead>Salary Before TDS</TableHead>
            <TableHead>PF Contribution</TableHead>
            <TableHead>Overtime Days</TableHead>
            <TableHead>OT Amount</TableHead>
            <TableHead>BYOD Incentive</TableHead>
            <TableHead>Negative Days</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>CIT Deduction</TableHead>
            <TableHead>PF Deduction</TableHead>
            <TableHead>Total Tax Deduction</TableHead>
            <TableHead>Adjustment</TableHead>
            <TableHead>Net Salary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((row, index) => {
              const rowErrors = errors[index] ?? {}
              const isInvalid = row.status !== "sent" && hasRowErrors(rowErrors)

              return (
                <TableRow
                  key={index}
                  className={
                    isInvalid
                      ? "bg-red-50 dark:bg-red-950/40"
                      : index % 2 === 0
                        ? "bg-gray-100 dark:bg-black"
                        : "bg-white dark:bg-gray-900"
                  }
                >
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "sent" ? "success" : "destructive"
                      }
                      className="capitalize"
                    >
                      {isInvalid ? "invalid" : row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  {Object.entries(row).map(([key, value]) => {
                    if (key === "status" || key === "sn") return null
                    const cellError = rowErrors[key as keyof RowErrors]

                    return (
                      <TableCell key={key} className="align-top">
                        <input
                          value={(value as string | number | undefined) ?? ""}
                          onChange={(e) =>
                            handleEdit(
                              index,
                              key as keyof SalaryRow,
                              e.target.value
                            )
                          }
                          aria-invalid={!!cellError}
                          title={cellError}
                          className={
                            cellError
                              ? "min-w-min h-8 rounded border border-red-500 bg-white px-1 text-red-700 dark:bg-gray-900"
                              : "min-w-min h-8"
                          }
                        />
                        {cellError && (
                          <p className="mt-1 max-w-48 text-xs text-red-600">
                            {cellError}
                          </p>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={24} className="h-24 text-center">
                No salary data uploaded yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
