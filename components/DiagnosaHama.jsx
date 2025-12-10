import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CaretDown,
  PaperclipHorizontal,
  PaperPlaneTilt,
  X,
} from '@phosphor-icons/react';

// Mock AI responses
const mockResponses = [
  'Daun keriting setelah pemupukan NPK bisa jadi karena over-fertilisasi atau kekurangan air. Coba cek pH tanah dan atur frekuensi penyiraman.',
  'Bercak kuning pada daun timun bisa jadi karena kekurangan nutrisi atau infeksi jamur. Periksa drainase dan gunakan fungisida organik jika perlu.',
  'Bercak kuning pada daun timun bisa jadi karena masalah pH tanah atau serangan bakteri. Lakukan tes tanah dan gunakan bakterisida sesuai dosis.',
];

// Suggested questions
const suggestedQuestions = [
  'Kenapa daun nya menguning?',
  'Kenapa daun nya keriting atau menggulung?',
  'Batang nya lunak atau membusuk?',
];

const DiagnosaHama = ({ plant, plants = [], onBack }) => {
  // State
  const [selectedPlant, setSelectedPlant] = useState(plant || null);
  const [showPlantDropdown, setShowPlantDropdown] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Refs
  const chatAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize plant data
  const plantData = selectedPlant
    ? {
        id: selectedPlant.id,
        name: selectedPlant.customName || selectedPlant.name,
        species: selectedPlant.species?.scientific || 'Cucumis sativus',
        location: selectedPlant.location || 'Teras',
        plantedDate: selectedPlant.plantedDate || new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        coverPhotoUrl: selectedPlant.photoUrl || selectedPlant.image || 'https://images.unsplash.com/photo-1568584711271-6c0b7a1e0d64?w=300',
      }
    : null;

  // Calculate days since planted
  const daysSincePlanted = plantData
    ? Math.floor((new Date() - new Date(plantData.plantedDate)) / (1000 * 60 * 60 * 24))
    : 0;

  // Auto-scroll to bottom when new messages
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle suggestion click
  const handleSuggestionClick = (question) => {
    setInputText(question);
    inputRef.current?.focus();
  };

  // Handle image attachment
  const handleAttachImage = (e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImages((prev) => [...prev, { file, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attached image
  const handleRemoveImage = (index) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Send message
  const handleSendMessage = async () => {
    if (!inputText.trim() && attachedImages.length === 0) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

    // Create user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      images: attachedImages.map((img) => img.preview),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setAttachedImages([]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasInput = inputText.trim().length > 0 || attachedImages.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px',
          backgroundColor: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Back Button */}
          <button
            onClick={onBack}
            aria-label="Kembali"
            style={{
              position: 'absolute',
              left: 0,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={24} weight="bold" color="#2D5016" />
          </button>

          {/* Title */}
          <h1
            style={{
              fontFamily: 'var(--font-caveat), Caveat, cursive',
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: 0,
            }}
          >
            Diagnosa Hama
          </h1>
        </div>
      </div>

      {/* Chat Content Area */}
      <div
        ref={chatAreaRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Plant Selector Card */}
        {plantData && (
          <div style={{ marginBottom: '24px' }}>
            {/* Dropdown Header */}
            <button
              onClick={() => setShowPlantDropdown(!showPlantDropdown)}
              aria-expanded={showPlantDropdown}
              aria-label="Pilih tanaman"
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0E0',
                borderRadius: showPlantDropdown ? '16px 16px 0 0' : '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: '#2C2C2C',
                }}
              >
                {plantData.name}
              </span>
              <motion.div
                animate={{ rotate: showPlantDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <CaretDown size={20} weight="bold" color="#666666" />
              </motion.div>
            </button>

            {/* Dropdown Content */}
            <AnimatePresence>
              {showPlantDropdown && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderTop: 'none',
                    borderRadius: '0 0 16px 16px',
                  }}
                >
                  <div
                    style={{
                      padding: '16px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={plantData.coverPhotoUrl}
                      alt={plantData.name}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                      }}
                    />
                    <div>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                          color: '#666666',
                          margin: '0 0 4px 0',
                        }}
                      >
                        {plantData.species}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                          color: '#666666',
                          margin: 0,
                        }}
                      >
                        {plantData.location} • {daysSincePlanted} hari sejak ditanam
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Suggested Questions */}
        <AnimatePresence>
          {showSuggestions && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              {suggestedQuestions.map((question, index) => (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSuggestionClick(question)}
                  style={{
                    padding: '16px 20px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '24px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#2C2C2C',
                  }}
                >
                  {question}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '16px',
                  backgroundColor: message.role === 'user' ? '#FFF9E6' : 'transparent',
                  borderRadius: '16px',
                  border: message.role === 'user' ? '1px solid #F5F0D0' : 'none',
                }}
              >
                {/* Attached Images */}
                {message.images && message.images.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {message.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Attachment ${idx + 1}`}
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Message Content */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: '#2C2C2C',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    display: 'flex',
                    gap: '4px',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: [0, -6, 0],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#CCCCCC',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Spacer for input area */}
        <div style={{ height: '120px', flexShrink: 0 }} />
      </div>

      {/* Input Area */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F5F5F5',
          padding: '16px 24px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Attached Images Preview */}
        <AnimatePresence>
          {attachedImages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '12px',
                overflowX: 'auto',
              }}
            >
              {attachedImages.map((img, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={img.preview}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }}
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    aria-label="Hapus foto"
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#FF4444',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} weight="bold" color="#FFFFFF" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Row */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
          }}
        >
          {/* Input Container */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: '24px',
            }}
          >
            {/* Attachment Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAttachImage}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Lampirkan foto"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PaperclipHorizontal size={24} weight="regular" color="#666666" />
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              placeholder="Tulis pertanyaan kamu disini"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              aria-label="Tulis pertanyaan"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#2C2C2C',
                backgroundColor: 'transparent',
              }}
            />
          </div>

          {/* Send Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!hasInput}
            aria-label="Kirim pesan"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: hasInput ? '#7CB342' : '#FFFFFF',
              border: hasInput ? 'none' : '1px solid #E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: hasInput ? 'pointer' : 'not-allowed',
              flexShrink: 0,
            }}
          >
            <PaperPlaneTilt
              size={24}
              weight="fill"
              color={hasInput ? '#FFFFFF' : '#CCCCCC'}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosaHama;
