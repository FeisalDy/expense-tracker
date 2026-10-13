import { Transaction } from "./transaction.entity.js";

export interface TransactionRepository {
    findById(id: string): Promise<Transaction | null>;
    get(): Promise<Transaction[]>;
    update(transaction: Transaction): Promise<void>;
    save(transaction: Transaction): Promise<void>;
    delete(id: string): Promise<void>;
}

export const TRANSACTION_REPOSITORY = Symbol(
  'TRANSACTION_REPOSITORY',
);