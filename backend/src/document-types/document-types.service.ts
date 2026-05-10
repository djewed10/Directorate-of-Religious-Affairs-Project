import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, ilike, ne } from 'drizzle-orm';
import { pageLimit } from '../common/pagination';
import { DB, type AppDb } from '../db/database.module';
import { documentTypes } from '../db/schema';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@Injectable()
export class DocumentTypesService {
  constructor(@Inject(DB) private readonly db: AppDb) {}

  list(query?: boolean | { includeInactive?: string | boolean; q?: string; page?: number; limit?: number }) {
    const includeInactive = typeof query === 'boolean' ? query : query?.includeInactive === true || query?.includeInactive === 'true';
    const { limit, offset } = pageLimit(typeof query === 'boolean' ? undefined : query?.page, typeof query === 'boolean' ? 100 : (query?.limit ?? 100));
    const filters = [];
    if (!includeInactive) filters.push(eq(documentTypes.isActive, true));
    if (typeof query !== 'boolean' && query?.q) filters.push(ilike(documentTypes.labelAr, `%${query.q}%`));
    return this.db
      .select()
      .from(documentTypes)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(documentTypes.group), asc(documentTypes.sortOrder), asc(documentTypes.labelAr))
      .limit(limit)
      .offset(offset);
  }

  async get(id: string) {
    const [type] = await this.db.select().from(documentTypes).where(eq(documentTypes.id, id)).limit(1);
    if (!type) throw new NotFoundException('Document type not found');
    return type;
  }

  async create(dto: CreateDocumentTypeDto) {
    await this.ensureUnique(dto.code, dto.labelAr);
    const [created] = await this.db.insert(documentTypes).values({ ...dto, code: this.normalizeCode(dto.code) }).returning();
    return created;
  }

  async update(id: string, dto: UpdateDocumentTypeDto) {
    await this.ensureExists(id);
    if (dto.code || dto.labelAr) await this.ensureUnique(dto.code, dto.labelAr, id);
    const [updated] = await this.db
      .update(documentTypes)
      .set({ ...dto, code: dto.code ? this.normalizeCode(dto.code) : undefined, updatedAt: new Date() })
      .where(eq(documentTypes.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Document type not found');
    return updated;
  }

  async delete(id: string) {
    const [updated] = await this.db
      .update(documentTypes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(documentTypes.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Document type not found');
    return updated;
  }

  private async ensureExists(id: string) {
    const [type] = await this.db.select().from(documentTypes).where(eq(documentTypes.id, id)).limit(1);
    if (!type) throw new NotFoundException('Document type not found');
    return type;
  }

  private async ensureUnique(code?: string, labelAr?: string, ignoreId?: string) {
    const filters = ignoreId ? ne(documentTypes.id, ignoreId) : undefined;
    const existing = await this.db.select().from(documentTypes).where(filters).limit(500);
    const normalizedCode = code ? this.normalizeCode(code) : undefined;
    const normalizedLabel = labelAr ? this.normalizeLabel(labelAr) : undefined;
    const duplicate = existing.find((type) => {
      if (normalizedCode && this.normalizeCode(type.code) === normalizedCode) return true;
      if (normalizedLabel && this.normalizeLabel(type.labelAr) === normalizedLabel) return true;
      return false;
    });
    if (duplicate) throw new ConflictException('نوع الوثيقة موجود مسبقًا');
  }

  private normalizeCode(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, '_');
  }

  private normalizeLabel(value: string) {
    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ar-DZ');
  }
}
