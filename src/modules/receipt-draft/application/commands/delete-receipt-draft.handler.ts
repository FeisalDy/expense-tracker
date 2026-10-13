import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeleteReceiptDraftCommand } from './delete-receipt-draft.command.js';
import {
    RECEIPT_DRAFT_REPOSITORY,
    type ReceiptDraftRepository,
} from '../../domain/receipt-draft.repository.js';

@CommandHandler(DeleteReceiptDraftCommand)
export class DeleteReceiptDraftHandler
    implements ICommandHandler<DeleteReceiptDraftCommand, void>
{
    constructor(
        @Inject(RECEIPT_DRAFT_REPOSITORY)
        private readonly receiptDraftRepository: ReceiptDraftRepository,
    ) {}

    async execute(command: DeleteReceiptDraftCommand): Promise<void> {
        const receiptDraft = await this.receiptDraftRepository.findById(
            command.id,
        );

        if (!receiptDraft) {
            throw new NotFoundException(
                `ReceiptDraft with id "${command.id}" not found`,
            );
        }

        await this.receiptDraftRepository.delete(receiptDraft);
    }
}
