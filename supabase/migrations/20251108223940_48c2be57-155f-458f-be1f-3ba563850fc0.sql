-- Fix user roles for business owners who don't have admin/provider roles
-- Add admin and provider roles to all business owners
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT p.user_id, 'admin'::app_role
FROM businesses b
JOIN profiles p ON p.id = b.owner_profile_id
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = p.user_id AND ur.role = 'admin'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT DISTINCT p.user_id, 'provider'::app_role
FROM businesses b
JOIN profiles p ON p.id = b.owner_profile_id
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = p.user_id AND ur.role = 'provider'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create dentist records for business owners who don't have one
INSERT INTO dentists (profile_id, first_name, last_name, email, is_active)
SELECT 
  p.id,
  COALESCE(p.first_name, ''),
  COALESCE(p.last_name, ''),
  COALESCE(p.email, ''),
  true
FROM businesses b
JOIN profiles p ON p.id = b.owner_profile_id
WHERE NOT EXISTS (
  SELECT 1 FROM dentists d WHERE d.profile_id = p.id
)
ON CONFLICT (profile_id) DO UPDATE SET is_active = true;