import { Query } from '@nestjs/cqrs';
import { ReceiptDraft } from '../../domain/receipt-draft.entity.js';

export class GetReceiptDraftQuery extends Query<ReceiptDraft[]> {
    constructor() {
        super();
    }
}
