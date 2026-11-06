/**
 * Minimal structured logger for server code.
 *
 * Each entry is written as one JSON line so it can be searched and
 * filtered in Vercel's Runtime Logs (e.g. search for an email address,
 * a requestId, or "payslip.failed").
 *
 * Never pass salary figures, bank details, PAN numbers or secrets here:
 * logs are visible to anyone with access to the Vercel project.
 */
export type LogLevel = "info" | "warn" | "error"

export type LogFields = Record<string, unknown>

export interface Logger {
  info(event: string, fields?: LogFields): void
  warn(event: string, fields?: LogFields): void
  error(event: string, fields?: LogFields): void
  child(fields: LogFields): Logger
}

/**
 * Pulls the useful, non-sensitive parts out of an error. Nodemailer/SMTP
 * errors carry `code`, `command`, `responseCode` and `response`, which
 * usually explain why SES rejected a message.
 */
export function serializeError(error: unknown): LogFields {
  if (!(error instanceof Error)) {
    return { message: String(error) }
  }

  const details = error as Error & {
    code?: unknown
    command?: unknown
    responseCode?: unknown
    response?: unknown
  }

  return {
    name: details.name,
    message: details.message,
    code: details.code,
    command: details.command,
    responseCode: details.responseCode,
    response: details.response,
    stack: details.stack?.split("\n").slice(0, 5).join("\n"),
  }
}

function write(level: LogLevel, event: string, fields: LogFields) {
  const line = JSON.stringify({
    level,
    event,
    time: new Date().toISOString(),
    ...fields,
  })

  if (level === "error") {
    console.error(line)
  } else if (level === "warn") {
    console.warn(line)
  } else {
    console.info(line)
  }
}

export function createLogger(baseFields: LogFields = {}): Logger {
  return {
    info: (event, fields = {}) =>
      write("info", event, { ...baseFields, ...fields }),
    warn: (event, fields = {}) =>
      write("warn", event, { ...baseFields, ...fields }),
    error: (event, fields = {}) =>
      write("error", event, { ...baseFields, ...fields }),
    child: (fields) => createLogger({ ...baseFields, ...fields }),
  }
}

export const logger = createLogger({ service: "payslip" })
