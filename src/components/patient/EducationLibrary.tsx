import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  BookOpen,
  Sparkles,
  Heart,
  Shield,
  Baby,
  Users,
  AlertCircle,
  ChevronRight,
  Clock,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EducationArticle {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  readTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  featured?: boolean;
  imageUrl?: string;
}

const EDUCATION_CATEGORIES = [
  { id: "all", name: "All Articles", icon: BookOpen, color: "blue" },
  { id: "prevention", name: "Prevention", icon: Shield, color: "green" },
  { id: "treatment", name: "Treatments", icon: Sparkles, color: "purple" },
  { id: "children", name: "Children's Dental Health", icon: Baby, color: "pink" },
  { id: "seniors", name: "Senior Care", icon: Users, color: "orange" },
  { id: "emergency", name: "Emergencies", icon: AlertCircle, color: "red" },
  { id: "cosmetic", name: "Cosmetic Dentistry", icon: Heart, color: "rose" },
];

export const EDUCATION_ARTICLES: EducationArticle[] = [
  {
    id: "1",
    title: "The Complete Guide to Proper Brushing Technique",
    category: "prevention",
    description: "Learn the correct way to brush your teeth for optimal oral health",
    content: `# The Complete Guide to Proper Brushing Technique

## Why Proper Brushing Matters
Brushing your teeth is one of the most important things you can do for your oral health. However, many people don't brush correctly, which can lead to cavities, gum disease, and other dental problems.

## The Right Way to Brush

### 1. Choose the Right Toothbrush
- Use a soft-bristled brush
- Replace your toothbrush every 3-4 months
- Consider an electric toothbrush for better cleaning

### 2. Use the Proper Technique
- Hold your brush at a 45-degree angle to your gums
- Use gentle, circular motions
- Brush all surfaces: outer, inner, and chewing surfaces
- Don't forget your tongue!

### 3. Timing is Everything
- Brush for at least 2 minutes, twice a day
- Divide your mouth into quadrants
- Spend 30 seconds on each quadrant

## Common Mistakes to Avoid
- Brushing too hard (damages enamel and gums)
- Using a worn-out toothbrush
- Not brushing long enough
- Skipping before bedtime

## Pro Tips
- Use a timer or electric toothbrush with a built-in timer
- Brush before breakfast and before bed
- Wait 30 minutes after eating acidic foods before brushing
- Use fluoride toothpaste

Remember: Proper brushing, combined with daily flossing and regular dental checkups, is the foundation of good oral health!`,
    readTime: 5,
    difficulty: 'beginner',
    tags: ["brushing", "prevention", "daily care"],
    featured: true,
  },
  {
    id: "2",
    title: "Understanding Root Canal Treatment",
    category: "treatment",
    description: "What to expect during and after a root canal procedure",
    content: `# Understanding Root Canal Treatment

## What is a Root Canal?
A root canal is a treatment used to repair and save a tooth that is badly decayed or infected. The procedure involves removing the damaged pulp, cleaning and disinfecting the inside of the tooth, and then filling and sealing it.

## When Do You Need a Root Canal?

### Common Signs:
- Severe toothache when chewing
- Prolonged sensitivity to hot or cold
- Darkening of the tooth
- Swelling and tenderness in nearby gums
- A persistent pimple on the gums

## The Procedure

### Step 1: Diagnosis
Your dentist will take X-rays to assess the damage and plan the treatment.

### Step 2: Anesthesia
Local anesthesia is administered to numb the area. Despite its reputation, modern root canals are relatively painless!

### Step 3: Cleaning
1. A protective sheet (rubber dam) is placed around the tooth
2. An opening is made in the crown
3. The pulp is removed using special instruments
4. The root canals are cleaned and shaped

### Step 4: Filling
The canals are filled with a rubber-like material called gutta-percha and sealed with adhesive cement.

### Step 5: Restoration
Usually, a crown is placed on the tooth to protect it and restore full function.

## Recovery

### What to Expect:
- Mild discomfort for a few days (manageable with over-the-counter pain relievers)
- Avoid chewing on the treated tooth until permanent restoration is complete
- Maintain good oral hygiene
- Attend follow-up appointments

## Success Rate
Root canal treatments have a success rate of over 95% and can last a lifetime with proper care!

## Aftercare Tips
- Take prescribed medications as directed
- Avoid hard foods for a few days
- Continue regular brushing and flossing
- Schedule a follow-up visit
- Report any severe pain or swelling immediately`,
    readTime: 8,
    difficulty: 'intermediate',
    tags: ["root canal", "treatment", "endodontics"],
    featured: true,
  },
  {
    id: "3",
    title: "Children's First Dental Visit: A Parent's Guide",
    category: "children",
    description: "Everything you need to know about your child's first trip to the dentist",
    content: `# Children's First Dental Visit: A Parent's Guide

## When Should Your Child First Visit the Dentist?
The American Dental Association recommends that children have their first dental visit within 6 months of getting their first tooth, or by their first birthday.

## Why Early Dental Visits Matter
- Establish a dental home
- Catch problems early
- Build positive associations with dental care
- Learn proper oral hygiene techniques
- Prevent early childhood cavities

## Preparing Your Child

### Before the Visit:
1. **Talk Positively**: Use simple, positive language
2. **Read Books**: Find children's books about visiting the dentist
3. **Play Pretend**: Practice opening wide and counting teeth
4. **Stay Calm**: Children pick up on parental anxiety

### What to Avoid Saying:
- "It won't hurt"
- "There's nothing to be scared of"
- "The dentist won't do anything bad"

These phrases can inadvertently introduce fear!

## What Happens at the First Visit

### The Examination:
- Visual inspection of teeth and gums
- Check for proper jaw development
- Look for cavities or other issues
- Assessment of bite alignment

### Education for Parents:
- Proper brushing techniques for babies and toddlers
- Fluoride needs
- Teething guidance
- Thumb-sucking or pacifier habits
- Dietary recommendations

## Establishing Good Habits Early

### For Infants:
- Wipe gums with a soft, damp cloth after feeding
- Start brushing as soon as first tooth appears
- Use a rice-grain sized amount of fluoride toothpaste

### For Toddlers (1-3 years):
- Brush twice daily with a smear of fluoride toothpaste
- Help them brush until age 6-7
- Avoid sugary drinks and snacks
- Schedule check-ups every 6 months

### For Preschoolers (3-5 years):
- Increase fluoride toothpaste to pea-sized amount
- Begin introducing flossing
- Encourage independence while supervising
- Discuss dental sealants with your dentist

## Making It a Positive Experience

### Tips for Success:
- Schedule morning appointments when children are well-rested
- Bring a favorite toy or comfort item
- Reward positive behavior (but not with sugary treats!)
- Stay positive and enthusiastic
- Consider a practice visit to familiarize your child

## Red Flags to Watch For

Contact your dentist if you notice:
- White or brown spots on teeth
- Bleeding gums
- Difficulty chewing
- Teeth grinding
- Thumb sucking past age 4
- Early tooth loss

## Building a Lifetime of Healthy Smiles
Starting dental visits early helps children develop positive attitudes toward oral health that last a lifetime!`,
    readTime: 7,
    difficulty: 'beginner',
    tags: ["children", "first visit", "prevention", "parents"],
    featured: true,
  },
  {
    id: "4",
    title: "Dental Emergencies: What to Do and When",
    category: "emergency",
    description: "Quick guide to handling common dental emergencies",
    content: `# Dental Emergencies: What to Do and When

## Knocked-Out Tooth

### Immediate Actions:
1. **Find the tooth** and handle it by the crown (top), not the root
2. **Rinse gently** with water if dirty (don't scrub!)
3. **Try to reinsert** the tooth into the socket if possible
4. **Keep it moist** - place in milk or saliva if you can't reinsert it
5. **Get to a dentist within 30 minutes** - time is critical!

### Success Factors:
- Acting within 30 minutes increases success rate dramatically
- Keeping the tooth moist is essential
- Avoid touching the root area

## Severe Toothache

### What to Do:
1. Rinse mouth with warm water
2. Gently floss to remove trapped food
3. Take over-the-counter pain relievers
4. Apply cold compress to outside of cheek
5. **Never** put aspirin directly on gums or tooth
6. Call your dentist for an appointment

### When to Seek Immediate Care:
- Fever accompanying toothache
- Swelling of face or gums
- Difficulty swallowing or breathing
- Severe, unmanageable pain

## Broken or Chipped Tooth

### Immediate Steps:
1. Save any pieces you can find
2. Rinse mouth with warm water
3. Apply gauze to any bleeding areas
4. Use cold compress to reduce swelling
5. Contact your dentist within 24 hours

### Temporary Relief:
- Cover sharp edges with dental wax or sugar-free gum
- Avoid chewing on that side
- Stick to soft foods

## Lost Filling or Crown

### What to Do:
1. Keep the crown if possible
2. Clean the crown gently
3. Try to slip it back on with dental cement or toothpaste
4. Protect the exposed tooth
5. See your dentist within a few days

### Temporary Solutions:
- Use dental cement from pharmacy
- Cover exposed tooth with sugar-free gum
- Avoid sticky or hard foods

## Abscess or Swelling

### Warning Signs:
- Painful, swollen bump on gums
- Fever
- Swollen jaw or face
- Difficulty swallowing
- Foul taste in mouth

### Action Plan:
1. **Seek immediate dental care** - this is serious!
2. Rinse with mild salt water
3. Do not try to drain the abscess yourself
4. Take over-the-counter pain relievers
5. Apply cold compress

## Soft Tissue Injuries

### For Cuts to Lips, Gums, or Tongue:
1. Clean area gently with water
2. Apply pressure with clean gauze
3. Use cold compress to reduce swelling
4. If bleeding doesn't stop after 15 minutes, seek emergency care

## Preventing Dental Emergencies

### At Home:
- Wear mouthguards during sports
- Avoid chewing hard objects (ice, popcorn kernels, hard candy)
- Use scissors, not teeth, to open packages
- Don't use teeth as tools

### Regular Care:
- Visit dentist regularly for check-ups
- Address small problems before they become emergencies
- Maintain good oral hygiene
- Keep your dentist's emergency number handy

## Emergency Dental Kit
Keep these items at home:
- Dentist's phone number
- Dental wax
- Temporary dental cement
- Gauze
- Small container with lid
- Pain relievers
- Cold pack
- Mirror and flashlight

Remember: Most dental emergencies can be prevented with regular dental care and smart habits!`,
    readTime: 6,
    difficulty: 'intermediate',
    tags: ["emergency", "urgent care", "toothache", "trauma"],
    featured: false,
  },
  {
    id: "5",
    title: "Teeth Whitening: Options and What Works",
    category: "cosmetic",
    description: "Compare different teeth whitening methods and find what's right for you",
    content: `# Teeth Whitening: Options and What Works

## Understanding Tooth Discoloration

### Types of Stains:

**Extrinsic Stains** (on tooth surface):
- Coffee, tea, red wine
- Tobacco
- Dark-colored foods

**Intrinsic Stains** (within tooth):
- Aging
- Medications (tetracycline)
- Trauma
- Excessive fluoride

## Professional Whitening Options

### 1. In-Office Whitening
**How it works:** High-concentration bleaching gel activated by special light
**Duration:** 60-90 minutes
**Results:** 3-8 shades lighter in one visit
**Cost:** $500-$1,000

**Pros:**
- Fastest results
- Professional supervision
- Immediate dramatic change
- Safe for teeth and gums

**Cons:**
- Most expensive option
- May cause temporary sensitivity
- Results vary by individual

### 2. Take-Home Professional Trays
**How it works:** Custom trays with professional-strength gel
**Duration:** 2-4 weeks of daily use
**Results:** 3-6 shades lighter
**Cost:** $300-$500

**Pros:**
- Custom fit for even results
- Professional-strength formula
- Use at your convenience
- Less expensive than in-office

**Cons:**
- Takes longer for results
- Requires commitment
- Possible sensitivity

## Over-the-Counter Options

### 3. Whitening Strips
**Duration:** 30 minutes daily for 2 weeks
**Results:** 1-3 shades lighter
**Cost:** $30-$60

**Pros:**
- Convenient
- Affordable
- No dentist visit needed
- Clinically proven results

**Cons:**
- Can miss hard-to-reach areas
- May slip during use
- Mild sensitivity possible
- Less dramatic results

### 4. Whitening Toothpaste
**Duration:** Daily brushing
**Results:** Maintains whiteness, removes surface stains
**Cost:** $5-$15

**Pros:**
- Most affordable
- Easy to incorporate into routine
- No sensitivity for most users
- Good for maintenance

**Cons:**
- Minimal whitening (1 shade at most)
- Takes longer to see results
- Works only on surface stains

### 5. Whitening Pens
**Duration:** Apply 1-2 times daily
**Results:** 1-2 shades lighter
**Cost:** $15-$30

**Pros:**
- Portable and convenient
- Quick application
- Affordable
- Good for touch-ups

**Cons:**
- Subtle results
- Must be precise with application
- Temporary results

## Natural Whitening Methods

### What Actually Works:
- **Baking soda** - Mildly effective for surface stains
- **Oil pulling** - May improve oral health, minimal whitening
- **Eating crunchy fruits/vegetables** - Natural cleaning action

### What Doesn't Work (Myths):
- ❌ Lemon juice (actually damages enamel!)
- ❌ Charcoal toothpaste (abrasive, not proven effective)
- ❌ Banana peels (no scientific evidence)

## Who Shouldn't Whiten?

Avoid whitening if you have:
- Sensitive teeth
- Worn enamel
- Cavities or gum disease
- Dental work on front teeth (won't whiten)
- Pregnancy or breastfeeding
- Age under 16

## Maintaining Your White Smile

### Do:
- Brush twice daily with whitening toothpaste
- Floss daily
- Use a straw for staining beverages
- Rinse mouth after consuming staining foods
- Visit dentist regularly

### Avoid:
- Smoking and tobacco products
- Excessive coffee, tea, red wine
- Dark-colored sodas
- Berries in excess

## Managing Sensitivity

If you experience sensitivity:
- Use sensitivity toothpaste 2 weeks before whitening
- Reduce frequency of treatment
- Apply fluoride gel
- Avoid hot/cold foods temporarily
- Consider a desensitizing gel

## How Long Do Results Last?

- **In-office:** 1-3 years
- **Take-home trays:** 1-2 years
- **Strips:** 3-6 months
- **Toothpaste:** Ongoing maintenance

Results vary based on:
- Your habits (coffee, wine, smoking)
- Oral hygiene routine
- Type of whitening used
- Initial tooth color

## Choosing the Right Option

Consider these factors:
- **Budget:** OTC products to professional treatments
- **Timeline:** Quick results vs. gradual
- **Sensitivity:** Professional supervision may help
- **Commitment:** Daily strips vs. one-time treatment

## Consult Your Dentist

Before starting any whitening treatment:
- Get a dental check-up
- Discuss your whitening goals
- Review your options
- Address any dental issues first
- Create a whitening plan

A healthy, white smile is achievable with the right approach!`,
    readTime: 10,
    difficulty: 'intermediate',
    tags: ["whitening", "cosmetic", "aesthetic", "stains"],
    featured: false,
  },
  {
    id: "6",
    title: "Gum Disease: Prevention and Treatment",
    category: "prevention",
    description: "Understand gum disease and how to keep your gums healthy",
    content: `# Gum Disease: Prevention and Treatment

## What is Gum Disease?

Gum disease (periodontal disease) is an infection of the tissues that hold your teeth in place. It's typically caused by poor oral hygiene habits that allow plaque to build up and harden.

## Stages of Gum Disease

### Gingivitis (Early Stage)
**Symptoms:**
- Red, swollen gums
- Bleeding when brushing or flossing
- Bad breath
- No permanent damage yet

**Good news:** Completely reversible with proper care!

### Periodontitis (Advanced Stage)
**Symptoms:**
- Gums pull away from teeth (receding)
- Persistent bad breath
- Loose teeth
- Pus between teeth and gums
- Changes in bite
- Tooth loss

**Warning:** Permanent damage to bone and tissue

## Risk Factors

### Controllable Factors:
- Poor oral hygiene
- Smoking
- Vitamin C deficiency
- Poor nutrition
- Stress

### Uncontrollable Factors:
- Genetics
- Age (risk increases after 30)
- Hormonal changes
- Certain medications
- Diseases (diabetes, HIV)

## Prevention Strategies

### Daily Care:
1. **Brush properly** - 2 minutes, twice daily
2. **Floss daily** - reaches where brushes can't
3. **Use mouthwash** - antibacterial formula
4. **Clean tongue** - removes bacteria

### Professional Care:
- Regular cleanings (every 6 months)
- Professional scaling when needed
- Deep cleanings for advanced cases

### Lifestyle Choices:
- Quit smoking
- Eat nutritious diet
- Manage stress
- Control blood sugar (if diabetic)

## Treatment Options

### For Gingivitis:
- Professional cleaning
- Improved home care routine
- Antibacterial mouthwash
- Regular monitoring

### For Periodontitis:

**Non-Surgical:**
- Scaling and root planing (deep cleaning)
- Antibiotics (topical or oral)
- Antimicrobial mouth rinse

**Surgical:**
- Flap surgery (pocket reduction)
- Bone grafts
- Soft tissue grafts
- Guided tissue regeneration

## Connection to Overall Health

Gum disease is linked to:
- Heart disease
- Diabetes complications
- Respiratory disease
- Rheumatoid arthritis
- Pregnancy complications

## Warning Signs - See Your Dentist If:
- Gums bleed regularly
- Gums are red, swollen, or tender
- Persistent bad breath
- Teeth feel loose
- Changes in bite
- Pain when chewing

## Recovery and Maintenance

### After Treatment:
- Follow dentist's instructions carefully
- Take prescribed medications
- Maintain excellent oral hygiene
- Attend all follow-up appointments
- Don't smoke

### Long-Term Success:
- Regular professional cleanings
- Daily home care
- Early intervention for problems
- Healthy lifestyle choices

Remember: Prevention is always easier (and less expensive) than treatment!`,
    readTime: 8,
    difficulty: 'intermediate',
    tags: ["gum disease", "prevention", "periodontics", "gingivitis"],
    featured: false,
  },
  {
    id: "7",
    title: "Dental Care for Seniors: Special Considerations",
    category: "seniors",
    description: "How dental needs change with age and how to maintain oral health",
    content: `# Dental Care for Seniors: Special Considerations

## How Oral Health Changes with Age

### Common Age-Related Issues:

**1. Dry Mouth (Xerostomia)**
- Often caused by medications
- Increases cavity risk
- Makes chewing and swallowing difficult

**2. Gum Disease**
- More prevalent in older adults
- Can lead to tooth loss
- Linked to overall health issues

**3. Tooth Decay**
- Root decay more common
- Worn enamel exposes sensitive areas
- Existing fillings may need replacement

**4. Tooth Loss**
- Affects nutrition and confidence
- Can cause bone loss in jaw
- May require dentures or implants

## Special Care Considerations

### Medications and Oral Health:
- Many medications cause dry mouth
- Some affect gum tissue
- Blood thinners complicate dental procedures
- **Always inform your dentist of all medications**

### Managing Chronic Conditions:
- **Diabetes:** Increases gum disease risk
- **Heart disease:** Special precautions for procedures
- **Osteoporosis:** Affects jawbone health
- **Arthritis:** Makes brushing/flossing difficult

## Daily Care Tips

### For Dry Mouth:
- Drink water frequently
- Use artificial saliva products
- Avoid alcohol and caffeine
- Chew sugar-free gum
- Use a humidifier at night

### For Limited Dexterity:
- Electric toothbrush (easier to hold)
- Floss holders or water flossers
- Adapted grips for toothbrush handles
- Sit while brushing if needed

### For Denture Wearers:
- Remove and rinse after eating
- Brush dentures daily
- Soak overnight
- Clean mouth and gums
- Regular professional check-ups

## Nutrition and Oral Health

### Best Foods for Senior Oral Health:
- **Calcium-rich:** Dairy, leafy greens
- **Protein:** Lean meats, eggs, beans
- **Soft fruits:** Bananas, melons, berries
- **Cooked vegetables:** Easier to chew
- **Whole grains:** Soft-cooked oatmeal, rice

### Foods to Avoid or Modify:
- Hard candies (choking hazard, tooth damage)
- Sticky foods (denture displacement)
- Very hot foods (reduced sensation)
- Tough meats (difficult to chew)

## Denture Care and Maintenance

### Daily Routine:
1. Remove and rinse after meals
2. Brush with denture cleanser
3. Soak overnight in solution
4. Clean storage container
5. Inspect for damage regularly

### When to See Your Dentist:
- Dentures feel loose
- Sore spots develop
- Difficulty chewing
- Changes in bite
- Cracked or damaged denture

## Implants vs. Dentures

### Dental Implants:
**Pros:**
- Most natural feel
- Prevent bone loss
- No need to remove
- Easier eating

**Cons:**
- More expensive
- Requires surgery
- Needs healthy jawbone
- Longer treatment time

### Dentures:
**Pros:**
- Less expensive
- Non-surgical option
- Quicker solution
- Can be adjusted

**Cons:**
- May feel less natural
- Require regular maintenance
- May slip or click
- Need replacement over time

## Preventing Oral Cancer

### Risk Factors:
- Tobacco use (smoking or chewing)
- Heavy alcohol consumption
- Age over 50
- HPV infection
- Sun exposure (lip cancer)

### Warning Signs:
- Persistent sore in mouth
- White or red patches
- Lump or thickening
- Difficulty swallowing
- Numbness in mouth
- Ear pain

**Get regular oral cancer screenings at dental check-ups!**

## Maintaining Independence

### Adaptive Devices:
- Electric toothbrushes with large handles
- Floss holders with long handles
- Denture removal aids
- Magnifying mirrors
- Timer apps for brushing

### Caregiver Assistance:
If you're caring for someone:
- Establish a gentle routine
- Use soft-bristled brushes
- Position person comfortably
- Be patient and encouraging
- Watch for signs of pain or problems

## Financial Considerations

### Insurance Options:
- Medicare (limited dental coverage)
- Medicare Advantage (may include dental)
- Medicaid (varies by state)
- Private dental insurance
- Discount dental plans

### Cost-Saving Tips:
- Preventive care (less expensive than treatment)
- Dental schools (discounted services)
- Community health centers
- Payment plans
- HSA/FSA accounts

## When to See a Dentist

### Regular Check-ups:
- Every 6 months minimum
- More frequent if you have gum disease
- Annual oral cancer screening
- Before starting cancer treatment

### Emergency Situations:
- Severe tooth pain
- Broken dentures
- Bleeding that won't stop
- Swelling or abscess
- Loose permanent teeth

## Quality of Life Benefits

Good oral health in seniors supports:
- **Nutrition:** Able to eat varied, healthy diet
- **Social engagement:** Confidence to smile and talk
- **Overall health:** Reduces infection risk
- **Mental health:** Maintains self-esteem
- **Independence:** Ability to maintain self-care

## Working with Your Dental Team

### Communicate Openly:
- Share complete medical history
- Discuss all medications
- Express concerns or fears
- Ask about costs upfront
- Request written instructions

### Advocate for Yourself:
- Don't dismiss tooth pain as "just age"
- Request accommodations if needed
- Ask questions about treatment options
- Get second opinions for major work
- Report side effects from treatments

Remember: It's never too late to improve your oral health! With proper care, you can keep your natural teeth for life or maintain comfortable, functional dentures.`,
    readTime: 12,
    difficulty: 'intermediate',
    tags: ["seniors", "elderly care", "dentures", "aging", "dry mouth"],
    featured: false,
  },
];

