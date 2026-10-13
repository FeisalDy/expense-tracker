import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    HttpCode,
    HttpStatus,
    Body,
    Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiResponse,
} from '@nestjs/swagger';
import { ExtractReceiptService } from '../../application/services/extract-receipt.service.js';
import { ExtractedReceiptResponseDto } from './dto/extracted-receipt-response.dto.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@ApiTags('ai')
@Controller('ai')
export class AiController {
    constructor(
        private readonly extractReceiptService: ExtractReceiptService,
    ) {}

    @Post('receipts/extract')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: MAX_FILE_SIZE_BYTES,
            },
        }),
    )
    @ApiOperation({
        summary: 'Extract structured receipt data for transaction draft',
        description:
            'Upload a receipt image (JPEG, PNG, WebP) to extract financial details into a structured draft. Does not persist the transaction.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Receipt image file (JPEG, PNG, WebP, max 10MB)',
                },
                userId: {
                    type: 'string',
                    description: 'Optional user ID to associate with the draft',
                },
            },
            required: ['file'],
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully extracted receipt draft',
        type: ExtractedReceiptResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Missing or invalid file format/size',
    })
    async extractReceipt(
        @UploadedFile() file: Express.Multer.File | undefined,
        @Body('userId') bodyUserId?: string,
        @Headers('x-user-id') headerUserId?: string,
    ): Promise<ExtractedReceiptResponseDto> {
        if (!file) {
            throw new BadRequestException('Receipt image file is required.');
        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type: ${file.mimetype}. Allowed types are: ${ALLOWED_MIME_TYPES.join(', ')}`,
            );
        }

        if (file.size === 0) {
            throw new BadRequestException('Uploaded file is empty.');
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException(
                `File size exceeds maximum allowed limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
            );
        }

        const effectiveUserId = bodyUserId ?? headerUserId ?? null;

        return this.extractReceiptService.execute(
            {
                buffer: file.buffer,
                mimeType: file.mimetype,
            },
            {
                userId: effectiveUserId,
            },
        );
    }
}
