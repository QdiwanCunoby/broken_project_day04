// Error handler centralizzato: unico punto che traduce gli errori in risposte HTTP.
import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { logger } from "../config/logger";
import { fail } from "../utils/apiResponse";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.code, err.message));
    return;
  }

  // ✅ FIX Bug 1: un body non valido è colpa del client → 400 con il dettaglio per campo,
  //    così il frontend React può mostrare il messaggio sotto ogni input.
  if (err instanceof ZodError) {
    const details = err.issues.map(issue => ({
      field: issue.path.map(String).join(".") || "body",
      message: issue.message,
    }));
    res.status(400).json(fail("VALIDATION_ERROR", "Dati di input non validi", details));
    return;
  }

  logger.error({ err }, "Errore non gestito");
  res.status(500).json(fail("INTERNAL_ERROR", "Errore interno del server"));
};
