import { ReceiptDraft } from "./receipt-draft.entity.js";

export interface ReceiptDraftRepository {
    findById(id: string): Promise<ReceiptDraft | null>;
    getAll(): Promise<ReceiptDraft[]>;
    save(receiptDraft: ReceiptDraft): Promise<void>;
    update(receiptDraft: ReceiptDraft): Promise<void>;
    delete(receiptDraft: ReceiptDraft): Promise<void>;
    approve(receiptDraft: ReceiptDraft): Promise<void>;
}

export const RECEIPT_DRAFT_REPOSITORY = Symbol('RECEIPT_DRAFT_REPOSITORY');