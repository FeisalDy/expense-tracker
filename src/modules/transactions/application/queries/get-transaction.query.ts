import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTransactionQuery } from './get-transaction.handler.js';
import {
    TRANSACTION_REPOSITORY,
    type TransactionRepository,
} from '../../domain/transaction.repository.js';
import { Transaction } from '../../domain/transaction.entity.js';
import { Inject } from '@nestjs/common';

@QueryHandler(GetTransactionQuery)
export class GetTransactionHandler implements IQueryHandler<GetTransactionQuery> {
    constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly transactionRepository: TransactionRepository,
    ) {}

    async execute(): Promise<Transaction[]> {
        return this.transactionRepository.get();
    }
}
