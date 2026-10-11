// Controller: converte HTTP ↔ business logic. Ogni handler async è avvolto da asyncHandler.
import { Request, Response } from "express";
import { AccountService } from "../services/accountService";
import { createAccountSchema } from "../schemas/accountSchemas";
import { asyncHandler } from "../middleware/asyncHandler";
import { ok } from "../utils/apiResponse";

export class AccountController {
  constructor(private readonly service: AccountService) {}

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const accounts = await this.service.getAllAccounts();
    res.json(ok(accounts));
  });

  // ✅ FIX Bug 2: Express 4 ignora la Promise restituita da un handler async. Se
  //    getAccountById lancia NotFoundError la Promise viene rifiutata, ma nessuno chiama
  //    next(err) → l'errorHandler non parte e la richiesta resta appesa. asyncHandler fa
  //    .catch(next) e porta l'errore all'errorHandler (→ 404 NOT_FOUND).
  //    Express 5 non ha questo problema: il router controlla se l'handler restituisce una
  //    Promise e, se viene rifiutata, chiama next(err) da solo.
  getById = asyncHandler(async (req: Request, res: Response) => {
    const account = await this.service.getAccountById(req.params.id);
    res.json(ok(account));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = createAccountSchema.parse(req.body); // lancia ZodError se il body non è valido
    const account = await this.service.createAccount(dto);
    res.status(201).json(ok(account));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.service.deleteAccount(req.params.id);
    res.status(204).send();
  });
}
