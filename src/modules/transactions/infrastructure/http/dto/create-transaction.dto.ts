import { IsString, IsNumber, IsOptional, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class CreateTransactionDto {

    @IsString()
    @IsNotEmpty()
    readonly userId: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    @IsNotEmpty()
    readonly amount: number;
    
    @IsOptional()
    @IsString()
    readonly description?: string;
}
