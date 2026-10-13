import {
    Controller,
    Post,
    Body,
    HttpCode,
    Get,
    Param,
    Patch,
    Put,
    Delete,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateReceiptDraftDto } from './dto/create-receipt-draft.dto.js';
import { UpdateReceiptDraftDto } from './dto/update-receipt-draft.dto.js';
import { CreateReceiptDraftCommand } from '../../application/commands/create-receipt-draft.command.js';
import { UpdateReceiptDraftCommand } from '../../application/commands/update-receipt-draft.command.js';
import { DeleteReceiptDraftCommand } from '../../application/commands/delete-receipt-draft.command.js';
import { ApproveReceiptDraftCommand } from '../../application/commands/approve-receipt-draft.command.js';
import { GetReceiptDraftQuery } from '../../application/queries/get-receipt-draft.query.js';

@Controller('receipt-drafts')
export class ReceiptDraftController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Get()
    async getReceiptDrafts() {
        return this.queryBus.execute(new GetReceiptDraftQuery());
    }

    @Post()
    @HttpCode(201)
    async createReceiptDraft(@Body() dto: CreateReceiptDraftDto) {
        const id = await this.commandBus.execute(
            new CreateReceiptDraftCommand(
                dto.userId,
                dto.items,
                new Date(dto.date),
            ),
        );
        return { id };
    }

    @Patch(':id')
    async updateReceiptDraft(
        @Param('id') id: string,
        @Body() dto: UpdateReceiptDraftDto,
    ) {
        await this.commandBus.execute(
            new UpdateReceiptDraftCommand(
                id,
                dto.items,
                dto.date ? new Date(dto.date) : undefined,
            ),
        );
        return { id };
    }

    @Put(':id')
    async replaceReceiptDraft(
        @Param('id') id: string,
        @Body() dto: UpdateReceiptDraftDto,
    ) {
        return this.updateReceiptDraft(id, dto);
    }

    @Post(':id/approve')
    @HttpCode(200)
    async approveReceiptDraft(@Param('id') id: string) {
        await this.commandBus.execute(new ApproveReceiptDraftCommand(id));
        return { id };
    }

    @Delete(':id')
    async deleteReceiptDraft(@Param('id') id: string) {
        await this.commandBus.execute(new DeleteReceiptDraftCommand(id));
        return { id };
    }
}
