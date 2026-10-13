import { Command } from '@nestjs/cqrs';

export class DeleteReceiptDraftCommand extends Command<void> {
    constructor(public readonly id: string) {
        super();
    }
}
