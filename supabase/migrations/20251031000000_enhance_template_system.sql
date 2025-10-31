-- Enhance template system with custom configuration and template-specific features
-- Part 1: Custom Template Configuration
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS custom_features JSONB,
ADD COLUMN IF NOT EXISTS custom_terminology JSONB;

COMMENT ON COLUMN businesses.custom_features IS 'Custom feature configuration for custom template type';
COMMENT ON COLUMN businesses.custom_terminology IS 'Custom terminology configuration for custom template type';

-- Update template type constraint to include custom
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS valid_template_type;
ALTER TABLE businesses
ADD CONSTRAINT valid_template_type
CHECK (template_type IN ('dentist', 'hairdresser', 'personal_trainer', 'beauty_salon', 'medical', 'generic', 'custom'));

-- Part 2: Template Change Audit Trail
CREATE TABLE IF NOT EXISTS template_change_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  from_template TEXT NOT NULL,
  to_template TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  migration_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_template_history_business ON template_change_history(business_id);
CREATE INDEX IF NOT EXISTS idx_template_history_date ON template_change_history(changed_at DESC);

COMMENT ON TABLE template_change_history IS 'Audit trail for template changes';

-- Part 3: Haircut/Beauty Salon Specific Features
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT, -- 'haircut', 'color', 'styling', 'nails', 'makeup', etc.
  tags TEXT[], -- searchable tags
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_business ON portfolio_items(business_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio_items(business_id, featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_items(business_id, category);

COMMENT ON TABLE portfolio_items IS 'Portfolio/gallery items for haircut and beauty salon templates';

-- Walk-in availability tracking
CREATE TABLE IF NOT EXISTS walk_in_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_walk_ins INTEGER DEFAULT 3,
  current_walk_ins INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_walkin_business_date ON walk_in_availability(business_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_walkin_unique ON walk_in_availability(business_id, date, start_time);

COMMENT ON TABLE walk_in_availability IS 'Walk-in availability slots for salon/barbershop templates';

-- Style library for quick reference
CREATE TABLE IF NOT EXISTS style_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  style_name TEXT NOT NULL,
  description TEXT,
  reference_image_url TEXT,
  estimated_duration INTEGER, -- in minutes
  estimated_price DECIMAL(10, 2),
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
  tags TEXT[],
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_style_business ON style_library(business_id);
CREATE INDEX IF NOT EXISTS idx_style_popular ON style_library(business_id, popular) WHERE popular = true;

COMMENT ON TABLE style_library IS 'Style/service reference library for salon templates';

-- Product sales tracking
CREATE TABLE IF NOT EXISTS product_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  sold_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_product_sales_business ON product_sales(business_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_date ON product_sales(business_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_product_sales_patient ON product_sales(patient_id);

COMMENT ON TABLE product_sales IS 'Retail product sales for salon/beauty templates';

-- Part 4: Dental Specific Features
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  claim_number TEXT,
  insurance_provider TEXT NOT NULL,
  policy_number TEXT,
  claim_amount DECIMAL(10, 2) NOT NULL,
  approved_amount DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'denied', 'paid')),
  submission_date DATE,
  response_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_business ON insurance_claims(business_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient ON insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(business_id, status);

COMMENT ON TABLE insurance_claims IS 'Insurance claim tracking for dental templates';

-- Dental chart data
CREATE TABLE IF NOT EXISTS dental_chart_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL CHECK (tooth_number BETWEEN 1 AND 32),
  condition TEXT, -- 'healthy', 'cavity', 'filling', 'crown', 'missing', 'root_canal', etc.
  notes TEXT,
  date_recorded DATE DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dental_chart_patient ON dental_chart_data(patient_id, tooth_number);
CREATE INDEX IF NOT EXISTS idx_dental_chart_business ON dental_chart_data(business_id);

COMMENT ON TABLE dental_chart_data IS 'Dental chart/tooth condition tracking';

-- Procedure complexity ratings
ALTER TABLE services
ADD COLUMN IF NOT EXISTS complexity_rating TEXT CHECK (complexity_rating IN ('simple', 'moderate', 'complex', 'advanced')),
ADD COLUMN IF NOT EXISTS requires_specialist BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS average_success_rate DECIMAL(5, 2);

COMMENT ON COLUMN services.complexity_rating IS 'Procedure complexity for dental templates';

-- Part 5: Personal Trainer Specific Features
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  goal TEXT, -- 'weight_loss', 'muscle_gain', 'endurance', 'flexibility', etc.
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workout_plans_business ON workout_plans(business_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_patient ON workout_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_status ON workout_plans(business_id, status);

COMMENT ON TABLE workout_plans IS 'Workout plans for personal trainer templates';

-- Workout exercises
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_minutes INTEGER,
  rest_seconds INTEGER,
  weight_kg DECIMAL(6, 2),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7),
  notes TEXT,
  video_url TEXT,
  display_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_plan ON workout_exercises(workout_plan_id);

COMMENT ON TABLE workout_exercises IS 'Individual exercises within workout plans';

-- Client measurements/progress tracking
CREATE TABLE IF NOT EXISTS client_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(5, 2),
  body_fat_percentage DECIMAL(5, 2),
  muscle_mass_kg DECIMAL(5, 2),
  bmi DECIMAL(4, 2),
  chest_cm DECIMAL(5, 2),
  waist_cm DECIMAL(5, 2),
  hips_cm DECIMAL(5, 2),
  bicep_cm DECIMAL(5, 2),
  thigh_cm DECIMAL(5, 2),
  notes TEXT,
  photo_url TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_measurements_patient ON client_measurements(patient_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_business ON client_measurements(business_id);

COMMENT ON TABLE client_measurements IS 'Body measurements and progress tracking for personal trainer templates';

-- Nutrition plans
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  daily_calories_target INTEGER,
  protein_grams_target INTEGER,
  carbs_grams_target INTEGER,
  fat_grams_target INTEGER,
  meal_plan_details JSONB, -- structured meal plan data
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_plans_business ON nutrition_plans(business_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_patient ON nutrition_plans(patient_id);

COMMENT ON TABLE nutrition_plans IS 'Nutrition plans for personal trainer templates';

-- Part 6: Medical Template Specific Features
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  result_value TEXT,
  result_unit TEXT,
  reference_range TEXT,
  status TEXT CHECK (status IN ('normal', 'abnormal', 'critical', 'pending')),
  lab_name TEXT,
  ordered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON lab_results(patient_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_results_business ON lab_results(business_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_status ON lab_results(patient_id, status);

COMMENT ON TABLE lab_results IS 'Laboratory test results for medical templates';

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  referred_to_name TEXT NOT NULL,
  referred_to_specialty TEXT,
  referred_to_contact TEXT,
  reason TEXT NOT NULL,
  urgency TEXT CHECK (urgency IN ('routine', 'urgent', 'emergency')),
  referral_date DATE DEFAULT CURRENT_DATE,
  appointment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  notes TEXT,
  referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_patient ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_business ON referrals(business_id, status);

COMMENT ON TABLE referrals IS 'Patient referrals to specialists for medical templates';

-- Medical questionnaires
CREATE TABLE IF NOT EXISTS medical_questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  questionnaire_name TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL, -- array of question objects
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questionnaires_business ON medical_questionnaires(business_id, active);

COMMENT ON TABLE medical_questionnaires IS 'Custom medical questionnaire templates';

-- Questionnaire responses
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES medical_questionnaires(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  responses JSONB NOT NULL, -- answers to questions
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_patient ON questionnaire_responses(patient_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_questionnaire ON questionnaire_responses(questionnaire_id);

COMMENT ON TABLE questionnaire_responses IS 'Patient responses to medical questionnaires';

-- Vital signs tracking
CREATE TABLE IF NOT EXISTS vital_signs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  measurement_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  temperature_celsius DECIMAL(4, 2),
  respiratory_rate INTEGER,
  oxygen_saturation INTEGER,
  weight_kg DECIMAL(5, 2),
  height_cm DECIMAL(5, 2),
  bmi DECIMAL(4, 2),
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vital_signs_patient ON vital_signs(patient_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_vital_signs_business ON vital_signs(business_id);

COMMENT ON TABLE vital_signs IS 'Vital signs tracking for medical templates';

-- Part 7: Row Level Security Policies
-- Portfolio items
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view portfolio items for their business"
  ON portfolio_items FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
      UNION
      SELECT business_id FROM employees WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert portfolio items for their business"
  ON portfolio_items FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update portfolio items for their business"
  ON portfolio_items FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete portfolio items for their business"
  ON portfolio_items FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    )
  );

-- Apply similar RLS patterns to all new tables
-- Walk-in availability
ALTER TABLE walk_in_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to walk-in availability" ON walk_in_availability FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Style library
ALTER TABLE style_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to style library" ON style_library FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Product sales
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to product sales" ON product_sales FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Insurance claims
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to insurance claims" ON insurance_claims FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Dental chart
ALTER TABLE dental_chart_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to dental chart" ON dental_chart_data FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Workout plans
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to workout plans" ON workout_plans FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Workout exercises
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to workout exercises" ON workout_exercises FOR ALL USING (
  workout_plan_id IN (
    SELECT id FROM workout_plans WHERE business_id IN (
      SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
      UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
    )
  )
);

-- Client measurements
ALTER TABLE client_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to measurements" ON client_measurements FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Nutrition plans
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to nutrition plans" ON nutrition_plans FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Lab results
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to lab results" ON lab_results FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to referrals" ON referrals FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Medical questionnaires
ALTER TABLE medical_questionnaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to questionnaires" ON medical_questionnaires FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Questionnaire responses
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to questionnaire responses" ON questionnaire_responses FOR ALL USING (
  questionnaire_id IN (
    SELECT id FROM medical_questionnaires WHERE business_id IN (
      SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
      UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
    )
  )
);

-- Vital signs
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business access to vital signs" ON vital_signs FOR ALL USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
    UNION SELECT business_id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Template change history
ALTER TABLE template_change_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business owners can view template history" ON template_change_history FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_profile_id = auth.uid())
);
