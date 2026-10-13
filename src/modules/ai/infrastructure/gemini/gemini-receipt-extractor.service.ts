import {
    Injectable,
    Logger,
    Optional,
    Inject,
    BadRequestException,
    BadGatewayException,
    RequestTimeoutException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';
import {
    ReceiptExtractor,
    ReceiptExtractorInput,
} from '../../application/interfaces/receipt-extractor.interface.js';
import {
    RawReceiptDetails,
    ReceiptLineItem,
} from '../../domain/extracted-receipt.js';

const RECEIPT_EXTRACTION_SYSTEM_INSTRUCTION = `You are an expert financial receipt parser specializing in international and Indonesian receipts.
Extract receipt details with absolute factual accuracy.
Rules:
- NEVER fabricate, hallucinate, or guess dates, amounts, categories, or merchant names. If any information is absent, illegible, or uncertain, use null.
- Indonesian receipts:
  * Currency is typically IDR (Rp / Rupiah). Return "IDR" for Rupiah.
  * Numbers often use '.' as thousands separator (e.g. 1.250.000 = 1250000) and ',' as decimal separator. Return raw numeric values as standard numbers.
  * Dates may appear in Indonesian formats such as DD/MM/YYYY, DD-MM-YYYY, or DD Month YYYY (e.g., "13 Okt 2026", "25 Desember 2025"). Standardize dates to YYYY-MM-DD.
- Return structured data strictly conforming to the schema.`;

const RECEIPT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        merchantName: {
            type: Type.STRING,
            description: 'Name of the merchant or store. Null if not legible or present.',
            nullable: true,
        },
        date: {
            type: Type.STRING,
            description: 'Transaction date in YYYY-MM-DD format. Null if not legible or present.',
            nullable: true,
        },
        time: {
            type: Type.STRING,
            description: 'Transaction time in HH:mm or HH:mm:ss format. Null if not legible or present.',
            nullable: true,
        },
        currency: {
            type: Type.STRING,
            description: 'ISO currency code (e.g., IDR, USD). Null if not determinable.',
            nullable: true,
        },
        total: {
            type: Type.NUMBER,
            description: 'Final total amount as a number. Null if missing.',
            nullable: true,
        },
        subtotal: {
            type: Type.NUMBER,
            description: 'Subtotal before tax/discount as a number. Null if missing.',
            nullable: true,
        },
        tax: {
            type: Type.NUMBER,
            description: 'Tax amount (e.g. PPN, PB1). Null if missing.',
            nullable: true,
        },
        discount: {
            type: Type.NUMBER,
            description: 'Discount amount deducted as a positive number. Null if missing.',
            nullable: true,
        },
        paymentMethod: {
            type: Type.STRING,
            description: 'Payment method (e.g. CASH, QRIS, DEBIT, CREDIT_CARD, GOPAY, OVO). Null if missing.',
            nullable: true,
        },
        lineItems: {
            type: Type.ARRAY,
            description: 'Line items detected on the receipt. Empty array if not legible.',
            items: {
                type: Type.OBJECT,
                properties: {
                    description: {
                        type: Type.STRING,
                        description: 'Item name or description.',
                    },
                    quantity: {
                        type: Type.NUMBER,
                        description: 'Quantity purchased, or null.',
                        nullable: true,
                    },
                    unitPrice: {
                        type: Type.NUMBER,
                        description: 'Unit price, or null.',
                        nullable: true,
                    },
                    totalPrice: {
                        type: Type.NUMBER,
                        description: 'Total price for this item, or null.',
                        nullable: true,
                    },
                },
                required: ['description'],
            },
        },
    },
    required: ['lineItems'],
};

@Injectable()
export class GeminiReceiptExtractorService implements ReceiptExtractor {
    private readonly logger = new Logger(GeminiReceiptExtractorService.name);
    private readonly client: GoogleGenAI;
    private readonly model = 'gemini-2.5-flash';

    constructor(
        private readonly configService: ConfigService,
        @Optional() @Inject('GOOGLE_GENAI_CLIENT') customClient?: GoogleGenAI,
    ) {
        if (customClient) {
            this.client = customClient;
            return;
        }

        const apiKey =
            this.configService.get<string>('GEMINI_API_KEY') ??
            process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.trim() === '') {
            throw new Error(
                'GEMINI_API_KEY is not defined. Please set GEMINI_API_KEY in your environment.',
            );
        }

