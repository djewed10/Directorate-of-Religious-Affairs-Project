import { BadRequestException, GoneException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, desc, eq, or } from 'drizzle-orm';
import { customAlphabet, nanoid } from 'nanoid';
import { ConsumptionService } from '../consumption/consumption.service';
import { DB, type AppDb } from '../db/database.module';
import { documents, externalUpdateRequests, mosques } from '../db/schema';
import { DocumentsService } from '../documents/documents.service';
import { MosquesService } from '../mosques/mosques.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProgressionService } from '../progression/progression.service';
import type { AuthUser } from '../common/types';
import { CreateExternalRequestDto } from './dto/create-external-request.dto';
import { SubmitExternalRequestDto } from './dto/submit-external-request.dto';

const shortCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

@Injectable()
export class ExternalUpdateRequestsService {
  constructor(
    @Inject(DB) private readonly db: AppDb,
    private readonly config: ConfigService,
    private readonly mosquesService: MosquesService,
    private readonly consumptionService: ConsumptionService,
    private readonly progressionService: ProgressionService,
    private readonly documentsService: DocumentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(mosqueId?: string) {
    return this.db
      .select({ request: externalUpdateRequests, mosque: mosques })
      .from(externalUpdateRequests)
      .innerJoin(mosques, eq(externalUpdateRequests.mosqueId, mosques.id))
      .where(mosqueId ? eq(externalUpdateRequests.mosqueId, mosqueId) : undefined)
      .orderBy(desc(externalUpdateRequests.createdAt))
      .limit(100);
  }

  async create(dto: CreateExternalRequestDto, user: AuthUser) {
    const mosque = await this.mosquesService.ensureExists(dto.mosqueId);
    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + (dto.expiresInDays ?? 14) * 24 * 60 * 60 * 1000);
    const [created] = await this.db
      .insert(externalUpdateRequests)
      .values({
        mosqueId: dto.mosqueId,
        requestType: dto.requestType,
        relatedDocumentId: dto.relatedDocumentId ?? null,
        token: nanoid(48),
        shortCode: shortCode(),
        expiresAt,
        createdByUserId: user.sub,
        allowProgressionFields: dto.allowProgressionFields ?? dto.requestType === 'consumption_control',
        allowCoverUpdate: dto.allowCoverUpdate ?? dto.requestType === 'cover_image_update',
      })
      .returning();
    const mobileBase = this.config.get<string>('MOBILE_PUBLIC_BASE_URL', 'http://localhost:8081');
    return {
      ...created,
      mosque,
      externalUrl: `${mobileBase}/external/${created.token}`,
    };
  }

  async getPublic(tokenOrCode: string) {
    const [row] = await this.db
      .select({ request: externalUpdateRequests, mosque: mosques })
      .from(externalUpdateRequests)
      .innerJoin(mosques, eq(externalUpdateRequests.mosqueId, mosques.id))
      .where(or(eq(externalUpdateRequests.token, tokenOrCode), eq(externalUpdateRequests.shortCode, tokenOrCode.toUpperCase())))
      .limit(1);
    if (!row) throw new NotFoundException('Request not found');
    if (row.request.status !== 'pending') throw new GoneException('Request is no longer pending');
    if (row.request.expiresAt < new Date()) {
      await this.db
        .update(externalUpdateRequests)
        .set({ status: 'expired' })
        .where(eq(externalUpdateRequests.id, row.request.id));
      throw new GoneException('Request expired');
    }
    return {
      request: {
        id: row.request.id,
        requestType: row.request.requestType,
        expiresAt: row.request.expiresAt,
        allowProgressionFields: row.request.allowProgressionFields,
        allowCoverUpdate: row.request.allowCoverUpdate,
      },
      mosque: {
        id: row.mosque.id,
        name: row.mosque.name,
        officialCode: row.mosque.officialCode,
        commune: row.mosque.commune,
        mosqueStatus: row.mosque.mosqueStatus,
      },
    };
  }

