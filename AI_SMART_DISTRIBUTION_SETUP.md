# AI-Powered Smart Appointment Distribution System

## 🤖 Overview

This system uses **Google Gemini AI** to intelligently distribute appointments throughout the dentist's schedule by analyzing booking patterns and promoting under-utilized time slots.

### Key Features

1. **Real AI Decision Making** - Uses Gemini AI (not just rules) to make smart recommendations
2. **Slot Usage Tracking** - Automatically tracks which time slots are booked frequently vs rarely
3. **Smart Promotion** - Actively promotes under-utilized slots to balance the schedule
4. **Learning System** - Tracks recommendation success rates to improve over time
5. **Fallback Support** - Works even if AI is unavailable (uses intelligent rule-based system)

---

## 🚀 Setup Instructions

### Step 1: Database Migration

Run the database migration to add slot tracking tables:

```bash
# The migration file is already created at:
# supabase/migrations/20251105120000_add_slot_usage_tracking.sql

# Apply it using Supabase CLI:
supabase db push

# Or apply manually in Supabase Dashboard > SQL Editor
```

This creates two new tables:
- `slot_usage_statistics` - Tracks booking frequency for each time slot
- `ai_slot_recommendations` - Logs AI recommendations and their outcomes

### Step 2: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Step 3: Configure Environment

Add your Gemini API key to `.env`:

```bash
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 4: Build Initial Statistics

After users have booked some appointments, build the statistics:

```javascript
// In your admin panel or console:
import { calculateSlotUsageStatistics } from '@/lib/slotUsageTracking';

// For a specific dentist:
await calculateSlotUsageStatistics('dentist-uuid');

// For all dentists in the business:
await calculateSlotUsageStatistics();
```

---

## 📊 How It Works

### 1. Data Collection

The system automatically tracks:
- **Every appointment booked** (time, day, dentist)
- **Booking frequency** for each time slot
- **Recent trends** (last 30 days)
- **AI recommendation outcomes**

### 2. AI Analysis

When a patient books an appointment, Gemini AI:

1. **Analyzes** current slot usage patterns
2. **Identifies** under-utilized time slots (< 50% booking rate)
3. **Considers** patient preferences and history
4. **Generates** personalized recommendations
5. **Explains** why each slot is recommended (in natural language)

### 3. Smart Recommendations

The AI prioritizes:

- ✅ **Under-utilized slots** (need more bookings)
- ✅ **Schedule balance** (distribute appointments evenly)
- ✅ **Patient preferences** (consider usual booking patterns)
- ✅ **Practical factors** (time of day, day of week)

### 4. User Experience

Patients see:
- **Top recommended slots** with AI badges
- **Natural language explanations** ("This 9 AM slot is rarely booked and would help balance your dentist's schedule")
- **Visual indicators** for promoted/under-utilized slots
- **All available slots** (not just AI recommendations)

---

## 🎯 Usage in Code

### Get AI-Powered Recommendations

The existing `getRecommendedSlots()` function now uses Gemini AI automatically:

```typescript
import { getRecommendedSlots } from '@/lib/smartScheduling';

const recommendations = await getRecommendedSlots(
  dentistId,
  patientId,
  date,
  availableSlots,
  appointmentTypeId
);

// Results now include AI reasoning:
recommendations.forEach(slot => {
  console.log(`${slot.time}: Score ${slot.score}`);
  console.log(`Reasons: ${slot.reasons.join(', ')}`);
  console.log(`AI says: ${slot.aiReasoning}`);
  console.log(`Under-utilized: ${slot.isUnderutilized}`);
  console.log(`Should promote: ${slot.shouldPromote}`);
});
```

### Track Slot Usage

Automatically update statistics after bookings:

```typescript
import { updateSlotStatisticsAfterBooking } from '@/lib/smartScheduling';

// After creating an appointment:
await updateSlotStatisticsAfterBooking(dentistId, appointmentDate);
```

### Get Under-Utilized Slots

```typescript
import { getUnderutilizedSlots } from '@/lib/slotUsageTracking';

const underutilized = await getUnderutilizedSlots(dentistId, 50);
// Returns slots with < 50% booking rate
```

### Test AI Connection

```typescript
import { testGeminiConnection } from '@/lib/geminiAI';

const result = await testGeminiConnection();
console.log(result.success ? '✅ AI Connected' : '❌ AI Failed');
console.log(result.message);
```

### Get AI Success Metrics

```typescript
import { getAIRecommendationSuccessRate } from '@/lib/geminiAI';

const metrics = await getAIRecommendationSuccessRate(dentistId);
console.log(`AI recommended ${metrics.accepted_recommendations} out of ${metrics.total_recommendations} times`);
console.log(`Success rate: ${metrics.success_rate.toFixed(1)}%`);
```

---

## 📈 Analytics & Monitoring

### View Booking Distribution

```typescript
import { getBookingDistribution } from '@/lib/slotUsageTracking';

const distribution = await getBookingDistribution(dentistId);
// Returns: [{time_slot, day_of_week, booking_rate, label}]
```

### Check Schedule Balance

```typescript
import { getSlotUtilizationSummary } from '@/lib/slotUsageTracking';

