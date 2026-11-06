import { describe, expect, it } from "vitest"

import {
  getRowErrors,
  MAX_DAYS,
  MAX_SALARY_AMOUNT,
  parseAmount,
  payslipRequestSchema,
  salaryRowSchema,
  sanityCheckValues,
} from "./payslip-validation"

describe("parseAmount", () => {
  it("parses comma-grouped integers", () => {
    expect(parseAmount("25,000")).toBe(25000)
  })

  it("parses decimals with grouping", () => {
    expect(parseAmount("1,500.50")).toBe(1500.5)
  })

  it("returns number inputs as-is", () => {
    expect(parseAmount(25000)).toBe(25000)
    expect(parseAmount(0)).toBe(0)
  })

  it("returns 0 for undefined/null/empty", () => {
    expect(parseAmount(undefined)).toBe(0)
    expect(parseAmount(null)).toBe(0)
    expect(parseAmount("")).toBe(0)
  })

  it("returns 0 for non-numeric input", () => {
    expect(parseAmount("not-a-number")).toBe(0)
    expect(parseAmount("  ")).toBe(0)
  })
})

describe("payslipRequestSchema", () => {
  const validPayload = {
    userData: {
      nameOfTheEmployee: "Jane Doe",
      email: "jane@example.com",
      position: "Engineer",
    },
    month: "January",
    year: "2025",
    recipientEmail: "jane@example.com",
  }

  it("accepts a minimal valid payload", () => {
    expect(payslipRequestSchema.safeParse(validPayload).success).toBe(true)
  })

  it("rejects an invalid month", () => {
    const result = payslipRequestSchema.safeParse({
      ...validPayload,
      month: "JANUARY",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("month")
    }
  })

  it("rejects a malformed year", () => {
    for (const year of ["25", "202", "abc", "12345"]) {
      const result = payslipRequestSchema.safeParse({ ...validPayload, year })
      expect(result.success, `year ${year} should be rejected`).toBe(false)
    }
  })

  it("rejects an invalid recipient email", () => {
    const result = payslipRequestSchema.safeParse({
      ...validPayload,
      recipientEmail: "not-an-email",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an empty employee name", () => {
    const result = payslipRequestSchema.safeParse({
      ...validPayload,
      userData: { ...validPayload.userData, nameOfTheEmployee: "" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects an over-long employee name", () => {
    const result = payslipRequestSchema.safeParse({
      ...validPayload,
      userData: {
        ...validPayload.userData,
        nameOfTheEmployee: "a".repeat(201),
      },
    })
    expect(result.success).toBe(false)
  })

  it("rejects malformed amount strings", () => {
    const badMalformed = salaryRowSchema.safeParse({
      nameOfTheEmployee: "Jane Doe",
      email: "jane@example.com",
      position: "Engineer",
      grossSalary: "25 000",
    })
    expect(badMalformed.success).toBe(false)
  })

  it("accepts blank amount strings", () => {
    const blank = salaryRowSchema.safeParse({
      nameOfTheEmployee: "Jane Doe",
      email: "jane@example.com",
      position: "Engineer",
      grossSalary: "",
    })
    expect(blank.success).toBe(true)
  })
})

describe("sanityCheckValues", () => {
  const cleanUserData = {
    nameOfTheEmployee: "Jane Doe",
    email: "jane@example.com",
    position: "Engineer",
    grossSalary: "115,000",
    basicSalary: "115,000",
    netSalary: "90,000",
  }

  it("returns no errors for clean data", () => {
    expect(sanityCheckValues(cleanUserData)).toEqual([])
  })

  it("flags negative amounts", () => {
    const errors = sanityCheckValues({
      ...cleanUserData,
      grossSalary: "-5,000",
    })
    expect(errors).toContain("grossSalary cannot be negative")
  })

  it("rejects implausibly large amounts", () => {
    const errors = sanityCheckValues({
      ...cleanUserData,
      netSalary: "999999999999",
    })
    expect(errors).toContain("netSalary exceeds the maximum allowed amount")
  })

  it("flags excessive working days", () => {
    const errors = sanityCheckValues({
      ...cleanUserData,
      wd: String(MAX_DAYS + 1),
    })
    expect(errors).toContain("Working days exceeds the maximum allowed")
  })

  it("flags excessive payable days", () => {
    const errors = sanityCheckValues({ ...cleanUserData, pd: "999" })
    expect(errors).toContain("Payable days exceeds the maximum allowed")
  })

  it("allows boundary day counts", () => {
    expect(
      sanityCheckValues({ ...cleanUserData, wd: String(MAX_DAYS) })
    ).toEqual([])
  })

  it("allows the maximum salary amount", () => {
    const errors = sanityCheckValues({
      ...cleanUserData,
      grossSalary: String(MAX_SALARY_AMOUNT),
    })
    expect(errors).toEqual([])
  })
})

describe("getRowErrors", () => {
  const validRow = {
    nameOfTheEmployee: "Jane Doe",
    email: "jane@example.com",
    position: "Engineer",
    grossSalary: "115,000",
    netSalary: "90,000",
  }

  it("returns no errors for a valid row", () => {
    expect(getRowErrors(validRow)).toEqual({})
  })

  it.each([
    ["-", 'Use 0 instead of "-"'],
    [" 25,000 ", "Remove the extra spaces"],
    ["25000", "Add thousand separators, e.g. 25,000"],
    ["-1,500", "Negative amounts are not allowed"],
    ["(1,500)", "Negative amounts are not allowed"],
    ["1,500.333", "Use at most 2 decimal places"],
    ["abc", "Use a number like 25,000 or 1,500.50"],
  ])("explains why amount %j is invalid", (value, message) => {
    expect(getRowErrors({ ...validRow, citDeduction: value })).toEqual({
      citDeduction: message,
    })
  })

  it("flags emails with extra spaces", () => {
    expect(getRowErrors({ ...validRow, email: "jane@example.com " })).toEqual({
      email: "Remove the extra spaces",
    })
  })

  it("flags missing required fields", () => {
    expect(getRowErrors({ ...validRow, position: undefined })).toEqual({
      position: "Required",
    })
  })

  it("reports every invalid cell in the row", () => {
    const errors = getRowErrors({
      ...validRow,
      email: "not-an-email",
      taxDeduction: "-",
    })
    expect(Object.keys(errors).sort()).toEqual(["email", "taxDeduction"])
  })

  it("includes sanity check problems", () => {
    expect(getRowErrors({ ...validRow, wd: "999" })).toEqual({
      wd: "Working days exceeds the maximum allowed",
    })
  })
})
