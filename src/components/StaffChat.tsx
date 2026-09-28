import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TbUser, TbSend, TbSearch, TbDotsVertical, TbMessageCircle, TbUsers, TbClock,
  TbVideo, TbPhoneOff, TbMicrophone, TbMicrophoneOff, TbEraser
} from 'react-icons/tb';
import {
  RiShoppingBag3Line,
  RiUserSharedLine,
  RiCloseLine,
  RiCheckLine,
  RiCheckDoubleLine,
  RiPhoneFill,
  RiFileTextLine,
  RiAddLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiDeleteBin6Line,
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
  RiPlayFill,
  RiPauseFill,
  RiDownloadLine,
  RiFireLine,
  RiStarLine,
  RiAttachment2,
  RiEmotionLine,
  RiMicLine,
  RiImageLine,
  RiShieldStarLine,
  RiShieldUserLine,
  RiBriefcaseLine,
  RiToolsLine,
  RiMoneyDollarCircleLine,
  RiShieldLine
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { api, type Staff } from '../api';
import './ChatInbox.css';

// ------------------ UNIVERSAL WAV AUDIO RECORDER ------------------
function writeWavString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  // Downsample to 22050 Hz for ultra-crisp voice and lightweight payload size
  let targetSamples = samples;
  let targetSampleRate = sampleRate;

  if (sampleRate > 24000) {
    const ratio = sampleRate / 22050;
    const newLen = Math.floor(samples.length / ratio);
    targetSamples = new Float32Array(newLen);
    for (let i = 0; i < newLen; i++) {
      targetSamples[i] = samples[Math.floor(i * ratio)];
    }
    targetSampleRate = 22050;
  }

  const buffer = new ArrayBuffer(44 + targetSamples.length * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeWavString(view, 0, 'RIFF');
  view.setUint32(4, 36 + targetSamples.length * 2, true);
  writeWavString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeWavString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // 1 = PCM
  view.setUint16(22, 1, true); // 1 = Mono
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  // "data" sub-chunk
  writeWavString(view, 36, 'data');
  view.setUint32(40, targetSamples.length * 2, true);

  // 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < targetSamples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, targetSamples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

class UniversalWavRecorder {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: Float32Array[] = [];
  private totalLength = 0;
  private sampleRate = 22050;

  async start(onLiveVolume?: (vol: number) => void) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Brauzerda Web Audio mavjud emas");
    }

    this.audioCtx = new AudioContextClass();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    this.sampleRate = this.audioCtx.sampleRate || 44100;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
    this.chunks = [];
    this.totalLength = 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.processor.onaudioprocess = (e) => {
      const channel = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(channel);
      this.chunks.push(copy);
      this.totalLength += copy.length;

      if (onLiveVolume && this.analyser) {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const norm = Math.min(100, Math.max(12, Math.round((avg / 128) * 100)));
        onLiveVolume(norm);
      }
    };

    source.connect(this.processor);
    const muteGain = this.audioCtx.createGain();
    muteGain.gain.value = 0;
    this.processor.connect(muteGain);
    muteGain.connect(this.audioCtx.destination);
  }

  stop(): Promise<{ base64: string; duration: number }> {
    return new Promise((resolve) => {
      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }

      const merged = new Float32Array(this.totalLength);
      let offset = 0;
      for (const chunk of this.chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      const dur = this.totalLength / (this.sampleRate || 22050);
      const wavBlob = encodeWAV(merged, this.sampleRate || 22050);

      if (this.audioCtx) {
        this.audioCtx.close().catch(() => {});
        this.audioCtx = null;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          base64: reader.result as string,
          duration: dur
        });
      };
      reader.readAsDataURL(wavBlob);
    });
  }

  cancel() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.chunks = [];
    this.totalLength = 0;
  }
}

// ------------------ DYNAMIC VOICE PLAYER (REACTIVE ANIMATION) ------------------
interface VoicePlayerProps {
  audioUrl: string;
  durationText?: string;
  isMine: boolean;
}

