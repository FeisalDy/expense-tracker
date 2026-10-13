import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateReceiptDraftCommand } from './update-receipt-draft.command.js';
import {
    RECEIPT_DRAFT_REPOSITORY,
    type ReceiptDraftRepository,
} from '../../domain/receipt-draft.repository.js';
import { ReceiptDraft } from '../../domain/receipt-draft.entity.js';
import { ReceiptDraftItem } from '../../domain/receipt-draft-item.entity.js';

@CommandHandler(UpdateReceiptDraftCommand)
export class UpdateReceiptDraftHandler
    implements ICommandHandler<UpdateReceiptDraftCommand, void>
{
    constructor(
        @Inject(RECEIPT_DRAFT_REPOSITORY)
        private readonly receiptDraftRepository: ReceiptDraftRepository,
    ) {}

    async execute(command: UpdateReceiptDraftCommand): Promise<void> {
        const existing = await this.receiptDraftRepository.findById(command.id);

        if (!existing) {
            throw new NotFoundException(
                `ReceiptDraft with id "${command.id}" not found`,
            );
        }

        const items =
            command.items !== undefined
                ? command.items.map(
                      (item) =>
                          new ReceiptDraftItem(
                              crypto.randomUUID(),
                              item.description,
                              item.quantity,
                              item.unitPrice,
                              item.totalPrice,
                              item.category,
                          ),
                  )
                : existing.items;

        const updated = new ReceiptDraft(
            existing.id,
            existing.userId,
            existing.status,
            items,
            command.date ?? existing.date,
        );

        await this.receiptDraftRepository.update(updated);
    }
}
