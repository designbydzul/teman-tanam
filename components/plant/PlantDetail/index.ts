/**
 * PlantDetail Module Exports
 * Re-exports all components and utilities for the PlantDetail feature.
 */

// Sub-components (existing)
export { default as CareActionCard } from './CareActionCard';
export { default as DeleteConfirmModal } from './DeleteConfirmModal';
export { default as HistoryEntry } from './HistoryEntry';
export { default as PlantHeader } from './PlantHeader';

// New extracted components
export { default as ActionDrawer } from './ActionDrawer';
export { default as CareActionsTab } from './CareActionsTab';
export { default as HistoryTab } from './HistoryTab';
export { default as PlantLifecycleSection } from './PlantLifecycleSection';

// Types
export * from './types';

// Utilities
export * from './utils';

