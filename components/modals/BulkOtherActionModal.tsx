'use client';

import React, { useState } from 'react';
import BulkActionModal, { type BulkActionSubmitData, type Plant } from './BulkActionModal';

interface OtherActionSubmitData {
  actionName: string;
  notes: string;
  photoFile: File | null;
}

interface BulkOtherActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OtherActionSubmitData) => void;
  selectedPlants?: Plant[];
  isProcessing?: boolean;
}

const BulkOtherActionModal: React.FC<BulkOtherActionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedPlants = [],
  isProcessing = false,
}) => {
  const [actionName, setActionName] = useState('');

  const isValid = actionName.trim().length > 0;

  const handleSubmit = (data: BulkActionSubmitData) => {
    if (!isValid) return;
    onSubmit({
      actionName: actionName.trim(),
      notes: data.notes,
      photoFile: data.photoFile,
    });
  };

  const handleCloseCleanup = () => {
    setActionName('');
  };

  return (
    <BulkActionModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      selectedPlants={selectedPlants}
      isProcessing={isProcessing}
      title="Catat Aktivitas Lain"
      notesPlaceholder="Catatan tambahan (opsional)..."
      isValid={isValid}
      onCloseCleanup={handleCloseCleanup}
    >
      {/* Action Name Input */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: '#2C2C2C', display: 'block', marginBottom: '8px' }}>Nama Aktivitas *</label>
        <input
          type="text"
          value={actionName}
          onChange={(e) => setActionName(e.target.value)}
          placeholder="Contoh: Repotting, Panen, dll."
          style={{ width: '100%', padding: '16px', fontSize: '1rem', fontFamily: "'Inter', sans-serif", color: '#2C2C2C', backgroundColor: '#FAFAFA', border: '2px solid transparent', borderRadius: '12px', outline: 'none', boxSizing: 'border-box' }}
          onFocus={(e) => { e.target.style.border = '2px solid #7CB342'; }}
          onBlur={(e) => { e.target.style.border = '2px solid transparent'; }}
        />
      </div>
    </BulkActionModal>
  );
};

export default BulkOtherActionModal;
