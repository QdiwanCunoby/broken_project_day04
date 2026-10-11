// Logga ogni richiesta in ingresso (con headers e body) e la riga di "finish".
import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  logger.info(
    { req: { method: req.method, url: req.originalUrl, headers: req.headers, body: req.body } },
    "richiesta in ingresso",
  );

  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`);
  });

  next();
};
