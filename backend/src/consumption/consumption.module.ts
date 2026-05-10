import { Module } from '@nestjs/common';
import { MosquesModule } from '../mosques/mosques.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConsumptionController } from './consumption.controller';
import { ConsumptionService } from './consumption.service';

@Module({
  imports: [MosquesModule, NotificationsModule],
  controllers: [ConsumptionController],
  providers: [ConsumptionService],
  exports: [ConsumptionService],
})
export class ConsumptionModule {}

