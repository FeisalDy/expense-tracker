export type ReviewStatus = 'READY' | 'NEEDS_REVIEW' | 'INCOMPLETE';

export interface ReceiptLineItem {
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    totalPrice: number | null;
}

export interface RawReceiptDetails {
    merchantName: string | null;
    date: string | null;
    time: string | null;
    currency: string | null;
    total: number | null;
    subtotal: number | null;
    tax: number | null;
    discount: number | null;
    paymentMethod: string | null;
    lineItems: ReceiptLineItem[];
}

export interface TransactionDraft {
    userId: string | null;
    amount: number | null;
    description: string | null;
    date: string | null;
}

export interface ExtractedReceiptResult {
    reviewStatus: ReviewStatus;
    transactionDraft: TransactionDraft;
    rawReceiptDetails: RawReceiptDetails;
    warnings: string[];
}
