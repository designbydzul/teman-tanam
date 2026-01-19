'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CaretDown,
  MagnifyingGlass,
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
import { OfflineModal } from '@/components/modals';
import { GlobalOfflineBanner } from '@/components/shared';
import { supabase } from '@/lib/supabase';
import TanyaTanamSkeleton from './TanyaTanamSkeleton';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import type { PlantUI, ActionHistoryEntry } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  timestamp: Date;
}

interface AttachedImage {
  file: File;
  preview: string;
}

interface PlantData {
  id: string;
  name: string;
  species: {
    name?: string;
    scientific?: string;
    category?: string;
    imageUrl?: string | null;
    wateringFrequencyDays?: number;
    fertilizingFrequencyDays?: number;
    difficultyLevel?: string;
    sunRequirement?: string;
    growingSeason?: string;
    harvestSigns?: string | null;
    careSummary?: string;
    // Lifecycle fields
    lifecycleType?: 'annual_harvest' | 'perennial_harvest' | 'perpetual';
    harvestDaysMin?: number | null;
    harvestDaysMax?: number | null;
  };
  speciesEmoji: string;
  location?: string | null;
  startedDate?: Date | null;
  coverPhotoUrl?: string | null;
  notes?: string | null;
  lastWatered?: Date | null;
  lastFertilized?: Date | null;
  customWateringDays?: number | null;
  customFertilizingDays?: number | null;
  // Lifecycle fields
  currentPhase?: string | null;
  phaseStartedAt?: Date | null;
  totalHarvests?: number;
  firstHarvestAt?: Date | null;
}

// Helper to get chat storage key for a plant
const getChatStorageKey = (plantId: string): string => `tanyaTanam_chat_${plantId}`;

// Indonesian day names
const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_INDONESIA = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Format date for date divider (Indonesian)
const formatDateDivider = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Today
  if (messageDate.getTime() === today.getTime()) {
    return 'Hari Ini';
  }

  // Yesterday
  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Kemarin';
  }

  // Within last 7 days - show day name
  const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return HARI_INDONESIA[date.getDay()];
  }

  // Older - show full date
  return `${date.getDate()} ${BULAN_INDONESIA[date.getMonth()]} ${date.getFullYear()}`;
};

// Check if two dates are on the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

// Date divider component
const DateDivider: React.FC<{ date: Date }> = ({ date }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '16px 0',
      gap: '12px',
    }}
  >
    <div style={{ flex: 1, height: '1px', backgroundColor: '#E0E0E0' }} />
    <span
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '12px',
        color: '#9E9E9E',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {formatDateDivider(date)}
    </span>
    <div style={{ flex: 1, height: '1px', backgroundColor: '#E0E0E0' }} />
  </div>
);

interface TanyaTanamProps {
  plant: PlantUI | null;
  plants?: PlantUI[];
  onBack: () => void;
}

