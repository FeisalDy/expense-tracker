import { Command } from '@nestjs/cqrs';

export class UpdateTransactionCommand extends Command<void> {
    constructor(
        public readonly id: string,
        public readonly amount?: number,
        public readonly description?: string | null,
        public readonly userId?: string,
    ) {
        super();
    }
}
