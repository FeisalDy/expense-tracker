import { Injectable } from '@nestjs/common';
import { TransactionRepository } from '../../domain/transaction.repository.js';
import { InjectModel } from '@nestjs/mongoose';
import {
    TransactionDocument,
    Transaction as TransactionSchemaModel,
} from './schemas/transaction.schema.js';
import { Model } from 'mongoose';
import { Transaction } from '../../domain/transaction.entity.js';

@Injectable()
export class MongooseTransactionRepository implements TransactionRepository {
    constructor(
        @InjectModel(TransactionSchemaModel.name)
        private transactionModel: Model<TransactionSchemaModel>,
    ) {}

    async getByUserId(userId: string) {
        const records = await this.transactionModel.find({ userId }).exec();

        return records.map((record) => this.#toDomain(record));
    }

    async findById(id: string) {
        const record = await this.transactionModel.findById(id).exec();

        return record ? this.#toDomain(record) : null;
    }
    
    async save(transaction: Transaction) {
        const record = this.#toSchema(transaction);
        await record.save();
    }

    #toDomain(transaction: TransactionDocument): Transaction {
        return new Transaction(
            transaction._id.toString(),
            transaction.userId,
            transaction.amount,
            transaction.description,
            transaction.createdAt,
        );
    }

    #toSchema(transaction: Transaction): TransactionDocument {
        return new this.transactionModel({
            _id: transaction.id,
            userId: transaction.userId,
            amount: transaction.amount,
            description: transaction.description,
            createdAt: transaction.createdAt,
        });
    }
}
