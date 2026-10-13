import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UpdateTransactionHandler } from './update-transaction.handler.js';
import { UpdateTransactionCommand } from './update-transaction.command.js';
import { TransactionRepository } from '../../domain/transaction.repository.js';
import { Transaction } from '../../domain/transaction.entity.js';

describe('UpdateTransactionHandler', () => {
    let handler: UpdateTransactionHandler;
    let repository: Partial<TransactionRepository>;

    beforeEach(() => {
        repository = {
            findById: vi.fn(),
            update: vi.fn(),
        };
        handler = new UpdateTransactionHandler(repository as TransactionRepository);
    });

    it('should update a transaction when it exists', async () => {
        const existingTransaction = new Transaction(
            'tx-1',
            'user-1',
            100,
            'Old description',
            new Date('2026-01-01'),
        );

        vi.mocked(repository.findById!).mockResolvedValue(existingTransaction);
        vi.mocked(repository.update!).mockResolvedValue(undefined);

        const command = new UpdateTransactionCommand('tx-1', 250, 'New description');
        await handler.execute(command);

        expect(repository.findById).toHaveBeenCalledWith('tx-1');
        expect(repository.update).toHaveBeenCalledTimes(1);

        const updatedTx = vi.mocked(repository.update!).mock.calls[0][0];
        expect(updatedTx.id).toBe('tx-1');
        expect(updatedTx.userId).toBe('user-1');
        expect(updatedTx.amount).toBe(250);
        expect(updatedTx.description).toBe('New description');
        expect(updatedTx.createdAt).toEqual(existingTransaction.createdAt);
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
        vi.mocked(repository.findById!).mockResolvedValue(null);

        const command = new UpdateTransactionCommand('tx-non-existent', 250);

        await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
        expect(repository.update).not.toHaveBeenCalled();
    });
});
