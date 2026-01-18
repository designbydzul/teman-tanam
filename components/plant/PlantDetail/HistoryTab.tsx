'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Drop,
  Leaf,
  Scissors,
  Basket,
  FirstAidKit,
  Plant,
  DotsThree,
} from '@phosphor-icons/react';
import type { HistoryTabProps, TimelineEntry } from './types';

/**
 * HistoryTab Component
 * Displays the timeline of past care actions grouped by date.
 */

// Helper function to get action icon based on type
const getActionIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'water':
      return <Drop size={20} weight="regular" color="#757575" />;
    case 'fertilize':
      return <Leaf size={20} weight="regular" color="#757575" />;
    case 'prune':
      return <Scissors size={20} weight="regular" color="#757575" />;
    case 'harvest':
      return <Basket size={20} weight="regular" color="#757575" />;
    case 'diagnose':
      return <FirstAidKit size={20} weight="regular" color="#757575" />;
    case 'add':
      return <Plant size={20} weight="regular" color="#757575" />;
    default:
      return <DotsThree size={20} weight="regular" color="#757575" />;
  }
};

const HistoryTab: React.FC<HistoryTabProps> = ({
  timeline,
  loading,
  onEntryClick,
}) => {
  return (
    <div style={{ padding: '16px 16px 24px 16px', minHeight: 'calc(100vh - 400px)' }}>
      {/* Loading State */}
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 450px)',
        }}>
          <p style={{ fontFamily: "'Inter', sans-serif", color: '#757575' }}>
            Memuat riwayat...
          </p>
        </div>
      ) : timeline.length === 0 ? (
        /* Empty State */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 450px)',
          textAlign: 'center',
        }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#F5F5F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Drop size={40} weight="regular" color="#CCCCCC" />
          </div>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1rem',
              color: '#757575',
              margin: 0,
            }}
          >
            Belum ada riwayat perawatan
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#999999',
              margin: '8px 0 0 0',
            }}
          >
            Catat penyiraman atau pemupukan pertamamu!
          </p>
        </div>
      ) : (
        /* Timeline Entries */
        timeline.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date Header */}
            <h3
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1rem',
                fontWeight: 700,
                color: '#2C2C2C',
                marginTop: groupIndex > 0 ? '32px' : '16px',
                marginBottom: '12px',
              }}
            >
              {group.date}
            </h3>

            {/* Timeline Entries for this date */}
            {group.entries.map((entry: TimelineEntry, entryIndex: number) => (
              <motion.div
                whileTap={{ scale: 0.98 }}
                key={entry.id || entryIndex}
                onClick={() => onEntryClick(entry, group.date)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E4E4E7',
                  padding: '16px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: (entry.notes || entry.photoUrl) ? 'flex-start' : 'center',
                  gap: '12px',
                }}
              >
                {/* Left side: Icon */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getActionIcon(entry.type)}
                </div>

                {/* Middle: Title, Notes, Photo */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#2C2C2C',
                      margin: 0,
                    }}
                  >
                    {entry.label}
                  </h4>
                  {entry.notes && (
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: '#666666',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {entry.notes}
                    </p>
                  )}
                  {entry.photoUrl && (
                    <img
                      src={entry.photoUrl}
                      alt="Foto aksi"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        display: 'block',
                        marginTop: '8px',
                      }}
                    />
                  )}
                </div>

                {/* Right side: Time */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#757575',
                    margin: 0,
                    flexShrink: 0,
                  }}
                >
                  {entry.time}
                </p>
              </motion.div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default HistoryTab;
