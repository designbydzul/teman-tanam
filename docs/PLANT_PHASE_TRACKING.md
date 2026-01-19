# Plant Phase Tracking Feature

## Overview

The Plant Phase Tracking feature allows users to track their plant's growth journey through defined phases (e.g., Semai → Vegetatif → Berbunga → Berbuah → Panen for vegetables).

**Status:** Foundation complete, UI component disabled pending further testing.

---

## Database Schema

### Table: `plant_phase_definitions`

Reference table containing phase definitions for each plant category.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `category` | text | Plant category (Sayuran, Rempah, Bunga, Tanaman Hias) |
| `phase_key` | text | Unique key for the phase (e.g., 'semai', 'vegetatif') |
| `phase_name` | text | Display name (e.g., 'Semai', 'Vegetatif') |
| `phase_order` | int | Order of phase (1, 2, 3...) |
| `icon` | text | Emoji icon for the phase |
| `color` | text | Hex color code |
| `description` | text | Phase description |
| `care_tips` | text[] | Array of care tips for this phase |
| `created_at` | timestamp | Creation timestamp |

### Table: `plants` (existing, extended)

Added columns for phase tracking:

| Column | Type | Description |
|--------|------|-------------|
| `current_phase` | text | Current phase key (e.g., 'semai') |
| `phase_started_at` | timestamp | When current phase started |
| `expected_harvest_date` | date | Estimated harvest date |

---

## Phase Definitions by Category

### Sayuran (Vegetables) - 5 phases
1. **Semai** 🌱 - Tahap awal pertumbuhan dari biji
2. **Vegetatif** 🌿 - Pertumbuhan daun dan batang
3. **Berbunga** 🌸 - Tanaman mulai berbunga
4. **Berbuah** 🍅 - Buah terbentuk dan berkembang
5. **Panen** 🧺 - Siap dipetik

### Rempah (Herbs) - 4 phases
1. **Semai** 🌱 - Tahap awal dari biji/stek
2. **Vegetatif** 🌿 - Daun dan batang tumbuh subur
3. **Dewasa** 🌳 - Tanaman mapan, produktif
4. **Berbunga** 🌸 - Mulai berbunga

### Bunga (Flowers) - 4 phases
1. **Semai** 🌱 - Tahap awal dari biji/bibit
2. **Vegetatif** 🌿 - Membentuk daun dan struktur
3. **Kuncup** 🌷 - Kuncup bunga terbentuk
4. **Mekar** 🌺 - Bunga mekar sempurna

### Tanaman Hias (Ornamental) - 3 phases
1. **Adaptasi** 🌱 - Menyesuaikan dengan lingkungan
2. **Pertumbuhan** 🌿 - Tumbuh aktif dengan daun baru
3. **Mapan** 🪴 - Stabil dan mudah dirawat

---

## Files Structure

```
├── types/index.ts
│   ├── PlantPhaseDefinitionRaw    # DB type (snake_case)
│   ├── PlantPhaseDefinition       # UI type (camelCase)
│   ├── UsePlantPhasesReturn       # Hook return type
│   └── UpdatePlantData            # Extended with phase fields
│
├── hooks/usePlantPhases.ts        # Hook for fetching phases
│
├── components/plant/
│   └── PlantLifeJourney.tsx       # UI component (disabled)
│
├── lib/constants.ts
│   └── CACHE_KEYS.PLANT_PHASES    # Cache key for offline
│
└── supabase/
    ├── migrations/20260119_seed_plant_phases.sql
    └── seed-phases.sql            # Seed data for phases
```

---

## TypeScript Types

### PlantPhaseDefinition (UI)
```typescript
interface PlantPhaseDefinition {
  id: string;
  category: PlantSpeciesCategory;
  phaseKey: string;
  phaseName: string;
  phaseOrder: number;
  icon: string;       // Emoji
  color: string;      // Hex color
  description: string;
  careTips: string[];
}
```

### Plant (extended)
```typescript
interface Plant {
  // ... existing fields
  currentPhase: string | null;
  phaseStartedAt: Date | null;
  expectedHarvestDate: Date | null;
}
```

### UpdatePlantData (extended)
```typescript
interface UpdatePlantData {
  // ... existing fields
  currentPhase?: string | null;
  phaseStartedAt?: Date | null;
  expectedHarvestDate?: Date | null;
}
```

---

## Hook: usePlantPhases

```typescript
const {
  phases,        // PlantPhaseDefinition[]
  loading,       // boolean
  error,         // string | null
  getPhaseByKey, // (key: string) => PlantPhaseDefinition | undefined
  getNextPhase   // (currentKey: string) => PlantPhaseDefinition | undefined
} = usePlantPhases(category);
```

Features:
- Fetches phases from Supabase filtered by category
- Caches phases for offline use
- Transforms snake_case to camelCase

---

## Component: PlantLifeJourney (Disabled)

Collapsible card showing:
- Current phase name and description
- Care tips for current phase
- "Naik ke fase X" button to advance
- Confirmation modal before advancing
- Celebration animation on success

**Location:** Under "Perawatan" tab in PlantDetail

**Props:**
```typescript
interface PlantLifeJourneyProps {
  plant: PlantUI;
  onPhaseAdvance: (
    newPhaseKey: string,
    newPhaseStartedAt: Date
  ) => Promise<{ success: boolean; error?: string }>;
}
```

---

## Setup Instructions

### 1. Create the table in Supabase

Run in SQL Editor:
```sql
CREATE TABLE plant_phase_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  phase_key TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  phase_order INTEGER NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  care_tips TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, phase_key)
);

-- Enable RLS
ALTER TABLE plant_phase_definitions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to plant_phase_definitions"
  ON plant_phase_definitions FOR SELECT USING (true);
```

### 2. Add columns to plants table

```sql
ALTER TABLE plants
ADD COLUMN IF NOT EXISTS current_phase TEXT,
ADD COLUMN IF NOT EXISTS phase_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expected_harvest_date DATE;
```

### 3. Seed phase definitions

Run the SQL in `supabase/migrations/20260119_seed_plant_phases.sql`

### 4. Enable the UI component

In `components/plant/PlantDetail.tsx`:
1. Uncomment the `PlantLifeJourney` import
2. Uncomment the `handlePhaseAdvance` function
3. Uncomment the component usage in the Perawatan tab

---

## Known Issues

1. **UI not updating after phase advance** - Fixed by using `sourcePlant` as base for state update instead of `prev` callback
2. **Confetti not centered** - Fixed by using flexbox centering instead of absolute positioning with transform

---

## Future Enhancements

- [ ] Auto-suggest phase based on days since started
- [ ] Phase timeline visualization
- [ ] Expected harvest date calculation
- [ ] Push notifications for phase milestones
- [ ] Photo gallery per phase
