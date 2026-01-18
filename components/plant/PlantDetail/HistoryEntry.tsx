'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Drop, Leaf, Scissors, Star, Image as ImageIcon } from '@phosphor-icons/react';
import { colors, radius, typography } from '@/styles/theme';
import type { ActionHistoryEntry } from '@/types';

interface HistoryEntryProps {
  entry: ActionHistoryEntry;
  onClick: () => void;
}

/**
 * HistoryEntry Component
 *
 * Displays a single entry in the care history timeline.
 *
 * Wrapped in React.memo to prevent re-renders when:
 * - New entries are added to the list (existing entries don't need to re-render)
 * - Parent component state changes but this entry's data hasn't changed
 */
const HistoryEntry = memo(function HistoryEntry({ entry, onClick }: HistoryEntryProps) {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'siram':
        return <Drop size={20} weight="fill" color="#2196F3" />;
      case 'pupuk':
        return <Leaf size={20} weight="fill" color="#4CAF50" />;
      case 'pangkas':
        return <Scissors size={20} weight="fill" color="#FF9800" />;
      default:
        return <Star size={20} weight="fill" color="#9C27B0" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'siram':
        return 'Disiram';
      case 'pupuk':
        return 'Dipupuk';
      case 'pangkas':
        return 'Dipangkas';
      default:
        // Capitalize first letter for custom actions
        return actionType.charAt(0).toUpperCase() + actionType.slice(1);
    }
  };

  const getActionBgColor = (actionType: string) => {
    switch (actionType) {
      case 'siram':
        return 'rgba(33, 150, 243, 0.1)';
      case 'pupuk':
        return 'rgba(76, 175, 80, 0.1)';
      case 'pangkas':
        return 'rgba(255, 152, 0, 0.1)';
      default:
        return 'rgba(156, 39, 176, 0.1)';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "d MMM yyyy, HH:mm", { locale: idLocale });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#FFFFFF',
        border: `1px solid ${colors.gray100}`,
        borderRadius: radius.lg,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: getActionBgColor(entry.action_type),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {getActionIcon(entry.action_type)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Action label */}
        <p
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray800,
            margin: '0 0 4px 0',
          }}
        >
          {getActionLabel(entry.action_type)}
        </p>

        {/* Date */}
        <p
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.sm,
            color: colors.gray600,
            margin: 0,
          }}
        >
          {formatDate(entry.action_date)}
        </p>

        {/* Notes preview */}
        {entry.notes && (
          <p
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize.sm,
              color: colors.gray600,
              margin: '8px 0 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.notes}
          </p>
        )}
      </div>

      {/* Photo indicator */}
      {entry.photo_url && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: radius.md,
            backgroundColor: colors.gray100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ImageIcon size={16} weight="fill" color={colors.gray600} />
        </div>
      )}
    </motion.button>
  );
});

export default HistoryEntry;
