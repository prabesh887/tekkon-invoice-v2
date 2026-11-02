import { describe, expect, it } from "vitest"

import type { SalaryRow } from "../types/types"
import emailTemplate from "./email-template"

function makeUserData(overrides: Partial<SalaryRow> = {}): SalaryRow {
  return {
    sn: "1",
    nameOfTheEmployee: "Jane Doe",
    email: "jane@example.com",
    position: "Engineer",
    panNumber: "123456789",
    accountNo: "001002003",
    wd: "26",
    pd: "26",
    grossSalary: "115,000",
    basicSalary: "115,000",
    lumpsumAllowance: "0",
    salaryBeforeTDS: "115,000",
    pfContribution: "0",
    overtimeDays: "0",
    otAmount: "0",
    byodIncentive: "0",
    negativeDays: "0",
    negativeAmount: "0",
    citDeduction: "25,000",
    pfDeduction: "0",
    taxDeduction: "0",
    adjustment: "0",
    netSalary: "90,000",
    status: "pending",
    ...overrides,
  }
}

describe("emailTemplate XSS escaping", () => {
  it("escapes <script> payloads in employee fields", () => {
    const html = emailTemplate(
      makeUserData({ nameOfTheEmployee: "<script>alert('x')</script>" })
    )
    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;")
    expect(html).not.toContain("<script>")
  })

  it("escapes attribute-injection payloads (img onerror)", () => {
    const html = emailTemplate(
      makeUserData({ position: "<img src=x onerror=alert(1)>" })
    )
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;")
    expect(html).not.toContain("<img src=x onerror=")
  })

  it("escapes double quotes inside attribute context", () => {
    const html = emailTemplate(
      makeUserData({ nameOfTheEmployee: '"><img src=x onerror=alert(1)>' })
    )
    expect(html).toContain("&quot;&gt;&lt;img src=x onerror=alert(1)&gt;")
    expect(html).not.toContain('"><img')
  })

  it("escapes ampersands to prevent nested entity parsing", () => {
    const html = emailTemplate(makeUserData({ email: "a&b@example.com" }))
    expect(html).toContain("a&amp;b@example.com")
    expect(html).not.toContain("a&b@example.com")
  })

  it("escapes apostrophes across fields", () => {
    const html = emailTemplate(
      makeUserData({ nameOfTheEmployee: "O'Brien", position: "Tel'Tel" })
    )
    expect(html).toContain("O&#39;Brien")
    expect(html).toContain("Tel&#39;Tel")
  })

  it("escapes values in amount and deduction cells", () => {
    const html = emailTemplate(
      makeUserData({ grossSalary: "<b>115000</b>", netSalary: "<i>90000</i>" })
    )
    expect(html).toContain("&lt;b&gt;115000&lt;/b&gt;")
    expect(html).toContain("&lt;i&gt;90000&lt;/i&gt;")
  })

  it("renders a benign template without stray raw script tags", () => {
    const html = emailTemplate(makeUserData())
    expect(html).not.toContain("<script")
    expect(html).toContain("Salary Statement for")
  })
})