const summary = await getSlotUtilizationSummary(dentistId);
console.log(`Total slots: ${summary.total_slots}`);
console.log(`Under-utilized: ${summary.underutilized_slots}`);
console.log(`Over-utilized: ${summary.overutilized_slots}`);
console.log(`Balance score: ${summary.balance_score}/100`);
```

---

## 🎨 UI Integration

### Display AI Recommendations

```tsx
import { getRecommendedSlots } from '@/lib/smartScheduling';

const RecommendationUI = ({ slot }) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span>{slot.time}</span>
        {slot.shouldPromote && (
          <Badge variant="primary">🤖 AI Recommended</Badge>
        )}
        {slot.isUnderutilized && (
          <Badge variant="secondary">📊 Helps Balance Schedule</Badge>
        )}
      </div>

      {slot.aiReasoning && (
        <p className="text-sm text-muted-foreground mt-2">
          {slot.aiReasoning}
        </p>
      )}

      <div className="text-xs text-muted-foreground">
        {slot.reasons.join(' • ')}
      </div>
    </div>
  );
};
```

---

## 🔄 Maintenance

### Recalculate Statistics

Run periodically (e.g., nightly cron job):

```typescript
import { calculateSlotUsageStatistics } from '@/lib/slotUsageTracking';

// Recalculate for all dentists
await calculateSlotUsageStatistics();
```

### Monitor AI Performance

```sql
-- View AI recommendation success rate
SELECT
  ai_model_used,
  COUNT(*) as total_recommendations,
  SUM(CASE WHEN was_ai_recommended THEN 1 ELSE 0 END) as accepted,
  AVG(CASE WHEN was_ai_recommended THEN 100 ELSE 0 END) as acceptance_rate,
  SUM(CASE WHEN appointment_completed THEN 1 ELSE 0 END) as completed
FROM ai_slot_recommendations
GROUP BY ai_model_used;

-- View most under-utilized slots
SELECT
  day_of_week,
  time_slot,
  recent_booking_rate,
  total_bookings
FROM slot_usage_statistics
WHERE recent_booking_rate < 50
ORDER BY recent_booking_rate ASC
LIMIT 10;
```

---

## 🛠️ Troubleshooting

### Issue: AI Recommendations Not Working

**Check:**
1. Is `VITE_GEMINI_API_KEY` set in `.env`?
2. Run `testGeminiConnection()` to verify API access
3. Check browser console for error messages

**Fallback:** System will use rule-based recommendations if AI fails

### Issue: No Statistics Available

**Solution:**
1. Ensure appointments have been booked
2. Run `calculateSlotUsageStatistics()` to build initial data
3. Check that database migration was applied

### Issue: All Slots Showing Same Score

**Solution:**
1. Wait for more appointment data to accumulate
2. Statistics update automatically after each booking
3. Manually trigger recalculation if needed

---

## 📊 Database Schema

### slot_usage_statistics

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| business_id | UUID | Business reference |
| dentist_id | UUID | Dentist reference |
| day_of_week | INTEGER | 0-6 (Sunday-Saturday) |
| hour_of_day | INTEGER | 0-23 |
| time_slot | VARCHAR(5) | e.g., "09:00" |
| total_bookings | INTEGER | All-time booking count |
| booking_rate | DECIMAL | % booked (all-time) |
| recent_bookings | INTEGER | Last 30 days |
| recent_booking_rate | DECIMAL | % booked (recent) |
| times_recommended | INTEGER | How often AI recommended |
| recommendation_success_rate | DECIMAL | % accepted when recommended |

### ai_slot_recommendations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| patient_id | UUID | Patient reference |
| dentist_id | UUID | Dentist reference |
| recommended_slots | JSONB | AI recommendations array |
| ai_model_used | VARCHAR | "gemini-pro" |
| ai_reasoning | TEXT | AI explanation |
| selected_slot | VARCHAR | User's choice |
| was_ai_recommended | BOOLEAN | Picked AI slot? |
| appointment_completed | BOOLEAN | Outcome tracking |

---

## 🎓 Best Practices

1. **Recalculate regularly** - Run statistics calculation nightly
2. **Monitor balance scores** - Aim for 70+ balance score
3. **Track AI acceptance** - Monitor how often users pick AI slots
4. **Review under-utilized slots** - Manually check if patterns make sense
5. **A/B test** - Compare outcomes with/without AI recommendations

---

## 🚀 Next Steps

1. ✅ Database migration applied
2. ✅ Gemini API key configured
3. ⏳ Wait for appointment data to accumulate
4. ⏳ Build initial statistics
5. ⏳ Monitor AI recommendations
6. ⏳ Analyze schedule balance improvements

---

## 📞 Support

- **Documentation:** See `/SMART_SCHEDULING_SETUP.md` for base system
- **AI Issues:** Check Gemini API key and quota
- **Database Issues:** Verify migration was applied
- **Performance:** Statistics calculation runs async, don't await

---

## 🎉 Success Metrics

Track these metrics to measure success:

- **Balance Score:** Target 70+ (was ~50 before AI)
- **Under-utilized Reduction:** Reduce slots with <40% booking rate
- **AI Acceptance Rate:** Aim for 60%+ of users picking AI slots
- **Schedule Variance:** Lower variance = better distribution
- **Patient Satisfaction:** Reduced wait times, better availability

---

**Built with ❤️ using Google Gemini AI**
