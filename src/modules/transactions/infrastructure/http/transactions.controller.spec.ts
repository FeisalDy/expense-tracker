import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TransactionsController } from './transactions.controller.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { CreateTransactionCommand } from '../../application/commands/create-transaction.command.js';
import { UpdateTransactionCommand } from '../../application/commands/update-transaction.command.js';
import { DeleteTransactionCommand } from '../../application/commands/delete-transaction.command.js';
import { GetTransactionQuery } from '../../application/queries/get-transaction.handler.js';
import { Transaction } from '../../domain/transaction.entity.js';

describe('TransactionsController', () => {
    let controller: TransactionsController;
    let commandBus: Partial<CommandBus>;
    let queryBus: Partial<QueryBus>;

    beforeEach(() => {
        commandBus = {
            execute: vi.fn(),
        };
        queryBus = {
            execute: vi.fn(),
        };
        controller = new TransactionsController(
            commandBus as CommandBus,
            queryBus as QueryBus,
        );
    });

    it('should create a transaction', async () => {
        vi.mocked(commandBus.execute!).mockResolvedValue('new-id');

        const dto: CreateTransactionDto = {
            userId: 'user-1',
            amount: 150,
            description: 'Lunch',
        };

        const result = await controller.createTransaction(dto);

        expect(result).toEqual({ id: 'new-id' });
        expect(commandBus.execute).toHaveBeenCalledWith(
            expect.any(CreateTransactionCommand),
        );
    });

    it('should get transactions', async () => {
        const dummyTransactions = [
            new Transaction('tx-1', 'user-1', 100, 'Test', new Date()),
        ];
        vi.mocked(queryBus.execute!).mockResolvedValue(dummyTransactions);

        const result = await controller.getTransactions();

        expect(result).toEqual(dummyTransactions);
        expect(queryBus.execute).toHaveBeenCalledWith(
            expect.any(GetTransactionQuery),
        );
    });

    it('should update a transaction', async () => {
        vi.mocked(commandBus.execute!).mockResolvedValue(undefined);

        const dto: UpdateTransactionDto = {
            amount: 200,
            description: 'Updated lunch',
        };

        const result = await controller.updateTransaction('tx-1', dto);

        expect(result).toEqual({ id: 'tx-1' });
        expect(commandBus.execute).toHaveBeenCalledWith(
            expect.any(UpdateTransactionCommand),
        );
        const command = vi.mocked(commandBus.execute!).mock.calls[0][0] as UpdateTransactionCommand;
        expect(command.id).toBe('tx-1');
        expect(command.amount).toBe(200);
        expect(command.description).toBe('Updated lunch');
    });

    it('should delete a transaction', async () => {
        vi.mocked(commandBus.execute!).mockResolvedValue(undefined);

        const result = await controller.deleteTransaction('tx-1');

        expect(result).toEqual({ id: 'tx-1' });
        expect(commandBus.execute).toHaveBeenCalledWith(
            expect.any(DeleteTransactionCommand),
        );
        const command = vi.mocked(commandBus.execute!).mock.calls[0][0] as DeleteTransactionCommand;
        expect(command.id).toBe('tx-1');
    });
});