export function EducationLibrary() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(null);

  const filteredArticles = EDUCATION_ARTICLES.filter((article) => {
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    const matchesSearch =
      searchTerm === "" ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredArticles.filter((article) => article.featured);
  const regularArticles = filteredArticles.filter((article) => !article.featured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          Patient Education Library
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Browse our comprehensive collection of dental health articles and guides
          to learn about treatments, prevention, and maintaining your oral health.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search articles, treatments, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {EDUCATION_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;

          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex items-center gap-2",
                isSelected && "shadow-md"
              )}
            >
              <Icon className="h-4 w-4" />
              {category.name}
            </Button>
          );
        })}
      </div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && selectedCategory === "all" && !searchTerm && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <h3 className="text-xl font-semibold">Featured Articles</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onSelect={setSelectedArticle}
                featured
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Articles */}
      <div className="space-y-4">
        {featuredArticles.length > 0 && selectedCategory === "all" && !searchTerm && (
          <h3 className="text-xl font-semibold">All Articles</h3>
        )}

        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No articles found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or browse different categories
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onSelect={setSelectedArticle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Article Detail Dialog */}
      <Dialog
        open={!!selectedArticle}
        onOpenChange={() => setSelectedArticle(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedArticle.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selectedArticle.category}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedArticle.readTime} min read
                  </Badge>
                  <Badge variant="outline">{selectedArticle.difficulty}</Badge>
                </div>
                <p className="text-gray-600 italic">{selectedArticle.description}</p>
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedArticle.content.replace(/\n/g, '<br/>').replace(/###/g, '<h3>').replace(/##/g, '<h2>').replace(/^#\s/gm, '<h1>') }} />
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ArticleCardProps {
  article: EducationArticle;
  onSelect: (article: EducationArticle) => void;
  featured?: boolean;
}

function ArticleCard({ article, onSelect, featured }: ArticleCardProps) {
  const categoryInfo = EDUCATION_CATEGORIES.find(
    (cat) => cat.id === article.category
  );
  const Icon = categoryInfo?.icon || BookOpen;

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-lg",
        featured && "border-2 border-blue-200 bg-blue-50/30"
      )}
      onClick={() => onSelect(article)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "p-2 rounded-lg",
              featured ? "bg-blue-100" : "bg-gray-100"
            )}
          >
            <Icon className={cn("h-5 w-5", featured ? "text-blue-600" : "text-gray-600")} />
          </div>
          {featured && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
          {article.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {article.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{article.readTime} min read</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {article.difficulty}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full group-hover:bg-blue-50 group-hover:text-blue-600"
        >
          Read Article
          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
