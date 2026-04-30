import { Module } from '@nestjs/common';
import { ConsumptionModule } from '../consumption/consumption.module';
import { DocumentsModule } from '../documents/documents.module';
import { MosquesModule } from '../mosques/mosques.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProgressionModule } from '../progression/progression.module';
import { ExternalUpdateRequestsController } from './external-update-requests.controller';
import { ExternalUpdateRequestsService } from './external-update-requests.service';

@Module({
  imports: [MosquesModule, ConsumptionModule, ProgressionModule, DocumentsModule, NotificationsModule],
  controllers: [ExternalUpdateRequestsController],
  providers: [ExternalUpdateRequestsService],
  exports: [ExternalUpdateRequestsService],
})
export class ExternalUpdateRequestsModule {}

