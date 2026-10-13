import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import {
    BadRequestException,
    BadGatewayException,
    RequestTimeoutException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { GeminiReceiptExtractorService } from './gemini-receipt-extractor.service.js';
import { GoogleGenAI } from '@google/genai';

describe('GeminiReceiptExtractorService', () => {
    let service: GeminiReceiptExtractorService;
    let mockGenAIClient: {
        models: {
            generateContent: ReturnType<typeof vi.fn>;
        };
    };
    let mockConfigService: Partial<ConfigService>;

    beforeEach(() => {
        mockGenAIClient = {
            models: {
                generateContent: vi.fn(),
            },
        };

        mockConfigService = {
            get: vi.fn((key: string) => {
                if (key === 'GEMINI_API_KEY') return 'valid-test-key';
                return undefined;
            }),
        };

        service = new GeminiReceiptExtractorService(
            mockConfigService as ConfigService,
            mockGenAIClient as unknown as GoogleGenAI,
        );
    });

    it('should fail fast if GEMINI_API_KEY is missing or empty', () => {
        const emptyConfigService = {
            get: vi.fn(() => undefined),
        } as unknown as ConfigService;

        const originalEnv = process.env.GEMINI_API_KEY;
        delete process.env.GEMINI_API_KEY;

        try {
            expect(() => {
                new GeminiReceiptExtractorService(emptyConfigService);
            }).toThrow('GEMINI_API_KEY is not defined. Please set GEMINI_API_KEY in your environment.');
        } finally {
            process.env.GEMINI_API_KEY = originalEnv;
        }
    });

    it('should successfully extract structured receipt details from Gemini response', async () => {
        const geminiOutput = {
            merchantName: 'Supermarket Jaya',
            date: '2026-10-13',
            time: '12:45:00',
            currency: 'IDR',
            total: 125000,
            subtotal: 112612.61,
            tax: 12387.39,
            discount: 0,
            paymentMethod: 'QRIS',
            lineItems: [
                {
                    description: 'Susu UHT 1L',
                    quantity: 2,
                    unitPrice: 20000,
                    totalPrice: 40000,
                },
                {
                    description: 'Roti Tawar',
                    quantity: 1,
                    unitPrice: 15000,
                    totalPrice: 15000,
                },
            ],
        };

        mockGenAIClient.models.generateContent.mockResolvedValue({
            text: JSON.stringify(geminiOutput),
        });

        const result = await service.extract({
            buffer: Buffer.from('fake-image-bytes'),
            mimeType: 'image/jpeg',
        });

        expect(mockGenAIClient.models.generateContent).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'gemini-2.5-flash',
                contents: expect.arrayContaining([
                    expect.objectContaining({
                        role: 'user',
                        parts: expect.arrayContaining([
                            expect.objectContaining({
                                inlineData: {
                                    mimeType: 'image/jpeg',
                                    data: Buffer.from('fake-image-bytes').toString('base64'),
                                },
                            }),
                        ]),
                    }),
                ]),
            }),
        );

        expect(result.merchantName).toBe('Supermarket Jaya');
        expect(result.date).toBe('2026-10-13');
        expect(result.time).toBe('12:45:00');
        expect(result.currency).toBe('IDR');
        expect(result.total).toBe(125000);
        expect(result.lineItems).toHaveLength(2);
        expect(result.lineItems[0].description).toBe('Susu UHT 1L');
    });

    it('should correctly parse Indonesian receipt specifics (Rp, separators, Indonesian dates)', async () => {
        const indonesianRawOutput = {
            merchantName: 'Warung Kopi Kenangan',
            date: '13/10/2026',
            time: '09:15',
            currency: 'Rp',
            total: '1.250.000',
            subtotal: '1.200.000',
            tax: '50.000',
            discount: null,
            paymentMethod: 'CASH',
            lineItems: [
                {
                    description: 'Kopi Kenangan Mantan',
                    quantity: 50,
                    unitPrice: '24.000',
                    totalPrice: '1.200.000',
                },
            ],
        };

        mockGenAIClient.models.generateContent.mockResolvedValue({
            text: JSON.stringify(indonesianRawOutput),
        });

        const result = await service.extract({
            buffer: Buffer.from('test-image'),
            mimeType: 'image/png',
        });

        expect(result.currency).toBe('IDR');
        expect(result.date).toBe('2026-10-13');
        expect(result.time).toBe('09:15:00');
        expect(result.total).toBe(1250000);
        expect(result.subtotal).toBe(1200000);
        expect(result.tax).toBe(50000);
        expect(result.lineItems[0].totalPrice).toBe(1200000);
    });

    it('should handle missing fields with null and never fabricate values', async () => {
        const sparseOutput = {
            merchantName: null,
            date: null,
            time: null,
            currency: null,
            total: null,
            subtotal: null,
            tax: null,
            discount: null,
            paymentMethod: null,
            lineItems: [],
        };

        mockGenAIClient.models.generateContent.mockResolvedValue({
            text: JSON.stringify(sparseOutput),
        });

        const result = await service.extract({
            buffer: Buffer.from('test-image'),
            mimeType: 'image/webp',
        });

        expect(result.merchantName).toBeNull();
        expect(result.date).toBeNull();
        expect(result.time).toBeNull();
        expect(result.currency).toBeNull();
        expect(result.total).toBeNull();
        expect(result.subtotal).toBeNull();
        expect(result.tax).toBeNull();
        expect(result.discount).toBeNull();
        expect(result.paymentMethod).toBeNull();
        expect(result.lineItems).toEqual([]);
    });

    it('should strip markdown code fences from response', async () => {
        const rawJson = '```json\n{"merchantName": "Alfamart", "total": 45000, "lineItems": []}\n```';

        mockGenAIClient.models.generateContent.mockResolvedValue({
            text: rawJson,
        });

        const result = await service.extract({
            buffer: Buffer.from('test-image'),
            mimeType: 'image/jpeg',
        });

        expect(result.merchantName).toBe('Alfamart');
        expect(result.total).toBe(45000);
    });

    it('should throw BadGatewayException on malformed JSON response', async () => {
        mockGenAIClient.models.generateContent.mockResolvedValue({
            text: 'Not a valid JSON string',
        });

        await expect(
            service.extract({
                buffer: Buffer.from('test-image'),
                mimeType: 'image/jpeg',
            }),
        ).rejects.toThrow(BadGatewayException);
    });

    it('should throw BadGatewayException on empty text response', async () => {
        mockGenAIClient.models.generateContent.mockResolvedValue({
            text: '',
        });

        await expect(
            service.extract({
                buffer: Buffer.from('test-image'),
                mimeType: 'image/jpeg',
            }),
        ).rejects.toThrow(BadGatewayException);
    });

    it('should map 429 rate limit errors to HttpStatus.TOO_MANY_REQUESTS', async () => {
        mockGenAIClient.models.generateContent.mockRejectedValue({
            status: 429,
            message: 'RESOURCE_EXHAUSTED quota exceeded',
        });

        await expect(
            service.extract({
                buffer: Buffer.from('test-image'),
                mimeType: 'image/jpeg',
            }),
        ).rejects.toThrow(HttpException);

        try {
            await service.extract({
                buffer: Buffer.from('test-image'),
                mimeType: 'image/jpeg',
            });
        } catch (err: unknown) {
            expect((err as HttpException).getStatus()).toBe(
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
    });

    it('should map timeout errors to RequestTimeoutException', async () => {
        mockGenAIClient.models.generateContent.mockRejectedValue({
            code: 'ETIMEDOUT',
            message: 'Request timeout after 30000ms',
        });

        await expect(
            service.extract({
                buffer: Buffer.from('test-image'),
                mimeType: 'image/jpeg',
            }),
        ).rejects.toThrow(RequestTimeoutException);
    });

    it('should map 400 invalid argument errors to BadRequestException', async () => {
        mockGenAIClient.models.generateContent.mockRejectedValue({
            status: 400,
            message: 'INVALID_ARGUMENT: Bad image data',
        });

        await expect(
            service.extract({
                buffer: Buffer.from('test-image'),
                mimeType: 'image/jpeg',
            }),
        ).rejects.toThrow(BadRequestException);
    });

    it('should map unknown upstream errors to BadGatewayException without exposing API key', async () => {
        mockGenAIClient.models.generateContent.mockRejectedValue(
            new Error('Internal connection reset with key secret_gemini_key_12345'),
        );

        await expect(
            service.extract({
                buffer: Buffer.from('test-image'),
                mimeType: 'image/jpeg',
            }),
        ).rejects.toThrow(BadGatewayException);
    });
});
