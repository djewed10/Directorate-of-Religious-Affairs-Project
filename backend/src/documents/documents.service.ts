import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { pageLimit } from '../common/pagination';
import type { AuthUser } from '../common/types';
import { DB, type AppDb } from '../db/database.module';
import { documentTypes, documentVersions, documents } from '../db/schema';
import { MosquesService } from '../mosques/mosques.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly mosquesService: MosquesService,
    @Inject(forwardRef(() => JobsService)) private readonly jobsService: JobsService,
  ) {}

  async list(query?: { mosqueId?: string; documentTypeId?: string; status?: string; page?: number; limit?: number }) {
    const { limit, offset } = pageLimit(query?.page, query?.limit ?? 30);
    const filters = [eq(documents.isActive, true)];
    if (query?.mosqueId) filters.push(eq(documents.mosqueId, query.mosqueId));
    if (query?.documentTypeId) filters.push(eq(documents.documentTypeId, query.documentTypeId));
    if (query?.status === 'expired') {
      filters.push(and(eq(documents.isActive, true))!);
    }
    return this.db
      .select({ document: documents, type: documentTypes })
      .from(documents)
      .innerJoin(documentTypes, eq(documents.documentTypeId, documentTypes.id))
      .where(and(...filters))
      .orderBy(desc(documents.uploadedAt))
      .limit(limit)
      .offset(offset);
  }

  async get(id: string) {
    const [row] = await this.db
      .select({ document: documents, type: documentTypes })
      .from(documents)
      .innerJoin(documentTypes, eq(documents.documentTypeId, documentTypes.id))
      .where(eq(documents.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Document not found');
    return row;
  }

  async create(dto: CreateDocumentDto, user?: AuthUser | null) {
    await this.mosquesService.ensureExists(dto.mosqueId);
    const [type] = await this.db.select().from(documentTypes).where(eq(documentTypes.id, dto.documentTypeId)).limit(1);
    if (!type) throw new NotFoundException('Document type not found');
    if (!type.supportsExpiration && dto.expirationDate) {
      throw new BadRequestException('This document type does not support expiration dates');
    }

    const [current] = await this.db
      .select()
      .from(documents)
      .where(and(eq(documents.mosqueId, dto.mosqueId), eq(documents.documentTypeId, dto.documentTypeId), eq(documents.isActive, true)))
      .orderBy(desc(documents.uploadedAt))
      .limit(1);

    if (current && dto.replacementMode !== 'additional') {
      const archivedVersions = await this.db
        .select()
        .from(documentVersions)
        .where(and(eq(documentVersions.documentId, current.id), eq(documentVersions.versionNumber, current.currentVersionNumber)))
        .limit(1);
      if (!archivedVersions[0]) {
        await this.db.insert(documentVersions).values({
          documentId: current.id,
          versionNumber: current.currentVersionNumber,
          storageKey: current.storageKey,
          mimeType: current.mimeType,
          fileSize: current.fileSize,
          issueDate: current.issueDate,
          expirationDate: current.expirationDate,
          uploadedByUserId: current.uploadedByUserId,
          changeReason: 'new_upload',
        });
      }

      const versionNumber = current.currentVersionNumber + 1;
      await this.db.insert(documentVersions).values({
        documentId: current.id,
        versionNumber,
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        issueDate: dto.issueDate ?? null,
        expirationDate: type.supportsExpiration ? (dto.expirationDate ?? null) : null,
        uploadedByUserId: user?.sub ?? null,
        changeReason: dto.sourceKind === 'renewal_upload' ? 'renewal' : 'replacement',
      });

      const [updated] = await this.db
        .update(documents)
        .set({
          sourceKind: dto.sourceKind ?? 'internal_upload',
          issueDate: dto.issueDate ?? null,
          expirationDate: type.supportsExpiration ? (dto.expirationDate ?? null) : null,
          storageKey: dto.storageKey,
          mimeType: dto.mimeType,
          fileSize: dto.fileSize,
          originalFilename: dto.originalFilename,
          currentVersionNumber: versionNumber,
          uploadedByUserId: user?.sub ?? null,
          uploadedAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isPinned: dto.isPinned ?? current.isPinned,
        })
        .where(eq(documents.id, current.id))
        .returning();
      await this.mosquesService.touch(dto.mosqueId);
      return updated;
    }

    const [created] = await this.db
      .insert(documents)
      .values({
        mosqueId: dto.mosqueId,
        documentTypeId: dto.documentTypeId,
        uploadedByUserId: user?.sub ?? null,
        sourceKind: dto.sourceKind ?? 'internal_upload',
        issueDate: dto.issueDate ?? null,
        expirationDate: type.supportsExpiration ? (dto.expirationDate ?? null) : null,
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        originalFilename: dto.originalFilename,
        isPinned: dto.isPinned ?? type.isPinnedDefault,
      })
      .returning();
    await this.db.insert(documentVersions).values({
      documentId: created.id,
      versionNumber: 1,
      storageKey: created.storageKey,
      mimeType: created.mimeType,
      fileSize: created.fileSize,
      issueDate: created.issueDate,
      expirationDate: created.expirationDate,
      uploadedByUserId: user?.sub ?? null,
      changeReason: 'new_upload',
    });
    await this.mosquesService.touch(dto.mosqueId);
    
    // Auto-trigger the notification evaluation to notify immediately
    if (created.expirationDate) {
      this.jobsService.createDocumentExpirationNotifications().catch(e => console.error('Error triggering document notifications', e));
    }
    
    return created;
  }

  async versions(documentId: string) {
    await this.get(documentId);
    return this.db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.versionNumber));
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const current = await this.get(id);
    let nextType = current.type;
    if (dto.documentTypeId && dto.documentTypeId !== current.document.documentTypeId) {
      const [type] = await this.db.select().from(documentTypes).where(eq(documentTypes.id, dto.documentTypeId)).limit(1);
      if (!type) throw new NotFoundException('Document type not found');
      nextType = type;
    }
    if (!nextType.supportsExpiration && dto.expirationDate) {
      throw new BadRequestException('This document type does not support expiration dates');
    }

    const [updated] = await this.db
      .update(documents)
      .set({
        documentTypeId: dto.documentTypeId ?? current.document.documentTypeId,
        issueDate: dto.issueDate === undefined ? current.document.issueDate : dto.issueDate,
        expirationDate:
          dto.expirationDate === undefined
            ? current.document.expirationDate
            : nextType.supportsExpiration
              ? dto.expirationDate
              : null,
        isPinned: dto.isPinned === undefined ? current.document.isPinned : dto.isPinned,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Document not found');
    await this.mosquesService.touch(updated.mosqueId);
    
    // Auto-trigger the notification evaluation to notify immediately
    if (updated.expirationDate) {
       this.jobsService.createDocumentExpirationNotifications().catch(e => console.error('Error triggering document notifications', e));
    }
    
    return this.get(id);
  }

  async softDelete(id: string) {
    const [deleted] = await this.db
      .update(documents)
      .set({ isActive: false, deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    if (!deleted) throw new NotFoundException('Document not found');
    await this.mosquesService.touch(deleted.mosqueId);
    return deleted;
  }
}
