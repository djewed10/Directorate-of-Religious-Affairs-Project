ALTER TABLE "aid_records" ADD COLUMN IF NOT EXISTS "attachment_storage_key" text;
--> statement-breakpoint
ALTER TABLE "aid_records" ADD COLUMN IF NOT EXISTS "attachment_mime_type" text;
--> statement-breakpoint
ALTER TABLE "aid_records" ADD COLUMN IF NOT EXISTS "attachment_file_size" integer;
--> statement-breakpoint
ALTER TABLE "aid_records" ADD COLUMN IF NOT EXISTS "attachment_original_filename" text;
