import { Controller, Post, Body, HttpCode, Get, Param, Patch, Put, Delete } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { CreateTransactionCommand } from '../../application/commands/create-transaction.command.js';
import { UpdateTransactionCommand } from '../../application/commands/update-transaction.command.js';
import { DeleteTransactionCommand } from '../../application/commands/delete-transaction.command.js';
import { GetTransactionQuery } from '../../application/queries/get-transaction.handler.js';

@Controller('transactions')
export class TransactionsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Get()
    async getTransactions() {
        const transactions = await this.queryBus.execute(
            new GetTransactionQuery(),
        );

        return transactions;
    }

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

    @Patch(':id')
    async updateTransaction(
        @Param('id') id: string,
        @Body() updateTransactionDto: UpdateTransactionDto,
    ) {
        await this.commandBus.execute(
            new UpdateTransactionCommand(
                id,
                updateTransactionDto.amount,
                updateTransactionDto.description,
                updateTransactionDto.userId,
            ),
        );

        return { id };
    }

    @Put(':id')
    async replaceTransaction(
        @Param('id') id: string,
        @Body() updateTransactionDto: UpdateTransactionDto,
    ) {
        return this.updateTransaction(id, updateTransactionDto);
    }

    @Delete(':id')
    async deleteTransaction(@Param('id') id: string) {
        await this.commandBus.execute(new DeleteTransactionCommand(id));

        return { id };
    }
}
