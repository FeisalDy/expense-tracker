import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ApproveReceiptDraftCommand } from './approve-receipt-draft.command.js';
import {
    RECEIPT_DRAFT_REPOSITORY,
    type ReceiptDraftRepository,
} from '../../domain/receipt-draft.repository.js';

@CommandHandler(ApproveReceiptDraftCommand)
export class ApproveReceiptDraftHandler
    implements ICommandHandler<ApproveReceiptDraftCommand, void>
{
    constructor(
        @Inject(RECEIPT_DRAFT_REPOSITORY)
        private readonly receiptDraftRepository: ReceiptDraftRepository,
    ) {}

    async execute(command: ApproveReceiptDraftCommand): Promise<void> {
        const receiptDraft = await this.receiptDraftRepository.findById(
            command.id,
        );

        if (!receiptDraft) {
            throw new NotFoundException(
                `ReceiptDraft with id "${command.id}" not found`,
            );
        }

        await this.receiptDraftRepository.approve(receiptDraft);
    }
}
