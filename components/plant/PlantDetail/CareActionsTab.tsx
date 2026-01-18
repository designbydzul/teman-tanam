'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Drop,
  Leaf,
  Scissors,
  DotsThree,
} from '@phosphor-icons/react';
import { getActionSubtitle } from './utils';
import type { CareActionsTabProps } from './types';

/**
 * CareActionsTab Component
 * Displays the 2x2 grid of care action cards (watering, fertilizing, pruning, other).
 */
const CareActionsTab: React.FC<CareActionsTabProps> = ({
  daysSinceWatered,
  daysSinceFertilized,
  wateringFrequencyDays,
  fertilizingFrequencyDays,
  onWateringTap,
  onFertilizingTap,
  onPruningTap,
  onOtherActionTap,
}) => {
  const wateringStatus = getActionSubtitle(daysSinceWatered, wateringFrequencyDays, 'water');
  const fertilizingStatus = getActionSubtitle(daysSinceFertilized, fertilizingFrequencyDays, 'fertilize');

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E4E7',
    padding: '16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  };

  const iconContainerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#FAFAFA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    color: '#2C2C2C',
    margin: '0 0 4px 0',
  };

  return (
    <div style={{ padding: '16px 16px 120px 16px' }}>
      {/* Section Header */}
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          fontWeight: 400,
          color: '#757575',
          margin: '0 0 12px 0',
        }}
      >
        Yang dapat anda lakukan
      </p>

      {/* 2x2 Action Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}>
        {/* Penyiraman Card */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={onWateringTap}
          style={cardStyle}
        >
          <div style={iconContainerStyle}>
            <Drop size={20} weight="regular" color="#757575" />
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <h3 style={titleStyle}>
              Penyiraman
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: wateringStatus.color,
                margin: 0,
              }}
            >
              {wateringStatus.text}
            </p>
          </div>
        </motion.div>

        {/* Pemupukan Card */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={onFertilizingTap}
          style={cardStyle}
        >
          <div style={iconContainerStyle}>
            <Leaf size={20} weight="regular" color="#757575" />
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <h3 style={titleStyle}>
              Pemupukan
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: fertilizingStatus.color,
                margin: 0,
              }}
            >
              {fertilizingStatus.text}
            </p>
          </div>
        </motion.div>

        {/* Pemangkasan Card */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={onPruningTap}
          style={cardStyle}
        >
          <div style={iconContainerStyle}>
            <Scissors size={20} weight="regular" color="#757575" />
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <h3 style={titleStyle}>
              Pemangkasan
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#757575',
                margin: 0,
              }}
            >
              Pangkas daun
            </p>
          </div>
        </motion.div>

        {/* Aksi Lainya Card */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={onOtherActionTap}
          style={cardStyle}
        >
          <div style={iconContainerStyle}>
            <DotsThree size={20} weight="regular" color="#757575" />
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <h3 style={titleStyle}>
              Aksi Lainya
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#757575',
                margin: 0,
              }}
            >
              Catat aksi
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CareActionsTab;
