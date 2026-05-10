import { Module } from '@nestjs/common';
import { MosquesModule } from '../mosques/mosques.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProgressionController } from './progression.controller';
import { ProgressionService } from './progression.service';

@Module({
  imports: [MosquesModule, NotificationsModule],
  controllers: [ProgressionController],
  providers: [ProgressionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}

