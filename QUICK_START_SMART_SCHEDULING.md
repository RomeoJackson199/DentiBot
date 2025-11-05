# ⚡ Smart Scheduling - Quick Start

## 🎯 **ONE MIGRATION TO RUN**

```bash
# That's it! Just run this:
npx supabase db push
```

**OR** manually run this file in Supabase SQL Editor:
📄 `supabase/migrations/20251105064008_add_smart_scheduling_system.sql`

---

## 🎨 **THREE COMPONENTS TO USE**

### 1. Smart Booking (Replaces old booking)
```tsx
import { SmartAppointmentBooking } from '@/components/SmartAppointmentBooking';

<SmartAppointmentBooking
  user={user}
  onComplete={() => router.push('/success')}
  onCancel={() => router.push('/')}
/>
```
✨ Shows recommended slots with scores

---

### 2. Capacity Dashboard (For admin page)
```tsx
import { CapacityDashboard } from '@/components/CapacityDashboard';

<CapacityDashboard />
```
📊 Shows who's near capacity, workload balance

---

### 3. Reschedule Assistant (In appointment manager)
```tsx
import { RescheduleAssistant } from '@/components/RescheduleAssistant';

<RescheduleAssistant
  appointmentId={appointmentId}
  open={open}
  onOpenChange={setOpen}
  onRescheduled={refreshList}
/>
```
🤖 Suggests 3 best alternative times

---

## ✅ **WHAT YOU GET**

| Feature | Description |
|---------|-------------|
| 🎯 **Smart Recommendations** | Top slots highlighted based on patient preferences |
| 📊 **Capacity Management** | Prevent overbooking, balance workload |
| 🔄 **Auto-Rescheduling** | Find alternatives in 1 click |
| ⏱️ **Buffer Times** | Automatic spacing between appointments |
| 📈 **Learning System** | Gets smarter over time |

---

## 🗄️ **WHAT WAS CREATED**

After migration, you'll have:
- ✅ 5 new database tables
- ✅ 2 smart functions
- ✅ 5 default appointment types per business
- ✅ Automatic preference tracking

---

## 🧪 **TEST IT**

1. **Book appointment** → See recommended badges ✨
2. **Open admin dashboard** → See capacity % 📊
3. **Try reschedule** → Get 3 suggestions 🤖

---

## 📦 **FILES**

```
New Files:
├── supabase/migrations/
│   └── 20251105064008_add_smart_scheduling_system.sql  ← Run this
├── src/lib/
│   ├── smartScheduling.ts           ← Recommendation engine
│   └── autoRescheduling.ts          ← Rescheduling logic
├── src/components/
│   ├── SmartAppointmentBooking.tsx  ← Use in booking page
│   ├── CapacityDashboard.tsx        ← Use in admin
│   └── RescheduleAssistant.tsx      ← Use in appointments
└── src/lib/appointmentAvailability.ts ← Enhanced with buffers
```

---

## 🚨 **IMPORTANT**

Before running migration, make sure these tables exist:
- ✅ `businesses`
- ✅ `dentists` (must have `business_id` column)
- ✅ `profiles`
- ✅ `appointments`

---

## 📖 **FULL GUIDE**

For detailed setup instructions: **SMART_SCHEDULING_SETUP.md**

---

**That's it! Run the migration and start using the components.** 🎉
