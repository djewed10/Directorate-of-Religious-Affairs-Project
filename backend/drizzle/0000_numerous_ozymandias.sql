CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE "aid_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mosque_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"aid_date" date NOT NULL,
	"source_type" text,
	"reference_number" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "associations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"contact_person" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumption_categories" (
	"code" text PRIMARY KEY NOT NULL,
	"label_ar" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumption_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consumption_update_id" uuid NOT NULL,
	"file_kind" text NOT NULL,
	"media_type" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"auto_title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumption_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mosque_id" uuid NOT NULL,
	"aid_record_id" uuid,
	"source_kind" text DEFAULT 'internal' NOT NULL,
	"consumption_category_code" text,
	"withdrawn_amount" numeric(14, 2),
	"short_note" text,
	"optional_progress_percent" integer,
	"created_by_user_id" uuid,
	"external_request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label_ar" text NOT NULL,
	"group" text NOT NULL,
	"supports_expiration" boolean DEFAULT false NOT NULL,
	"is_required_default" boolean DEFAULT false NOT NULL,
	"is_pinned_default" boolean DEFAULT false NOT NULL,
	"retention_policy" text DEFAULT 'keep_all_versions' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"issue_date" date,
	"expiration_date" date,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uploaded_by_user_id" uuid,
	"change_reason" text DEFAULT 'new_upload' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mosque_id" uuid NOT NULL,
	"document_type_id" uuid NOT NULL,
	"uploaded_by_user_id" uuid,
	"source_kind" text DEFAULT 'internal_upload' NOT NULL,
	"issue_date" date,
	"expiration_date" date,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"original_filename" text NOT NULL,
	"current_version_number" integer DEFAULT 1 NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_update_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mosque_id" uuid NOT NULL,
	"request_type" text NOT NULL,
	"related_document_id" uuid,
	"token" text NOT NULL,
	"short_code" text,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"allow_progression_fields" boolean DEFAULT false NOT NULL,
	"allow_cover_update" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "internal_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mosque_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"template_code" text,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mosque_statuses" (
	"code" text PRIMARY KEY NOT NULL,
	"label_ar" text NOT NULL,
	"receives_friday_donations_default" boolean NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mosques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"official_code" text NOT NULL,
	"name" text NOT NULL,
	"association_id" uuid,
	"commune" text NOT NULL,
	"daira" text,
	"wilaya" text,
	"address" text,
	"location_text" text,
	"zone_type" text DEFAULT 'urban' NOT NULL,
	"classification" text,
	"population_coverage" integer,
	"poor_area_flag" boolean DEFAULT false NOT NULL,
	"mosque_status" text DEFAULT 'under_construction' NOT NULL,
	"receives_friday_donations" boolean DEFAULT true NOT NULL,
	"current_progress_percent" integer,
	"estimated_total_project_cost" numeric(14, 2),
	"estimated_completion_cost" numeric(14, 2),
	"cover_image_storage_key" text,
	"last_aid_date" date,
	"aid_count" integer DEFAULT 0 NOT NULL,
	"total_aid_amount" numeric(14, 2) DEFAULT 0 NOT NULL,
	"total_consumed_amount" numeric(14, 2) DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label_ar" text NOT NULL,
	"content_ar" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"mosque_id" uuid,
	"type" text NOT NULL,
	"title_ar" text NOT NULL,
	"body_ar" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ocr_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"official_code_regex" text DEFAULT '\d{4,}' NOT NULL,
	"date_regex" text DEFAULT '(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}-\d{2}-\d{2})' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progression_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"progression_update_id" uuid NOT NULL,
	"file_kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"auto_title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progression_stages" (
	"code" text PRIMARY KEY NOT NULL,
	"label_ar" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progression_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mosque_id" uuid NOT NULL,
	"source_kind" text DEFAULT 'internal' NOT NULL,
	"stage_code" text,
	"progress_percent" integer,
	"short_note" text,
	"created_by_user_id" uuid,
	"external_request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"expo_push_token" text NOT NULL,
	"device_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'operator' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aid_records" ADD CONSTRAINT "aid_records_mosque_id_mosques_id_fk" FOREIGN KEY ("mosque_id") REFERENCES "public"."mosques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_media" ADD CONSTRAINT "consumption_media_consumption_update_id_consumption_updates_id_fk" FOREIGN KEY ("consumption_update_id") REFERENCES "public"."consumption_updates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_updates" ADD CONSTRAINT "consumption_updates_mosque_id_mosques_id_fk" FOREIGN KEY ("mosque_id") REFERENCES "public"."mosques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_updates" ADD CONSTRAINT "consumption_updates_aid_record_id_aid_records_id_fk" FOREIGN KEY ("aid_record_id") REFERENCES "public"."aid_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_updates" ADD CONSTRAINT "consumption_updates_consumption_category_code_consumption_categories_code_fk" FOREIGN KEY ("consumption_category_code") REFERENCES "public"."consumption_categories"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_updates" ADD CONSTRAINT "consumption_updates_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_mosque_id_mosques_id_fk" FOREIGN KEY ("mosque_id") REFERENCES "public"."mosques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_update_requests" ADD CONSTRAINT "external_update_requests_mosque_id_mosques_id_fk" FOREIGN KEY ("mosque_id") REFERENCES "public"."mosques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_update_requests" ADD CONSTRAINT "external_update_requests_related_document_id_documents_id_fk" FOREIGN KEY ("related_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_update_requests" ADD CONSTRAINT "external_update_requests_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_mosque_id_mosques_id_fk" FOREIGN KEY ("mosque_id") REFERENCES "public"."mosques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mosques" ADD CONSTRAINT "mosques_association_id_associations_id_fk" FOREIGN KEY ("association_id") REFERENCES "public"."associations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_mosque_id_mosques_id_fk" FOREIGN KEY ("mosque_id") REFERENCES "public"."mosques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_media" ADD CONSTRAINT "progression_media_progression_update_id_progression_updates_id_fk" FOREIGN KEY ("progression_update_id") REFERENCES "public"."progression_updates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_updates" ADD CONSTRAINT "progression_updates_mosque_id_mosques_id_fk" FOREIGN KEY ("mosque_id") REFERENCES "public"."mosques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_updates" ADD CONSTRAINT "progression_updates_stage_code_progression_stages_code_fk" FOREIGN KEY ("stage_code") REFERENCES "public"."progression_stages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_updates" ADD CONSTRAINT "progression_updates_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aid_records_mosque_idx" ON "aid_records" USING btree ("mosque_id");--> statement-breakpoint
CREATE INDEX "aid_records_date_idx" ON "aid_records" USING btree ("aid_date");--> statement-breakpoint
CREATE INDEX "associations_name_idx" ON "associations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "consumption_media_update_idx" ON "consumption_media" USING btree ("consumption_update_id");--> statement-breakpoint
CREATE INDEX "consumption_media_type_idx" ON "consumption_media" USING btree ("media_type");--> statement-breakpoint
CREATE INDEX "consumption_updates_mosque_idx" ON "consumption_updates" USING btree ("mosque_id");--> statement-breakpoint
CREATE INDEX "consumption_updates_created_idx" ON "consumption_updates" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "document_types_code_unique" ON "document_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "document_types_group_idx" ON "document_types" USING btree ("group");--> statement-breakpoint
CREATE UNIQUE INDEX "document_versions_document_version_unique" ON "document_versions" USING btree ("document_id","version_number");--> statement-breakpoint
CREATE INDEX "documents_mosque_idx" ON "documents" USING btree ("mosque_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("document_type_id");--> statement-breakpoint
CREATE INDEX "documents_expiration_idx" ON "documents" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "documents_active_idx" ON "documents" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "external_update_requests_token_unique" ON "external_update_requests" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "external_update_requests_short_code_unique" ON "external_update_requests" USING btree ("short_code");--> statement-breakpoint
CREATE INDEX "external_update_requests_mosque_idx" ON "external_update_requests" USING btree ("mosque_id");--> statement-breakpoint
CREATE INDEX "external_update_requests_status_idx" ON "external_update_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "internal_notes_mosque_idx" ON "internal_notes" USING btree ("mosque_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mosques_official_code_unique" ON "mosques" USING btree ("official_code");--> statement-breakpoint
CREATE INDEX "mosques_name_idx" ON "mosques" USING btree ("name");--> statement-breakpoint
CREATE INDEX "mosques_commune_idx" ON "mosques" USING btree ("commune");--> statement-breakpoint
CREATE INDEX "mosques_status_idx" ON "mosques" USING btree ("mosque_status");--> statement-breakpoint
CREATE INDEX "mosques_friday_idx" ON "mosques" USING btree ("receives_friday_donations");--> statement-breakpoint
CREATE UNIQUE INDEX "note_templates_code_unique" ON "note_templates" USING btree ("code");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_mosque_idx" ON "notifications" USING btree ("mosque_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "progression_media_update_idx" ON "progression_media" USING btree ("progression_update_id");--> statement-breakpoint
CREATE INDEX "progression_updates_mosque_idx" ON "progression_updates" USING btree ("mosque_id");--> statement-breakpoint
CREATE INDEX "progression_updates_created_idx" ON "progression_updates" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "push_tokens_token_unique" ON "push_tokens" USING btree ("expo_push_token");--> statement-breakpoint
CREATE INDEX "push_tokens_user_idx" ON "push_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");
