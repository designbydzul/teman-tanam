'use client';

import React from 'react';
import BulkActionModal, { type BulkActionSubmitData, type Plant } from './BulkActionModal';

interface BulkPruningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulkActionSubmitData) => void;
  selectedPlants?: Plant[];
  alreadyPrunedToday?: Plant[];
  isProcessing?: boolean;
}

const BulkPruningModal: React.FC<BulkPruningModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedPlants = [],
  alreadyPrunedToday = [],
  isProcessing = false,
}) => {
  return (
    <BulkActionModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      selectedPlants={selectedPlants}
      alreadyDoneToday={alreadyPrunedToday}
      alreadyDoneTodayLabel="sudah dipangkas"
      isProcessing={isProcessing}
      title="Catat Pemangkasan"
      notesPlaceholder="Catatan pemangkasan (opsional)..."
    />
  );
};

export default BulkPruningModal;
