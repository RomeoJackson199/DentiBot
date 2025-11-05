import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/arboretums-hero.jpg";
import mathTutoring from "@/assets/math-tutoring.jpg";
import scienceHelp from "@/assets/science-help.jpg";
import essayWriting from "@/assets/essay-writing.jpg";

export async function setupArboretumHomepage(businessSlug: string = "arboretums") {
  // Get business by slug
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .single();

  if (businessError || !business) {
    console.error("Business not found:", businessError);
    return { success: false, error: businessError || "Business not found" };
  }

  const businessId = business.id;

  // 1. Set up homepage settings
  const { error: homepageError } = await supabase
    .from("homepage_settings")
    .upsert({
      business_id: businessId,
      hero_title: "Ace Your Homework with Arboretums",
      hero_subtitle: "Expert tutoring and homework help for secondary students in all subjects",
      hero_image_url: heroImage,
      show_services: true,
      show_about: true,
      about_title: "Why Students Choose Arboretums",
      about_content: `At Arboretums, we understand that secondary school can be challenging. That's why we've created a supportive learning environment where students can get the help they need to succeed.

Our experienced tutors specialize in breaking down complex concepts into easy-to-understand lessons. Whether you're struggling with math equations, science experiments, or essay writing, we're here to guide you every step of the way.

With flexible scheduling and personalized attention, we help students build confidence, improve grades, and develop strong study habits that last a lifetime.`,
      cta_text: "Get Homework Help",
      is_active: true,
    });

  if (homepageError) {
    console.error("Error setting up homepage:", homepageError);
    return { success: false, error: homepageError };
  }

  // 2. Update services with images if they exist
  const { data: services } = await supabase
    .from("business_services")
    .select("id, name")
    .eq("business_id", businessId)
    .limit(4);

  if (services && services.length > 0) {
    const serviceImages = [
      {
        image_url: mathTutoring,
        description: "One-on-one help with algebra, geometry, calculus, and all math topics"
      },
      {
        image_url: scienceHelp,
        description: "Support with biology, chemistry, physics, and lab work"
      },
      {
        image_url: essayWriting,
        description: "Guidance on essays, research papers, and creative writing"
      },
      {
        image_url: heroImage,
        description: "Comprehensive tutoring across all secondary school subjects"
      }
    ];

    for (let i = 0; i < services.length && i < serviceImages.length; i++) {
      const { error } = await supabase
        .from("business_services")
        .update({
          image_url: serviceImages[i].image_url,
          description: serviceImages[i].description,
        })
        .eq("id", services[i].id);

      if (error) {
        console.error(`Error updating service ${services[i].id}:`, error);
      }
    }
  }

  return { success: true };
}
