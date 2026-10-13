import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetReceiptDraftQuery } from './get-receipt-draft.query.js';
import {
    RECEIPT_DRAFT_REPOSITORY,
    type ReceiptDraftRepository,
} from '../../domain/receipt-draft.repository.js';
import { ReceiptDraft } from '../../domain/receipt-draft.entity.js';

@QueryHandler(GetReceiptDraftQuery)
export class GetReceiptDraftHandler
    implements IQueryHandler<GetReceiptDraftQuery, ReceiptDraft[]>
{
    constructor(
        @Inject(RECEIPT_DRAFT_REPOSITORY)
        private readonly receiptDraftRepository: ReceiptDraftRepository,
    ) {}

    async execute(): Promise<ReceiptDraft[]> {
        return this.receiptDraftRepository.getAll();
    }
}
