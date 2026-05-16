import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ExpoPushService } from './expo-push.service';
import { JobsController } from './jobs.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [JobsController],
  providers: [JobsService, ExpoPushService],
  exports: [JobsService, ExpoPushService],
})
export class JobsModule {}
