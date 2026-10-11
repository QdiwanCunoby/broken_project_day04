// Configurazione Express app — separata da index.ts per i test (Giorno 7)
import express from "express";
import cors from "cors";
import helmet from "helmet";
import accountRoutes from "./routes/accountRoutes";
import { requestLogger } from "./middleware/requestLogger";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { errorHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimiter";

const app = express();

// ─── Middleware ───
app.use(helmet());                                    // Security headers
app.use(cors({ origin: "http://localhost:5173" }));   // CORS per React (Vite)
app.use(express.json({ limit: "100kb" }));            // Parse body JSON
app.use(requestLogger);                               // Log richiesta (+ body) e finish

// ─── Routes ───
app.use("/api", globalLimiter);                       // 100 req/min per IP (/health escluso)
app.use("/api/accounts", accountRoutes);

// ─── Health check ───
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 + error handler (sempre per ultimi) ───
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
