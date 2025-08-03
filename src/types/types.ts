export type CSVRow = Record<string, string | number | boolean>

export interface SalaryRow {
  sn: string
  nameOfTheEmployee: string
  email: string
  position: string
  panNumber: string
  accountNo: string
  wd: string
  pd: string
  grossSalary: string
  basicSalary: string
  lumpsumAllowance: string
  salaryBeforeTDS: string
  pfContribution: string
  overtimeDays: string
  otAmount: string
  byodIncentive: string
  negativeDays: string
  negativeAmount: string
  citDeduction: string
  pfDeduction: string
  taxDeduction: string
  adjustment: string
  netSalary: string
  totalDeduction?: string
  status: "pending" | "sent" | "failed"
  month?: string
  year?: string
}
