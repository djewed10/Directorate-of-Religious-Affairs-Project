import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { AuthUser } from '../common/types';
import { DB, type AppDb } from '../db/database.module';
import { internalNotes, noteTemplates } from '../db/schema';
import { MosquesService } from '../mosques/mosques.service';
import { CreateInternalNoteDto } from './dto/create-internal-note.dto';
import { UpdateInternalNoteDto } from './dto/update-internal-note.dto';

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

  async update(id: string, dto: UpdateInternalNoteDto) {
    const [current] = await this.db.select().from(internalNotes).where(eq(internalNotes.id, id)).limit(1);
    if (!current) throw new NotFoundException('Internal note not found');
    const [updated] = await this.db
      .update(internalNotes)
      .set({
        templateCode: dto.templateCode === undefined ? current.templateCode : dto.templateCode,
        content: dto.content === undefined ? current.content : dto.content,
        updatedAt: new Date(),
      })
      .where(eq(internalNotes.id, id))
      .returning();
    await this.mosquesService.touch(updated.mosqueId);
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.db.delete(internalNotes).where(eq(internalNotes.id, id)).returning();
    if (!deleted) throw new NotFoundException('Internal note not found');
    return deleted;
  }
}
