import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, ilike, or } from 'drizzle-orm';
import { pageLimit } from '../common/pagination';
import { DB, type AppDb } from '../db/database.module';
import { associations } from '../db/schema';
import { CreateAssociationDto } from './dto/create-association.dto';
import { UpdateAssociationDto } from './dto/update-association.dto';

@Injectable()
export class AssociationsService {
  constructor(@Inject(DB) private readonly db: AppDb) {}

  async list(query?: { q?: string; page?: number; limit?: number }) {
    const { limit, offset } = pageLimit(query?.page, query?.limit);
    const where = query?.q
      ? or(ilike(associations.name, `%${query.q}%`), ilike(associations.contactPerson, `%${query.q}%`))
      : undefined;
    return this.db.select().from(associations).where(where).limit(limit).offset(offset).orderBy(desc(associations.createdAt));
  }

  async get(id: string) {
    const [association] = await this.db.select().from(associations).where(eq(associations.id, id)).limit(1);
    if (!association) throw new NotFoundException('Association not found');
    return association;
  }

  async create(dto: CreateAssociationDto) {
    const [created] = await this.db.insert(associations).values(dto).returning();
    return created;
  }

  async update(id: string, dto: UpdateAssociationDto) {
    const [updated] = await this.db
      .update(associations)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(associations.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Association not found');
    return updated;
  }
}

