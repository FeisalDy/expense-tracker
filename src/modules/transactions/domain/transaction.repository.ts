import { Transaction } from "./transaction.entity.js";

export interface TransactionRepository {
    findById(id: string): Promise<Transaction | null>;
    getByUserId(userId: string): Promise<Transaction[]>;
    save(transaction: Transaction): Promise<void>;
}

export const TRANSACTION_REPOSITORY = Symbol(
  'TRANSACTION_REPOSITORY',
);