# Mosque Dossiers

Internal Arabic RTL system for mosque dossiers, construction/renovation follow-up, document wallets, aid history, consumption control, notifications, and secure external token uploads.

## Structure

- `backend`: NestJS, TypeScript, PostgreSQL, Drizzle ORM, JWT auth, Swagger, cron jobs, S3/local storage abstraction.
- `mobile`: Expo React Native with Expo Router. The same codebase runs on Android and web/desktop with responsive layouts.

There is no separate web frontend folder.

## Quick Start

```powershell
docker compose up -d

cd backend
copy .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run start:dev
```

Backend API: `http://localhost:3000/api`  
Swagger: `http://localhost:3000/api/docs`

Docker publishes Postgres on port `5433` by default so it does not collide with a local Postgres installation.

```powershell
cd mobile
copy .env.example .env
npm install
npm run web
```

Expo web opens from the Metro URL. For Android with a custom/native build:

```powershell
cd mobile
npm run android
```

Demo credentials:

- Email: `admin@mosque.local`
- Password: `Admin12345!`

## Database

The Drizzle schema is in `backend/src/db/schema.ts`.

Commands:

```powershell
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
```

Seeded data includes:

- Mosque statuses in Arabic with default Friday donation behavior.
- 26 editable document types in Arabic.
- Progression stages.
- Consumption categories.
- Internal note templates.
- Demo admin and demo mosque.

## Storage

Files are not stored in PostgreSQL. The DB stores metadata only.

Development defaults to local storage:

```env
STORAGE_DRIVER=local
LOCAL_STORAGE_DIR=./storage-local
```

For S3-compatible storage, including Cloudflare R2 or MinIO:

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=http://localhost:9000
S3_REGION=auto
S3_BUCKET=mosque-documents
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
```

`docker-compose.yml` includes PostgreSQL and MinIO. Signed upload URLs are returned by the backend. For the MVP, upload signing is also available to external token forms; in production, scope signing to a valid external request token.

## OCR

OCR images are never sent to the backend.

The mobile app includes an on-device OCR architecture:

- `mobile/src/ocr/ocrService.ts`
- `mobile/src/ocr/extractors.ts`

Expo Go does not support native ML Kit OCR modules. To enable local OCR, build a custom dev client/prebuild and install a native OCR module such as `react-native-mlkit-ocr`, then set:

```env
EXPO_PUBLIC_ENABLE_NATIVE_OCR=true
```

On web or when OCR is unavailable, the app shows a manual fallback. Extraction logic picks the longest numeric official-code candidates and parses common date formats such as `dd/MM/yyyy`, `dd-MM-yyyy`, and `yyyy-MM-dd`.

## Push Notification Images

The Android app icon is configured from the directorate logo, and the notification small icon uses the Expo notification config plugin.

Remote rich notification images are best-effort. When a notification is tied to a mosque with an HTTPS cover image URL, the backend adds `richContent.image` to the Expo push payload while keeping the existing navigation `data` fields unchanged. Android can display the image through Expo Push Service; iOS requires a Notification Service Extension for remote images. Local development storage URLs and expired signed URLs will fall back to the app notification icon.

ملاحظة: صور إشعارات المساجد تعتمد على دعم المنصة ورابط صورة HTTPS صالح؛ إذا لم تتوفر الشروط يظهر شعار التطبيق كبديل دون تغيير منطق فتح الإشعار.

## Implemented MVP

- JWT login and secure token storage.
- Admin/manager/operator roles.
- Mosque and association backend CRUD.
- Mosque dashboard with Arabic RTL cards and clickable filters.
- Strong mosque search by official code, name, association, commune, status, document filters, and Friday donation flag.
- Mosque detail with overview, document wallet, progression, consumption, aid history, notes, and settings.
- Editable document types from the backend.
- Document upload metadata with predefined type selection and dynamic expiration-date behavior.
- Soft-delete/versioning model for documents.
- Aid record creation and aggregate recalculation.
- Progression and consumption timelines with media metadata.
- Secure external token/code requests for consumption, progression, document renewal/upload, and cover image update.
- Persistent notification center.
- Scheduled jobs for document expiration, inactivity, external request expiry, and trash cleanup.
- Printable mosque summary on web.
- Dark/light responsive Arabic UI.

## Assumptions

- Association presidents do not have accounts; they only use `/external/[token]`.
- No municipality/daira/wilaya approval workflow is implemented.
- `official_code` is unique and visible across search/detail cards.
- Expiration notifications are created only when `expiration_date` exists.
- Documents that do not support expiration hide the expiration input in the app.
- Multiple scanned pages can be converted in-app into a single printable PDF package for document-style uploads.

## TODOs

- Scope public upload signing to a live external token.
- Add full user-management screens in the app.
- Add association create/edit screens in the app.
- Add native ML Kit OCR dependency in a custom Expo dev client.
- Add Expo push delivery service; DB notifications are already the source of truth.
- Add automated API/e2e tests.
