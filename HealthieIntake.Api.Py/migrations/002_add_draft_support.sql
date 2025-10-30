-- Migration: Add draft support to intakes table
-- Purpose: Enable saving draft progress and multi-device sync
-- Date: 2025-10-30

-- Add new columns for draft functionality
ALTER TABLE intakes
ADD COLUMN IF NOT EXISTS patient_healthie_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS current_step VARCHAR(10),
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Update status default for new records (existing records keep their status)
ALTER TABLE intakes
ALTER COLUMN status SET DEFAULT 'draft';

-- Update existing records to have submitted_at = created_at if status is 'submitted'
UPDATE intakes
SET submitted_at = created_at,
    last_updated_at = COALESCE(updated_at, created_at)
WHERE status = 'submitted' AND submitted_at IS NULL;

-- Add index for fast draft lookups by healthie_id
CREATE INDEX IF NOT EXISTS idx_intakes_healthie_status
ON intakes(patient_healthie_id, status);

-- Add index for last_updated_at (for sorting drafts)
CREATE INDEX IF NOT EXISTS idx_intakes_last_updated
ON intakes(last_updated_at DESC);

-- Update non-null constraint for patient_healthie_id (allow null for old records)
-- Note: New inserts should always provide this value
COMMENT ON COLUMN intakes.patient_healthie_id IS 'Healthie patient ID - required for new records';
COMMENT ON COLUMN intakes.status IS 'Record status: draft or completed';
COMMENT ON COLUMN intakes.current_step IS 'Current form step (1-6) for draft';
COMMENT ON COLUMN intakes.last_updated_at IS 'Last modification timestamp for conflict resolution';
COMMENT ON COLUMN intakes.submitted_at IS 'Timestamp when form was completed (NULL for drafts)';
