import { Command } from '@nestjs/cqrs';

export class ApproveReceiptDraftCommand extends Command<void> {
    constructor(public readonly id: string) {
        super();
    }
}
