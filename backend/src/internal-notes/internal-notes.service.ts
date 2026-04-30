import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { AuthUser } from '../common/types';
import { DB, type AppDb } from '../db/database.module';
import { internalNotes, noteTemplates } from '../db/schema';
import { MosquesService } from '../mosques/mosques.service';
import { CreateInternalNoteDto } from './dto/create-internal-note.dto';

@Injectable()
export class InternalNotesService {
  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly mosquesService: MosquesService,
  ) {}

  templates() {
    return this.db.select().from(noteTemplates).where(eq(noteTemplates.isActive, true)).orderBy(noteTemplates.sortOrder);
  }

  list(mosqueId: string) {
    return this.db.select().from(internalNotes).where(eq(internalNotes.mosqueId, mosqueId)).orderBy(desc(internalNotes.createdAt));
  }

  async create(dto: CreateInternalNoteDto, user: AuthUser) {
    await this.mosquesService.ensureExists(dto.mosqueId);
    const [created] = await this.db
      .insert(internalNotes)
      .values({
        mosqueId: dto.mosqueId,
        createdByUserId: user.sub,
        templateCode: dto.templateCode ?? null,
        content: dto.content,
      })
      .returning();
    await this.mosquesService.touch(dto.mosqueId);
    return created;
  }

  async delete(id: string) {
    const [deleted] = await this.db.delete(internalNotes).where(eq(internalNotes.id, id)).returning();
    if (!deleted) throw new NotFoundException('Internal note not found');
    return deleted;
  }
}

