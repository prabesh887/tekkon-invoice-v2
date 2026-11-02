import { z } from "zod"

export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

// A currency/number field that tolerates "25,000", "1,500.50", "0".
const amountString = z
  .string()
  .max(50)
  .optional()
  .refine(
    (v) =>
      v === undefined || v === "" || /^\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(v),
    "Invalid amount format"
  )

export const salaryRowSchema = z.object({
  sn: z.string().max(20).optional(),
  nameOfTheEmployee: z.string().min(1).max(200),
  email: z.string().email().max(255),
  position: z.string().max(200),
  panNumber: z.string().max(50).optional(),
  accountNo: z.string().max(50).optional(),
  wd: z.string().max(10).optional(),
  pd: z.string().max(10).optional(),
  grossSalary: amountString,
  basicSalary: amountString,
  lumpsumAllowance: amountString,
  salaryBeforeTDS: amountString,
  pfContribution: amountString,
  overtimeDays: z.string().max(10).optional(),
  otAmount: amountString,
  byodIncentive: amountString,
  negativeDays: z.string().max(10).optional(),
  negativeAmount: amountString,
  citDeduction: amountString,
  pfDeduction: amountString,
  taxDeduction: amountString,
  adjustment: amountString,
  netSalary: amountString,
  status: z.enum(["pending", "sent", "failed"]).optional(),
  month: z.string().max(50).optional(),
  year: z.string().max(50).optional(),
})

export const payslipRequestSchema = z.object({
  userData: salaryRowSchema,
  month: z.enum(months),
  year: z.string().regex(/^\d{4}$/, "Year must be a 4-digit number"),
  recipientEmail: z.string().email().max(255),
})

/**
 * Convert values such as:
 *
 * "25,000" → 25000
 * "1,500.50" → 1500.50
 * undefined → 0
 */
export function parseAmount(value: string | number | undefined | null): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  return (
    Number(
      String(value ?? "0")
        .replace(/,/g, "")
        .trim()
    ) || 0
  )
}

export const MAX_SALARY_AMOUNT = 1_000_000_000 // 1 billion NPR
export const MAX_DAYS = 366

export type SalaryRowInput = z.infer<typeof salaryRowSchema>

/**
 * Sanity-check salary figures supplied by the client.
 *
 * Payslip structures vary between companies (net salary does not always
 * equal gross minus all deductions), so we do NOT enforce a strict
 * arithmetic relationship. We only reject obviously invalid figures:
 * negative amounts and implausibly large values.
 */
export function sanityCheckValues(userData: SalaryRowInput): string[] {
  const errors: string[] = []

  const amountFields = [
    "grossSalary",
    "basicSalary",
    "lumpsumAllowance",
    "salaryBeforeTDS",
    "pfContribution",
    "otAmount",
    "byodIncentive",
    "negativeAmount",
    "citDeduction",
    "pfDeduction",
    "taxDeduction",
    "adjustment",
    "netSalary",
  ] as const

  for (const field of amountFields) {
    const value = parseAmount(userData[field])
    if (value < 0) {
      errors.push(`${field} cannot be negative`)
    } else if (value > MAX_SALARY_AMOUNT) {
      errors.push(`${field} exceeds the maximum allowed amount`)
    }
  }

  if (userData.wd && parseAmount(userData.wd) > MAX_DAYS) {
    errors.push("Working days exceeds the maximum allowed")
  }

  if (userData.pd && parseAmount(userData.pd) > MAX_DAYS) {
    errors.push("Payable days exceeds the maximum allowed")
  }

  return errors
}
