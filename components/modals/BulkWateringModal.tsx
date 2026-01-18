'use client';

import React from 'react';
import BulkActionModal, { type BulkActionSubmitData, type Plant } from './BulkActionModal';

interface BulkWateringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulkActionSubmitData) => void;
  selectedPlants?: Plant[];
  alreadyWateredToday?: Plant[];
  isProcessing?: boolean;
}

const BulkWateringModal: React.FC<BulkWateringModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedPlants = [],
  alreadyWateredToday = [],
  isProcessing = false,
}) => {
  return (
    <BulkActionModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      selectedPlants={selectedPlants}
      alreadyDoneToday={alreadyWateredToday}
      alreadyDoneTodayLabel="sudah disiram"
      isProcessing={isProcessing}
      title="Catat Penyiraman"
      notesPlaceholder="Catatan penyiraman (opsional)..."
    />
  );
};

export default BulkWateringModal;
