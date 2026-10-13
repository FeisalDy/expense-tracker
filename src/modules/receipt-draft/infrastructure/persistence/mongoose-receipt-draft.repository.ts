import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReceiptDraftRepository } from '../../domain/receipt-draft.repository.js';
import { ReceiptDraft as ReceiptDraftDomain } from '../../domain/receipt-draft.entity.js';
import { ReceiptDraftItem } from '../../domain/receipt-draft-item.entity.js';
import {
    ReceiptDraft as ReceiptDraftSchemaModel,
    ReceiptDraftDocument,
} from './schemas/receipt-draft.schema.js';

@Injectable()
export class MongooseReceiptDraftRepository implements ReceiptDraftRepository {
    constructor(
        @InjectModel(ReceiptDraftSchemaModel.name)
        private readonly receiptDraftModel: Model<ReceiptDraftSchemaModel>,
    ) {}

    async getAll(): Promise<ReceiptDraftDomain[]> {
        const records = await this.receiptDraftModel.find().exec();
        return records.map((record) => this.#toDomain(record));
    }

    async findById(id: string): Promise<ReceiptDraftDomain | null> {
        const record = await this.receiptDraftModel.findById(id).exec();
        return record ? this.#toDomain(record) : null;
    }

    async save(receiptDraft: ReceiptDraftDomain): Promise<void> {
        const record = this.#toSchema(receiptDraft);
        await record.save();
    }

    async update(receiptDraft: ReceiptDraftDomain): Promise<void> {
        await this.receiptDraftModel
            .findByIdAndUpdate(receiptDraft.id, {
                status: receiptDraft.status,
                items: receiptDraft.items.map((item) => ({
                    _id: item.id,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    category: item.category,
                })),
                date: receiptDraft.date,
            })
            .exec();
    }

    async delete(receiptDraft: ReceiptDraftDomain): Promise<void> {
        await this.receiptDraftModel
            .findByIdAndDelete(receiptDraft.id)
            .exec();
    }

    async approve(receiptDraft: ReceiptDraftDomain): Promise<void> {
        await this.receiptDraftModel
            .findByIdAndUpdate(receiptDraft.id, { status: 'APPROVED' })
            .exec();
    }

    #toDomain(record: ReceiptDraftDocument): ReceiptDraftDomain {
        const items = (record.items ?? []).map(
            (item) =>
                new ReceiptDraftItem(
                    item._id.toString(),
                    item.description,
                    item.quantity,
                    item.unitPrice,
                    item.totalPrice,
                    item.category,
                ),
        );

        return new ReceiptDraftDomain(
            record._id.toString(),
            record.userId,
            record.status,
            items,
            record.date,
        );
    }

    #toSchema(receiptDraft: ReceiptDraftDomain): ReceiptDraftDocument {
        return new this.receiptDraftModel({
            _id: receiptDraft.id,
            userId: receiptDraft.userId,
            status: receiptDraft.status,
            items: receiptDraft.items.map((item) => ({
                _id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                category: item.category,
            })),
            date: receiptDraft.date,
        });
    }
}
