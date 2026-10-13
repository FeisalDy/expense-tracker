import { Command } from '@nestjs/cqrs';

export class UpdateReceiptDraftCommand extends Command<void> {
    constructor(
        public readonly id: string,
        public readonly items?: {
            description: string;
            quantity: number | null;
            unitPrice: number | null;
            totalPrice: number | null;
            category: string | null;
        }[],
        public readonly date?: Date,
    ) {
        super();
    }
}