        this.client = new GoogleGenAI({ apiKey });
    }

    async extract(input: ReceiptExtractorInput): Promise<RawReceiptDetails> {
        try {
            const base64Data = input.buffer.toString('base64');

            const response = await this.client.models.generateContent({
                model: this.model,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                inlineData: {
                                    mimeType: input.mimeType,
                                    data: base64Data,
                                },
                            },
                            {
                                text: 'Analyze this receipt image and extract all financial details according to the schema.',
                            },
                        ],
                    },
                ],
                config: {
                    systemInstruction: RECEIPT_EXTRACTION_SYSTEM_INSTRUCTION,
                    responseMimeType: 'application/json',
                    responseSchema: RECEIPT_SCHEMA,
                    httpOptions: {
                        timeout: 30000,
                    },
                },
            });

            const text = response.text;
            if (!text || text.trim() === '') {
                throw new BadGatewayException('Gemini returned an empty response.');
            }

            return this.parseAndValidateResponse(text);
        } catch (error: unknown) {
            this.handleGeminiError(error);
        }
    }

    private parseAndValidateResponse(rawJson: string): RawReceiptDetails {
        let parsed: unknown;
        try {
            const sanitizedText = this.stripMarkdownCodeFences(rawJson);
            parsed = JSON.parse(sanitizedText);
        } catch {
            this.logger.error('Failed to parse Gemini JSON output');
            throw new BadGatewayException(
                'Failed to parse structured response from AI model.',
            );
        }

        if (typeof parsed !== 'object' || parsed === null) {
            throw new BadGatewayException('Invalid AI response structure: expected an object.');
        }

        const data = parsed as Record<string, unknown>;

        return {
            merchantName: this.sanitizeString(data.merchantName),
            date: this.sanitizeDate(data.date),
            time: this.sanitizeTime(data.time),
            currency: this.sanitizeCurrency(data.currency),
            total: this.sanitizeNumber(data.total),
            subtotal: this.sanitizeNumber(data.subtotal),
            tax: this.sanitizeNumber(data.tax),
            discount: this.sanitizeNumber(data.discount),
            paymentMethod: this.sanitizeString(data.paymentMethod),
            lineItems: this.sanitizeLineItems(data.lineItems),
        };
    }

    private stripMarkdownCodeFences(text: string): string {
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        return cleaned.trim();
    }

    private sanitizeString(val: unknown): string | null {
        if (typeof val !== 'string') return null;
        const trimmed = val.trim();
        if (!trimmed || ['null', 'undefined', 'n/a', 'none'].includes(trimmed.toLowerCase())) {
            return null;
        }
        return trimmed;
    }

    private sanitizeDate(val: unknown): string | null {
        const str = this.sanitizeString(val);
        if (!str) return null;

        // Check if already in YYYY-MM-DD
        const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
        if (isoMatch) {
            const year = parseInt(isoMatch[1], 10);
            const month = parseInt(isoMatch[2], 10);
            const day = parseInt(isoMatch[3], 10);
            if (year > 1970 && year < 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return str;
            }
        }

        // Try parsing Indonesian or alternative date format DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(str);
        if (dmyMatch) {
            const day = dmyMatch[1].padStart(2, '0');
            const month = dmyMatch[2].padStart(2, '0');
            const year = dmyMatch[3];
            return `${year}-${month}-${day}`;
        }

        // Generic Date parse attempt
        const parsedTimestamp = Date.parse(str);
        if (!Number.isNaN(parsedTimestamp)) {
            const d = new Date(parsedTimestamp);
            return d.toISOString().split('T')[0];
        }

        return null;
    }

    private sanitizeTime(val: unknown): string | null {
        const str = this.sanitizeString(val);
        if (!str) return null;
        const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(str);
        if (timeMatch) {
            const hours = timeMatch[1].padStart(2, '0');
            const minutes = timeMatch[2];
            const seconds = timeMatch[3] ?? '00';
            return `${hours}:${minutes}:${seconds}`;
        }
        return null;
    }

    private sanitizeCurrency(val: unknown): string | null {
        const str = this.sanitizeString(val);
        if (!str) return null;
        const upper = str.toUpperCase();
        if (upper === 'RP' || upper === 'RUPIAH' || upper === 'IDR') {
            return 'IDR';
        }
        return upper;
    }

    private sanitizeNumber(val: unknown): number | null {
        if (typeof val === 'number') {
            if (Number.isFinite(val) && val >= 0) {
                return Math.round(val * 100) / 100;
            }
            return null;
        }

        if (typeof val === 'string') {
            let clean = val.trim().replace(/^(rp\.?|idr)\s*/i, '');
            // Handle Indonesian thousand separator e.g. 1.250.000 or 1.250.000,50
            if (clean.includes('.') && clean.includes(',')) {
                clean = clean.replace(/\./g, '').replace(',', '.');
            } else if (clean.includes('.')) {
                const parts = clean.split('.');
                // If last part is 3 digits, treat all dots as thousand separators
                if (parts[parts.length - 1].length === 3) {
                    clean = clean.replace(/\./g, '');
                }
            } else if (clean.includes(',')) {
                clean = clean.replace(',', '.');
            }

            const num = parseFloat(clean);
            if (Number.isFinite(num) && num >= 0) {
                return Math.round(num * 100) / 100;
            }
        }

        return null;
    }

    private sanitizeLineItems(val: unknown): ReceiptLineItem[] {
        if (!Array.isArray(val)) return [];

        const items: ReceiptLineItem[] = [];
        for (const raw of val) {
            if (typeof raw !== 'object' || raw === null) continue;
            const item = raw as Record<string, unknown>;
            const description = this.sanitizeString(item.description);
            if (!description) continue;

            items.push({
                description,
                quantity: this.sanitizeNumber(item.quantity),
                unitPrice: this.sanitizeNumber(item.unitPrice),
                totalPrice: this.sanitizeNumber(item.totalPrice),
            });
        }
        return items;
    }

    private handleGeminiError(error: unknown): never {
        if (error instanceof HttpException) {
            throw error;
        }

        const errObj = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};
        const message = typeof errObj.message === 'string' ? errObj.message : '';
        const status = typeof errObj.status === 'number' ? errObj.status : 0;
        const code = typeof errObj.code === 'string' ? errObj.code : '';

        // Clean any sensitive details from log
        this.logger.error(`Gemini receipt extraction failed: ${message}`);

        if (code === 'ETIMEDOUT' || message.toLowerCase().includes('timeout')) {
            throw new RequestTimeoutException('Receipt extraction timed out. Please try again.');
        }

        if (
            status === 429 ||
            message.includes('429') ||
            message.includes('RESOURCE_EXHAUSTED') ||
            message.toLowerCase().includes('quota') ||
            message.toLowerCase().includes('rate limit')
        ) {
            throw new HttpException(
                'AI service rate limit exceeded. Please try again later.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        if (status === 400 || message.includes('INVALID_ARGUMENT')) {
            throw new BadRequestException(
                'Failed to process receipt image. Please ensure the image is clear and valid.',
            );
        }

        throw new BadGatewayException('Failed to process receipt with AI service.');
    }
}
