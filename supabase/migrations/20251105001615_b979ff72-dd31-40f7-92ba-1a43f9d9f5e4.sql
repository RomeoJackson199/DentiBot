-- Insert homepage settings for Arboretums
INSERT INTO public.homepage_settings (
  business_id,
  hero_title,
  hero_subtitle,
  hero_image_url,
  show_services,
  show_about,
  about_title,
  about_content,
  cta_text,
  cta_link,
  is_active
) VALUES (
  '6c6f94f5-b822-4dfa-931f-f2376ae404f5',
  'Ace Your Homework with Arboretums',
  'Expert tutoring and homework help for secondary students in all subjects',
  '/src/assets/arboretums-hero.jpg',
  true,
  true,
  'Why Students Choose Arboretums',
  'At Arboretums, we understand that secondary school can be challenging. That''s why we''ve created a supportive learning environment where students can get the help they need to succeed.

Our experienced tutors specialize in breaking down complex concepts into easy-to-understand lessons. Whether you''re struggling with math equations, science experiments, or essay writing, we''re here to guide you every step of the way.

With flexible scheduling and personalized attention, we help students build confidence, improve grades, and develop strong study habits that last a lifetime.',
  'Get Homework Help',
  '/book-appointment',
  true
);