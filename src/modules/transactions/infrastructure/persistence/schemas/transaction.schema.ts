import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ type: String, default: null })
    description?: string | null;

    createdAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
