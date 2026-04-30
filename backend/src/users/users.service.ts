import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { desc, eq } from 'drizzle-orm';
import { DB, type AppDb } from '../db/database.module';
import { users } from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(DB) private readonly db: AppDb) {}

  private sanitize(user: typeof users.$inferSelect) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async list() {
    const rows = await this.db.select().from(users).orderBy(desc(users.createdAt));
    return rows.map((user) => this.sanitize(user));
  }

  async findByEmail(email: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return user;
  }

  async findById(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async me(id: string) {
    return this.sanitize(await this.findById(id));
  }

  async create(dto: CreateUserDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');
    const [created] = await this.db
      .insert(users)
      .values({
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: dto.role,
        isActive: dto.isActive ?? true,
      })
      .returning();
    return this.sanitize(created);
  }

  async update(id: string, dto: UpdateUserDto) {
    const values: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (dto.name !== undefined) values.name = dto.name;
    if (dto.email !== undefined) values.email = dto.email.toLowerCase();
    if (dto.password !== undefined) values.passwordHash = await bcrypt.hash(dto.password, 10);
    if (dto.role !== undefined) values.role = dto.role;
    if (dto.isActive !== undefined) values.isActive = dto.isActive;

    const [updated] = await this.db.update(users).set(values).where(eq(users.id, id)).returning();
    if (!updated) throw new NotFoundException('User not found');
    return this.sanitize(updated);
  }
}

