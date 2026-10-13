import { Controller, Post, Body, HttpCode, Get, Param } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { CreateTransactionCommand } from '../../application/commands/create-transaction.command.js';
import { GetTransactionQuery } from '../../application/queries/get-transaction.handler.js';

@Controller('transactions')
export class TransactionsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    @HttpCode(201)
    async createTransaction(
        @Body() createTransactionDto: CreateTransactionDto,
    ) {
        const id = await this.commandBus.execute(
            new CreateTransactionCommand(
                createTransactionDto.userId,
                createTransactionDto.amount,
                createTransactionDto.description,
                new Date(),
            ),
        );

        return { id };
    }

    @Get(':userId')
    async getTransactions(@Param('userId') userId: string) {
        const transactions = await this.queryBus.execute(
            new GetTransactionQuery(userId),
        );

        return transactions;
    }
}
