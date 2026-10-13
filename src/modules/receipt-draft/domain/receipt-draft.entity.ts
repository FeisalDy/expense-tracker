import { ReceiptDraftItem } from "./receipt-draft-item.entity.js";

export class ReceiptDraft {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly status: string,
        public readonly items: ReceiptDraftItem[],
        public readonly date: Date,
    ){}

    create(userId: string, status: string, items: ReceiptDraftItem[], date: Date): ReceiptDraft {
        return new ReceiptDraft(
            this.id,
            userId,
            status,
            items,
            date
        );
    }
}
