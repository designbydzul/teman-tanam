/**
 * Types for Home component and its sub-components
 */

import { IconProps } from '@phosphor-icons/react';
import { ComponentType } from 'react';

export interface PlantSpecies {
  id: string;
  name: string;
  emoji?: string;
  imageUrl?: string;
}

export interface Plant {
  id: string;
  name: string;
  location: string;
  status: string;
  statusColor?: string;
  image?: string | null;
  species?: PlantSpecies | null;
  lastWatered?: string | null;
  lastFertilized?: string | null;
  lastPruned?: string | null;
}

export interface StatItem {
  label: string;
  value: number;
  Icon: ComponentType<IconProps>;
}

export type NetworkStatus = 'online' | 'offline' | 'reconnecting';

export type BulkActionType = 'siram' | 'pupuk' | 'pangkas' | 'lainnya' | null;

export interface StatusOption {
  value: string;
  label: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'Semua', label: 'Semua Status' },
  { value: 'Perlu disiram', label: 'Perlu disiram' },
  { value: 'Perlu dipupuk', label: 'Perlu dipupuk' },
  { value: 'Terawat', label: 'Terawat' },
  { value: 'Siap dipanen', label: 'Siap dipanen' },
];
