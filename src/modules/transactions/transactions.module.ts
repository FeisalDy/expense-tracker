import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import {
    TransactionSchema,
    Transaction,
} from './infrastructure/persistence/schemas/transaction.schema.js';
import { TransactionsController } from './infrastructure/http/transactions.controller.js';
import { CreateTransactionHandler } from './application/commands/create-transaction.handler.js';
import { TRANSACTION_REPOSITORY } from './domain/transaction.repository.js';
import { MongooseTransactionRepository } from './infrastructure/persistence/mongoose-transaction.repository.js';
import { GetTransactionHandler } from './application/queries/get-transaction.query.js';

const CommandHandlers = [CreateTransactionHandler, GetTransactionHandler];
@Module({
    imports: [
        CqrsModule,
        MongooseModule.forFeature([
            { name: Transaction.name, schema: TransactionSchema },
        ]),
    ],
    controllers: [TransactionsController],
    providers: [
        ...CommandHandlers,
        {
            provide: TRANSACTION_REPOSITORY,
            useClass: MongooseTransactionRepository
        }
    ],
})
export class TransactionsModule {}
