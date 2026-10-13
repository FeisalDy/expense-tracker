import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateTransactionCommand } from './update-transaction.command.js';
import { Inject, NotFoundException } from '@nestjs/common';
import {
    TRANSACTION_REPOSITORY,
    type TransactionRepository,
} from '../../domain/transaction.repository.js';

@CommandHandler(UpdateTransactionCommand)
export class UpdateTransactionHandler
    implements ICommandHandler<UpdateTransactionCommand, void>
{
    constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly transactionRepository: TransactionRepository,
    ) {}

    async execute(command: UpdateTransactionCommand): Promise<void> {
        const transaction = await this.transactionRepository.findById(command.id);

        if (!transaction) {
            throw new NotFoundException(`Transaction with id "${command.id}" not found`);
        }

        const updatedTransaction = transaction.update(
            command.amount,
            command.description,
            command.userId,
        );

        await this.transactionRepository.update(updatedTransaction);
    }
}
