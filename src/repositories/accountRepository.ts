// Repository in-memory
import { Account, AccountStatus } from "../types/account";
import { CreateAccountDto } from "../schemas/accountSchemas";
import { IAccountRepository } from "../services/accountService";

export class InMemoryAccountRepository implements IAccountRepository {
  private accounts: Account[] = [];

  async findAll(): Promise<Account[]> { return [...this.accounts]; }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.find(a => a.id === id) ?? null;
  }

  async findByIban(iban: string): Promise<Account | null> {
    return this.accounts.find(a => a.iban === iban) ?? null;
  }

  async create(dto: CreateAccountDto): Promise<Account> {
    const account: Account = {
      id: crypto.randomUUID(), ...dto,
      status: AccountStatus.ACTIVE, createdAt: new Date(),
    };
    this.accounts.push(account);
    return account;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.accounts.splice(index, 1);
    return true;
  }
}
