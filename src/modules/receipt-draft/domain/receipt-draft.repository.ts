import { ReceiptDraft } from "./receipt-draft.entity.js";

export interface ReceiptDraftRepository {
    find(receiptDraft: ReceiptDraft): Promise<ReceiptDraft | null>;
    save(receiptDraft: ReceiptDraft): Promise<void>;
    update(receiptDraft: ReceiptDraft): Promise<void>;
    delete(receiptDraft: ReceiptDraft): Promise<void>;
    approve(receiptDraft: ReceiptDraft): Promise<void>;
}