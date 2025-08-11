import React from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"

export function CsvSample() {
  const downloadSampleCSV = () => {
    const link = document.createElement("a")
    link.href = "/sample.csv"
    link.download = "sample-salary-data.csv"
    link.style.display = "none"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Sample CSV downloaded successfully!")
  }
  return (
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
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
                <span className="font-medium text-blue-800">{index + 1}.</span>
                <span className="ml-2 text-blue-700">{column}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          💡 <strong>Tip:</strong> Make sure your CSV file has exactly these
          column headers in the first row
        </p>
      </div>
    </div>
  )
}