  async submit(tokenOrCode: string, dto: SubmitExternalRequestDto) {
    const [row] = await this.db
      .select({ request: externalUpdateRequests, mosque: mosques })
      .from(externalUpdateRequests)
      .innerJoin(mosques, eq(externalUpdateRequests.mosqueId, mosques.id))
      .where(or(eq(externalUpdateRequests.token, tokenOrCode), eq(externalUpdateRequests.shortCode, tokenOrCode.toUpperCase())))
      .limit(1);
    if (!row) throw new NotFoundException('Request not found');
    if (row.request.status !== 'pending') throw new GoneException('Request is no longer pending');
    if (row.request.expiresAt < new Date()) throw new GoneException('Request expired');

    if (row.request.requestType === 'consumption_control') {
      await this.consumptionService.create({
        mosqueId: row.request.mosqueId,
        aidRecordId: dto.aidRecordId,
        sourceKind: 'external',
        consumptionCategoryCode: dto.consumptionCategoryCode,
        withdrawnAmount: dto.withdrawnAmount,
        shortNote: dto.shortNote,
        optionalProgressPercent: dto.progressPercent,
        externalRequestId: row.request.id,
        media: dto.consumptionMedia,
      });
      if (row.request.allowProgressionFields && (dto.progressPercent !== undefined || dto.progressionMedia?.length || dto.progressionNote)) {
        await this.progressionService.create({
          mosqueId: row.request.mosqueId,
          sourceKind: 'external',
          stageCode: dto.progressionStageCode,
          progressPercent: dto.progressPercent,
          shortNote: dto.progressionNote,
          externalRequestId: row.request.id,
          media: dto.progressionMedia,
        });
      }
    }

    if (row.request.requestType === 'progression_update') {
      await this.progressionService.create({
        mosqueId: row.request.mosqueId,
        sourceKind: 'external',
        stageCode: dto.progressionStageCode,
        progressPercent: dto.progressPercent,
        shortNote: dto.progressionNote,
        externalRequestId: row.request.id,
        media: dto.progressionMedia,
      });
    }

    if (row.request.requestType === 'document_renewal' || row.request.requestType === 'document_upload') {
      if (!dto.documentStorageKey || !dto.documentMimeType || !dto.documentFileSize || !dto.documentOriginalFilename) {
        throw new BadRequestException('Document upload metadata is required');
      }
      let documentTypeId = dto.documentTypeId;
      if (row.request.relatedDocumentId) {
        const [related] = await this.db
          .select()
          .from(documents)
          .where(eq(documents.id, row.request.relatedDocumentId))
          .limit(1);
        documentTypeId = related?.documentTypeId ?? documentTypeId;
      }
      if (!documentTypeId) throw new BadRequestException('Document type is required');
      await this.documentsService.create({
        mosqueId: row.request.mosqueId,
        documentTypeId,
        sourceKind: row.request.requestType === 'document_renewal' ? 'renewal_upload' : 'external_upload',
        issueDate: dto.issueDate,
        expirationDate: dto.expirationDate,
        storageKey: dto.documentStorageKey,
        mimeType: dto.documentMimeType,
        fileSize: dto.documentFileSize,
        originalFilename: dto.documentOriginalFilename,
        replacementMode: 'archive_current',
      });
    }

    if (row.request.requestType === 'cover_image_update' || row.request.allowCoverUpdate) {
      if (dto.coverImageStorageKey) {
        await this.mosquesService.update(row.request.mosqueId, { coverImageStorageKey: dto.coverImageStorageKey });
      }
    }

    const [completed] = await this.db
      .update(externalUpdateRequests)
      .set({ status: 'completed', completedAt: new Date() })
      .where(and(eq(externalUpdateRequests.id, row.request.id), eq(externalUpdateRequests.status, 'pending')))
      .returning();

    await this.notificationsService.create({
      userId: row.request.createdByUserId,
      mosqueId: row.request.mosqueId,
      type: `external_${row.request.requestType}_received`,
      titleAr: 'تم استلام تحديث من الجمعية',
      bodyAr: `${row.mosque.name} - رقم ${row.mosque.officialCode} - بلدية ${row.mosque.commune} أرسل تحديثًا جديدًا.`,
      metadataJson: { externalRequestId: row.request.id, requestType: row.request.requestType },
    });

    return { status: 'completed', request: completed };
  }
}