const TanyaTanam: React.FC<TanyaTanamProps> = ({ plant, plants = [], onBack }) => {
  // Auth - get current user
  const { user } = useAuth();

  // Online status
  const { isOnline } = useOnlineStatus();
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // State
  const [selectedPlant, setSelectedPlant] = useState<PlantUI | null>(plant || null);
  const [showPlantDropdown, setShowPlantDropdown] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [careHistory, setCareHistory] = useState<ActionHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [bottomOffset, setBottomOffset] = useState(16); // Default for desktop

  // Constants for image handling
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_IMAGE_DIMENSION = 1200; // Max width/height for compression

  // Load chat history from database when plant changes
  const loadChatFromDatabase = useCallback(async (plantId: string) => {
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
          } catch {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      } else if (data && data.length > 0) {
        // Transform database format to component format
        const formattedMessages: Message[] = data.map((msg) => ({
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
    if (selectedPlant?.id) {
      loadChatFromDatabase(selectedPlant.id);
    }
  }, [selectedPlant?.id, loadChatFromDatabase]);

  // Save message to database
  const saveMessageToDatabase = useCallback(async (
    plantId: string,
    role: 'user' | 'assistant',
    message: string,
    photoUrl: string | null = null
  ): Promise<{ data: { id: string } | null; error: boolean }> => {
    if (!plantId || !user?.id) return { data: null, error: false };

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
        return { data: null, error: true };
      }
      return { data, error: false };
    } catch (err) {
      console.error('Error saving message:', err);
      return { data: null, error: true };
    }
  }, [user?.id]);

  // Also save to localStorage as backup (with error handling for quota)
  useEffect(() => {
    if (selectedPlant?.id && messages.length > 0) {
      const storageKey = getChatStorageKey(selectedPlant.id);
      try {
        // Only save last 50 messages to prevent quota issues
        const messagesToSave = messages.slice(-50);
        localStorage.setItem(storageKey, JSON.stringify(messagesToSave));
      } catch (err) {
        // If quota exceeded, try to clear old chat data
        if (err instanceof DOMException && err.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old chat data');
          // Clear all tanyaTanam chat keys except current one
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('tanyaTanam_chat_') && key !== storageKey) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          // Try saving again with fewer messages
          try {
            const messagesToSave = messages.slice(-20);
            localStorage.setItem(storageKey, JSON.stringify(messagesToSave));
          } catch {
            console.error('Failed to save chat even after clearing old data');
          }
        }
      }
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
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const imageErrorTimer = useRef<NodeJS.Timeout | null>(null);

  // Helper to show image error with auto-dismiss and cleanup
  const showImageErrorWithMessage = useCallback((message: string): void => {
    if (imageErrorTimer.current) {
      clearTimeout(imageErrorTimer.current);
    }
    setImageError(message);
    imageErrorTimer.current = setTimeout(() => setImageError(null), 4000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (imageErrorTimer.current) {
        clearTimeout(imageErrorTimer.current);
      }
    };
  }, []);

  // Filter messages based on search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : messages;

  // Lock body scroll when TanyaTanam is open
  useEffect(() => {
    const originalStyle = document.body.style.cssText;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.cssText = originalStyle;
    };
  }, []);

  // Detect platform and set appropriate bottom offset for input
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isMobile = isIOS || isAndroid || window.innerWidth < 768;

    if (isStandalone) {
      // PWA mode: Use safe area inset (handled via CSS env())
      setBottomOffset(24);
    } else if (isIOS) {
      // iOS Safari/Chrome: Need space for browser toolbar
      // Chrome iOS has taller toolbar (~70px) than Safari (~50px)
      const isChrome = /crios/.test(ua);
      setBottomOffset(isChrome ? 56 : 48);
    } else if (isMobile) {
      // Other mobile browsers: moderate offset
      setBottomOffset(48);
    } else {
      // Desktop: simple 16px from bottom
      setBottomOffset(16);
    }
  }, []);

  // Detect keyboard and adjust input position to stick to visible viewport bottom
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

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
      const viewport = window.visualViewport;
      viewport.addEventListener('resize', handleViewportChange);
      viewport.addEventListener('scroll', handleViewportChange);

      // Initial call
      handleViewportChange();

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        viewport.removeEventListener('resize', handleViewportChange);
        viewport.removeEventListener('scroll', handleViewportChange);
      };
    }
  }, []);

  // Normalize plant data (includes all info needed for enhanced context)
  const plantData: PlantData | null = selectedPlant
    ? {
      id: selectedPlant.id,
      name: selectedPlant.customName || selectedPlant.name || 'Tanaman',
      species: {
        name: selectedPlant.species?.name ?? undefined,
        scientific: selectedPlant.species?.scientific ?? undefined,
        category: selectedPlant.species?.category ?? undefined,
        imageUrl: selectedPlant.species?.imageUrl ?? undefined,
        wateringFrequencyDays: selectedPlant.species?.wateringFrequencyDays || 3,
        fertilizingFrequencyDays: selectedPlant.species?.fertilizingFrequencyDays || 14,
        // New fields from updated schema
        difficultyLevel: selectedPlant.species?.difficultyLevel ?? undefined,
        sunRequirement: selectedPlant.species?.sunRequirement ?? undefined,
        growingSeason: selectedPlant.species?.growingSeason ?? undefined,
        harvestSigns: selectedPlant.species?.harvestSigns ?? undefined,
        careSummary: selectedPlant.species?.careSummary ?? undefined,
        // Lifecycle fields
        lifecycleType: (selectedPlant.species as { lifecycleType?: 'annual_harvest' | 'perennial_harvest' | 'perpetual' })?.lifecycleType ?? undefined,
        harvestDaysMin: (selectedPlant.species as { harvestDaysMin?: number })?.harvestDaysMin ?? undefined,
        harvestDaysMax: (selectedPlant.species as { harvestDaysMax?: number })?.harvestDaysMax ?? undefined,
      },
      speciesEmoji: selectedPlant.species?.emoji || '🌱',
      location: selectedPlant.location ?? undefined,
      startedDate: selectedPlant.startedDate ? new Date(selectedPlant.startedDate) : undefined,
      // Priority: user's plant photo > species illustration
      coverPhotoUrl: selectedPlant.image || selectedPlant.species?.imageUrl || undefined,
      notes: selectedPlant.notes ?? undefined,
      lastWatered: selectedPlant.lastWatered ? new Date(selectedPlant.lastWatered) : undefined,
      lastFertilized: selectedPlant.lastFertilized ? new Date(selectedPlant.lastFertilized) : undefined,
      // Custom care frequencies (override species defaults)
      customWateringDays: selectedPlant.customWateringDays ?? undefined,
      customFertilizingDays: selectedPlant.customFertilizingDays ?? undefined,
      // Lifecycle fields
      currentPhase: selectedPlant.currentPhase ?? undefined,
      phaseStartedAt: selectedPlant.phaseStartedAt ? new Date(selectedPlant.phaseStartedAt) : undefined,
      totalHarvests: selectedPlant.totalHarvests ?? 0,
      firstHarvestAt: selectedPlant.firstHarvestAt ? new Date(selectedPlant.firstHarvestAt) : undefined,
    }
    : null;

  // Calculate days since started caring (with validation)
  const daysSinceStarted = (() => {
    if (!plantData?.startedDate) return null;
    const startDate = new Date(plantData.startedDate);
    if (isNaN(startDate.getTime())) return null;
    const days = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : null;
  })();

  // Auto-scroll to bottom when new messages
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Call API to get AI response
  const callTanyaTanamAPI = async (
    userMessageContent: string,
    currentMessages: Message[],
    images: string[] = []
  ): Promise<string> => {
    try {
      // Build enhanced context with care history
      let enhancedContextText: string | null = null;
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
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Create object URL to load image
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(objectUrl);

        let width = img.width;
        let height = img.height;

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
        ctx?.drawImage(img, 0, 0, width, height);

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
  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    // Clear any previous error
    setImageError(null);

    for (const file of imageFiles) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        showImageErrorWithMessage('Foto terlalu besar, maks 5MB. Coba foto dengan resolusi lebih kecil.');
        continue;
      }

      try {
        // Compress large images (> 1MB)
        let preview: string;
        if (file.size > 1024 * 1024) {
          preview = await compressImage(file);
        } else {
          // Small images don&apos;t need compression
          preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        setAttachedImages((prev) => [...prev, { file, preview }]);
      } catch (err) {
        console.error('Error processing image:', err);
        showImageErrorWithMessage('Gagal memproses gambar. Coba lagi ya.');
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attached image
  const handleRemoveImage = (index: number) => {
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
    const userMessage: Message = {
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
      const { data: savedUserMsg, error: saveUserError } = await saveMessageToDatabase(
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
      // Show non-blocking warning if save failed (message still shown in UI)
      if (saveUserError) {
        showImageErrorWithMessage('Gagal menyimpan pesan. Chat mungkin tidak tersimpan.');
      }
    }

    // Call real API with images
    const aiResponse = await callTanyaTanamAPI(messageContent, updatedMessages, imagesToSend);

    // Create AI message for UI
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    // Save AI response to database
    if (selectedPlant?.id) {
      const { data: savedAiMsg } = await saveMessageToDatabase(
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
      // Note: Don't show error for AI message save failure (less critical)
    }

    setIsLoading(false);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasInput = inputText.trim().length > 0 || attachedImages.length > 0;

  // Show skeleton during initial load (loading chat and no messages yet)
  const showSkeleton = isLoadingChat && messages.length === 0;

  // Return skeleton if still loading initial data
  if (showSkeleton) {
    return <TanyaTanamSkeleton />;
  }

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
          backgroundColor: '#FFFFFF',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          // Space for fixed header + safe area (header is taller when search is open)
          paddingTop: `calc(${isSearchMode ? '140px' : '88px'} + env(safe-area-inset-top, 0px))`,
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
            // Extra padding for floating input card: input card (~60px) + platform-specific bottomOffset + buffer
            // bottomOffset varies: desktop=16px, iOS Safari=70px, iOS Chrome=80px
            paddingBottom: `calc(${bottomOffset + 80}px + env(safe-area-inset-bottom, 0px))`,
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Empty search results */}
            {searchQuery && filteredMessages.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 24px',
                  textAlign: 'center',
                }}
              >
                <MagnifyingGlass size={48} weight="light" color="#E0E0E0" />
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#9E9E9E',
                    margin: '16px 0 0 0',
                  }}
                >
                  Tidak ada pesan yang cocok dengan &quot;{searchQuery}&quot;
                </p>
              </div>
            )}

            {filteredMessages.map((message, index) => {
              // Check if we need to show a date divider before this message
              const showDateDivider = index === 0 ||
                !isSameDay(new Date(filteredMessages[index - 1].timestamp), new Date(message.timestamp));

              return (
                <React.Fragment key={message.id}>
                  {/* Date Divider */}
                  {showDateDivider && <DateDivider date={new Date(message.timestamp)} />}

                  {/* Message */}
                  <motion.div
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
                        {message.role === 'user' ? (
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
                        ) : (
                          <div
                            className="markdown-content"
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '14px',
                              lineHeight: 1.6,
                              color: '#2C2C2C',
                            }}
                          >
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => (
                                  <p style={{ margin: '0 0 12px 0' }}>{children}</p>
                                ),
                                strong: ({ children }) => (
                                  <strong style={{ fontWeight: 600 }}>{children}</strong>
                                ),
                                em: ({ children }) => (
                                  <em style={{ fontStyle: 'italic' }}>{children}</em>
                                ),
                                ul: ({ children }) => (
                                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>
                                ),
                                li: ({ children }) => (
                                  <li style={{ marginBottom: '4px' }}>{children}</li>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </React.Fragment>
              );
            })}

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

        {/* Input Area - Floating Card */}
        <div
          className="chat-input-area"
          data-keyboard-open={keyboardHeight > 0 ? "true" : "false"}
          style={{
            position: 'fixed',
            // When keyboard is open, position just above keyboard
            // When keyboard is closed: use platform-specific bottomOffset + safe area
            // bottomOffset is set based on platform detection (desktop=16px, iOS Safari=70px, iOS Chrome=80px)
            bottom: keyboardHeight > 0
              ? `${keyboardHeight + 8}px`
              : `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)', // 16px margin on each side
            maxWidth: 'calc(var(--app-max-width) - 32px)',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: '20px',
            padding: '12px 16px',
            zIndex: 10001,
            transition: 'bottom 0.2s ease-out',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
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
              alignItems: 'center',
            }}
          >
            {/* Camera Button */}
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
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
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
                lineHeight: '1.5',
                color: '#2C2C2C',
                backgroundColor: 'transparent',
                resize: 'none',
                overflow: 'hidden',
                minHeight: '24px',
                maxHeight: '120px',
                padding: '4px 0',
              }}
            />

            {/* Send Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!hasInput}
              aria-label="Kirim pesan"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: hasInput ? '#7CB342' : '#F5F5F5',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: hasInput ? 'pointer' : 'not-allowed',
                flexShrink: 0,
              }}
            >
              <PaperPlaneTilt
                size={20}
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
          WebkitTransform: 'translateX(-50%) translateZ(0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Global Offline Banner */}
          <GlobalOfflineBanner />
          {/* Header Row - Always visible */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px',
              position: 'relative',
              borderBottom: '1px solid #E0E0E0',
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

            {/* Search Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSearchMode(!isSearchMode)}
              aria-label="Cari pesan"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: isSearchMode ? '#F0F7E6' : '#FFFFFF',
                border: isSearchMode ? '1px solid #7CB342' : '1px solid #E0E0E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <MagnifyingGlass size={20} weight="regular" color={isSearchMode ? '#7CB342' : '#2C2C2C'} />
            </motion.button>
          </div>

          {/* Search Input Row - Below header border when active */}
          <AnimatePresence>
            {isSearchMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '16px 24px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#FAFAFA',
                      border: '2px solid #7CB342',
                      borderRadius: '12px',
                      padding: '0 8px 0 16px',
                    }}
                  >
                    {/* Search Icon */}
                    <MagnifyingGlass size={20} weight="regular" color="#757575" style={{ flexShrink: 0 }} />

                    {/* Input */}
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Cari pesan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '14px 8px',
                        fontSize: '1rem',
                        fontFamily: "'Inter', sans-serif",
                        color: '#2C2C2C',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                      }}
                    />

                    {/* Clear Button */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (searchQuery) {
                          setSearchQuery('');
                        } else {
                          setIsSearchMode(false);
                        }
                      }}
                      style={{
                        flexShrink: 0,
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#E0E0E0',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={16} weight="bold" color="#757575" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                  zIndex: 20000,
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
                    top: 'calc(20px + env(safe-area-inset-top, 0px))',
                    right: 'calc(20px + env(safe-area-inset-right, 0px))',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 20001,
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