function VoiceMessagePlayer({ audioUrl, durationText, isMine }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [basePeaks, setBasePeaks] = useState<number[]>([35, 65, 45, 80, 50, 95, 60, 100, 70, 50, 85, 45, 75, 90, 50, 70, 40]);
  const [liveBounce, setLiveBounce] = useState<number>(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelDataRef = useRef<Float32Array | null>(null);
  const sampleRateRef = useRef<number>(22050);

  // Extract real audio peaks from decoded audio buffer
  useEffect(() => {
    let cancelled = false;
    if (!audioUrl) return;

    const extractAudioPeaks = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const res = await fetch(audioUrl);
        const arrayBuf = await res.arrayBuffer();
        const tempCtx = new AudioContextClass();
        const audioBuffer = await tempCtx.decodeAudioData(arrayBuf);
        if (cancelled) return;

        const channel = audioBuffer.getChannelData(0);
        channelDataRef.current = channel;
        sampleRateRef.current = audioBuffer.sampleRate;
        if (audioBuffer.duration && isFinite(audioBuffer.duration)) {
          setDuration(audioBuffer.duration);
        }

        const barCount = 17;
        const blockSize = Math.floor(channel.length / barCount);
        const peaks: number[] = [];

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          const start = i * blockSize;
          const end = start + blockSize;
          const step = Math.max(1, Math.floor(blockSize / 32));
          let count = 0;
          for (let j = start; j < end; j += step) {
            sum += Math.abs(channel[j] || 0);
            count++;
          }
          const avg = count > 0 ? sum / count : 0;
          const peakVal = Math.max(25, Math.min(100, Math.round(avg * 320)));
          peaks.push(peakVal);
        }

        setBasePeaks(peaks);
        tempCtx.close().catch(() => {});
      } catch (e) {
        console.warn('Real waveform decode error:', e);
      }
    };

    extractAudioPeaks();
    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  // Real-time voice animation loop connected directly to PCM voice volume
  useEffect(() => {
    if (!isPlaying) {
      setLiveBounce(1.0);
      return;
    }

    let animId: number;
    const updateVoiceAnimation = () => {
      if (audioRef.current && channelDataRef.current) {
        const cTime = audioRef.current.currentTime;
        const sRate = sampleRateRef.current || 22050;
        const currentSample = Math.floor(cTime * sRate);

        const windowSize = 512;
        let sum = 0;
        const ch = channelDataRef.current;
        const start = Math.max(0, currentSample - windowSize / 2);
        const end = Math.min(ch.length, currentSample + windowSize / 2);

        for (let i = start; i < end; i++) {
          sum += Math.abs(ch[i]);
        }
        const instantAmp = end > start ? sum / (end - start) : 0;
        // Bounce dynamically scales with voice loudness (0.75x to 2.0x)
        const bounce = Math.min(2.0, Math.max(0.75, instantAmp * 4.5 + 0.75));
        setLiveBounce(bounce);
      }
      animId = requestAnimationFrame(updateVoiceAnimation);
    };

    animId = requestAnimationFrame(updateVoiceAnimation);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio play error:', err);
      });
    }
  };

  const formatSecs = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '4px 2px',
      minWidth: '220px',
      maxWidth: '300px'
    }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        playsInline
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          setLiveBounce(1.0);
        }}
      />

      <button
        type="button"
        onClick={togglePlay}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: 'none',
          background: isMine ? '#ffffff' : '#0284c7',
          color: isMine ? '#0284c7' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          transition: 'transform 0.15s'
        }}
        title={isPlaying ? "To'xtatish" : "Eshitish"}
      >
        {isPlaying ? <RiPauseFill size={20} /> : <RiPlayFill size={20} style={{ marginLeft: '2px' }} />}
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {/* Real Dynamic Waveform Reacting to Voice Loudness */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '22px' }}>
          {basePeaks.map((h, idx) => {
            const progress = duration > 0 ? currentTime / duration : 0;
            const barProgress = idx / 16;
            const isPassed = barProgress <= progress;
            const isCurrent = Math.abs(barProgress - progress) < 0.09;

            // When playing, the current and adjacent bars bounce to actual voice volume
            const dynamicHeight = (isPlaying && isCurrent)
              ? Math.min(100, Math.max(25, h * liveBounce))
              : h;

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: `${dynamicHeight}%`,
                  borderRadius: '2px',
                  backgroundColor: isMine
                    ? (isPassed ? '#ffffff' : 'rgba(255, 255, 255, 0.45)')
                    : (isPassed ? '#0284c7' : '#cbd5e1'),
                  transform: isPlaying && isCurrent ? 'scaleY(1.2)' : 'scaleY(1)',
                  transition: 'height 0.08s ease, transform 0.08s ease, background-color 0.15s'
                }}
              />
            );
          })}
        </div>

        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.05}
          value={currentTime}
          onChange={handleSlider}
          style={{
            width: '100%',
            height: '3px',
            marginTop: '-6px',
            opacity: 0,
            cursor: 'pointer'
          }}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: 500,
          color: isMine ? 'rgba(255, 255, 255, 0.9)' : '#64748b'
        }}>
          <span>{formatSecs(currentTime)}</span>
          <span>{duration > 0 ? formatSecs(duration) : (durationText || 'Ovozli xabar')}</span>
        </div>
      </div>
    </div>
  );
}

interface InternalMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  text: string;
  mediaUrl?: string;
  mediaType?: string;
  isRead: boolean;
  createdAt: string;
}

const getRoleIcon = (roleId?: string, size = 12) => {
  switch (roleId) {
    case 'super_admin':
      return <RiShieldStarLine size={size} />;
    case 'admin':
      return <RiShieldUserLine size={size} />;
    case 'manager':
      return <RiBriefcaseLine size={size} />;
    case 'specialist':
      return <RiToolsLine size={size} />;
    case 'cashier':
    case 'kassir':
      return <RiMoneyDollarCircleLine size={size} />;
    default:
      return <RiShieldLine size={size} />;
  }
};

const cleanText = (text?: string): string => {
  if (!text) return '';
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '').trim();
};

const GENERAL_CHAT_USER: Staff = {
  id: 'general',
  name: 'Umumiy guruh',
  firstName: 'Umumiy',
  lastName: 'guruh',
  phone: 'Barcha foydalanuvchilar',
  email: 'all@odim.uz',
  role: 'super_admin',
  roleTitle: 'Umumiy kanal (Barcha xodimlar)',
  status: 'active',
  isOnline: true,
  assignedDeals: 0,
  permissions: {
    canExportClients: false,
    canViewAllLeads: true,
    canSeeRevenue: false,
    canEditCatalog: false,
    canDeleteRecords: false,
  }
};

