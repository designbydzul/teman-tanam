/**
 * PlantDetail Component Types
 * Shared type definitions for PlantDetail and its sub-components
 */

import type { PlantUI, CareStatusUI, ActionHistoryEntry } from '@/types';

// Timeline entry for history display
export interface TimelineEntry {
  type: string;
  actionType: string;
  label: string;
  notes: string | null;
  id: string;
  time: string | null;
  createdAt: string;
  photoUrl?: string | null;
  dateFormatted?: string;
}

// Grouped timeline entries by date
export interface TimelineGroup {
  date: string;
  rawDate: string;
  entries: TimelineEntry[];
}

// Options for action submission
export interface ActionOptions {
  notes?: string;
  photo?: File | null;
}

// Result of action operations
export interface ActionResult {
  success: boolean;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPlant = any;

// Props for the main PlantDetail component
export interface PlantDetailProps {
  plant: PlantUI;
  onBack: () => void;
  onEdit?: (plant: AnyPlant) => void;
  onDelete?: (plant: AnyPlant) => void;
  onRecordAction?: (
    plantId: string,
    actionType: 'siram' | 'pupuk' | 'pangkas' | 'lainnya',
    notes?: string | null,
    photo?: File | null
  ) => Promise<{ success: boolean; action?: unknown; error?: string; offline?: boolean }>;
  onSavePlant?: (updatedPlant: AnyPlant) => Promise<ActionResult>;
}

// Normalized plant data for display
export interface PlantDisplayData {
  id: string | number;
  customName: string;
  species: {
    name: string | null;
    scientific: string | null;
    emoji: string;
  };
  location: string | null | undefined;
  startedDate: Date | string;
  photoUrl: string | null;
  lastWatered: Date | string | null;
  lastFertilized: Date | string | null;
  notes: string;
  difficultyLevel: string | null;
  sunRequirement: string | null;
  harvestSigns: string | null;
}

// Action status styling
export interface ActionStatusStyle {
  text: string;
  color: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

// Props for action drawer components
export interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  notes: string;
  setNotes: (notes: string) => void;
  photo: File | null;
  photoPreview: string | null;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  photoInputRef: React.RefObject<HTMLInputElement | null>;
  notesPlaceholder?: string;
  submitLabel?: string;
  showStatus?: boolean;
  statusDoneToday?: boolean;
  statusLabel?: string;
  onUndo?: () => Promise<void>;
}

// Props for history detail drawer
export interface HistoryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimelineEntry | null;
  onDelete: () => void;
  onPhotoClick: (url: string) => void;
  isDeleting: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
}

// Props for CareActionsTab
export interface CareActionsTabProps {
  daysSinceWatered: number | null | undefined;
  daysSinceFertilized: number | null | undefined;
  wateringFrequencyDays: number | null;
  fertilizingFrequencyDays: number | null;
  onWateringTap: () => void;
  onFertilizingTap: () => void;
  onPruningTap: () => void;
  onOtherActionTap: () => void;
  /** Called when harvest card is tapped */
  onHarvestTap?: () => void;
  /** Whether plant is ready for harvest */
  isHarvestReady?: boolean;
  /** Whether this is a harvestable plant type */
  isHarvestable?: boolean;
}

// Props for HistoryTab
export interface HistoryTabProps {
  timeline: TimelineGroup[];
  loading: boolean;
  onEntryClick: (entry: TimelineEntry, dateFormatted: string) => void;
}

// Re-export types from main types file for convenience
export type { PlantUI, CareStatusUI, ActionHistoryEntry };
