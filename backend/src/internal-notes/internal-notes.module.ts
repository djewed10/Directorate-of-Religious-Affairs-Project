import { Module } from '@nestjs/common';
import { MosquesModule } from '../mosques/mosques.module';
import { InternalNotesController } from './internal-notes.controller';
import { InternalNotesService } from './internal-notes.service';

@Module({
  imports: [MosquesModule],
  controllers: [InternalNotesController],
  providers: [InternalNotesService],
})
export class InternalNotesModule {}

