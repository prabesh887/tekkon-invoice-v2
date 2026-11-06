import { afterEach, describe, expect, it, vi } from "vitest"

import { createLogger, serializeError } from "./logger"

afterEach(() => {
  vi.restoreAllMocks()
})

function lastLine(spy: ReturnType<typeof vi.spyOn>) {
  return JSON.parse(spy.mock.calls.at(-1)?.[0] as string)
}

describe("createLogger", () => {
  it("writes one JSON line with level, event and fields", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {})

    createLogger({ service: "payslip" }).info("payslip.sent", {
      messageId: "abc",
    })

    expect(lastLine(spy)).toMatchObject({
      level: "info",
      event: "payslip.sent",
      service: "payslip",
      messageId: "abc",
    })
  })

  it("routes warn and error to the matching console method", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const log = createLogger()

    log.warn("payslip.rejected")
    log.error("payslip.failed")

    expect(lastLine(warn).level).toBe("warn")
    expect(lastLine(error).level).toBe("error")
  })

  it("child loggers carry parent fields", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {})

    createLogger({ requestId: "r1" })
      .child({ recipientEmail: "a@b.com" })
      .info("payslip.sent")

    expect(lastLine(spy)).toMatchObject({
      requestId: "r1",
      recipientEmail: "a@b.com",
    })
  })
})

describe("serializeError", () => {
  it("keeps SMTP details from nodemailer errors", () => {
    const error = Object.assign(new Error("Message rejected"), {
      code: "EMESSAGE",
      command: "DATA",
      responseCode: 554,
      response: "554 Message rejected: Email address is not verified.",
    })

    expect(serializeError(error)).toMatchObject({
      message: "Message rejected",
      code: "EMESSAGE",
      command: "DATA",
      responseCode: 554,
    })
  })

  it("handles non-Error values", () => {
    expect(serializeError("boom")).toEqual({ message: "boom" })
  })
})
