import { Query } from "@nestjs/cqrs";
import { Transaction } from "../../domain/transaction.entity.js";

export class GetTransactionQuery extends Query<Transaction[]> {
    constructor(public readonly userId: string) { 
        super()
    }
}