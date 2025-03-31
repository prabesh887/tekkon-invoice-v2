"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import Papa from "papaparse"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { SalaryRow } from "@/types/types"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export default function UploadCsv({
  onUpload,
}: {
  onUpload: (data: SalaryRow[]) => void
}) {
  const formSchema = z.object({
    csvFile: z
      .custom<FileList>((val) => val instanceof FileList, "Invalid file input")
      .refine((files) => files.length > 0, "A CSV file is required.")
      .refine(
        (files) => files[0]?.type === "text/csv",
        "Only CSV files are accepted."
      ),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      csvFile: undefined,
    },
  })

  // Helper function to map a CSV row to our type
  const parseCSVRow = (row: Record<string, string>): SalaryRow => ({
    sn: row["S.N."],
    nameOfTheEmployee: row["Name of the Employee"],
    email: row["Email"],
    position: row["Position"],
    panNumber: row["PAN Number"],
    accountNo: row["Account No."] || row["Account Number"],
    wd: row["W.D."] || row["W.D"],
    pd: row["P.D."] || row["P.D"],
    grossSalary: row["Gross salary"],
    basicSalary: row["Basic Salary"],
    lumpsumAllowance: row["Lumpsum Allowance"],
    salaryBeforeTDS: row["Salary Before TDS"],
    pfContribution: row["PF Contribution"],
    overtimeDays: row["Overtime Days"] || row["OT Days"] || "0",
    otAmount: row["Overtime Amount"] || row["OT Amount"] || "0",
    byodIncentive: row["BYOD Incentive"] || "0",
    negativeDays: row["Negative Days"] || "0",
    amount: row["Amount"],
    citDeduction: row["CIT Deduction"],
    pfDeduction: row["PF Deduction"],
    totalTaxDeduction: row["Total Tax Deduction"],
    adjustment: row["Adjustment"] || "0",
    netSalary: row["Net Salary"],
    status: "pending",
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const file = values.csvFile[0]
    if (!file) return

    toast.promise(
      new Promise<SalaryRow[]>((resolve, reject) => {
        Papa.parse(file, {
          delimiter: ",",
          newline: "\r\n",
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Define each required header group as an array of acceptable alternatives.
            const requiredHeaderGroups = [
              ["S.N."],
              ["Name of the Employee"],
              ["Email"],
              ["Position"],
              ["PAN Number"],
              ["Account No.", "Account Number"],
              ["W.D.", "W.D"],
              ["P.D.", "P.D"],
              ["Gross salary"],
              ["Basic Salary"],
              ["Lumpsum Allowance"],
              ["Salary Before TDS"],
              ["PF Contribution"],
              ["Overtime Days", "OT Days"],
              ["Overtime Amount", "OT Amount"],
              ["BYOD Incentive"],
              ["Negative Days"],
              ["Amount"],
              ["CIT Deduction"],
              ["PF Deduction"],
              ["Total Tax Deduction"],
              ["Adjustment"],
              ["Net Salary"],
            ]

            const headers = results.meta.fields || []
            console.log("🚀 ~ onSubmit ~ headers:", headers)
            console.log("🚀 ~ data:", results.data)
            // Check that for every required header group, at least one acceptable header exists.
            const isValid = requiredHeaderGroups.every((group) =>
              group.some((header) => headers.includes(header))
            )

            if (!isValid) {
              reject("CSV format does not match required structure")
              return
            }

            try {
              const parsedData: SalaryRow[] = (
                results.data as Record<string, string>[]
              ).map(parseCSVRow)
              onUpload(parsedData)
              resolve(parsedData)
            } catch {
              reject("Error parsing CSV data")
            }
          },
          error: (error) => reject(error.message),
        })
      }),
      {
        loading: "Parsing Salary CSV...",
        success: (data: SalaryRow[]) =>
          `Processed ${data.length} employee records`,
        error: (err) => `CSV Error: ${err}`,
      }
    )
  }

  return (
    <section className="">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-2">
          <FormField
            control={form.control}
            name="csvFile"
            render={({ field: { onChange, ref } }) => (
              <FormItem>
                <FormLabel className="block mb-2 text-lg text-center font-medium">
                  Upload Your CSV File
                </FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    id="file_input"
                    accept=".csv"
                    onChange={(e) => onChange(e.target.files)}
                    ref={ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-center">
            <Button size="lg" className="w-1/2" type="submit">
              Upload
            </Button>
          </div>
        </form>
      </Form>
    </section>
  )
}
