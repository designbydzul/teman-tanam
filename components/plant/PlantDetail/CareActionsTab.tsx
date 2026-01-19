'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Drop,
  Leaf,
  Scissors,
  DotsThree,
  Basket,
} from '@phosphor-icons/react';
import { colors } from '@/styles/theme';
import { getActionSubtitle } from './utils';
import type { CareActionsTabProps } from './types';

/**
 * CareActionsTab Component
 * Displays the grid of care action cards (watering, fertilizing, pruning, harvest, other).
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
  onHarvestTap,
  isHarvestReady = false,
  isHarvestable = false,
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

  const harvestReadyCardStyle: React.CSSProperties = {
    ...cardStyle,
    border: `2px solid ${colors.yellowSun}`,
    backgroundColor: `${colors.yellowSun}10`,
    boxShadow: `0 0 12px ${colors.yellowSun}30`,
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

  const harvestIconContainerStyle: React.CSSProperties = {
    ...iconContainerStyle,
    backgroundColor: isHarvestReady ? `${colors.yellowSun}30` : '#FAFAFA',
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
      {/* Harvest Ready Banner */}
      {isHarvestReady && onHarvestTap && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onHarvestTap}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            backgroundColor: `${colors.yellowSun}15`,
            border: `1px solid ${colors.yellowSun}40`,
            borderRadius: '12px',
            marginBottom: '16px',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '24px' }}>✨</span>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: colors.gray800,
                margin: 0,
              }}
            >
              Siap Panen!
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: colors.gray600,
                margin: '2px 0 0 0',
              }}
            >
              Ketuk untuk mencatat hasil panen
            </p>
          </div>
          <Basket size={24} weight="fill" color={colors.yellowSun} />
        </motion.div>
      )}

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

      {/* Action Cards Grid */}
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

        {/* Panen Card - Only show for harvestable plants */}
        {isHarvestable && onHarvestTap ? (
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={onHarvestTap}
            style={isHarvestReady ? harvestReadyCardStyle : cardStyle}
          >
            <div style={harvestIconContainerStyle}>
              <Basket
                size={20}
                weight={isHarvestReady ? 'fill' : 'regular'}
                color={isHarvestReady ? colors.yellowSun : '#757575'}
              />
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <h3 style={{
                ...titleStyle,
                color: isHarvestReady ? colors.greenForest : '#2C2C2C',
              }}>
                Panen
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: isHarvestReady ? colors.yellowSun : '#757575',
                  fontWeight: isHarvestReady ? 500 : 400,
                  margin: 0,
                }}
              >
                {isHarvestReady ? 'Siap dipanen!' : 'Catat panen'}
              </p>
            </div>
          </motion.div>
        ) : (
          /* Aksi Lainya Card */
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
        )}

        {/* Aksi Lainya Card - Show as 5th card if harvestable */}
        {isHarvestable && onHarvestTap && (
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
        )}
      </div>
    </div>
  );
};

export default CareActionsTab;
