'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PlantSpecies {
  emoji: string;
  name: string;
  scientific: string;
  imageUrl?: string | null;
}

interface PlantData {
  photoPreview?: string | null;
  customName?: string;
  species?: PlantSpecies | null;
  location?: string;
  notes?: string;
}

interface AddPlantSuccessProps {
  plantData: PlantData;
  onViewDetails: () => void;
  onAddNew: () => void;
  onBackHome: () => void;
}

const AddPlantSuccess: React.FC<AddPlantSuccessProps> = ({ plantData, onViewDetails, onAddNew, onBackHome }) => {
  return (
    <motion.div
      className="ios-fixed-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Plant Photo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            width: '160px',
            height: '160px',
            margin: '0 auto 24px',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#F1F8E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid #7CB342',
          }}
        >
          {plantData.photoPreview ? (
            <img
              src={plantData.photoPreview}
              alt={plantData.customName || 'Tanaman'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : plantData.species?.imageUrl ? (
            <img
              src={plantData.species.imageUrl}
              alt={plantData.species.name || 'Tanaman'}
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div style={{ fontSize: '4rem' }}>{plantData.species?.emoji || '🌱'}</div>
          )}
        </motion.div>

        {/* Success Message */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '20px',
            fontWeight: 600,
            color: '#2C2C2C',
            margin: '0 0 16px 0',
          }}
        >
          Yeay Berhasil Disimpan
        </motion.h2>

        {/* Plant Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginBottom: '32px' }}
        >
          <h3
            className="font-accent"
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: '0 0 8px 0',
            }}
          >
            {plantData.customName || 'Tanaman Baru'}
          </h3>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#757575',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {plantData.species?.name || 'Tanaman'} · {plantData.species?.scientific || ''} · Di {plantData.location || 'Lokasi'}
            {plantData.notes && ` · ${plantData.notes}`}
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* View Details Button */}
          <button
            onClick={onViewDetails}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              color: '#7CB342',
              backgroundColor: '#FFFFFF',
              border: '2px solid #7CB342',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#F1F8E9';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#FFFFFF';
            }}
          >
            Lihat Details
          </button>

          {/* Add New Button */}
          <button
            onClick={onAddNew}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: '#7CB342',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#689F38';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#7CB342';
            }}
          >
            Tambah Baru
          </button>
        </motion.div>

        {/* Back to Home Link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={onBackHome}
          style={{
            marginTop: '16px',
            background: 'transparent',
            border: 'none',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: '#757575',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Kembali Ke Beranda
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default AddPlantSuccess;
