import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
    ReceiptDraftItemSchema,
    ReceiptDraftItemSchemaFactory,
} from './receipt-draft-item.schema.js';

export type ReceiptDraftDocument = HydratedDocument<ReceiptDraft>;

@Schema({ timestamps: true })
export class ReceiptDraft {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true, default: 'PENDING' })
    status: string;

    @Prop({ type: [ReceiptDraftItemSchemaFactory], default: [] })
    items: ReceiptDraftItemSchema[];

    @Prop({ required: true })
    date: Date;

    createdAt: Date;
    updatedAt: Date;
}

export const ReceiptDraftSchema = SchemaFactory.createForClass(ReceiptDraft);
