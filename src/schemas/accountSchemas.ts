// Validazione input con Zod: lo schema è la single source of truth, il DTO ne deriva.
import { z } from "zod";
import { AccountType } from "../types/account";

export const createAccountSchema = z.object({
  iban: z.string().regex(/^IT\d{2}[A-Z]\d{10}[0-9A-Z]{12}$/, { message: "IBAN italiano non valido" }),
  holderName: z.string().trim().min(2, { message: "Intestatario: minimo 2 caratteri" }),
  balance: z.number().nonnegative({ message: "Il saldo iniziale non può essere negativo" }),
  accountType: z.enum(AccountType),
  customerId: z.string().min(1, { message: "customerId obbligatorio" }),
});

export type CreateAccountDto = z.infer<typeof createAccountSchema>;
