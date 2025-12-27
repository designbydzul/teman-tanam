import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CaretDown,
  ClockCounterClockwise,
  Camera,
  PaperPlaneTilt,
  X,
} from '@phosphor-icons/react';
import {
  fetchPlantCareHistory,
  buildEnhancedPlantContext,
  formatContextForAI,
} from '@/lib/plantContextBuilder';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import OfflineModal from './OfflineModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Helper to get chat storage key for a plant
const getChatStorageKey = (plantId) => `tanyaTanam_chat_${plantId}`;

const TanyaTanam = ({ plant, plants = [], onBack }) => {
  // Auth - get current user
  const { user } = useAuth();

  // Online status
  const { isOnline } = useOnlineStatus();
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // State
  const [selectedPlant, setSelectedPlant] = useState(plant || null);
  const [showPlantDropdown, setShowPlantDropdown] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [careHistory, setCareHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Constants for image handling
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_IMAGE_DIMENSION = 1200; // Max width/height for compression

  // Load chat history from database when plant changes
  const loadChatFromDatabase = useCallback(async (plantId) => {
    if (!plantId || !user?.id) {
      setMessages([]);
      return;
    }

    setIsLoadingChat(true);
    try {
      const { data, error } = await supabase
        .from('tanya_tanam_chats')
        .select('*')
        .eq('plant_id', plantId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        // Fallback to localStorage
        const storageKey = getChatStorageKey(plantId);
        const savedChat = localStorage.getItem(storageKey);
        if (savedChat) {
          try {
            setMessages(JSON.parse(savedChat));
          } catch (e) {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      } else if (data && data.length > 0) {
        // Transform database format to component format
        const formattedMessages = data.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.message,
          images: msg.photo_url ? [msg.photo_url] : [],
          timestamp: new Date(msg.created_at),
        }));
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading chat:', err);
      setMessages([]);
    } finally {
      setIsLoadingChat(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadChatFromDatabase(selectedPlant?.id);
  }, [selectedPlant?.id, loadChatFromDatabase]);

  // Save message to database
  const saveMessageToDatabase = useCallback(async (plantId, role, message, photoUrl = null) => {
    if (!plantId || !user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('tanya_tanam_chats')
        .insert({
          plant_id: plantId,
          user_id: user.id,
          role: role,
          message: message,
          photo_url: photoUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Error saving message:', err);
      return null;
    }
  }, [user?.id]);

  // Also save to localStorage as backup
  useEffect(() => {
    if (selectedPlant?.id && messages.length > 0) {
      const storageKey = getChatStorageKey(selectedPlant.id);
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, selectedPlant?.id]);

  // Fetch care history when plant changes
  useEffect(() => {
    const loadCareHistory = async () => {
      if (!selectedPlant?.id) {
        setCareHistory([]);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const history = await fetchPlantCareHistory(selectedPlant.id);
        setCareHistory(history);
      } catch (err) {
        console.error('Error fetching care history:', err);
        setCareHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadCareHistory();
  }, [selectedPlant?.id]);

  // Refs
  const chatAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Lock body scroll when TanyaTanam is open
  useEffect(() => {
    const originalStyle = document.body.style.cssText;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.cssText = originalStyle;
    };
  }, []);

  // Detect keyboard and adjust input position to stick to visible viewport bottom
  useEffect(() => {
    let timeoutId;

    const handleViewportChange = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const viewport = window.visualViewport;
        // Calculate how much the viewport has shifted up
        const offsetY = window.innerHeight - viewport.height - viewport.offsetTop;

        // Clear previous timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Debounce to prevent bounce
        timeoutId = setTimeout(() => {
          setKeyboardHeight(offsetY > 0 ? offsetY : 0);
        }, 10);
      }
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);

      // Initial call
      handleViewportChange();

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      };
    }
  }, []);

  // Helper to format date for AI context
  const formatDateForAI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffTime = now - d;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'hari ini';
    if (diffDays === 1) return 'kemarin';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    return `${Math.floor(diffDays / 30)} bulan yang lalu`;
  };

  // Normalize plant data (includes all info needed for enhanced context)
  const plantData = selectedPlant
    ? {
      id: selectedPlant.id,
      name: selectedPlant.customName || selectedPlant.name,
      species: {
        name: selectedPlant.species?.name || null,
        scientific: selectedPlant.species?.scientific || null,
        category: selectedPlant.species?.category || null,
        wateringFrequencyDays: selectedPlant.species?.wateringFrequencyDays || 3,
        fertilizingFrequencyDays: selectedPlant.species?.fertilizingFrequencyDays || 14,
        // New fields from updated schema
        difficultyLevel: selectedPlant.species?.difficultyLevel || null,
        sunRequirement: selectedPlant.species?.sunRequirement || null,
        growingSeason: selectedPlant.species?.growingSeason || null,
        harvestSigns: selectedPlant.species?.harvestSigns || null,
        careSummary: selectedPlant.species?.careSummary || null,
      },
      speciesEmoji: selectedPlant.species?.emoji || '🌱',
      location: selectedPlant.location || null,
      startedDate: selectedPlant.startedDate || null,
      coverPhotoUrl: selectedPlant.photoUrl || (selectedPlant.image !== null && selectedPlant.image) || null,
      notes: selectedPlant.notes || null,
      lastWatered: selectedPlant.lastWatered || null,
      lastFertilized: selectedPlant.lastFertilized || null,
      // Custom care frequencies (override species defaults)
      customWateringDays: selectedPlant.customWateringDays || null,
      customFertilizingDays: selectedPlant.customFertilizingDays || null,
    }
    : null;

  // Calculate days since started caring (with validation)
  const daysSinceStarted = (() => {
    if (!plantData?.startedDate) return null;
    const startDate = new Date(plantData.startedDate);
    if (isNaN(startDate.getTime())) return null;
    const days = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : null;
  })();

  // Auto-scroll to bottom when new messages
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Call API to get AI response
  const callTanyaTanamAPI = async (userMessageContent, currentMessages, images = []) => {
    try {
      // Build enhanced context with care history
      let enhancedContextText = null;
      if (plantData) {
        const enhancedContext = buildEnhancedPlantContext(plantData, careHistory);
        enhancedContextText = formatContextForAI(enhancedContext);
      }

      const response = await fetch('/api/tanya-tanam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessageContent,
          images: images, // Send base64 images
          plantContextText: enhancedContextText, // Rich formatted context
          chatHistory: currentMessages
            .filter(m => m.role && m.content && m.content.trim().length > 0)
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

  // Compress image for mobile
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Create object URL to load image
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_IMAGE_DIMENSION;
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = (width / height) * MAX_IMAGE_DIMENSION;
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with quality reduction
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        // Revoke the object URL on error too
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Gagal memproses gambar'));
      };

      img.src = objectUrl;
    });
  };

  // Handle image attachment
  const handleAttachImage = async (e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    // Clear any previous error
    setImageError(null);

    for (const file of imageFiles) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setImageError('Foto terlalu besar, maks 5MB. Coba foto dengan resolusi lebih kecil.');
        // Auto-hide error after 4 seconds
        setTimeout(() => setImageError(null), 4000);
        continue;
      }

      try {
        // Compress large images (> 1MB)
        let preview;
        if (file.size > 1024 * 1024) {
          preview = await compressImage(file);
        } else {
          // Small images don't need compression
          preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        }

        setAttachedImages((prev) => [...prev, { file, preview }]);
      } catch (err) {
        console.error('Error processing image:', err);
        setImageError('Gagal memproses gambar. Coba lagi ya.');
        setTimeout(() => setImageError(null), 4000);
      }
    }

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

    // Check if offline
    if (!isOnline) {
      setShowOfflineModal(true);
      return;
    }

    const messageContent = inputText.trim();
    const imagesToSend = attachedImages.map((img) => img.preview);
    const photoUrl = imagesToSend.length > 0 ? imagesToSend[0] : null;

    // Create user message for UI
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      images: imagesToSend,
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

    // Save user message to database
    if (selectedPlant?.id) {
      const savedUserMsg = await saveMessageToDatabase(
        selectedPlant.id,
        'user',
        messageContent,
        photoUrl
      );
      // Update message ID if saved successfully
      if (savedUserMsg) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, id: savedUserMsg.id } : msg
          )
        );
      }
    }

    // Call real API with images
    const aiResponse = await callTanyaTanamAPI(messageContent, updatedMessages, imagesToSend);

    // Create AI message for UI
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    // Save AI response to database
    if (selectedPlant?.id) {
      const savedAiMsg = await saveMessageToDatabase(
        selectedPlant.id,
        'assistant',
        aiResponse,
        null
      );
      // Update message ID if saved successfully
      if (savedAiMsg) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessage.id ? { ...msg, id: savedAiMsg.id } : msg
          )
        );
      }
    }

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
    <>
      {/* Main Container */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          height: '100vh',
          height: '100dvh', // Dynamic viewport height - adjusts when keyboard appears
          backgroundColor: '#FFFFFF',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'calc(88px + env(safe-area-inset-top, 0px))', // Space for fixed header + safe area
          overflow: 'hidden', // Prevent any scroll on container itself
        }}
      >
        {/* Chat Content Area */}
        <div
          ref={chatAreaRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px 24px',
            paddingBottom: '120px', // Space for fixed input area
            display: 'flex',
            flexDirection: 'column',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
            touchAction: 'pan-y',
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
                <CaretDown size={20} weight="regular" color="#757575" />
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
                          backgroundColor: '#FAFAFA',
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
                          color: '#757575',
                          margin: '0 0 4px 0',
                        }}
                      >
                        {plantData.species?.name || plantData.species?.scientific}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                          color: '#757575',
                          margin: 0,
                        }}
                      >
                        {[
                          plantData.location,
                          daysSinceStarted === 0 ? 'Baru mulai hari ini!' : (daysSinceStarted != null ? `${daysSinceStarted} hari merawat` : null)
                        ].filter(Boolean).join(' • ') || 'Tanaman'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '8px',
              }}
            >
              {/* Attached Images - Outside bubble */}
              {message.images && message.images.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {message.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Attachment ${idx + 1}`}
                      onClick={() => setFullscreenImage(img)}
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        backgroundColor: '#F5F5F5',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Message Content - In bubble */}
              {message.content && (
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    backgroundColor: message.role === 'user' ? '#FFF9E6' : 'transparent',
                    borderRadius: '16px',
                    border: message.role === 'user' ? '1px solid #F5F0D0' : 'none',
                  }}
                >
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
              )}
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

      {/* Image Error Toast */}
      <AnimatePresence>
        {imageError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '140px',
              left: '24px',
              right: '24px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              padding: '12px 16px',
              borderRadius: '12px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              textAlign: 'center',
              zIndex: 10000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {imageError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${-keyboardHeight}px)`,
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F5F5F5',
          padding: '16px 24px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          zIndex: 10001,
          transition: 'transform 0.2s ease-out',
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
            {/* Attachment Button - accept="image/*" enables both camera and gallery on mobile */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
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
              <Camera size={24} weight="regular" color="#757575" />
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

      {/* Header - Fixed at top, rendered after main container for Safari iOS z-index fix */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 'var(--app-max-width)',
        zIndex: 10000,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E0E0E0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        WebkitTransform: 'translateX(-50%) translateZ(0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        {/* Navigation Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            position: 'relative',
          }}
        >
          {/* Back Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
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
            <ArrowLeft size={20} weight="regular" color="#2C2C2C" />
          </motion.button>

          {/* Title - Centered */}
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
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
          <motion.button
            whileTap={{ scale: 0.95 }}
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
            <ClockCounterClockwise size={20} weight="regular" color="#2C2C2C" />
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
                    fontFamily: "'Caveat', cursive",
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
                    color: '#757575',
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

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {fullscreenImage && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullscreenImage(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                zIndex: 5000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setFullscreenImage(null)}
                aria-label="Tutup"
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 5001,
                }}
              >
                <X size={24} weight="bold" color="#FFFFFF" />
              </button>

              {/* Image */}
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={fullscreenImage}
                alt="Fullscreen view"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '95vw',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

        {/* Offline Modal */}
        <OfflineModal
          isOpen={showOfflineModal}
          onClose={() => setShowOfflineModal(false)}
          featureName="Tanya Tanam"
        />
      </div>
    </>
  );
};

export default TanyaTanam;
