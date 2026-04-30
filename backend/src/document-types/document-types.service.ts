import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DB, type AppDb } from '../db/database.module';
import { documentTypes } from '../db/schema';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@Injectable()
export class DocumentTypesService {
  constructor(@Inject(DB) private readonly db: AppDb) {}

  list(includeInactive = false) {
    return this.db
      .select()
      .from(documentTypes)
      .where(includeInactive ? undefined : eq(documentTypes.isActive, true))
      .orderBy(asc(documentTypes.group), asc(documentTypes.sortOrder), asc(documentTypes.labelAr));
  }

  async get(id: string) {
    const [type] = await this.db.select().from(documentTypes).where(eq(documentTypes.id, id)).limit(1);
    if (!type) throw new NotFoundException('Document type not found');
    return type;
  }

  async create(dto: CreateDocumentTypeDto) {
    const existing = await this.db.select().from(documentTypes).where(eq(documentTypes.code, dto.code)).limit(1);
    if (existing[0]) throw new ConflictException('Document type code already exists');
    const [created] = await this.db.insert(documentTypes).values(dto).returning();
    return created;
  }

  async update(id: string, dto: UpdateDocumentTypeDto) {
    const [updated] = await this.db
      .update(documentTypes)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(documentTypes.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Document type not found');
    return updated;
  }
}

