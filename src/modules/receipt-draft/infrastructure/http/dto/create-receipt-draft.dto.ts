import { IsString, IsNotEmpty, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateReceiptDraftItemDto } from './create-receipt-draft-item.dto.js';

export class CreateReceiptDraftDto {
    @IsString()
    @IsNotEmpty()
    readonly userId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateReceiptDraftItemDto)
    readonly items: CreateReceiptDraftItemDto[];

    @IsDateString()
    readonly date: string;
}
