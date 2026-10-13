import { PartialType } from '@nestjs/mapped-types';
import { CreateReceiptDraftDto } from './create-receipt-draft.dto.js';

export class UpdateReceiptDraftDto extends PartialType(CreateReceiptDraftDto) {}
