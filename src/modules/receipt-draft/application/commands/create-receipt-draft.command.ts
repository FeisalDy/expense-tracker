import { Command } from '@nestjs/cqrs';

export class CreateReceiptDraftCommand extends Command<string> {
    constructor(
        public readonly userId: string,
        public readonly items: {
            description: string;
            quantity: number | null;
            unitPrice: number | null;
            totalPrice: number | null;
            category: string | null;
        }[],
        public readonly date: Date,
    ) {
        super();
    }
}
