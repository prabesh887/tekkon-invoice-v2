"use client"

import { SalaryRow } from "@/types/types"
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
  onDataChange,
}: {
  data: SalaryRow[]
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
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <TableRow
                key={index}
                className={`${
                  index % 2 === 0
                    ? "bg-gray-100 dark:bg-black"
                    : "bg-white dark:bg-gray-900"
                }`}
              >
                <TableCell>{index + 1}</TableCell>
                {Object.keys(row).map((key) =>
                  key !== "status" && key !== "sn" ? (
                    <TableCell key={key}>
                      <input
                        value={row[key as keyof SalaryRow] as string | number}
                        onChange={(e) =>
                          handleEdit(
                            index,
                            key as keyof SalaryRow,
                            e.target.value
                          )
                        }
                        className="min-w-min h-8"
                      />
                    </TableCell>
                  ) : null
                )}
                <TableCell>
                  <Badge
                    variant={row.status === "sent" ? "default" : "destructive"}
                    className="capitalize"
                  >
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
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
