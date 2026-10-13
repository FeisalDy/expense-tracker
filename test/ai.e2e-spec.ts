import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { RECEIPT_EXTRACTOR } from '../src/modules/ai/application/interfaces/receipt-extractor.interface.js';
import { RawReceiptDetails } from '../src/modules/ai/domain/extracted-receipt.js';

describe('AI Receipt Extraction (e2e)', () => {
    let app: INestApplication<App>;
    const mockExtract = vi.fn();

    beforeEach(async () => {
        const mockRawDetails: RawReceiptDetails = {
            merchantName: 'Indomaret Point',
            date: '2026-10-13',
            time: '14:30:00',
            currency: 'IDR',
            total: 55000,
            subtotal: 50000,
            tax: 5000,
            discount: 0,
            paymentMethod: 'QRIS',
            lineItems: [
                {
                    description: 'Roti Gandum',
                    quantity: 1,
                    unitPrice: 20000,
                    totalPrice: 20000,
                },
                {
                    description: 'Kopi Kenangan',
                    quantity: 1,
                    unitPrice: 30000,
                    totalPrice: 30000,
                },
            ],
        };

        mockExtract.mockResolvedValue(mockRawDetails);

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(RECEIPT_EXTRACTOR)
            .useValue({
                extract: mockExtract,
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('POST /ai/receipts/extract - should successfully extract receipt image', async () => {
        const fakeImageBuffer = Buffer.from('fake-image-content');

        const response = await request(app.getHttpServer())
            .post('/ai/receipts/extract')
            .attach('file', fakeImageBuffer, 'receipt.jpg')
            .field('userId', 'user-test-123')
            .expect(200);

        expect(response.body).toHaveProperty('reviewStatus', 'READY');
        expect(response.body).toHaveProperty('transactionDraft');
        expect(response.body.transactionDraft).toEqual({
            userId: 'user-test-123',
            amount: 55000,
            description: 'Indomaret Point',
            date: '2026-10-13T14:30:00Z',
        });
        expect(response.body).toHaveProperty('rawReceiptDetails');
        expect(response.body.rawReceiptDetails.merchantName).toBe('Indomaret Point');
        expect(response.body.rawReceiptDetails.total).toBe(55000);
        expect(response.body).toHaveProperty('warnings');
        expect(Array.isArray(response.body.warnings)).toBe(true);
    });

    it('POST /ai/receipts/extract - should reject missing file with 400 Bad Request', async () => {
        const response = await request(app.getHttpServer())
            .post('/ai/receipts/extract')
            .expect(400);

        expect(response.body.message).toContain('Receipt image file is required');
    });

    it('POST /ai/receipts/extract - should reject invalid file MIME type with 400 Bad Request', async () => {
        const response = await request(app.getHttpServer())
            .post('/ai/receipts/extract')
            .attach('file', Buffer.from('pdf data'), 'receipt.pdf')
            .expect(400);

        expect(response.body.message).toContain('Invalid file type');
    });
});
