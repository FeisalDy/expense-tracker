import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReceiptDraftItemDocument = HydratedDocument<ReceiptDraftItemSchema>;

@Schema({ _id: true })
export class ReceiptDraftItemSchema {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ required: true })
    description: string;

    @Prop({ type: Number, default: null })
    quantity: number | null;

    @Prop({ type: Number, default: null })
    unitPrice: number | null;

    @Prop({ type: Number, default: null })
    totalPrice: number | null;

    @Prop({ type: String, default: null })
    category: string | null;
}

export const ReceiptDraftItemSchemaFactory =
    SchemaFactory.createForClass(ReceiptDraftItemSchema);