export default function StaffChat() {
  const navigate = useNavigate();
  const { currentUser, roles } = useAuth();

  const [users, setUsers] = useState<Staff[]>([]);
  const [selectedUser, setSelectedUser] = useState<Staff | null>(GENERAL_CHAT_USER);
  const selectedUserRef = useRef<Staff | null>(GENERAL_CHAT_USER);
  const [recentMap, setRecentMap] = useState<Record<string, { lastMessage?: string; lastTime?: string; lastSender?: string; unread?: number }>>({});
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUserCard, setShowUserCard] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);

  // Telegram-style Message Selection & History Clearing
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);

  // Universal WAV Voice recording refs
  const wavRecorderRef = useRef<UniversalWavRecorder | null>(null);
  const [liveRecordVolume, setLiveRecordVolume] = useState<number>(15);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRecentChats = async () => {
    if (!currentUser?.id) return;
    try {
      const recent = await api.getRecentInternalChats(currentUser.id);
      setRecentMap(recent || {});
    } catch (e) {
      console.warn('Failed to load recent chats:', e);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getStaff();
      const currentId = currentUser?.id;
      const currentPhone = currentUser?.phone?.replace(/\D/g, '');

      const filtered = data.filter(u => {
        if (!u) return false;
        if (currentId && u.id === currentId) return false;
        const uPhone = (u.phone || '').replace(/\D/g, '');
        if (currentPhone && uPhone && currentPhone === uPhone) return false;
        return true;
      });

      setUsers(filtered);
      loadRecentChats();
    } catch (e) {
      console.error('Failed to load users for chat:', e);
    }
  };

  const loadMessages = async (target?: Staff | null) => {
    const targetStaff = target !== undefined ? target : selectedUserRef.current;
    if (!currentUser || !targetStaff) return;

    try {
      const fetched = await api.getInternalMessages(currentUser.id, targetStaff.id);
      setMessages(() => {
        const map = new Map<string, InternalMessage>();
        fetched.forEach(m => {
          if (m && m.id) map.set(m.id, m);
        });
        return Array.from(map.values());
      });
    } catch (e) {
      console.error('Failed to load chat messages:', e);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRecentChats();
    const interval = setInterval(() => {
      loadUsers();
      loadRecentChats();
    }, 3000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => {
      loadMessages();
    }, 1500);

    const handleMsgEvent = () => {
      loadMessages();
      loadRecentChats();
    };
    window.addEventListener('odim_new_message', handleMsgEvent);
    window.addEventListener('storage', handleMsgEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('odim_new_message', handleMsgEvent);
      window.removeEventListener('storage', handleMsgEvent);
    };
  }, [selectedUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectUserChat = (user: Staff) => {
    setSelectedUser(user);
    selectedUserRef.current = user;
    loadMessages(user);
    // Clear unread indicator locally for clicked chat
    setRecentMap(prev => ({
      ...prev,
      [user.id]: {
        ...(prev[user.id] || {}),
        unread: 0
      }
    }));
  };

  const handleSendMessage = async (mediaUrl?: string, mediaType?: string, customText?: string) => {
    const textToSend = customText !== undefined ? customText : inputMessage.trim();
    if ((!textToSend && !mediaUrl) || !selectedUser || !currentUser) return;

    const isGeneral = selectedUser.id === 'general';
    const senderName = currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Foydalanuvchi';
    const receiverName = isGeneral ? 'Umumiy guruh' : (selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'Xodim');

    setInputMessage('');
    setShowEmojiPicker(false);

    try {
      const res = await api.sendInternalMessage({
        sender_id: currentUser.id,
        sender_name: senderName,
        receiver_id: isGeneral ? 'general' : selectedUser.id,
        receiver_name: receiverName,
        text: textToSend,
        media_url: mediaUrl || '',
        media_type: mediaType || ''
      });

      if (res.success && res.message) {
        setMessages(prev => {
          if (prev.some(m => m.id === res.message.id)) return prev;
          return [...prev, res.message];
        });
        scrollToBottom();

        // Instantly update recentMap so this contact jumps to the top of the chat list
        const targetKey = isGeneral ? 'general' : selectedUser.id;
        const nowIso = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const preview = (mediaType === 'audio' ? '🎤 Ovozli xabar' : (mediaType === 'image' ? '📷 Rasm' : (textToSend || 'Media fayl')));
        setRecentMap(prev => ({
          ...prev,
          [targetKey]: {
            lastMessage: preview,
            lastTime: nowIso,
            lastSender: senderName,
            unread: 0
          }
        }));

        loadRecentChats();
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const compressed = await compressImage(file);
      if (compressed) {
        handleSendMessage(compressed, 'image');
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        handleSendMessage(base64, 'file');
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Universal Cross-Platform WAV Audio Voice Recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Brauzeringiz ovoz yozishni qo'llab-quvvatlamaydi.");
        return;
      }

      const recorder = new UniversalWavRecorder();
      wavRecorderRef.current = recorder;
      await recorder.start((vol) => {
        setLiveRecordVolume(vol);
      });

      setIsRecording(true);
      setRecordingTimer(0);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      alert("Mikrofondan foydalanishga ruxsat berilmadi yoki mikrofon ulanmagan.");
    }
  };

  const stopRecordingAndSend = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const recorder = wavRecorderRef.current;
    const finalDuration = formatTimer(recordingTimer);

    setIsRecording(false);
    setRecordingTimer(0);
    setLiveRecordVolume(15);

    if (recorder) {
      try {
        const result = await recorder.stop();
        if (result && result.base64) {
          handleSendMessage(result.base64, 'audio', finalDuration);
        }
      } catch (e) {
        console.error('Failed to stop & process WAV audio:', e);
      }
    }
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (wavRecorderRef.current) {
      wavRecorderRef.current.cancel();
      wavRecorderRef.current = null;
    }
    setIsRecording(false);
    setRecordingTimer(0);
    setLiveRecordVolume(15);
  };

  // Telegram-style Selection and Deletion Handlers
  const toggleSelectMessage = (msgId: string) => {
    setSelectedMessageIds(prev =>
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMessageIds.length === messages.length) {
      setSelectedMessageIds([]);
    } else {
      setSelectedMessageIds(messages.map(m => m.id));
    }
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessageIds.length === 0) return;
    try {
      await api.deleteInternalMessages(selectedMessageIds);
      setMessages(prev => prev.filter(m => !selectedMessageIds.includes(m.id)));
      setSelectedMessageIds([]);
      setIsSelectionMode(false);
      setShowDeleteConfirmModal(false);
      loadRecentChats();
    } catch (e) {
      console.error('Failed to delete messages:', e);
    }
  };

  const handleClearHistory = async () => {
    if (!currentUser || !selectedUser) return;
    try {
      await api.clearInternalChatHistory(currentUser.id, selectedUser.id);
      setMessages([]);
      setSelectedMessageIds([]);
      setIsSelectionMode(false);
      setShowClearHistoryModal(false);
      loadRecentChats();
    } catch (e) {
      console.error('Failed to clear chat history:', e);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatRecentTime = (timeStr?: string) => {
    if (!timeStr) return '';
    if (timeStr === 'Hozir') return 'Hozir';
    try {
      const normalized = timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T') + (timeStr.includes('Z') ? '' : 'Z');
      const d = new Date(normalized);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    } catch {
      // fallback
    }
    return timeStr.slice(11, 16) || timeStr.slice(-8, -3);
  };

  const parseTimestamp = (t?: string): number => {
    if (!t) return 0;
    if (t === 'Hozir') return Date.now();
    const normalized = t.includes('T') ? t : t.replace(' ', 'T') + (t.includes('Z') ? '' : 'Z');
    const parsed = Date.parse(normalized);
    if (!isNaN(parsed)) return parsed;
    const parsedDirect = Date.parse(t);
    if (!isNaN(parsedDirect)) return parsedDirect;
    return 0;
  };

  const getRecentForUser = (user: Staff) => {
    if (!user) return undefined;
    if (recentMap[user.id]) return recentMap[user.id];
    const uPhoneNorm = (user.phone || '').replace(/\D/g, '');
    for (const [key, val] of Object.entries(recentMap)) {
      if (key === user.id) return val;
      if (uPhoneNorm && uPhoneNorm.length >= 7 && key.includes(uPhoneNorm.slice(-9))) return val;
      if (val?.lastSender && user.name && val.lastSender.toLowerCase() === user.name.toLowerCase()) return val;
    }
    return undefined;
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.phone?.includes(q) || u.roleTitle?.toLowerCase().includes(q);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const recentA = getRecentForUser(a);
    const recentB = getRecentForUser(b);
    const timeA = recentA?.lastTime || '';
    const timeB = recentB?.lastTime || '';

    const tsA = parseTimestamp(timeA);
    const tsB = parseTimestamp(timeB);

    // 1. Latest message timestamp comes first (floats to the very top)
    if (tsA > 0 || tsB > 0) {
      if (tsA > 0 && tsB > 0 && tsA !== tsB) {
        return tsB - tsA;
      }
      if (tsA > 0 && tsB === 0) return -1;
      if (tsA === 0 && tsB > 0) return 1;
    }

    // 2. Unread messages come next
    const unreadA = recentA?.unread || 0;
    const unreadB = recentB?.unread || 0;
    if (unreadA !== unreadB) {
      return unreadB - unreadA;
    }

    // 3. Alphabetical fallback
    return (a.name || '').localeCompare(b.name || '');
  });

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="inbox-page-wrapper">
      {/* 1. TOP BAR WITH TABS */}
      <div className="chat-top-channel-bar">
        <div className="top-channel-tabs">
          <button className="top-channel-pill active">
            <TbUsers size={18} />
            <span>Foydalanuvchilar Chati</span>
            <span className="channel-pill-count">{users.length + 1}</span>
          </button>

          <button
            className="top-channel-pill"
            onClick={() => navigate('/chat/inbox')}
            title="Mijozlar Inboxi"
          >
            <TbMessageCircle size={18} />
            <span>Mijozlar Inboxi</span>
          </button>
        </div>

        <div className="top-channel-right">
          <button
            className={`top-profile-btn ${showUserCard ? 'active' : ''}`}
            onClick={() => setShowUserCard(!showUserCard)}
            title="Foydalanuvchi ma'lumotlari kartochkasi"
          >
            <TbUser size={16} />
            <span>{selectedUser?.id === 'general' ? 'Guruh profili' : 'Xodim Profili'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 3-COLUMN CHAT LAYOUT */}
      <div className="chat-layout">
        <div className="chat-unified-container">

          {/* LEFT COLUMN: STAFF / USER LIST */}
          <div className="chat-contacts-panel">
            <div className="contacts-panel-header">
              <h2 className="contacts-panel-title">Foydalanuvchilar</h2>
            </div>

            <div className="contacts-search-wrapper" style={{ padding: '0 0 12px 0' }}>
              <div className="chat-search-input" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TbSearch size={18} color="#64748b" />
                <input
                  type="text"
                  placeholder="Foydalanuvchini qidirish..."
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13.5px', width: '100%' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="contacts-list">
              {/* PINNED GENERAL GROUP CHAT */}
              <div
                className={`contact-card-item ${selectedUser?.id === 'general' ? 'active' : ''}`}
                onClick={() => selectUserChat(GENERAL_CHAT_USER)}
                style={{
                  background: selectedUser?.id === 'general' ? '#191919' : 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
                  border: selectedUser?.id === 'general' ? '1.5px solid #191919' : '1.5px solid #bae6fd',
                  marginBottom: '10px'
                }}
              >
                <div className="contact-card-avatar-wrap">
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: selectedUser?.id === 'general' ? '#ffffff' : 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
                    color: selectedUser?.id === 'general' ? '#0f172a' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '18px'
                  }}>
                    <TbUsers size={22} />
                  </div>
                  <div className="cw-online-indicator online" style={{ bottom: '2px', right: '2px' }} />
                </div>

                <div className="contact-card-content">
                  <div className="contact-card-top-row">
                    <span className="contact-card-name" style={{ color: selectedUser?.id === 'general' ? '#ffffff' : '#0f172a', fontWeight: 700 }}>
                      🌐 Umumiy guruh
                    </span>
                    {recentMap['general']?.lastTime && (
                      <span className="contact-card-time" style={{ color: selectedUser?.id === 'general' ? 'rgba(255,255,255,0.7)' : '#64748b' }}>
                        {formatRecentTime(recentMap['general'].lastTime)}
                      </span>
                    )}
                  </div>
                  <div className="contact-card-bottom-row" style={{ marginTop: '3px' }}>
                    <span className="contact-card-preview" style={{ color: selectedUser?.id === 'general' ? 'rgba(255,255,255,0.85)' : '#475569' }}>
                      {recentMap['general']?.lastMessage ? (
                        `${recentMap['general'].lastSender ? recentMap['general'].lastSender.split(' ')[0] + ': ' : ''}${recentMap['general'].lastMessage}`
                      ) : (
                        "Barcha xodimlar guruhi"
                      )}
                    </span>
                    {(recentMap['general']?.unread || 0) > 0 && (
                      <span className="contact-unread-badge">
                        {recentMap['general']?.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ padding: '4px 8px 6px 8px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Shaxsiy xabarlar ({sortedUsers.length})
              </div>

              {sortedUsers.length === 0 ? (
                <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center', fontSize: '13px' }}>
                  Foydalanuvchilar topilmadi
                </div>
              ) : (
                sortedUsers.map(u => {
                  const isSelected = selectedUser?.id === u.id;
                  const matchedRole = roles.find(r => r.id === u.role);
                  const roleTitleStr = matchedRole?.title || matchedRole?.name || u.roleTitle || u.role || 'Kassir';
                  const userRecent = getRecentForUser(u);

                  return (
                    <div
                      key={u.id}
                      className={`contact-card-item ${isSelected ? 'active' : ''}`}
                      onClick={() => selectUserChat(u)}
                    >
                      <div className="contact-card-avatar-wrap">
                        <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#191919', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '15px', overflow: 'hidden' }}>
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            getInitials(u.name)
                          )}
                        </div>
                        <div className={`cw-online-indicator ${u.isOnline ? 'online' : ''}`} style={{ bottom: '2px', right: '2px' }} />
                      </div>

                      <div className="contact-card-content">
                        <div className="contact-card-top-row">
                          <span className="contact-card-name">{u.name}</span>
                          {userRecent?.lastTime && (
                            <span className="contact-card-time">{formatRecentTime(userRecent.lastTime)}</span>
                          )}
                        </div>
                        <div className="contact-card-bottom-row" style={{ marginTop: '4px', gap: '6px' }}>
                          <span className="contact-card-preview" style={{ flex: 1 }}>
                            {userRecent?.lastMessage || (
                              <span className="channel-pill-count" style={{ fontSize: '10.5px', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                {getRoleIcon(u.role, 10)}
                                <span>{cleanText(roleTitleStr)}</span>
                              </span>
                            )}
                          </span>
                          {(userRecent?.unread || 0) > 0 && (
                            <span className="contact-unread-badge">
                              {userRecent?.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CENTER COLUMN: ACTIVE CHAT WINDOW */}
          <div className="chat-window-panel">
            {selectedUser ? (
              <>
                {/* CHAT WINDOW HEADER */}
                <div className="chat-window-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="cw-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="cw-avatar-wrap">
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: selectedUser.id === 'general' ? 'linear-gradient(135deg, #0284c7 0%, #059669 100%)' : '#191919',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '15px',
                        overflow: 'hidden'
                      }}>
                        {selectedUser.id === 'general' ? (
                          <TbUsers size={22} />
                        ) : selectedUser.avatar ? (
                          <img src={selectedUser.avatar} alt={selectedUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          getInitials(selectedUser.name)
                        )}
                      </div>
                      <div className="cw-online-indicator online" />
                    </div>

                    <div className="cw-header-info">
                      <h3 className="cw-header-name">
                        {selectedUser.id === 'general' ? '🌐 Umumiy guruh' : selectedUser.name}
                      </h3>
                      <span className="cw-header-status">
                        <span className={`cw-status-dot ${selectedUser.isOnline ? 'online' : ''}`} />
                        {selectedUser.id === 'general' ? (
                          `${users.length + 1} nafar xodim • Hamma ko'ra oladigan umumiy kanal`
                        ) : (
                          `${selectedUser.isOnline ? 'Hozir online' : 'Oflayn'} • ${cleanText(selectedUser.roleTitle || 'Foydalanuvchi')}`
                        )}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT-HAND BUTTONS: DELETE (SELECTION MODE) & CLEAR HISTORY */}
                  <div className="cw-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        setSelectedMessageIds([]);
                      }}
                      style={{
                        background: isSelectionMode ? '#ef4444' : '#f1f5f9',
                        color: isSelectionMode ? '#ffffff' : '#334155',
                        border: isSelectionMode ? 'none' : '1px solid #e2e8f0',
                        padding: '7px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        boxShadow: isSelectionMode ? '0 2px 8px rgba(239,68,68,0.25)' : 'none'
                      }}
                      title="Xabarlarni tanlab o'chirish (Telegram usulida)"
                    >
                      <RiDeleteBin6Line size={16} />
                      <span>{isSelectionMode ? 'Bekor qilish' : 'O\'chirish'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowClearHistoryModal(true)}
                      style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fee2e2',
                        padding: '7px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                      title="Suhbat tarixini tozalash (Ochistit istoriyu)"
                    >
                      <TbEraser size={16} />
                      <span>Tarixni tozalash</span>
                    </button>
                  </div>
                </div>

                {/* TELEGRAM-STYLE SELECTION BAR */}
                {isSelectionMode && (
                  <div style={{
                    background: '#eff6ff',
                    borderBottom: '1.5px solid #bfdbfe',
                    padding: '9px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e40af' }}>
                        {selectedMessageIds.length > 0 ? `${selectedMessageIds.length} ta xabar tanlandi` : 'O\'chirmoqchi bo\'lgan xabarlaringizni tanlang'}
                      </span>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        style={{
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {selectedMessageIds.length === messages.length ? 'Barchasini bekor qilish' : 'Barchasini tanlash'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        disabled={selectedMessageIds.length === 0}
                        onClick={() => setShowDeleteConfirmModal(true)}
                        style={{
                          background: selectedMessageIds.length > 0 ? '#ef4444' : '#fca5a5',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: selectedMessageIds.length > 0 ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background 0.2s'
                        }}
                      >
                        <RiDeleteBinLine size={15} />
                        <span>O'chirish ({selectedMessageIds.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedMessageIds([]);
                        }}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          cursor: 'pointer'
                        }}
                      >
                        Chiqish
                      </button>
                    </div>
                  </div>
                )}

                {/* MESSAGES AREA */}
                <div className="chat-messages-container-box">
                  <div className="chat-messages-area">
                    <div className="chat-divider"><span>Bugun</span></div>

                    {messages.length === 0 ? (
                      <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8', fontSize: '14px', paddingTop: '40px' }}>
                        <TbMessageCircle size={44} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                        <p>
                          {selectedUser.id === 'general'
                            ? "Umumiy guruhda hali xabarlar yo'q."
                            : `Siz va ${selectedUser.name} o'rtasida hali xabarlar yo'q.`}
                        </p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>Birinchi xabaringizni yozing!</p>
                      </div>
                    ) : (
                      messages.map((m, i) => {
                        const isMine = Boolean(
                          m.senderId === currentUser?.id ||
                          (currentUser?.name && m.senderName && m.senderName.toLowerCase() === currentUser.name.toLowerCase())
                        );

                        const isSelected = selectedMessageIds.includes(m.id);
                        const imgUrl = m.mediaUrl || (m as any).media_url;
                        const isImg = (m.mediaType === 'image' || (m as any).media_type === 'image') ||
                          (typeof imgUrl === 'string' && (imgUrl.startsWith('data:image') || /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(imgUrl)));
                        const isAudio = (m.mediaType === 'audio' || (m as any).media_type === 'audio') ||
                          (typeof imgUrl === 'string' && (imgUrl.startsWith('data:audio') || /\.(webm|mp3|wav|ogg|m4a)($|\?)/i.test(imgUrl)));

                        return (
                          <div
                            key={m.id || i}
                            className={`message-wrapper ${isMine ? 'is-me' : 'is-other'} ${isSelected ? 'is-selected-row' : ''}`}
                            onClick={() => {
                              if (isSelectionMode) toggleSelectMessage(m.id);
                            }}
                            style={{
                              cursor: isSelectionMode ? 'pointer' : 'default',
                              backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                              borderRadius: '12px',
                              padding: isSelectionMode ? '4px 8px' : '2px 0',
                              transition: 'background-color 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            {/* TELEGRAM SELECTION CHECKBOX */}
                            {isSelectionMode && (
                              <div
                                style={{ flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectMessage(m.id);
                                }}
                              >
                                {isSelected ? (
                                  <RiCheckboxCircleFill size={22} color="#0284c7" />
                                ) : (
                                  <RiCheckboxBlankCircleLine size={22} color="#94a3b8" />
                                )}
                              </div>
                            )}

                            <div className={`message-bubble ${isMine ? 'bubble-me' : 'bubble-other'}`} style={{ maxWidth: isAudio ? '320px' : undefined }}>
                              {selectedUser.id === 'general' && !isMine && (() => {
                                const senderStaff = users.find(u => u.id === m.senderId || (u.name && m.senderName && u.name.toLowerCase() === m.senderName.toLowerCase()));
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                    {senderStaff?.avatar ? (
                                      <img src={senderStaff.avatar} alt={m.senderName} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : null}
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
                                      {m.senderName || 'Xodim'}
                                    </span>
                                  </div>
                                );
                              })()}

                              {/* TEXT MESSAGE */}
                              {m.text && !isAudio && <p className="bubble-text">{m.text}</p>}

                              {/* VOICE AUDIO MESSAGE */}
                              {isAudio && imgUrl && (
                                <VoiceMessagePlayer
                                  audioUrl={imgUrl}
                                  durationText={m.text && m.text !== 'Ovozli xabar' ? m.text : undefined}
                                  isMine={isMine}
                                />
                              )}

                              {/* IMAGE MESSAGE */}
                              {imgUrl && isImg && !isAudio && (
                                <div
                                  className="chat-media-wrapper"
                                  style={{ marginTop: '5px', marginBottom: '3px', cursor: 'pointer', position: 'relative' }}
                                  onClick={(e) => {
                                    if (isSelectionMode) return;
                                    e.stopPropagation();
                                    setViewingImage(imgUrl);
                                  }}
                                  title="Kattalashtirish uchun bosing"
                                >
                                  <img
                                    src={imgUrl}
                                    alt="Rasm"
                                    className="chat-media-image"
                                    style={{
                                      maxWidth: '260px',
                                      maxHeight: '260px',
                                      borderRadius: '10px',
                                      objectFit: 'cover',
                                      display: 'block',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                                    }}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '6px',
                                    right: '6px',
                                    background: 'rgba(0,0,0,0.65)',
                                    color: '#ffffff',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '10.5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    pointerEvents: 'none'
                                  }}>
                                    <RiImageLine size={13} />
                                    <span>Kattalashtirish</span>
                                  </div>
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px', fontSize: '11px', opacity: 0.9 }}>
                                <span>{m.createdAt ? (m.createdAt.length > 10 ? m.createdAt.slice(-8, -3) : m.createdAt) : 'Hozir'}</span>
                                {isMine && (
                                  m.isRead ? (
                                    <RiCheckDoubleLine size={15} color="#38bdf8" title="O'qildi (2 ta ptichka)" />
                                  ) : (
                                    <RiCheckLine size={13} color="rgba(255, 255, 255, 0.75)" title="Yuborildi (1 ta ptichka)" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* EMOJI PICKER POPUP */}
                  {showEmojiPicker && (
                    <div style={{ padding: '8px 16px', background: '#ffffff', borderTop: '1.5px solid #e2e8f0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {['👍', '😍', '😊', '🙌', '💼', '✅', '🎉', '🔥', '❤️', '👌', '🤝', '💯'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setInputMessage(prev => prev + emoji)}
                          style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* INPUT BAR */}
                  <div className="chat-input-area" style={{ position: 'relative' }}>
                    {isRecording ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', padding: '8px 18px', borderRadius: '24px', border: '1.5px solid #fca5a5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#dc2626', fontWeight: 600, fontSize: '14px' }}>
                          <TbMicrophone size={20} className="pulse-icon" />
                          <span>Ovoz yozilmoqda: {formatTimer(recordingTimer)}</span>

                          {/* Dynamic live voice waveform during recording */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '22px', marginLeft: '6px' }}>
                            {[0.5, 0.9, 1.4, 0.7, 1.3, 1.6, 0.8, 1.3, 0.6].map((factor, idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: '3.5px',
                                  height: `${Math.min(22, Math.max(5, Math.round(liveRecordVolume * 0.22 * factor)))}px`,
                                  backgroundColor: '#dc2626',
                                  borderRadius: '2px',
                                  transition: 'height 0.08s ease'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={cancelRecording} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 14px', borderRadius: '16px', cursor: 'pointer', fontWeight: 500 }}>
                            Bekor qilish
                          </button>
                          <button type="button" onClick={stopRecordingAndSend} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '16px', cursor: 'pointer', fontWeight: 600 }}>
                            Yuborish
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                          accept="image/*,.pdf,.doc,.docx"
                        />

                        <div className="chat-composer-card">
                          <div className="composer-input-row">
                            <input
                              type="text"
                              className="composer-text-input"
                              placeholder={selectedUser.id === 'general' ? "Umumiy guruhga xabar yozing..." : `${selectedUser.name}ga xabar yozing...`}
                              value={inputMessage}
                              onChange={(e) => setInputMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendMessage();
                              }}
                            />
                          </div>
                          <div className="composer-toolbar-row">
                            <div className="composer-left-tools">
                              <button
                                type="button"
                                className="composer-circle-tool"
                                onClick={() => fileInputRef.current?.click()}
                                title="Fayl biriktirish"
                              >
                                <RiAttachment2 size={18} />
                              </button>

                              <button
                                type="button"
                                className={`composer-circle-tool ${showEmojiPicker ? 'active' : ''}`}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                title="Emotsiya qo'shish"
                              >
                                <RiEmotionLine size={18} />
                              </button>
                            </div>

                            <div className="composer-right-tools">
                              <button
                                type="button"
                                className="composer-circle-tool"
                                onClick={startRecording}
                                title="Ovozli xabar yozish"
                              >
                                <RiMicLine size={18} />
                              </button>

                              <button
                                type="button"
                                className="composer-send-pill-btn"
                                onClick={() => handleSendMessage()}
                                disabled={!inputMessage.trim()}
                                style={{
                                  opacity: inputMessage.trim() ? 1 : 0.6,
                                  cursor: inputMessage.trim() ? 'pointer' : 'default'
                                }}
                              >
                                <TbSend size={15} />
                                <span>Yuborish</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                <TbMessageCircle size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                <h3>Suhbatni boshlash uchun foydalanuvchini tanlang</h3>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>Tizimda ro'yxatdan o'tgan barcha xodimlar bilan yozishishingiz mumkin.</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: USER DETAILS CARD */}
          {selectedUser && showUserCard && (
            <div className="chat-details-panel">
              <div className="details-header" style={{ textAlign: 'center', padding: '20px 16px', borderBottom: '1.5px solid #e2e8f0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: selectedUser.id === 'general' ? 'linear-gradient(135deg, #0284c7 0%, #059669 100%)' : '#191919',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '24px',
                  margin: '0 auto 12px auto',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {selectedUser.id === 'general' ? (
                    <TbUsers size={28} />
                  ) : selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(selectedUser.name)
                  )}
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{selectedUser.name}</h4>
                <span className="channel-pill-count" style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '12px', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  {getRoleIcon(selectedUser.role, 12)}
                  <span>{cleanText(selectedUser.roleTitle || selectedUser.role || 'Xodim')}</span>
                </span>
              </div>

              <div style={{ padding: '16px' }}>
                <h5 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  {selectedUser.id === 'general' ? "Guruh ma'lumotlari" : "Foydalanuvchi ma'lumotlari"}
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{selectedUser.id === 'general' ? "A'zolar:" : "Telefon:"}</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      {selectedUser.id === 'general' ? `${users.length + 1} nafar xodim` : selectedUser.phone}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Status:</span>
                    <span style={{ fontWeight: 600, color: selectedUser.isOnline ? '#059669' : '#64748b' }}>
                      {selectedUser.isOnline ? '● Online' : '○ Offline'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{selectedUser.id === 'general' ? "Maqsad:" : "Email:"}</span>
                    <span style={{ fontWeight: 500, color: '#0f172a' }}>
                      {selectedUser.id === 'general' ? "Barcha uchun umumiy kanal" : (selectedUser.email || 'Kiritilmagan')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {viewingImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setViewingImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignSelf: 'flex-end' }}>
              <a
                href={viewingImage}
                download="odim_chat_image.jpg"
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                title="Rasmni yuklab olish"
              >
                <RiDownloadLine size={20} />
              </a>
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                title="Yopish"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            <img
              src={viewingImage}
              alt="Kattalashtirilgan rasm"
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}

      {/* 1. DELETE SELECTED MESSAGES MODAL */}
      {showDeleteConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowDeleteConfirmModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px 24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <RiDeleteBin6Line size={28} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Xabarlarni o'chirish
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5, marginBottom: '22px' }}>
              Haqiqatan ham tanlangan <strong>{selectedMessageIds.length} ta</strong> xabarni o'chirmoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedMessages}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '12px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                }}
              >
                Ha, o'chirilsin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CLEAR FULL CHAT HISTORY MODAL */}
      {showClearHistoryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowClearHistoryModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px 24px',
              maxWidth: '430px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <TbEraser size={28} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Suhbat tarixini tozalash
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5, marginBottom: '22px' }}>
              Siz haqiqatan ham <strong>{selectedUser?.id === 'general' ? 'Umumiy guruhdagi' : `${selectedUser?.name} bilan bo'lgan`}</strong> barcha xabarlarni to'liq tozalab tashlamoqchimisiz?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowClearHistoryModal(false)}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '12px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220,38,38,0.3)'
                }}
              >
                Ha, tozalansin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
