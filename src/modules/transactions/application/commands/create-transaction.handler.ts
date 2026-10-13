import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateTransactionCommand } from "./create-transaction.command.js";
import { Inject } from '@nestjs/common';
import { TRANSACTION_REPOSITORY, type TransactionRepository } from '../../domain/transaction.repository.js';
import { Transaction } from '../../domain/transaction.entity.js';

@CommandHandler(CreateTransactionCommand)
export class CreateTransactionHandler implements ICommandHandler<CreateTransactionCommand> {
    constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(command: CreateTransactionCommand): Promise<string> {
    const transaction = Transaction.create(
      crypto.randomUUID(),
      command.userId,
      command.amount,
      command.description,
      command.createdAt,
    );

    await this.transactionRepository.save(transaction);
    return transaction.id;
  }
}