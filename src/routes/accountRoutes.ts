// Route: connette URL → Controller. Wiring delle dipendenze.
import { Router } from "express";
import { AccountController } from "../controllers/accountController";
import { AccountService } from "../services/accountService";
import { InMemoryAccountRepository } from "../repositories/accountRepository";

const router = Router();

// ─── Dependency injection manuale ───
const repository = new InMemoryAccountRepository();
const service = new AccountService(repository);
const controller = new AccountController(service);

router.get("/",       controller.getAll);
router.get("/:id",    controller.getById);
router.post("/",      controller.create);
router.delete("/:id", controller.delete);

export default router;
