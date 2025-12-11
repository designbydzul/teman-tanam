import React from 'react';
import { motion } from 'framer-motion';

const AddPlantSuccess = ({ plantData, onViewDetails, onAddNew, onBackHome }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
              alt={plantData.customName}
              loading="lazy"
              decoding="async"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{ fontSize: '4rem' }}>{plantData.species.emoji}</div>
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
            {plantData.customName}
          </h3>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#666666',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {plantData.species.name} · {plantData.species.scientific} · Di {plantData.location}
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
              e.target.style.backgroundColor = '#F1F8E9';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#FFFFFF';
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
              e.target.style.backgroundColor = '#689F38';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#7CB342';
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
            color: '#666666',
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
