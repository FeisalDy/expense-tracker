export class Transaction {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly amount: number,
        public readonly description: string | null | undefined,
        public readonly createdAt: Date,
    ){}

    static create(
        id: string,
        userId: string,
        amount: number,
        description: string | null | undefined,
        createdAt: Date
    ){
        return new Transaction(id, userId, amount, description, createdAt);
    }
}