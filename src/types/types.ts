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
  amount: string
  citDeduction: string
  pfDeduction: string
  totalTaxDeduction: string
  adjustment: string
  netSalary: string
  status: "pending" | "sent"
}
