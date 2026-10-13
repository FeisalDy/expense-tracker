export class ReceiptDraftItem {
    constructor(
        public readonly id: string,
        public readonly description: string,
        public readonly quantity: number | null,
        public readonly unitPrice: number | null,
        public readonly totalPrice: number | null,
        public readonly category: string | null,
    ){}

    create(description: string, quantity: number | null, unitPrice: number | null, totalPrice: number | null, category: string | null): ReceiptDraftItem {
        return new ReceiptDraftItem(
            this.id,
            description,
            quantity,
            unitPrice,
            totalPrice,
            category
        );
    }
}
