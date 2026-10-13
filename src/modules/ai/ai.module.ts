import { Module } from '@nestjs/common';
import { AiController } from './infrastructure/http/ai.controller.js';
import { ExtractReceiptService } from './application/services/extract-receipt.service.js';
import { GeminiReceiptExtractorService } from './infrastructure/gemini/gemini-receipt-extractor.service.js';
import { RECEIPT_EXTRACTOR } from './application/interfaces/receipt-extractor.interface.js';

@Module({
    controllers: [AiController],
    providers: [
        GeminiReceiptExtractorService,
        {
            provide: RECEIPT_EXTRACTOR,
            useClass: GeminiReceiptExtractorService,
        },
        ExtractReceiptService,
    ],
    exports: [ExtractReceiptService, RECEIPT_EXTRACTOR],
})
export class AiModule {}
