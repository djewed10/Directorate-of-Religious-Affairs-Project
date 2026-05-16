ALTER TABLE "mosques" ADD COLUMN IF NOT EXISTS "address_text" text;
ALTER TABLE "mosques" ADD COLUMN IF NOT EXISTS "google_maps_url" text;
ALTER TABLE "external_update_requests" ADD COLUMN IF NOT EXISTS "allow_location_update" boolean DEFAULT false NOT NULL;
