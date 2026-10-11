export type UUID = string;

export enum AccountType { CHECKING = "CHECKING", SAVINGS = "SAVINGS", DEPOSIT = "DEPOSIT" }
export enum AccountStatus { ACTIVE = "ACTIVE", BLOCKED = "BLOCKED", CLOSED = "CLOSED" }

export interface Account {
  id: UUID;
  iban: string;
  holderName: string;
  balance: number;
  accountType: AccountType;
  status: AccountStatus;
  createdAt: Date;
  customerId: UUID;
}
