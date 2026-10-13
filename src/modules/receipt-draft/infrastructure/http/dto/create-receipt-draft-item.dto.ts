import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
} from 'class-validator';

export class CreateReceiptDraftItemDto {
    @IsString()
    @IsNotEmpty()
    readonly description: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    readonly quantity: number | null;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    readonly unitPrice: number | null;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    readonly totalPrice: number | null;

    @IsOptional()
    @IsString()
    readonly category: string | null;
}
