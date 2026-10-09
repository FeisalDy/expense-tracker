import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config.js';
import { MongooseModule } from '@nestjs/mongoose';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
    imports: [
        // Distributed tracing, auto-correlated logs, request/job metrics, error
        // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
        ObserveModule.forRoot({
            appKey: 'YOUR_APP_KEY',
            appSecret: 'YOUR_APP_SECRET',
            serviceId: 'expenses-tracker',
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            cache: true,
            load: [databaseConfig],
        }),
        TransactionsModule,
        MongooseModule.forRootAsync({
            inject: [ConfigService], // Inject ConfigService here
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('database.uri'),
            }),
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
