import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteTransactionCommand } from './delete-transaction.command.js';
import { Inject, NotFoundException } from '@nestjs/common';
import {
    TRANSACTION_REPOSITORY,
    type TransactionRepository,
} from '../../domain/transaction.repository.js';

@CommandHandler(DeleteTransactionCommand)
export class DeleteTransactionHandler
    implements ICommandHandler<DeleteTransactionCommand, void>
{
    constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly transactionRepository: TransactionRepository,
    ) {}

    async execute(command: DeleteTransactionCommand): Promise<void> {
        const transaction = await this.transactionRepository.findById(command.id);

        if (!transaction) {
            throw new NotFoundException(`Transaction with id "${command.id}" not found`);
        }

        await this.transactionRepository.delete(command.id);
    }
}
