// Business logic: lancia errori tipizzati (AppError), mai risposte HTTP.
import { Account } from "../types/account";
import { CreateAccountDto } from "../schemas/accountSchemas";
import { ConflictError, NotFoundError } from "../errors/AppError";

export interface IAccountRepository {
  findAll(): Promise<Account[]>;
  findById(id: string): Promise<Account | null>;
  findByIban(iban: string): Promise<Account | null>;
  create(dto: CreateAccountDto): Promise<Account>;
  delete(id: string): Promise<boolean>;
}

export class AccountService {
  constructor(private readonly repository: IAccountRepository) {}

  async getAllAccounts(): Promise<Account[]> {
    return this.repository.findAll();
  }

  async getAccountById(id: string): Promise<Account> {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundError("Account", id);
    return account;
  }

  async createAccount(dto: CreateAccountDto): Promise<Account> {
    const existing = await this.repository.findByIban(dto.iban);
    if (existing) throw new ConflictError("IBAN già registrato");
    return this.repository.create(dto);
  }

  async deleteAccount(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError("Account", id);
  }
}
