// Logger Pino con redaction dei dati sensibili (PCI-DSS / GDPR).
import pino, { LoggerOptions } from "pino";

// ✅ FIX Bug 3: i log vengono archiviati per 12-24 mesi e li leggono più persone dei dati
//    di produzione → credenziali, dati di carta e codice fiscale non devono mai finirci.
const SENSITIVE_KEYS = ["password", "passwordHash", "token", "fiscalCode", "pan", "cvv"];

export const redactPaths = [
  ...SENSITIVE_KEYS,                            // { password: ... } al primo livello
  ...SENSITIVE_KEYS.map(k => `*.${k}`),         // { user: { password: ... } } — il wildcard copre UN livello
  ...SENSITIVE_KEYS.map(k => `req.body.${k}`),  // body loggato dal requestLogger (2 livelli)
  "req.headers.authorization",
  "req.headers.cookie",
];

export const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  redact: { paths: redactPaths, censor: "[REDACTED]" },
};

export const logger = pino({
  ...loggerOptions,
  transport: { target: "pino-pretty", options: { colorize: true } },
});
