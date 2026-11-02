import { describe, expect, it } from "vitest"

import {
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
