import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AiController } from './ai.controller.js';
import { ExtractReceiptService } from '../../application/services/extract-receipt.service.js';
import { ExtractedReceiptResult } from '../../domain/extracted-receipt.js';

import { Readable } from 'stream';

describe('AiController', () => {
    let controller: AiController;
    let mockExtractService: Partial<ExtractReceiptService>;

    beforeEach(() => {
        mockExtractService = {
            execute: vi.fn(),
        };
        controller = new AiController(
            mockExtractService as ExtractReceiptService,
        );
    });

    const createMockFile = (
        overrides: Partial<Express.Multer.File> = {},
    ): Express.Multer.File => ({
        fieldname: 'file',
        originalname: 'receipt.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: '/tmp',
        filename: 'receipt.jpg',
        path: '/tmp/receipt.jpg',
        buffer: Buffer.from('mock-image-bytes'),
        stream: new Readable(),
        ...overrides,
    });

    it('should successfully extract receipt and return response DTO', async () => {
        const mockResult: ExtractedReceiptResult = {
            reviewStatus: 'READY',
            transactionDraft: {
                userId: 'user-789',
                amount: 75000,
                description: 'Starbucks',
                date: '2026-10-13T10:00:00Z',
            },
            rawReceiptDetails: {
                merchantName: 'Starbucks',
                date: '2026-10-13',
                time: '10:00:00',
                currency: 'IDR',
                total: 75000,
                subtotal: 70000,
                tax: 5000,
                discount: null,
                paymentMethod: 'QRIS',
                lineItems: [],
            },
            warnings: [],
        };

        vi.mocked(mockExtractService.execute!).mockResolvedValue(mockResult);

        const file = createMockFile();
        const response = await controller.extractReceipt(
            file,
            'user-789',
            undefined,
        );

        expect(response).toEqual(mockResult);
        expect(mockExtractService.execute).toHaveBeenCalledWith(
            {
                buffer: file.buffer,
                mimeType: 'image/jpeg',
            },
            {
                userId: 'user-789',
            },
        );
    });

    it('should use header x-user-id if body userId is omitted', async () => {
        const mockResult: ExtractedReceiptResult = {
            reviewStatus: 'READY',
            transactionDraft: {
                userId: 'header-user',
                amount: 50000,
                description: 'Cafe',
                date: null,
            },
            rawReceiptDetails: {
                merchantName: 'Cafe',
                date: null,
                time: null,
                currency: 'IDR',
                total: 50000,
                subtotal: null,
                tax: null,
                discount: null,
                paymentMethod: null,
                lineItems: [],
            },
            warnings: [],
        };

        vi.mocked(mockExtractService.execute!).mockResolvedValue(mockResult);

        const file = createMockFile();
        await controller.extractReceipt(file, undefined, 'header-user');

        expect(mockExtractService.execute).toHaveBeenCalledWith(
            expect.anything(),
            {
                userId: 'header-user',
            },
        );
    });

    it('should throw BadRequestException if file is missing', async () => {
        await expect(controller.extractReceipt(undefined)).rejects.toThrow(
            BadRequestException,
        );
    });

    it('should throw BadRequestException if file MIME type is invalid', async () => {
        const file = createMockFile({ mimetype: 'application/pdf' });
        await expect(controller.extractReceipt(file)).rejects.toThrow(
            BadRequestException,
        );
    });

    it('should throw BadRequestException if file size is zero', async () => {
        const file = createMockFile({ size: 0 });
        await expect(controller.extractReceipt(file)).rejects.toThrow(
            BadRequestException,
        );
    });

    it('should throw BadRequestException if file size exceeds 10MB limit', async () => {
        const file = createMockFile({ size: 11 * 1024 * 1024 });
        await expect(controller.extractReceipt(file)).rejects.toThrow(
            BadRequestException,
        );
    });
});
