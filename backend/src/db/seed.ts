import 'dotenv/config';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
    CONSUMPTION_CATEGORIES,
    DOCUMENT_TYPES,
    MOSQUE_STATUSES,
    NOTE_TEMPLATES,
    PROGRESSION_STAGES,
} from './defaults';
import {
    aidRecords,
    associations,
    consumptionCategories,
    consumptionUpdates,
    documentTypes,
    documents,
    mosqueStatuses,
    mosques,
    noteTemplates,
    ocrConfigs,
    progressionStages,
    progressionUpdates,
    users,
} from './schema';

async function getOrCreateAssociation(db: ReturnType<typeof drizzle>, name: string) {
  const existing = await db.select().from(associations).where(eq(associations.name, name)).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await db
    .insert(associations)
    .values({
      name,
      phone: '0550 00 00 00',
      contactPerson: 'رئيس الجمعية',
      notes: 'بيانات تجريبية قابلة للتعديل.',
    })
    .returning();
  return created;
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgres://mosque:mosque@localhost:5433/mosque_dossiers',
  });
  const db = drizzle(pool);

  const passwordHash = await bcrypt.hash('Admin12345!', 10);
  await db
    .insert(users)
    .values({
      name: 'مدير النظام',
      email: 'admin@mosque.local',
      passwordHash,
      role: 'admin',
      isActive: true,
    })
    .onConflictDoNothing({ target: users.email });

  await db
    .insert(mosqueStatuses)
    .values(
      MOSQUE_STATUSES.map((status, index) => ({
        ...status,
        sortOrder: index + 1,
      })),
    )
    .onConflictDoNothing({ target: mosqueStatuses.code });

  await db
    .insert(documentTypes)
    .values(
      DOCUMENT_TYPES.map((type, index) => ({
        ...type,
        isPinnedDefault: type.isPinnedDefault ?? false,
        isRequiredDefault: type.isRequiredDefault ?? false,
        sortOrder: index + 1,
      })),
    )
    .onConflictDoNothing({ target: documentTypes.code });

  await db
    .insert(progressionStages)
    .values(PROGRESSION_STAGES.map(([code, labelAr], index) => ({ code, labelAr, sortOrder: index + 1 })))
    .onConflictDoNothing({ target: progressionStages.code });

  await db
    .insert(consumptionCategories)
    .values(CONSUMPTION_CATEGORIES.map(([code, labelAr], index) => ({ code, labelAr, sortOrder: index + 1 })))
    .onConflictDoNothing({ target: consumptionCategories.code });

  await db
    .insert(noteTemplates)
    .values(
      NOTE_TEMPLATES.map(([code, labelAr, contentAr], index) => ({
        code,
        labelAr,
        contentAr,
        sortOrder: index + 1,
      })),
    )
    .onConflictDoNothing({ target: noteTemplates.code });

  const association = await getOrCreateAssociation(db, 'جمعية مسجد النور');
  const demoMosque = await db.select().from(mosques).where(eq(mosques.officialCode, '2026-001')).limit(1);
  let mosqueId = demoMosque[0]?.id;
  if (!mosqueId) {
    const [created] = await db
      .insert(mosques)
      .values({
        officialCode: '2026-001',
        name: 'مسجد النور',
        associationId: association.id,
        commune: 'السانية',
        daira: 'وهران',
        wilaya: 'وهران',
        address: 'حي السلام',
        zoneType: 'urban',
        mosqueStatus: 'under_construction',
        receivesFridayDonations: true,
        currentProgressPercent: 62,
        estimatedTotalProjectCost: 18000000,
        estimatedCompletionCost: 5600000,
        aidCount: 1,
        totalAidAmount: 1200000,
        totalConsumedAmount: 450000,
        lastAidDate: '2025-12-15',
      })
      .returning();
    mosqueId = created.id;

    await db.insert(aidRecords).values({
      mosqueId,
      amount: 1200000,
      aidDate: '2025-12-15',
      sourceType: 'grant',
      referenceNumber: 'AID-2025-44',
      notes: 'استفادة تجريبية أولى.',
    });
    await db.insert(progressionUpdates).values({
      mosqueId,
      sourceKind: 'internal',
      stageCode: 'structure',
      progressPercent: 62,
      shortNote: 'الهيكل مكتمل جزئيا وتبقى الأشغال الداخلية.',
    });
    await db.insert(consumptionUpdates).values({
      mosqueId,
      sourceKind: 'internal',
      consumptionCategoryCode: 'building_materials',
      withdrawnAmount: 450000,
      shortNote: 'استهلاك تجريبي لمواد البناء.',
    });
  }

  const [technicalSheet] = await db
    .select()
    .from(documentTypes)
    .where(eq(documentTypes.code, 'technical_sheet'))
    .limit(1);
  if (technicalSheet && mosqueId) {
    const existing = await db
      .select()
      .from(documents)
      .where(eq(documents.mosqueId, mosqueId))
      .limit(1);
    if (!existing[0]) {
      await db.insert(documents).values({
        mosqueId,
        documentTypeId: technicalSheet.id,
        sourceKind: 'internal_upload',
        storageKey: 'demo/technical-sheet.pdf',
        mimeType: 'application/pdf',
        fileSize: 125000,
        originalFilename: 'technical-sheet.pdf',
        isPinned: true,
      });
    }
  }

  await db
    .insert(ocrConfigs)
    .values({
      name: 'default',
      officialCodeRegex: '\\d{4,}',
      dateRegex: '(\\d{2}[/-]\\d{2}[/-]\\d{4}|\\d{4}-\\d{2}-\\d{2})',
      isActive: true,
    })
    .onConflictDoNothing();

  await pool.end();
  console.log('Seed complete. Demo login: admin@mosque.local / Admin12345!');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

