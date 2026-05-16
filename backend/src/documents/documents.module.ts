import { Module, forwardRef } from '@nestjs/common';
import { MosquesModule } from '../mosques/mosques.module';
import { JobsModule } from '../jobs/jobs.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [MosquesModule, forwardRef(() => JobsModule)],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

