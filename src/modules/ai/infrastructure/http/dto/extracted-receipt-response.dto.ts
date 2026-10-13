import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReceiptLineItemDto {
    @ApiProperty({
        example: 'Kopi Susu Gula Aren',
        description: 'Item name or description',
    })
    description: string;

    @ApiPropertyOptional({
        example: 2,
        nullable: true,
        description: 'Quantity purchased',
    })
    quantity: number | null;

    @ApiPropertyOptional({
        example: 18000,
        nullable: true,
        description: 'Unit price per item',
    })
    unitPrice: number | null;

    @ApiPropertyOptional({
        example: 36000,
        nullable: true,
        description: 'Total price for this line item',
    })
    totalPrice: number | null;
}

export class RawReceiptDetailsDto {
    @ApiPropertyOptional({
        example: 'Kopi Kenangan',
        nullable: true,
        description: 'Identified merchant or store name',
    })
    merchantName: string | null;

    @ApiPropertyOptional({
        example: '2026-10-13',
        nullable: true,
        description: 'Receipt date in YYYY-MM-DD format',
    })
    date: string | null;

    @ApiPropertyOptional({
        example: '14:30:00',
        nullable: true,
        description: 'Receipt time in HH:mm:ss format',
    })
    time: string | null;

    @ApiPropertyOptional({
        example: 'IDR',
        nullable: true,
        description: 'ISO currency code (e.g. IDR, USD)',
    })
    currency: string | null;

    @ApiPropertyOptional({
        example: 39600,
        nullable: true,
        description: 'Total amount from receipt',
    })
    total: number | null;

    @ApiPropertyOptional({
        example: 36000,
        nullable: true,
        description: 'Subtotal before tax and discount',
    })
    subtotal: number | null;

    @ApiPropertyOptional({
        example: 3600,
        nullable: true,
        description: 'Tax amount (e.g. PB1, PPN)',
    })
    tax: number | null;

    @ApiPropertyOptional({
        example: 0,
        nullable: true,
        description: 'Discount amount deducted',
    })
    discount: number | null;

    @ApiPropertyOptional({
        example: 'QRIS',
        nullable: true,
        description: 'Payment method used',
    })
    paymentMethod: string | null;

    @ApiProperty({
        type: [ReceiptLineItemDto],
        description: 'List of line items detected on receipt',
    })
    lineItems: ReceiptLineItemDto[];
}

export class TransactionDraftDto {
    @ApiPropertyOptional({
        example: 'user-123',
        nullable: true,
        description: 'User ID associated with the draft',
    })
    userId: string | null;

    @ApiPropertyOptional({
        example: 39600,
        nullable: true,
        description:
            'Extracted amount conforming to transaction contract (positive number with max 2 decimals)',
    })
    amount: number | null;

    @ApiPropertyOptional({
        example: 'Kopi Kenangan',
        nullable: true,
        description: 'Extracted transaction description / merchant',
    })
    description: string | null;

    @ApiPropertyOptional({
        example: '2026-10-13T14:30:00Z',
        nullable: true,
        description: 'ISO date string representing transaction date and time',
    })
    date: string | null;
}

export class ExtractedReceiptResponseDto {
    @ApiProperty({
        enum: ['READY', 'NEEDS_REVIEW', 'INCOMPLETE'],
        example: 'READY',
        description: 'Review status of the receipt extraction draft',
    })
    reviewStatus: 'READY' | 'NEEDS_REVIEW' | 'INCOMPLETE';

    @ApiProperty({
        type: TransactionDraftDto,
        description: 'Transaction draft compatible with CreateTransactionDto',
    })
    transactionDraft: TransactionDraftDto;

    @ApiProperty({
        type: RawReceiptDetailsDto,
        description: 'Raw extracted receipt details',
    })
    rawReceiptDetails: RawReceiptDetailsDto;

    @ApiProperty({
        type: [String],
        example: [],
        description: 'Warnings and notices generated during extraction and validation',
    })
    warnings: string[];
}
