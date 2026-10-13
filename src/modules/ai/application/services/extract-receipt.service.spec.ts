import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ExtractReceiptService } from './extract-receipt.service.js';
import { ReceiptExtractor } from '../interfaces/receipt-extractor.interface.js';
import { RawReceiptDetails } from '../../domain/extracted-receipt.js';

describe('ExtractReceiptService', () => {
    let service: ExtractReceiptService;
    let extractMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        extractMock = vi.fn();
        const mockExtractor: ReceiptExtractor = {
            extract: extractMock,
        };
        service = new ExtractReceiptService(mockExtractor);
    });

    it('should successfully build a READY draft when all critical fields are valid', async () => {
        const rawDetails: RawReceiptDetails = {
            merchantName: 'Indomaret Point',
            date: '2026-10-13',
            time: '14:20:00',
            currency: 'IDR',
            total: 54000,
            subtotal: 50000,
            tax: 5000,
            discount: 1000,
            paymentMethod: 'QRIS',
            lineItems: [
                {
                    description: 'Onigiri Salmon',
                    quantity: 2,
                    unitPrice: 15000,
                    totalPrice: 30000,
                },
                {
                    description: 'Iced Americano',
                    quantity: 1,
                    unitPrice: 20000,
                    totalPrice: 20000,
                },
            ],
        };

        extractMock.mockResolvedValue(rawDetails);

        const result = await service.execute(
            {
                buffer: Buffer.from('test-image-content'),
                mimeType: 'image/jpeg',
            },
            {
                userId: 'user-456',
            },
        );

        expect(result.reviewStatus).toBe('READY');
        expect(result.warnings).toEqual([]);

        // Contract checks matching CreateTransactionDto & CreateTransactionCommand
        expect(result.transactionDraft).toEqual({
            userId: 'user-456',
            amount: 54000,
            description: 'Indomaret Point',
            date: '2026-10-13T14:20:00Z',
        });
        expect(result.rawReceiptDetails).toBe(rawDetails);
    });

    it('should set reviewStatus to INCOMPLETE and draft amount to null if total is missing', async () => {
        const rawDetails: RawReceiptDetails = {
            merchantName: 'Alfamart',
            date: '2026-10-13',
            time: null,
            currency: 'IDR',
            total: null,
            subtotal: null,
            tax: null,
            discount: null,
            paymentMethod: null,
            lineItems: [],
        };

        extractMock.mockResolvedValue(rawDetails);

        const result = await service.execute({
            buffer: Buffer.from('test-image'),
            mimeType: 'image/png',
        });

        expect(result.reviewStatus).toBe('INCOMPLETE');
        expect(result.transactionDraft.amount).toBeNull();
        expect(result.warnings).toContain(
            'Total amount could not be detected from receipt.',
        );
    });

    it('should set reviewStatus to NEEDS_REVIEW when merchant name is missing', async () => {
        const rawDetails: RawReceiptDetails = {
            merchantName: null,
            date: '2026-10-13',
            time: '10:00:00',
            currency: 'IDR',
            total: 25000,
            subtotal: 25000,
            tax: 0,
            discount: 0,
            paymentMethod: 'CASH',
            lineItems: [
                {
                    description: 'Snack',
                    quantity: 1,
                    unitPrice: 25000,
                    totalPrice: 25000,
                },
            ],
        };

        extractMock.mockResolvedValue(rawDetails);

        const result = await service.execute({
            buffer: Buffer.from('test-image'),
            mimeType: 'image/jpeg',
        });

        expect(result.reviewStatus).toBe('NEEDS_REVIEW');
        expect(result.transactionDraft.amount).toBe(25000);
        expect(result.transactionDraft.description).toBe('Snack');
        expect(result.warnings).toContain(
            'Merchant name could not be identified.',
        );
    });

    it('should set reviewStatus to NEEDS_REVIEW when date is missing', async () => {
        const rawDetails: RawReceiptDetails = {
            merchantName: 'Gramedia',
            date: null,
            time: null,
            currency: 'IDR',
            total: 100000,
            subtotal: 100000,
            tax: 0,
            discount: 0,
            paymentMethod: 'DEBIT',
            lineItems: [],
        };

        extractMock.mockResolvedValue(rawDetails);

        const result = await service.execute({
            buffer: Buffer.from('test-image'),
            mimeType: 'image/jpeg',
        });

        expect(result.reviewStatus).toBe('NEEDS_REVIEW');
        expect(result.transactionDraft.date).toBeNull();
        expect(result.warnings).toContain(
            'Transaction date could not be identified.',
        );
    });

    it('should detect arithmetic discrepancies between subtotal, tax, discount and total', async () => {
        const rawDetails: RawReceiptDetails = {
            merchantName: 'Restaurant XYZ',
            date: '2026-10-13',
            time: '19:00:00',
            currency: 'IDR',
            total: 150000,
            subtotal: 100000,
            tax: 10000, // 100000 + 10000 = 110000 != 150000
            discount: 0,
            paymentMethod: 'CREDIT_CARD',
            lineItems: [],
        };

        extractMock.mockResolvedValue(rawDetails);

        const result = await service.execute({
            buffer: Buffer.from('test-image'),
            mimeType: 'image/jpeg',
        });

        expect(result.reviewStatus).toBe('NEEDS_REVIEW');
        expect(result.warnings).toContain(
            'Subtotal, tax, and discount do not match total amount.',
        );
    });

    it('should reject empty image buffer with BadRequestException', async () => {
        await expect(
            service.execute({
                buffer: Buffer.alloc(0),
                mimeType: 'image/jpeg',
            }),
        ).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported MIME type with BadRequestException', async () => {
        await expect(
            service.execute({
                buffer: Buffer.from('test'),
                mimeType: 'application/pdf',
            }),
        ).rejects.toThrow(BadRequestException);
    });
});
