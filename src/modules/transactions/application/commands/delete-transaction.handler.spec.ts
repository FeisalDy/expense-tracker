import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { DeleteTransactionHandler } from './delete-transaction.handler.js';
import { DeleteTransactionCommand } from './delete-transaction.command.js';
import { TransactionRepository } from '../../domain/transaction.repository.js';
import { Transaction } from '../../domain/transaction.entity.js';

describe('DeleteTransactionHandler', () => {
    let handler: DeleteTransactionHandler;
    let repository: Partial<TransactionRepository>;

    beforeEach(() => {
        repository = {
            findById: vi.fn(),
            delete: vi.fn(),
        };
        handler = new DeleteTransactionHandler(repository as TransactionRepository);
    });

    it('should delete a transaction when it exists', async () => {
        const existingTransaction = new Transaction(
            'tx-1',
            'user-1',
            100,
            'Description',
            new Date('2026-01-01'),
        );

        vi.mocked(repository.findById!).mockResolvedValue(existingTransaction);
        vi.mocked(repository.delete!).mockResolvedValue(undefined);

        const command = new DeleteTransactionCommand('tx-1');
        await handler.execute(command);

        expect(repository.findById).toHaveBeenCalledWith('tx-1');
        expect(repository.delete).toHaveBeenCalledWith('tx-1');
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
        vi.mocked(repository.findById!).mockResolvedValue(null);

        const command = new DeleteTransactionCommand('tx-non-existent');

        await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
        expect(repository.delete).not.toHaveBeenCalled();
    });
});
