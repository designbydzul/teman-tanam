import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CaretDown,
  ClockCounterClockwise,
  PaperclipHorizontal,
  PaperPlaneTilt,
  X,
} from '@phosphor-icons/react';

// Helper function to calculate days since planted
const calculateDaysSincePlanted = (plantedDate) => {
  if (!plantedDate) return null;
  const planted = new Date(plantedDate);
  const today = new Date();
  const diffTime = Math.abs(today - planted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Suggested questions
const suggestedQuestions = [
  'Kenapa daun nya menguning?',
  'Kenapa daun nya keriting atau menggulung?',
  'Batang nya lunak atau membusuk?',
];

const TanyaTanam = ({ plant, plants = [], onBack }) => {
  // State
  const [selectedPlant, setSelectedPlant] = useState(plant || null);
  const [showPlantDropdown, setShowPlantDropdown] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Refs
  const chatAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Handle iOS keyboard and lock body scroll
  useEffect(() => {
    // Lock body scroll when TanyaTanam opens
    const originalStyle = document.body.style.cssText;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '0';

    // Track keyboard using visualViewport
    const handleViewportChange = () => {
      if (window.visualViewport && containerRef.current) {
        const viewportHeight = window.visualViewport.height;
        const viewportOffsetTop = window.visualViewport.offsetTop;

        // Set container height to match visual viewport
        containerRef.current.style.height = `${viewportHeight}px`;
        containerRef.current.style.top = `${viewportOffsetTop}px`;

        // Calculate if keyboard is open
        const windowHeight = window.innerHeight;
        const newKeyboardHeight = windowHeight - viewportHeight - viewportOffsetTop;
        setKeyboardHeight(newKeyboardHeight > 50 ? newKeyboardHeight : 0);

        // Auto-scroll chat to bottom when keyboard opens
        if (newKeyboardHeight > 50 && chatAreaRef.current) {
          setTimeout(() => {
            if (chatAreaRef.current) {
              chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
            }
          }, 50);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      // Initial call
      handleViewportChange();
    }

    return () => {
      document.body.style.cssText = originalStyle;
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  // Normalize plant data
  const plantData = selectedPlant
    ? {
        id: selectedPlant.id,
        name: selectedPlant.customName || selectedPlant.name,
        species: selectedPlant.species?.scientific || 'Cucumis sativus',
        speciesEmoji: selectedPlant.species?.emoji || '🌱',
        location: selectedPlant.location || 'Teras',
        plantedDate: selectedPlant.plantedDate || new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        coverPhotoUrl: selectedPlant.photoUrl || (selectedPlant.image !== null && selectedPlant.image) || null,
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

  // Call API to get AI response
  const callTanyaTanamAPI = async (userMessageContent, currentMessages) => {
    try {
      const response = await fetch('/api/tanya-tanam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessageContent,
          plantContext: plantData ? {
            name: plantData.name,
            species: plantData.species,
            age: calculateDaysSincePlanted(plantData.plantedDate),
            location: plantData.location,
            lastWatered: selectedPlant?.lastWatered || null,
            lastFertilized: selectedPlant?.lastFertilized || null
          } : null,
          chatHistory: currentMessages
            .filter(m => m.role)
            .map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      if (data.success) {
        return data.message;
      } else {
        return 'Waduh, ada masalah koneksi nih. Coba lagi ya!';
      }
    } catch (error) {
      console.error('Tanya Tanam API Error:', error);
      return 'Waduh, ada masalah koneksi nih. Coba lagi ya!';
    }
  };

  // Handle suggestion click - auto send the message
  const handleSuggestionClick = async (question) => {
    // Hide suggestions
    setShowSuggestions(false);

    // Create user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      images: [],
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Call real API
    const aiResponse = await callTanyaTanamAPI(question, updatedMessages);

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
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

    const messageContent = inputText.trim();

    // Create user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      images: attachedImages.map((img) => img.preview),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setAttachedImages([]);
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    // Call real API
    const aiResponse = await callTanyaTanamAPI(messageContent, updatedMessages);

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
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
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        width: '100%',
        backgroundColor: '#FFFFFF',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header - Matches PlantDetail header layout exactly */}
      <div style={{ position: 'relative', zIndex: 10, backgroundColor: '#FFFFFF', flexShrink: 0 }}>
        {/* Navigation Row - Same as PlantDetail */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
          }}
        >
          {/* Back Button */}
          <button
            onClick={onBack}
            aria-label="Kembali"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} weight="bold" color="#2D5016" />
          </button>

          {/* Title - Centered */}
          <h1
            style={{
              fontFamily: 'var(--font-caveat), Caveat, cursive',
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#2D5016',
              margin: 0,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            Tanya Tanam
          </h1>

          {/* History Button */}
          <button
            onClick={() => setShowHistoryModal(true)}
            aria-label="Riwayat chat"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ClockCounterClockwise size={16} weight="regular" color="#666666" />
          </button>
        </div>
      </div>

      {/* Chat Content Area */}
      <div
        ref={chatAreaRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: keyboardHeight > 0 ? '8px 16px' : '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
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
                    {plantData.coverPhotoUrl ? (
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
                    ) : (
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '12px',
                          backgroundColor: '#F1F8E9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                        }}
                      >
                        {plantData.speciesEmoji}
                      </div>
                    )}
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
                          objectFit: 'contain',
                          backgroundColor: '#F5F5F5',
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

      </div>

      {/* Input Area */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F5F5F5',
          padding: keyboardHeight > 0 ? '8px 16px' : '16px 24px',
          paddingBottom: keyboardHeight > 0 ? '8px' : 'max(16px, env(safe-area-inset-bottom))',
          transition: 'padding 0.2s ease',
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
                gap: '12px',
                marginBottom: '12px',
                overflowX: 'auto',
                overflowY: 'visible',
                padding: '8px 4px',
                margin: '-8px -4px 12px -4px',
              }}
            >
              {attachedImages.map((img, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    width: '72px',
                    height: '72px',
                  }}
                >
                  <img
                    src={img.preview}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '1px solid #E0E0E0',
                    }}
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    aria-label="Hapus foto"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#FF4444',
                      border: '2px solid #FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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
              alignItems: 'flex-end',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              border: inputFocused || inputText ? '2px solid #7CB342' : '2px solid transparent',
              borderRadius: '24px',
              transition: 'border-color 200ms',
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
                flexShrink: 0,
                marginBottom: '2px',
              }}
            >
              <PaperclipHorizontal size={24} weight="regular" color="#666666" />
            </button>

            {/* Text Input - Expandable Textarea */}
            <textarea
              ref={inputRef}
              placeholder="Tulis pertanyaan kamu disini"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              aria-label="Tulis pertanyaan"
              rows={1}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                lineHeight: '1.4',
                color: '#2C2C2C',
                backgroundColor: 'transparent',
                resize: 'none',
                overflow: 'hidden',
                minHeight: '21px',
                maxHeight: '120px',
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

      {/* History Coming Soon Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 4000,
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4001,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '32px 24px',
                  width: 'calc(100% - 48px)',
                  maxWidth: '320px',
                  textAlign: 'center',
                  pointerEvents: 'auto',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#F1F8E9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <ClockCounterClockwise size={32} weight="bold" color="#7CB342" />
                </div>

                {/* Title */}
                <h2
                  style={{
                    fontFamily: 'var(--font-caveat), Caveat, cursive',
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: '#2D5016',
                    margin: '0 0 12px 0',
                  }}
                >
                  Segera Hadir!
                </h2>

                {/* Description */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#666666',
                    margin: '0 0 24px 0',
                    lineHeight: 1.5,
                  }}
                >
                  Fitur riwayat chat akan tersedia di update selanjutnya. Tunggu ya!
                </p>

                {/* Button */}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    fontSize: '1rem',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: '#7CB342',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Oke, Mengerti
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TanyaTanam;
