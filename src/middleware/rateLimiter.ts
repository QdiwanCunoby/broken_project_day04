// Feature opzionale: rate limiting contro scraping e brute-force.
// ⚠️ Contatore in-memory: con più istanze dietro Nginx ogni istanza conta a sé →
//    in produzione serve uno store condiviso (rate-limit-redis, G10).
import rateLimit, { Options } from "express-rate-limit";
import { Request, Response } from "express";
import { fail } from "../utils/apiResponse";

// Risposta 429 con l'envelope standard invece del testo semplice di default.
const rateLimitedHandler = (req: Request, res: Response, _next: unknown, options: Options): void => {
  res
    .status(options.statusCode)
    .json(fail("RATE_LIMITED", "Troppe richieste, riprova tra qualche istante"));
};

// 100 req/min per IP su tutta l'API. standardHeaders → RateLimit-* leggibili dal frontend.
// (`limit` è il nome attuale dell'opzione `max` del PDF, che resta come alias deprecato.)
export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedHandler,
});

// 5 req/min: da montare su POST /api/auth/login quando arriva (G6).
export const strictLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedHandler,
});
