-- Add project_state enum for business maturity tracking
-- This is different from project_phase which tracks product development stages

-- Create enum for project state (business maturity)
CREATE TYPE public.project_state AS ENUM (
  'idea',                -- No customers, no revenue (idea/exploration)
  'validacion_temprana', -- 1-10 customers, €0-1k/month
  'traccion',            -- 10-100 customers, €1-10k/month
  'consolidado'          -- 100+ customers, €10k+/month
);

-- Add project_state column to projects table
ALTER TABLE public.projects
ADD COLUMN project_state public.project_state DEFAULT 'idea';

-- Add index for performance
CREATE INDEX idx_projects_state ON public.projects(project_state);

-- Add comment for documentation
COMMENT ON COLUMN public.projects.project_state IS
'Business maturity state: idea (no customers), validacion_temprana (1-10 customers), traccion (10-100 customers), consolidado (100+ customers)';

-- Update RLS policies to include project_state (already covered by existing policies)
-- No changes needed as existing policies cover all columns
