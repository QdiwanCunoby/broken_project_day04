// Entry point — avvia il server HTTP
import { app } from "./app";
import { logger } from "./config/logger";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

// Tiene vivo il processo sulle Promise rifiutate e non gestite (senza questo listener
// Node >= 15 terminerebbe il processo). Prima loggava a livello debug, quindi con
// LOG_LEVEL=info il Bug 2 era silenzioso: ora a livello error, così si vede subito.
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "unhandledRejection: un handler async non ha chiamato next(err)?");
});

app.listen(PORT, () => {
  logger.info(`🏦 LipariBank API su http://localhost:${PORT}`);
});
