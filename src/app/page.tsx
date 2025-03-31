"use client"

import { useState } from "react"

import { SalaryRow } from "@/types/types"
import Header from "@/components/Header"

import { SalaryTable } from "./components/SalaryTable"
import { Toaster } from "./components/ui/sonner"
import UploadCsv from "./components/UploadCsv"

export default function Home() {
  const [tableData, setTableData] = useState<SalaryRow[]>([])
  return (
    <main>
      <Header />
      <div className="min-h-screen items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
        {tableData.length === 0 && <UploadCsv onUpload={setTableData} />}

        {tableData.length > 0 && (
          <div className="w-full overflow-x-auto">
            <SalaryTable data={tableData} onDataChange={setTableData} />
          </div>
        )}
      </div>
      <Toaster duration={3000} richColors position="bottom-right" />
    </main>
  )
}
