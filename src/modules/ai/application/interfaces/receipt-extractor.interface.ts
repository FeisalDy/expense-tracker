import { RawReceiptDetails } from '../../domain/extracted-receipt.js';

export interface ReceiptExtractorInput {
    buffer: Buffer;
    mimeType: string;
}

export interface ReceiptExtractor {
    extract(input: ReceiptExtractorInput): Promise<RawReceiptDetails>;
}

export const RECEIPT_EXTRACTOR = Symbol('RECEIPT_EXTRACTOR');
