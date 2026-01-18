'use client';

import React from 'react';
import BulkActionModal, { type BulkActionSubmitData, type Plant } from './BulkActionModal';

interface BulkFertilizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulkActionSubmitData) => void;
  selectedPlants?: Plant[];
  alreadyFertilizedToday?: Plant[];
  isProcessing?: boolean;
}

const BulkFertilizeModal: React.FC<BulkFertilizeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedPlants = [],
  alreadyFertilizedToday = [],
  isProcessing = false,
}) => {
  return (
    <BulkActionModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      selectedPlants={selectedPlants}
      alreadyDoneToday={alreadyFertilizedToday}
      alreadyDoneTodayLabel="sudah dipupuk"
      isProcessing={isProcessing}
      title="Catat Pemupukan"
      notesPlaceholder="Jenis pupuk, dosis, catatan lainnya..."
    />
  );
};

export default BulkFertilizeModal;
