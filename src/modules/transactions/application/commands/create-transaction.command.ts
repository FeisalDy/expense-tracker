import { Command } from "@nestjs/cqrs";

export class CreateTransactionCommand extends Command<string> {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly description: string | null | undefined,
    public readonly createdAt: Date,
  ) {
    super()
  }
}