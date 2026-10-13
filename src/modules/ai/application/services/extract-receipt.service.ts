import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
    RECEIPT_EXTRACTOR,
    ReceiptExtractorInput,
} from '../interfaces/receipt-extractor.interface.js';
import type { ReceiptExtractor } from '../interfaces/receipt-extractor.interface.js';
import {
    ExtractedReceiptResult,
    ReviewStatus,
    TransactionDraft,
    RawReceiptDetails,
} from '../../domain/extracted-receipt.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ExtractReceiptOptions {
    userId?: string | null;
}

@Injectable()
export class ExtractReceiptService {
    constructor(
        @Inject(RECEIPT_EXTRACTOR)
        private readonly receiptExtractor: ReceiptExtractor,
    ) {}

    async execute(
        input: ReceiptExtractorInput,
        options?: ExtractReceiptOptions,
    ): Promise<ExtractedReceiptResult> {
        this.validateInput(input);

        const rawDetails = await this.receiptExtractor.extract(input);
        return this.buildResult(rawDetails, options?.userId ?? null);
    }

    private validateInput(input: ReceiptExtractorInput): void {
        if (!input.buffer || input.buffer.length === 0) {
            throw new BadRequestException('Receipt image file is empty or missing.');
        }

        if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
            throw new BadRequestException(
                `Unsupported image format: ${input.mimeType}. Allowed formats are: ${ALLOWED_MIME_TYPES.join(', ')}`,
            );
        }
    }

    private buildResult(
        raw: RawReceiptDetails,
        userId: string | null,
    ): ExtractedReceiptResult {
        const warnings: string[] = [];
        let reviewStatus: ReviewStatus = 'READY';

        // 1. Validate Total / Amount
        let draftAmount: number | null = null;
        if (raw.total !== null && raw.total > 0) {
            draftAmount = Math.round(raw.total * 100) / 100;
        } else {
            draftAmount = null;
            reviewStatus = 'INCOMPLETE';
            warnings.push('Total amount could not be detected from receipt.');
        }

        // 2. Validate Merchant Name
        let draftDescription: string | null = null;
        if (raw.merchantName) {
            draftDescription = raw.merchantName;
        } else {
            if (raw.lineItems.length > 0) {
                draftDescription = raw.lineItems[0].description;
            } else {
                draftDescription = null;
            }
            warnings.push('Merchant name could not be identified.');
            if (reviewStatus !== 'INCOMPLETE') {
                reviewStatus = 'NEEDS_REVIEW';
            }
        }

        // 3. Validate Date
        let draftDate: string | null = null;
        if (raw.date) {
            const timePart = raw.time ?? '00:00:00';
            draftDate = `${raw.date}T${timePart}Z`;
        } else {
            warnings.push('Transaction date could not be identified.');
            if (reviewStatus !== 'INCOMPLETE') {
                reviewStatus = 'NEEDS_REVIEW';
            }
        }

        // 4. Validate arithmetic consistency if subtotal is available
        if (raw.total !== null && raw.subtotal !== null) {
            const expected =
                raw.subtotal + (raw.tax ?? 0) - (raw.discount ?? 0);
            const diff = Math.abs(expected - raw.total);
            if (diff > 1.0) {
                warnings.push(
                    'Subtotal, tax, and discount do not match total amount.',
                );
                if (reviewStatus !== 'INCOMPLETE') {
                    reviewStatus = 'NEEDS_REVIEW';
                }
            }
        }

        // 5. Line items check
        if (raw.lineItems.length === 0) {
            warnings.push('No legible line items were detected.');
        }

        const transactionDraft: TransactionDraft = {
            userId,
            amount: draftAmount,
            description: draftDescription,
            date: draftDate,
        };

        return {
            reviewStatus,
            transactionDraft,
            rawReceiptDetails: raw,
            warnings,
        };
    }
}
