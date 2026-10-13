import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateReceiptDraftCommand } from './create-receipt-draft.command.js';
import {
    RECEIPT_DRAFT_REPOSITORY,
    type ReceiptDraftRepository,
} from '../../domain/receipt-draft.repository.js';
import { ReceiptDraft } from '../../domain/receipt-draft.entity.js';
import { ReceiptDraftItem } from '../../domain/receipt-draft-item.entity.js';

@CommandHandler(CreateReceiptDraftCommand)
export class CreateReceiptDraftHandler
    implements ICommandHandler<CreateReceiptDraftCommand, string>
{
    constructor(
        @Inject(RECEIPT_DRAFT_REPOSITORY)
        private readonly receiptDraftRepository: ReceiptDraftRepository,
    ) {}

    async execute(command: CreateReceiptDraftCommand): Promise<string> {
        const id = crypto.randomUUID();

        const items = command.items.map(
            (item) =>
                new ReceiptDraftItem(
                    crypto.randomUUID(),
                    item.description,
                    item.quantity,
                    item.unitPrice,
                    item.totalPrice,
                    item.category,
                ),
        );

        const receiptDraft = new ReceiptDraft(
            id,
            command.userId,
            'PENDING',
            items,
            command.date,
        );

        await this.receiptDraftRepository.save(receiptDraft);
        return id;
    }
}
