//TODO: build a ReceiptDraft workflow in the application layer, persist pending drafts, and make the bot a delivery adapter. This keeps the business flow independent of whether the user interacts through a website, Telegram, WhatsApp, or another channel.

import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

@Module({
    imports: [
        CqrsModule
    ],
    controllers: [],
    providers: [],
})

export class ReceiptDraftModule {}