"use client"

import React, { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, FileText, Upload } from "lucide-react"
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
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export default function UploadCsv({
  onUpload,
}: {
  onUpload: (data: SalaryRow[]) => void
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

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
    negativeAmount: row["Amount"] || row["Negative Amount"] || "0",
    citDeduction: row["CIT Deduction"],
    pfDeduction: row["PF Deduction"],
    taxDeduction: row["Total Tax Deduction"],
    adjustment: row["Adjustment"] || "0",
    netSalary: row["Net Salary"],
    status: "pending",
  })

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0])
    } else {
      setSelectedFile(null)
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const file = values.csvFile[0]
    if (!file) return

    setIsProcessing(true)

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
              ["Amount", "Negative Amount"],
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
              setIsProcessing(false)
              reject("CSV format does not match required structure")
              return
            }

            try {
              const parsedData: SalaryRow[] = (
                results.data as Record<string, string>[]
              ).map(parseCSVRow)
              onUpload(parsedData)
              setIsProcessing(false)
              resolve(parsedData)
            } catch {
              setIsProcessing(false)
              reject("Error parsing CSV data")
            }
          },
          error: (error) => {
            setIsProcessing(false)
            reject(error.message)
          },
        })
      }),
      {
        loading: "Parsing Salary CSV...",
        success: (data: SalaryRow[]) =>
          `Successfully processed ${data.length} employee records!`,
        error: (err) => `CSV Error: ${err}`,
      }
    )
  }

  return (
    <section className="w-full max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="csvFile"
            render={({ field: { onChange, ref } }) => (
              <FormItem>
                <FormControl>
                  <div
                    className={`
                      relative border-2 rounded-xl p-2 transition-all duration-300 cursor-pointer
                      ${
                        selectedFile
                          ? "border-green-400 bg-green-50"
                          : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                      }
                      ${isProcessing ? "pointer-events-none opacity-60" : ""}
                    `}
                    onClick={() =>
                      !isProcessing &&
                      document.getElementById("file_input")?.click()
                    }
                  >
                    {/* Hidden file input */}
                    <Input
                      type="file"
                      id="file_input"
                      accept=".csv"
                      onChange={(e) => {
                        onChange(e.target.files)
                        handleFileSelect(e.target.files)
                      }}
                      ref={ref}
                      className="hidden"
                    />

                    <div className="text-center">
                      {isProcessing ? (
                        <div className="animate-spin h-16 w-16 mx-auto mb-4">
                          <Upload className="h-16 w-16 text-blue-500" />
                        </div>
                      ) : selectedFile ? (
                        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                      ) : (
                        <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      )}

                      {isProcessing ? (
                        <div>
                          <p className="text-xl font-semibold text-gray-900 mb-2">
                            Processing Your File...
                          </p>
                          <p className="text-gray-600">
                            Please wait while we parse your CSV data
                          </p>
                        </div>
                      ) : selectedFile ? (
                        <div>
                          <p className="text-xl font-semibold text-gray-900 mb-2">
                            File Ready to Upload!
                          </p>
                          <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">
                              {selectedFile.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024).toFixed(1)} KB • Click
                            &quot;Process CSV&quot; to continue
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xl font-semibold text-gray-900 mb-2">
                            Click to Choose Your CSV File
                          </p>
                          <p className="text-gray-600 mb-4">
                            Select your salary CSV file from your computer
                          </p>
                          {/* <div className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            <Upload className="h-5 w-5 mr-2" />
                            Browse Files
                          </div> */}
                          <p className="text-xs text-gray-500 mt-4">
                            Supports: .csv files only (Max 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-center mt-2" />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className={`
                px-12 py-3 text-lg font-semibold transition-all duration-200
                ${
                  selectedFile
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }
                ${isProcessing ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
              `}
              type="submit"
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </div>
              ) : selectedFile ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Process CSV File
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Select File First
                </div>
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="text-center text-sm text-gray-500">
            <p>Need help? Make sure your CSV has all the required columns.</p>
            <p>Check the sample CSV format above for reference.</p>
          </div>
        </form>
      </Form>
    </section>
  )
}
