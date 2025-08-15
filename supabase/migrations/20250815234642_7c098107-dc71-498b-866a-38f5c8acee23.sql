-- Add share type to shares table
ALTER TABLE public.shares 
ADD COLUMN share_type TEXT NOT NULL DEFAULT 'latest_only' 
CHECK (share_type IN ('latest_only', 'all_versions'));

-- Add comment for clarity
COMMENT ON COLUMN public.shares.share_type IS 'Type of share: latest_only (view current version) or all_versions (view and switch between all versions)';