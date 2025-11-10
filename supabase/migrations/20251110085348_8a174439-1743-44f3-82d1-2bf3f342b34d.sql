-- Grant super_admin role to Romeojackson199@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('fe38f522-c744-4074-acc1-d59537952859', 'super_admin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;