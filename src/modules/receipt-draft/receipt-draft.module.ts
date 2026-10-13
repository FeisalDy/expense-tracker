import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import {
    ReceiptDraft,
    ReceiptDraftSchema,
} from './infrastructure/persistence/schemas/receipt-draft.schema.js';
import { ReceiptDraftController } from './infrastructure/http/receipt-draft.controller.js';
import { CreateReceiptDraftHandler } from './application/commands/create-receipt-draft.handler.js';
import { UpdateReceiptDraftHandler } from './application/commands/update-receipt-draft.handler.js';
import { DeleteReceiptDraftHandler } from './application/commands/delete-receipt-draft.handler.js';
import { ApproveReceiptDraftHandler } from './application/commands/approve-receipt-draft.handler.js';
import { GetReceiptDraftHandler } from './application/queries/get-receipt-draft.handler.js';
import { RECEIPT_DRAFT_REPOSITORY } from './domain/receipt-draft.repository.js';
import { MongooseReceiptDraftRepository } from './infrastructure/persistence/mongoose-receipt-draft.repository.js';

const CommandHandlers = [
    CreateReceiptDraftHandler,
    UpdateReceiptDraftHandler,
    DeleteReceiptDraftHandler,
    ApproveReceiptDraftHandler,
    GetReceiptDraftHandler,
];

@Module({
    imports: [
        CqrsModule,
        MongooseModule.forFeature([
            { name: ReceiptDraft.name, schema: ReceiptDraftSchema },
        ]),
    ],
    controllers: [ReceiptDraftController],
    providers: [
        ...CommandHandlers,
        {
            provide: RECEIPT_DRAFT_REPOSITORY,
            useClass: MongooseReceiptDraftRepository,
        },
    ],
})
export class ReceiptDraftModule {}