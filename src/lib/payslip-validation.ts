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

const AMOUNT_FIELDS = [
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

interface FieldIssue {
  field: keyof SalaryRowInput
  message: string
}

function getSanityIssues(userData: SalaryRowInput): FieldIssue[] {
  const issues: FieldIssue[] = []

  for (const field of AMOUNT_FIELDS) {
    const value = parseAmount(userData[field])
    if (value < 0) {
      issues.push({ field, message: `${field} cannot be negative` })
    } else if (value > MAX_SALARY_AMOUNT) {
      issues.push({
        field,
        message: `${field} exceeds the maximum allowed amount`,
      })
    }
  }

  if (userData.wd && parseAmount(userData.wd) > MAX_DAYS) {
    issues.push({
      field: "wd",
      message: "Working days exceeds the maximum allowed",
    })
  }

  if (userData.pd && parseAmount(userData.pd) > MAX_DAYS) {
    issues.push({
      field: "pd",
      message: "Payable days exceeds the maximum allowed",
    })
  }

  return issues
}

/**
 * Sanity-check salary figures supplied by the client.
 *
 * Payslip structures vary between companies (net salary does not always
 * equal gross minus all deductions), so we do NOT enforce a strict
 * arithmetic relationship. We only reject obviously invalid figures:
 * negative amounts and implausibly large values.
 */
export function sanityCheckValues(userData: SalaryRowInput): string[] {
  return getSanityIssues(userData).map((issue) => issue.message)
}

// ---------------------------------------------------------
// Row errors for the UI
//
// Runs the same rules as the API so admins can fix the data in
// the table before sending, instead of finding out per email.
// ---------------------------------------------------------

/** Field → human-readable problem, for every invalid cell in a row. */
export type RowErrors = Partial<Record<keyof SalaryRowInput, string>>

/** CSV column names, so errors point at the column to fix in the sheet. */
export const FIELD_LABELS: Record<keyof SalaryRowInput, string> = {
  sn: "S.N.",
  nameOfTheEmployee: "Name of the Employee",
  email: "Email",
  position: "Position",
  panNumber: "PAN Number",
  accountNo: "Account No.",
  wd: "W.D.",
  pd: "P.D.",
  grossSalary: "Gross salary",
  basicSalary: "Basic Salary",
  lumpsumAllowance: "Lumpsum Allowance",
  salaryBeforeTDS: "Salary Before TDS",
  pfContribution: "PF Contribution",
  overtimeDays: "Overtime Days",
  otAmount: "Overtime Amount",
  byodIncentive: "BYOD Incentive",
  negativeDays: "Negative Days",
  negativeAmount: "Amount",
  citDeduction: "CIT Deduction",
  pfDeduction: "PF Deduction",
  taxDeduction: "Total Tax Deduction",
  adjustment: "Adjustment",
  netSalary: "Net Salary",
  status: "Status",
  month: "Month",
  year: "Year",
}

function describeAmountProblem(value: string): string {
  const trimmed = value.trim()

  if (trimmed !== value) {
    return "Remove the extra spaces"
  }
  if (trimmed === "-") {
    return 'Use 0 instead of "-"'
  }
  if (/^-|^\(.*\)$/.test(trimmed)) {
    return "Negative amounts are not allowed"
  }
  if (/^\d{4,}(\.\d+)?$/.test(trimmed)) {
    return `Add thousand separators, e.g. ${Number(trimmed).toLocaleString("en-US")}`
  }
  if (/\.\d{3,}$/.test(trimmed)) {
    return "Use at most 2 decimal places"
  }
  return "Use a number like 25,000 or 1,500.50"
}

export function getRowErrors(row: Partial<SalaryRowInput>): RowErrors {
  const errors: RowErrors = {}
  const parsed = salaryRowSchema.safeParse(row)

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof SalaryRowInput | undefined
      if (!field || errors[field]) continue

      const value = row[field]

      if (value === undefined || value === "") {
        errors[field] = "Required"
      } else if ((AMOUNT_FIELDS as readonly string[]).includes(field)) {
        errors[field] = describeAmountProblem(String(value))
      } else if (field === "email") {
        errors[field] =
          String(value).trim() !== value
            ? "Remove the extra spaces"
            : "Not a valid email address"
      } else {
        errors[field] = issue.message
      }
    }

    // Sanity checks need the parsed values, so stop at format errors.
    return errors
  }

  for (const issue of getSanityIssues(parsed.data)) {
    errors[issue.field] ??= issue.message
  }

  return errors
}

export function hasRowErrors(errors: RowErrors): boolean {
  return Object.keys(errors).length > 0
}
