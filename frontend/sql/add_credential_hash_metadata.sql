ALTER TABLE credentials
ADD COLUMN IF NOT EXISTS metadata_schema_version INTEGER,
ADD COLUMN IF NOT EXISTS hash_algorithm TEXT;

-- Existing credentials were issued before canonical schema stamping.
-- Leave them nullable so verification can use the legacy JSON.stringify hash path.
UPDATE credentials
SET hash_algorithm = 'sha256:json-stringify'
WHERE metadata_schema_version IS NULL
  AND hash_algorithm IS NULL;

ALTER TABLE credentials
ALTER COLUMN metadata_schema_version SET DEFAULT 1,
ALTER COLUMN hash_algorithm SET DEFAULT 'sha256:canonical-json:v1';
