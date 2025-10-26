-- Enable RLS on user_profile_map table
ALTER TABLE public.user_profile_map ENABLE ROW LEVEL SECURITY;

-- Add RLS policy: users can only see their own mapping
CREATE POLICY "Users can view their own profile mapping"
ON public.user_profile_map
FOR SELECT
USING (auth.uid() = user_id);