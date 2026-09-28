import React, { useState, useEffect, useRef } from 'react';
import { 
  TbUser, TbSend, TbDotsVertical, TbMessageCircle, TbUsers, TbClock, TbArchive, TbStar, 
  TbVideo, TbPhoneOff, TbMicrophone, TbMicrophoneOff 
} from 'react-icons/tb';
import {
  RiTelegramFill,
  RiInstagramFill,
  RiFacebookFill,
  RiShoppingBag3Line,
  RiUserSharedLine,
  RiCloseLine,
  RiCheckLine,
  RiPhoneFill,
  RiFileTextLine,
  RiAddLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiFireLine,
  RiStarLine,
  RiAttachment2,
  RiEmotionLine,
  RiMicLine,
  RiImageLine
} from 'react-icons/ri';
import { io, Socket } from 'socket.io-client';
import './ChatInbox.css';

// ---------------- AUDIO WAVE VISUALIZER COMPONENT ----------------
interface VisualizerProps {
  stream: MediaStream | null;
  color: string;
  isMuted: boolean;
}

function AudioVisualizer({ stream, color, isMuted }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!stream || isMuted || !stream.getAudioTracks().length) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      // Mobil/Desktop brauzerda AudioContextni faollashtirish (Resume)
      if (audioContext.state === 'suspended') {
        const resume = () => {
          if (audioContext.state === 'suspended') {
            audioContext.resume().catch(err => console.log("AudioContext resume failed:", err));
          }
        };
        window.addEventListener('click', resume);
        window.addEventListener('touchstart', resume);
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        if (!canvasRef.current) return;
        animationRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const intensity = average / 255;

        const width = canvas.width;
        const height = canvas.height;
        const sliceWidth = width / 100;
        const time = Date.now() * 0.008;

        // 1-to'lqin
        ctx.beginPath();
        ctx.lineWidth = 3 + intensity * 6;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.moveTo(0, height / 2);

        for (let i = 0; i <= 100; i++) {
          const x = i * sliceWidth;
          const amp = (height / 2.5) * (intensity > 0.05 ? intensity : 0.05);
          const y = height / 2 + Math.sin(i * 0.15 + time) * amp * Math.sin(i * Math.PI / 100);
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.shadowBlur = 0;

        // 2-to'lqin
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = color + '55';
        ctx.moveTo(0, height / 2);
        for (let i = 0; i <= 100; i++) {
          const x = i * sliceWidth;
          const amp = (height / 3.5) * (intensity > 0.05 ? intensity : 0.05);
          const y = height / 2 + Math.sin(i * 0.25 - time) * amp * Math.sin(i * Math.PI / 100);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      draw();
    } catch (e) {
      console.error("Audio visualizer error:", e);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream, color, isMuted]);

  return (
    <canvas 
      ref={canvasRef} 
      width={250} 
      height={80} 
      style={{ 
        width: '100%', 
        maxHeight: '80px', 
        display: 'block',
        pointerEvents: 'none'
      }} 
    />
  );
}

// ---------------- CONTACT AVATAR ILLUSTRATION ----------------
function ContactAvatar({ type, name, size = 48 }: { type?: string; name: string; size?: number }) {
  let resolvedType = type;
  if (!resolvedType || resolvedType === 'default') {
    const types = ['alisher', 'gulom', 'nigora', 'arlene', 'jacob'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    resolvedType = types[Math.abs(hash) % types.length];
  }
  if (resolvedType === 'alisher') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '50%', flexShrink: 0 }}>
        <circle cx="24" cy="24" r="24" fill="#FEF3C7"/>
        <path d="M11 44C11 35 17 31 24 31C31 31 37 35 37 44" fill="#2563EB"/>
        <circle cx="24" cy="20" r="9" fill="#FDBA74"/>
        <path d="M15 18C15 12 18 9 24 9C30 9 33 12 33 18C33 18 30 14 24 14C18 14 15 18 15 18Z" fill="#D97706"/>
      </svg>
    );
  }
  if (type === 'gulom') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '50%', flexShrink: 0 }}>
        <circle cx="24" cy="24" r="24" fill="#ECFCCB"/>
        <path d="M11 44C11 35 17 31 24 31C31 31 37 35 37 44" fill="#65A30D"/>
        <circle cx="24" cy="20" r="9" fill="#EAB308"/>
        <path d="M15 18C15 12 18 9 24 9C30 9 33 12 33 18C33 18 30 14 24 14C18 14 15 18 15 18Z" fill="#4D7C0F"/>
      </svg>
    );
  }
  if (type === 'nigora') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '50%', flexShrink: 0 }}>
        <circle cx="24" cy="24" r="24" fill="#FFE4E6"/>
        <path d="M11 44C11 35 17 31 24 31C31 31 37 35 37 44" fill="#F43F5E"/>
        <circle cx="24" cy="20" r="9" fill="#FECDD3"/>
        <path d="M14 19C14 11 18 8 24 8C30 8 34 11 34 19C34 19 30 13 24 13C18 13 14 19 14 19Z" fill="#881337"/>
      </svg>
    );
  }
  if (type === 'arlene') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '50%', flexShrink: 0 }}>
        <circle cx="24" cy="24" r="24" fill="#FFEDD5"/>
        <path d="M11 44C11 35 17 31 24 31C31 31 37 35 37 44" fill="#3B82F6"/>
        <circle cx="24" cy="20" r="9" fill="#FDBA74"/>
        <path d="M14 19C14 11 18 8 24 8C30 8 34 11 34 19C34 19 30 13 24 13C18 13 14 19 14 19Z" fill="#9A3412"/>
      </svg>
    );
  }
  if (type === 'jacob') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '50%', flexShrink: 0 }}>
        <circle cx="24" cy="24" r="24" fill="#F1F5F9"/>
        <path d="M11 44C11 35 17 31 24 31C31 31 37 35 37 44" fill="#64748B"/>
        <circle cx="24" cy="20" r="9" fill="#CBD5E1"/>
        <path d="M15 18C15 12 18 9 24 9C30 9 33 12 33 18C33 18 30 14 24 14C18 14 15 18 15 18Z" fill="#334155"/>
      </svg>
    );
  }
  return (
    <div className="contact-avatar-fallback" style={{ width: size, height: size, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
      <TbUser size={size * 0.55} />
    </div>
  );
}

interface Message { 
  id: string | number; 
  text: string; 
  time: string; 
  isMe: boolean; 
  type?: string; 
  mediaUrl?: string | null; 
  fileId?: string | null; 
}

interface ChatContact { 
  chatId: string; 
  name: string; 
  lastMessage: string; 
  time: string; 
  source: string; 
  unreadCount: number; 
  messages: Message[]; 
  isOnline?: boolean;
  phone?: string;
  company?: string;
  dealStatus?: string;
  isTyping?: boolean;
  isMissedCall?: boolean;
  isAudio?: boolean;
  avatarType?: 'alisher' | 'gulom' | 'nigora' | 'arlene' | 'jacob' | 'default';
}

const DEFAULT_OMNICHANNEL_CONTACTS: ChatContact[] = [
  {
    chatId: 'ig-alisher',
    name: 'Alisher Nabiyev',
    lastMessage: 'typing...',
    time: '07:40 AM',
    source: 'instagram',
    unreadCount: 0,
    isOnline: true,
    isTyping: true,
    avatarType: 'alisher',
    phone: '+998 90 777 12 34',
    company: 'Nabiyev Tech Solutions',
    dealStatus: 'Muzokara jarayonida',
    messages: [
      { id: 1, text: 'Salom, yangi loyiha bo‘yicha taklifingizni ko‘rib chiqdik. Bugun batafsil gaplashsak bo‘ladimi?', time: '04:22 PM', isMe: true },
      { id: 2, text: 'Assalomu alaykum! Albatta, qulay vaqtni aytsangiz, online uchrashuv tashkil qilamiz.', time: '04:22 PM', isMe: false }
    ]
  },
  {
    chatId: 'ig-gulom',
    name: "G'ulom G'ofurov",
    lastMessage: 'Please carry it carefully',
    time: '07:45 AM',
    source: 'instagram',
    unreadCount: 1,
    isOnline: true,
    avatarType: 'gulom',
    phone: '+998 91 234 56 78',
    company: 'Gofurov Logistics',
    dealStatus: 'Yangi so\'rov',
    messages: [
      { id: 1, text: 'Assalomu alaykum, tovarlarni jo‘natishga tayyormiz.', time: '07:40 AM', isMe: true },
      { id: 2, text: 'Please carry it carefully', time: '07:45 AM', isMe: false }
    ]
  },
  {
    chatId: 'ig-nigora',
    name: 'Nigora Karimova',
    lastMessage: 'Missed call',
    time: '08:23 AM',
    source: 'instagram',
    unreadCount: 0,
    isOnline: false,
    isMissedCall: true,
    avatarType: 'nigora',
    phone: '+998 93 456 78 90',
    company: 'Karimova Studio',
    dealStatus: 'Qayta aloqa kutilmoqda',
    messages: [
      { id: 1, text: 'Missed call', time: '08:23 AM', isMe: false }
    ]
  },
  {
    chatId: 'tg-arlene',
    name: 'AArlene Lily',
    lastMessage: 'audio file',
    time: '09:35 AM',
    source: 'telegram',
    unreadCount: 0,
    isOnline: true,
    isAudio: true,
    avatarType: 'arlene',
    phone: '+998 99 888 77 66',
    company: 'Global Media Agency',
    dealStatus: 'Muzokara jarayonida',
    messages: [
      { id: 1, text: 'audio file', time: '09:35 AM', isMe: false }
    ]
  },
  {
    chatId: 'fb-jacob',
    name: 'Jacob Jones',
    lastMessage: 'Okay',
    time: 'Yesterday',
    source: 'facebook',
    unreadCount: 1,
    isOnline: false,
    avatarType: 'jacob',
    phone: '+998 95 111 22 33',
    company: 'Jones Trading Co.',
    dealStatus: 'Taklif yuborildi',
    messages: [
      { id: 1, text: 'Shartnomani tasdiqlab berishingiz mumkinmi?', time: 'Kecha 17:30', isMe: true },
      { id: 2, text: 'Okay', time: 'Yesterday', isMe: false }
    ]
  },
  {
    chatId: 'tg-1',
    name: 'Otabek Mirzayev',
    lastMessage: 'Katta partiya buyurtmasi bo\'yicha qayta aloqaga chiqasizmi?',
    time: '14:20',
    source: 'telegram',
    unreadCount: 1,
    isOnline: true,
    avatarType: 'default',
    phone: '+998 90 123 45 67',
    company: 'Silk Road Logistics',
    dealStatus: 'Muzokara jarayonida',
    messages: [
      { id: 1, text: 'Assalomu alaykum, yangi katalog bo\'yicha savolim bor edi', time: '14:15', isMe: false },
      { id: 2, text: 'Va alaykum assalom! Albatta, qaysi tovarlar qiziqtiryapti?', time: '14:18', isMe: true },
      { id: 3, text: 'Katta partiya buyurtmasi bo\'yicha qayta aloqaga chiqasizmi?', time: '14:20', isMe: false },
    ]
  }
];

export default function ChatInbox() {
  const [contacts, setContacts] = useState<ChatContact[]>(DEFAULT_OMNICHANNEL_CONTACTS);
  const [activeChatId, setActiveChatId] = useState<string>('ig-alisher');
  const [channelFilter, setChannelFilter] = useState<'all' | 'telegram' | 'instagram' | 'facebook'>('all');
  const [showCustomerCard, setShowCustomerCard] = useState(true);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [dealTitle, setDealTitle] = useState('');
  const [dealAmount, setDealAmount] = useState('');
  const [dealSuccessMsg, setDealSuccessMsg] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState('Sardor Qodirov');
  const [transferNote, setTransferNote] = useState('');
  const [replyText, setReplyText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- VIDEO CALL STATES ---
  const [isCalling, setIsCalling] = useState(false);
  const [isClientJoined, setIsClientJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState<string>('');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null);
  const [savedGifs, setSavedGifs] = useState<string[]>([]);
  const [savedStickers, setSavedStickers] = useState<string[]>([]);
  const [isGifPanelOpen, setIsGifPanelOpen] = useState(false);
  const [gifPanelTab, setGifPanelTab] = useState<'gifs' | 'stickers'>('gifs');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    type: 'chat_gif' | 'saved_gif' | 'chat_sticker' | 'saved_sticker';
    targetUrl: string;
    messageId?: string | number;
    fileId?: string | null;
  }>({ x: 0, y: 0, visible: false, type: 'chat_gif', targetUrl: '' });
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [contacts, activeChatId]);

  useEffect(() => {
    const handleCloseMenu = () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
      setHeaderMenuOpen(false);
    };
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : window.location.origin;

    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('CHAT_HISTORY', (history: ChatContact[]) => {
      const existingIds = new Set(DEFAULT_OMNICHANNEL_CONTACTS.map(d => d.chatId));
      const combined = [
        ...DEFAULT_OMNICHANNEL_CONTACTS,
        ...history.filter(h => !existingIds.has(h.chatId))
      ];
      setContacts(combined);
    });

    newSocket.on('SAVED_GIFS', (gifs: string[]) => {
      setSavedGifs(gifs);
    });

    newSocket.on('SAVED_STICKERS', (stickers: string[]) => {
      setSavedStickers(stickers);
    });

    newSocket.on('TUNNEL_URL', (url: string) => {
      setTunnelUrl(url);
    });

    newSocket.on('CHAT_MESSAGE', (msg: any) => {
      setContacts(prev => {
        const existing = prev.find(c => c.chatId === msg.chatId.toString());
        if (existing) {
          return prev.map(c => {
            if (c.chatId === msg.chatId.toString()) {
              return {
                ...c,
                lastMessage: msg.text,
                time: msg.time,
                unreadCount: activeChatId === c.chatId ? 0 : c.unreadCount + 1,
                messages: [...c.messages, { id: msg.id, text: msg.text, time: msg.time, isMe: msg.isMe, type: msg.type, mediaUrl: msg.mediaUrl }]
              };
            }
            return c;
          });
        } else {
          const newContact: ChatContact = { 
            chatId: msg.chatId.toString(),
            name: msg.name,
            lastMessage: msg.text,
            time: msg.time,
            source: msg.source,
            unreadCount: activeChatId === msg.chatId.toString() ? 0 : 1,
            isOnline: true,
            messages: [{ id: msg.id, text: msg.text, time: msg.time, isMe: msg.isMe, type: msg.type, mediaUrl: msg.mediaUrl }]
          };
          if (!activeChatId) setActiveChatId(newContact.chatId);
          return [newContact, ...prev];
        }
      });
    });

    const candidateQueue: any[] = [];

    // WEBRTC SIGNALING HANDLERS (Agent Side)
    newSocket.on('CLIENT_JOINED', async () => {
       setIsClientJoined(true);
       try {
         const pc = new RTCPeerConnection({
           iceServers: [
             { urls: 'stun:stun.l.google.com:19302' },
             { urls: 'stun:stun1.l.google.com:19302' },
             { urls: 'stun:stun2.l.google.com:19302' },
             { urls: 'stun:stun.xten.com' }
           ]
         });
         peerConnection.current = pc;
         if (localStream.current) localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current!));
          pc.ontrack = (event) => {
            const rStream = event.streams[0];
            setRemoteStream(rStream);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = rStream;
                remoteVideoRef.current.muted = false;
                remoteVideoRef.current.play().catch(err => console.error("Remote video play failed:", err));
              }
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = rStream;
                remoteAudioRef.current.volume = 1.0;
                remoteAudioRef.current.play().catch(err => console.error("Remote audio play failed:", err));
              }
          };
         pc.onicecandidate = (event) => { if (event.candidate) newSocket.emit('WEBRTC_ICE_CANDIDATE', { chatId: activeChatId, candidate: event.candidate }); };
         
         const offer = await pc.createOffer();
         await pc.setLocalDescription(offer);
         newSocket.emit('WEBRTC_OFFER', { chatId: activeChatId, offer });
       } catch (err) { console.error(err); }
    });

    newSocket.on('WEBRTC_ANSWER', async (answer) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        while (candidateQueue.length > 0) {
          const cand = candidateQueue.shift();
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(cand));
          } catch (err) {
            console.error("Ice candidate processing error:", err);
          }
        }
      }
    });

    newSocket.on('WEBRTC_ICE_CANDIDATE', async (candidate) => {
      if (peerConnection.current) {
        try {
          if (peerConnection.current.remoteDescription) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            candidateQueue.push(candidate);
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    newSocket.on('CALL_ENDED', () => { endCall(); });

    return () => { newSocket.disconnect(); }
  }, [activeChatId]);

  const activeChat = contacts.find(c => c.chatId === activeChatId);

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId);
    if (socket) {
      socket.emit('MARK_READ', { chatId });
    }
  };

  const handleSend = () => {
    if (!replyText.trim() || !activeChat) return;
    const newMsg: Message = { id: Date.now(), text: replyText, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), isMe: true };
    setContacts(prev => prev.map(c => c.chatId === activeChatId ? { ...c, lastMessage: replyText, time: newMsg.time, messages: [...c.messages, newMsg] } : c));
    if (socket) socket.emit('SEND_REPLY', { chatId: activeChat.chatId, text: replyText });
    setReplyText('');
  };

  const handleSendTestInstagramMessage = async () => {
    setIsSendingTest(true);
    try {
      const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : window.location.origin;

      const randomMessages = [
        "Assalomu alaykum! Profilingizdan ko'rdim, tovarlar narxi qancha? Yetkazib berish bormi?",
        "Salom! Instagram Direct orqali yozyapman, yangi katalogingiz bormi?",
        "Katalogingizni ko'rib chiqdim, qanday qilib buyurtma qilsam bo'ladi?",
        "Assalomu alaykum, yangi chegirmalar haqida ma'lumot bera olasizmi?"
      ];
      const randomText = randomMessages[Math.floor(Math.random() * randomMessages.length)];
      const randomNames = ["Nilufar (Instagram Direct)", "Jasur Karimov (Instagram)", "Ziyoda (Instagram Direct)", "Shaxzod (Instagram)"];
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];

      await fetch(`${socketUrl}/api/social/simulate-test-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'instagram',
          senderName: randomName,
          text: randomText
        })
      });
      setChannelFilter('instagram');
    } catch (err) {
      console.error("Test xabar yuborishda xato:", err);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleClearHistory = () => {
    if (!activeChat) return;
    const confirmClear = window.confirm("Haqiqatan ham ushbu chat tarixini tozalamoqchimisiz? Barcha xabarlar butunlay o'chiriladi.");
    if (confirmClear) {
      if (socket) {
        socket.emit('CLEAR_HISTORY', { chatId: activeChat.chatId });
      }
      setContacts(prev =>
        prev.map(c =>
          c.chatId === activeChat.chatId
            ? { ...c, messages: [], lastMessage: '' }
            : c
        )
      );
    }
  };

  const startCall = async () => {
    if (!socket || !activeChat) return;
    setIsCalling(true);

    // Click gesture paytida audio/video elementlarini "unlock" qilamiz
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().catch(e => console.log("Unlock manager audio on gesture:", e));
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play().catch(e => console.log("Unlock manager video on gesture:", e));
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      console.log("Qurilma xatoligi...");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      } catch (err2) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (err3) {
          stream = new MediaStream();
        }
      }
    }
    
    localStream.current = stream;
     if (localVideoRef.current && stream && stream.getVideoTracks().length > 0) {
       localVideoRef.current.srcObject = stream;
       localVideoRef.current.muted = true;
       localVideoRef.current.play().catch(e => console.log("Local video play failed:", e));
     }

    // BRAUZER O'ZI TURGAN HOZIRGI JORIY HAVOLANI BACKENDGA YUBORADI! (ENG ISHONCHLI YO'L)
    const callLink = `${window.location.origin}/call/${activeChat.chatId}`;
    socket.emit('START_CALL', { chatId: activeChat.chatId, callLink });
  };

  const endCall = () => {
    setIsCalling(false);
    setIsClientJoined(false);
    setRemoteStream(null);
    if (localStream.current) localStream.current.getTracks().forEach(track => track.stop());
    if (peerConnection.current) peerConnection.current.close();
    if (socket && activeChat) socket.emit('END_CALL', { chatId: activeChat.chatId });
  };

  const toggleMute = () => {
    if (localStream.current && localStream.current.getAudioTracks().length > 0) {
      localStream.current.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            if (socket && activeChat) {
              socket.emit('SEND_MEDIA', {
                chatId: activeChat.chatId,
                base64: base64Data,
                filename: file.name || 'screenshot.png'
              });
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  return (
    <div className="inbox-page-wrapper">
      {/* 1. TOP CHANNEL BAR (Telegram, Instagram, Facebook at top as requested) */}
      <div className="chat-top-channel-bar">
        <div className="top-channel-tabs">
          <button
            className={`top-channel-pill ${channelFilter === 'all' ? 'active' : ''}`}
            onClick={() => setChannelFilter('all')}
          >
            <span>Barchasi</span>
            <span className="channel-pill-count">{contacts.length}</span>
          </button>
          <button
            className={`top-channel-pill tg ${channelFilter === 'telegram' ? 'active' : ''}`}
            onClick={() => setChannelFilter('telegram')}
            title="Telegram suhbatlar"
          >
            <RiTelegramFill size={18} />
            <span>Telegram</span>
            <span className="channel-pill-count">{contacts.filter(c => c.source === 'telegram').length}</span>
          </button>
          <button
            className={`top-channel-pill ig ${channelFilter === 'instagram' ? 'active' : ''}`}
            onClick={() => setChannelFilter('instagram')}
            title="Instagram Direct"
          >
            <RiInstagramFill size={18} />
            <span>Instagram</span>
            <span className="channel-pill-count">{contacts.filter(c => c.source === 'instagram').length}</span>
          </button>
          <button
            className={`top-channel-pill fb ${channelFilter === 'facebook' ? 'active' : ''}`}
            onClick={() => setChannelFilter('facebook')}
            title="Facebook Messenger"
          >
            <RiFacebookFill size={18} />
            <span>Facebook</span>
            <span className="channel-pill-count">{contacts.filter(c => c.source === 'facebook').length}</span>
          </button>
        </div>

        <div className="top-channel-right">
          <button
            className="top-test-msg-btn"
            disabled={isSendingTest}
            onClick={handleSendTestInstagramMessage}
            title="Instagram Direct orqali yangi test xabar simulyatsiya qilish"
          >
            <RiInstagramFill size={17} />
            <span>{isSendingTest ? "Yuborilmoqda..." : "+ Test Instagram xabari"}</span>
          </button>
          <button
            className={`top-profile-btn ${showCustomerCard ? 'active' : ''}`}
            onClick={() => setShowCustomerCard(!showCustomerCard)}
            title="Mijoz kartochkasi paneli"
          >
            <TbUser size={16} />
            <span>Mijoz profili</span>
          </button>
        </div>
      </div>

      <div className="chat-layout">
        {/* UNIFIED CONTAINER: Contact list and Chat window seamlessly joined */}
        <div className="chat-unified-container">
          {/* 2. CONTACT LIST (Left Column) */}
          <div className="chat-contacts-panel">
          <div className="contacts-panel-header">
            <h2 className="contacts-panel-title">Contact list</h2>
          </div>

          <div className="contacts-list">
            {contacts.filter(c => channelFilter === 'all' || c.source === channelFilter).length === 0 ? (
              <div style={{padding: '30px', color: '#94a3b8', textAlign: 'center', fontSize: '14px'}}>Suhbatlar topilmadi</div>
            ) : (
              contacts.filter(c => channelFilter === 'all' || c.source === channelFilter).map(c => (
                <div 
                  key={c.chatId} 
                  className={`contact-card-item ${activeChatId === c.chatId ? 'active' : ''}`} 
                  onClick={() => selectChat(c.chatId)}
                >
                  <div className="contact-card-avatar-wrap">
                    <ContactAvatar type={c.avatarType} name={c.name} size={46} />
                    <div className={`channel-mini-badge ${c.source || 'telegram'}`}>
                      {c.source === 'instagram' && <RiInstagramFill size={10} />}
                      {c.source === 'facebook' && <RiFacebookFill size={10} />}
                      {(!c.source || c.source === 'telegram') && <RiTelegramFill size={10} />}
                    </div>
                  </div>

                  <div className="contact-card-content">
                    <div className="contact-card-top-row">
                      <span className="contact-card-name">{c.name}</span>
                      <span className="contact-card-time">{c.time}</span>
                    </div>
                    <div className="contact-card-bottom-row">
                      {c.isTyping ? (
                        <span className="contact-status-typing">typing...</span>
                      ) : c.isMissedCall ? (
                        <span className="contact-status-missed">
                          <RiPhoneFill size={12} style={{ transform: 'rotate(135deg)', display: 'inline-block' }} /> Missed call
                        </span>
                      ) : (
                        <span className="contact-card-preview">{c.lastMessage || 'Yangi xabar...'}</span>
                      )}

                      {c.unreadCount > 0 && (
                        <span className="contact-unread-badge">{c.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. CHAT WINDOW (Center Column) */}
        <div className="chat-window-panel">
          {activeChat ? (
            <>
              <div className="chat-window-header">
                <div className="cw-header-left">
                  <div className="cw-avatar-wrap">
                    <ContactAvatar type={activeChat.avatarType} name={activeChat.name} size={44} />
                    <div className={`cw-online-indicator ${activeChat.isOnline ? 'online' : ''}`}></div>
                  </div>
                  <div className="cw-header-info">
                    <h3 className="cw-header-name">{activeChat.name}</h3>
                    <span className="cw-header-status">
                      <span className="cw-status-dot"></span> Onlayn
                    </span>
                  </div>
                </div>

                <div className="cw-header-actions">
                  <button
                    className="quick-deal-btn"
                    onClick={() => {
                      setDealTitle(`${activeChat.name} — Yangi buyurtma`);
                      setDealAmount('15,000,000');
                      setDealModalOpen(true);
                    }}
                    title="Xabardan Kanbanga yangi bitim yaratish"
                  >
                    <RiShoppingBag3Line size={18} />
                    <span>Bitim yaratish</span>
                  </button>

                  <button
                    className="quick-transfer-btn"
                    onClick={() => setTransferModalOpen(true)}
                    title="Chatni boshqa xodimga uzatish"
                  >
                    <RiUserSharedLine size={18} />
                    <span>Uzatish</span>
                  </button>

                  <button
                    className={`quick-profile-toggle-btn ${showCustomerCard ? 'active' : ''}`}
                    onClick={() => setShowCustomerCard(!showCustomerCard)}
                    title="Mijoz kartochkasi"
                  >
                    <TbUser size={20} />
                  </button>

                  <TbVideo size={20} color="#002BFF" style={{cursor: 'pointer'}} onClick={startCall} title="Video qo'ng'iroq" />
                  <TbDotsVertical 
                    size={20} 
                    color="#666" 
                    style={{cursor: 'pointer'}} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setHeaderMenuOpen(!headerMenuOpen);
                    }}
                  />
                  {headerMenuOpen && (
                    <div className="header-dropdown-menu">
                      <button 
                        onClick={() => {
                          setHeaderMenuOpen(false);
                          handleClearHistory();
                        }}
                        className="header-dropdown-item danger"
                      >
                        <RiDeleteBinLine size={15} style={{ marginRight: '6px' }} /> Tarixni tozalash
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Call Overlay */}
              <div className="inchat-video-call" style={{ display: isCalling ? 'flex' : 'none' }}>
                {!isClientJoined && <div className="calling-overlay">Mijoz qo'shilishi kutilmoqda... (havola jo'natildi)</div>}
                 <video ref={remoteVideoRef} autoPlay playsInline className="inchat-remote-video" />
                 <video ref={localVideoRef} autoPlay playsInline muted className="inchat-local-video" />
                
                <div className="inchat-audio-waves-container">
                  <div className="inchat-wave-box">
                    <span className="inchat-wave-label">Siz</span>
                    <AudioVisualizer stream={localStream.current} color="#30d158" isMuted={isMuted} />
                  </div>
                  <div className="inchat-wave-box">
                    <span className="inchat-wave-label">Mijoz</span>
                    <AudioVisualizer stream={remoteStream} color="#007aff" isMuted={false} />
                  </div>
                </div>

                <div className="inchat-controls">
                  <button onClick={toggleMute} className="icon-btn">{isMuted ? <TbMicrophoneOff /> : <TbMicrophone />}</button>
                  <button onClick={endCall} className="icon-btn danger"><TbPhoneOff /></button>
                </div>
              </div>

              {/* Messages Container Box */}
              <div className="chat-messages-container-box">
                <div className="chat-messages-area">
                  <div className="chat-divider"><span>Today</span></div>
                  {activeChat.messages.map((msg: any, i) => (
                    <div key={i} className={`message-wrapper ${msg.isMe ? 'is-me' : 'is-other'}`}>
                      <div className={`message-bubble ${msg.isMe ? 'bubble-me' : 'bubble-other'} ${msg.type === 'sticker' || msg.type === 'video_sticker' ? 'sticker-bubble' : ''}`}>
                        {msg.type === 'photo' && msg.mediaUrl ? (
                          <div className="chat-media-wrapper" onClick={() => setActiveLightboxUrl(msg.mediaUrl)} style={{ cursor: 'zoom-in' }}>
                            <img src={msg.mediaUrl} alt="Rasm" className="chat-media-image" />
                            {msg.text && msg.text !== '[Rasm]' && <p className="bubble-text">{msg.text}</p>}
                          </div>
                        ) : msg.type === 'gif' && msg.mediaUrl ? (
                          <div 
                            className="chat-media-wrapper" 
                            style={{ position: 'relative' }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                visible: true,
                                type: 'chat_gif',
                                targetUrl: msg.mediaUrl,
                                messageId: msg.id
                              });
                            }}
                          >
                            {msg.mediaUrl.endsWith('.mp4') ? (
                              <video src={msg.mediaUrl} autoPlay loop muted playsInline className="chat-media-gif" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px' }} />
                            ) : (
                              <img src={msg.mediaUrl} alt="GIF" className="chat-media-gif" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px' }} />
                            )}
                            {!msg.isMe && (
                              <button 
                                className="gif-save-badge" 
                                title="GIFlarimga saqlash" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (socket) socket.emit('SAVE_GIF', { gifUrl: msg.mediaUrl });
                                  alert("GIF muvaffaqiyatli saqlandi!");
                                }}
                              >
                                <RiDownloadLine size={13} style={{ marginRight: '4px' }} /> Saqlash
                              </button>
                            )}
                            {msg.text && msg.text !== '[GIF]' && <p className="bubble-text">{msg.text}</p>}
                          </div>
                        ) : (msg.type === 'sticker' || msg.type === 'video_sticker') && msg.mediaUrl ? (
                          <div 
                            className="chat-media-wrapper" 
                            style={{ position: 'relative' }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                visible: true,
                                type: 'chat_sticker',
                                targetUrl: msg.mediaUrl,
                                messageId: msg.id,
                                fileId: (msg as any).fileId
                              });
                            }}
                          >
                            {msg.type === 'video_sticker' ? (
                              <video src={msg.mediaUrl} autoPlay loop muted playsInline className="chat-media-sticker" />
                            ) : (
                              <img src={msg.mediaUrl} alt="Stiker" className="chat-media-sticker" />
                            )}
                            {!msg.isMe && (
                              <button 
                                className="gif-save-badge" 
                                title="Stikerlarimga saqlash" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (socket) socket.emit('SAVE_STICKER', { stickerUrl: msg.mediaUrl, fileId: (msg as any).fileId });
                                  alert("Stiker muvaffaqiyatli saqlandi!");
                                }}
                              >
                                <RiDownloadLine size={13} style={{ marginRight: '4px' }} /> Saqlash
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="bubble-text">{msg.text}</p>
                        )}
                        <div className="bubble-meta">
                          <span className="message-time">{msg.time}</span>
                          {!msg.isMe && (
                            <span className="bubble-status-icon" title="Yetkazildi">
                              <RiCheckLine size={14} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Bottom Input Area */}
              <div className="chat-input-area" style={{ position: 'relative' }}>
                {isGifPanelOpen && (
                  <div className="gif-selector-panel">
                    <div className="gif-panel-header">
                      <div className="gif-panel-tabs">
                        <span className={`panel-tab ${gifPanelTab === 'gifs' ? 'active' : ''}`} onClick={() => setGifPanelTab('gifs')}>GIFlar</span>
                        <span className={`panel-tab ${gifPanelTab === 'stickers' ? 'active' : ''}`} onClick={() => setGifPanelTab('stickers')}>Stikerlar</span>
                      </div>
                      <button className="gif-panel-close" onClick={() => setIsGifPanelOpen(false)}>&times;</button>
                    </div>
                    <div className="gif-grid">
                      {gifPanelTab === 'gifs' ? (
                        savedGifs.length === 0 ? (
                          <div className="no-gifs">Hozircha saqlangan GIFlar yo'q. Kelgan GIFlardagi 'Saqlash' tugmasini bosing!</div>
                        ) : (
                          savedGifs.map((url, index) => (
                            <div 
                              key={index} 
                              className="gif-grid-item" 
                              onClick={() => {
                                if (socket && activeChat) {
                                  socket.emit('SEND_SAVED_GIF', { chatId: activeChat.chatId, gifUrl: url });
                                  setIsGifPanelOpen(false);
                                }
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  visible: true,
                                  type: 'saved_gif',
                                  targetUrl: url
                                });
                              }}
                            >
                              {url.endsWith('.mp4') ? (
                                <video src={url} autoPlay loop muted playsInline className="gif-grid-video" />
                              ) : (
                                <img src={url} alt="GIF" className="gif-grid-video" />
                              )}
                            </div>
                          ))
                        )
                      ) : (
                        savedStickers.length === 0 ? (
                          <div className="no-gifs">Hozircha saqlangan stikerlar yo'q. Kelgan stikerlardagi 'Saqlash' tugmasini bosing!</div>
                        ) : (
                          savedStickers.map((item: any, index) => {
                            const url = typeof item === 'string' ? item : (item.url || '');
                            const fileId = typeof item === 'string' ? null : (item.fileId || null);
                            return ( 
                              <div 
                                key={index} 
                                className="gif-grid-item" 
                                onClick={() => {
                                  if (socket && activeChat) {
                                    socket.emit('SEND_SAVED_STICKER', { chatId: activeChat.chatId, stickerUrl: url, fileId: fileId });
                                    setIsGifPanelOpen(false);
                                  }
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    visible: true,
                                    type: 'saved_sticker',
                                    targetUrl: url
                                  });
                                }}
                              >
                                {url.endsWith('.webm') ? (
                                  <video src={url} autoPlay loop muted playsInline className="gif-grid-video" />
                                ) : (
                                  <img src={url} alt="Sticker" className="gif-grid-video" />
                                )}
                              </div>
                            );
                          })
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Modern Composer Card */}
                <div className="chat-composer-card">
                  <div className="composer-input-row">
                    <input 
                      type="text" 
                      className="composer-text-input"
                      placeholder="Type a message..." 
                      value={replyText} 
                      onChange={e => setReplyText(e.target.value)} 
                      onKeyPress={e => e.key === 'Enter' && handleSend()} 
                      onPaste={handlePaste} 
                    />
                  </div>
                  <div className="composer-toolbar-row">
                    <div className="composer-left-tools">
                      <button type="button" className="composer-circle-tool" title="Fayl biriktirish" onClick={() => alert("Fayl biriktirish")}>
                        <RiAttachment2 size={18} />
                      </button>
                      <button type="button" className="composer-circle-tool" title="Emotsiya qo'shish" onClick={() => setReplyText(prev => prev + ' 😊')}>
                        <RiEmotionLine size={18} />
                      </button>
                    </div>

                    <div className="composer-right-tools">
                      <button 
                        type="button" 
                        className={`composer-circle-tool ${isGifPanelOpen ? 'active' : ''}`} 
                        title="GIF va stikerlar" 
                        onClick={() => setIsGifPanelOpen(!isGifPanelOpen)}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>GIF</span>
                      </button>
                      <button type="button" className="composer-circle-tool" title="Rasm yuborish" onClick={() => alert("Rasm tanlang")}>
                        <RiImageLine size={18} />
                      </button>
                      <button type="button" className="composer-circle-tool" title="Ovozli xabar" onClick={() => alert("Ovoz yozish")}>
                        <RiMicLine size={18} />
                      </button>
                      <button type="button" className="composer-send-pill-btn" onClick={handleSend} title="Yuborish">
                        <TbSend size={15} />
                        <span>Yuborish</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
          <div className="no-chat-selected">
            <div className="no-chat-animated-wrapper">
              <div className="no-chat-icon-halo">
                <div className="no-chat-icon-circle">
                  <TbMessageCircle size={48} className="no-chat-icon" />
                </div>
              </div>
              <h3 className="no-chat-title">Muloqotni boshlash uchun chatni tanlang</h3>
              <p className="no-chat-subtitle">Chap tomondagi suhbatlardan birini tanlang yoki yangi murojaatni kuting</p>
            </div>
            
            {tunnelUrl && (
              <div className="tunnel-info-box">
                <div className="tunnel-info-header">
                  <span className="tunnel-pulse"></span>
                  <h4>Mobil yoki boshqa qurilmadan kirish havolasi:</h4>
                </div>
                <div className="tunnel-url-row">
                  <a href={tunnelUrl} target="_blank" rel="noopener noreferrer" className="tunnel-link">
                    {tunnelUrl}
                  </a>
                  <button onClick={() => { navigator.clipboard.writeText(tunnelUrl); alert("Havola nusxalandi!"); }} className="tunnel-copy-btn">
                    Nusxalash
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* 4. Customer Profile Panel (Right Column) */}
      {showCustomerCard && activeChat && (
        <div className="chat-customer-profile-panel">
          <div className="profile-header">
            <div className="profile-avatar-large">
              <TbUser size={36} />
            </div>
            <h4>{activeChat.name}</h4>
            <span className="profile-company">{activeChat.company || 'Yakka tartibdagi mijoz'}</span>
            <div className={`profile-channel-tag ${activeChat.source || 'telegram'}`}>
              {activeChat.source === 'instagram' && <><RiInstagramFill /> Instagram Direct</>}
              {activeChat.source === 'facebook' && <><RiFacebookFill /> Facebook Messenger</>}
              {(!activeChat.source || activeChat.source === 'telegram') && <><RiTelegramFill /> Telegram</>}
            </div>
          </div>

          <div className="profile-actions-grid">
            <button
              className="p-action-btn primary"
              onClick={() => {
                setDealTitle(`${activeChat.name} — Yangi buyurtma`);
                setDealAmount('15,000,000');
                setDealModalOpen(true);
              }}
            >
              <RiShoppingBag3Line size={15} />
              <span>Bitim yaratish</span>
            </button>
            <button
              className="p-action-btn secondary"
              onClick={() => setTransferModalOpen(true)}
            >
              <RiUserSharedLine size={15} />
              <span>Xodimga uzatish</span>
            </button>
          </div>

          <div className="profile-details-scroll">
            <div className="p-section">
              <span className="p-section-title">Aloqa ma'lumotlari</span>
              <div className="p-info-item">
                <span className="p-label">Telefon:</span>
                <span className="p-value">{activeChat.phone || '+998 90 123 45 67'}</span>
              </div>
              <div className="p-info-item">
                <span className="p-label">Chat ID:</span>
                <span className="p-value">{activeChat.chatId}</span>
              </div>
              <div className="p-info-item">
                <span className="p-label">Mas'ul:</span>
                <span className="p-value">{selectedStaff}</span>
              </div>
            </div>

            <div className="p-section">
              <span className="p-section-title">Bitim holati</span>
              <div className="deal-status-card">
                <div className="ds-top">
                  <span className="ds-title">Boshlang'ich muzokara</span>
                  <span className="ds-badge">Kanbanga biriktirilgan</span>
                </div>
                <div className="ds-price">15,000,000 UZS</div>
              </div>
            </div>

            <div className="p-section">
              <span className="p-section-title">Teglar</span>
              <div className="p-tags-wrap">
                <span className="p-tag hot">
                  <RiFireLine size={13} style={{ marginRight: '4px' }} />
                  Issiq lid
                </span>
                <span className="p-tag vip">
                  <RiStarLine size={13} style={{ marginRight: '4px' }} />
                  VIP mijoz
                </span>
                <span className="p-tag b2b">B2B shartnoma</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* CREATE DEAL MODAL */}
      {dealModalOpen && (
        <div className="chat-modal-overlay" onClick={() => setDealModalOpen(false)}>
          <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <h3>Kanbanga yangi bitim yaratish</h3>
              <button className="chat-modal-close" onClick={() => setDealModalOpen(false)}><RiCloseLine size={20} /></button>
            </div>
            <div className="chat-modal-body">
              <div className="modal-field">
                <label>Bitim nomi</label>
                <input
                  type="text"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  placeholder="Bitim nomini kiriting"
                />
              </div>
              <div className="modal-field">
                <label>Taxminiy summa (UZS)</label>
                <input
                  type="text"
                  value={dealAmount}
                  onChange={(e) => setDealAmount(e.target.value)}
                  placeholder="10,000,000"
                />
              </div>
              <div className="modal-field">
                <label>Mijoz</label>
                <input type="text" value={activeChat?.name || ''} readOnly />
              </div>
              <div className="modal-field">
                <label>Boshlang'ich ustun</label>
                <select className="modal-select">
                  <option>Yangi so'rovlar</option>
                  <option>Muzokara jarayonida</option>
                  <option>KP yuborildi</option>
                </select>
              </div>
            </div>
            <div className="chat-modal-footer">
              <button className="btn-cancel" onClick={() => setDealModalOpen(false)}>Bekor qilish</button>
              <button
                className="btn-confirm"
                onClick={() => {
                  setDealModalOpen(false);
                  setDealSuccessMsg(`Bitim muvaffaqiyatli yaratildi va Kanbanga qo'shildi! (${dealTitle})`);
                  setTimeout(() => setDealSuccessMsg(null), 3500);
                }}
              >
                Bitimni saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER CHAT MODAL */}
      {transferModalOpen && (
        <div className="chat-modal-overlay" onClick={() => setTransferModalOpen(false)}>
          <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <h3>Chatni boshqa xodimga uzatish</h3>
              <button className="chat-modal-close" onClick={() => setTransferModalOpen(false)}><RiCloseLine size={20} /></button>
            </div>
            <div className="chat-modal-body">
              <p className="modal-subtext">Mijoz suhbatini boshqa menejerga biriktirish orqali muloqot uzluksizligini ta'minlaysiz.</p>
              <div className="modal-field">
                <label>Xodimni tanlang</label>
                <select
                  className="modal-select"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                >
                  <option value="Sardor Qodirov">Sardor Qodirov (Katta sotuvchi)</option>
                  <option value="Malika Karimova">Malika Karimova (Mijozlar bilan ishlash)</option>
                  <option value="Farhod Qosimov">Farhod Qosimov (Texnik mutaxassis)</option>
                </select>
              </div>
              <div className="modal-field">
                <label>Izoh / Eslatma xodimga</label>
                <textarea
                  rows={3}
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Masalan: Mijoz shartnoma bo'yicha maxsus chegirma so'rayapti..."
                  className="modal-textarea"
                />
              </div>
            </div>
            <div className="chat-modal-footer">
              <button className="btn-cancel" onClick={() => setTransferModalOpen(false)}>Bekor qilish</button>
              <button
                className="btn-confirm"
                onClick={() => {
                  setTransferModalOpen(false);
                  setDealSuccessMsg(`Suhbat muvaffaqiyatli ${selectedStaff} ga uzatildi!`);
                  setTimeout(() => setDealSuccessMsg(null), 3500);
                }}
              >
                Uzatishni tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {dealSuccessMsg && (
        <div className="chat-success-toast">
          <RiCheckboxCircleLine size={20} />
          <span>{dealSuccessMsg}</span>
        </div>
      )}
      
      {/* 4. Telegram Lightbox (Zoomed View Modal) */}
      {activeLightboxUrl && (
        <div className="chat-lightbox-overlay" onClick={() => setActiveLightboxUrl(null)}>
          <button className="lightbox-close-btn" onClick={() => setActiveLightboxUrl(null)}>&times;</button>
          <img src={activeLightboxUrl} alt="Telegram Zoomed View" className="chat-lightbox-content" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* 5. Custom Telegram Premium Context Menu */}
      {contextMenu.visible && (
        <div 
          className="custom-context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'chat_gif' || contextMenu.type === 'chat_sticker' ? (
            <>
              <div 
                className="context-menu-item" 
                onClick={() => {
                  if (socket) {
                    if (contextMenu.type === 'chat_gif') {
                      socket.emit('SAVE_GIF', { gifUrl: contextMenu.targetUrl });
                      alert("GIF muvaffaqiyatli saqlandi!");
                    } else {
                      socket.emit('SAVE_STICKER', { stickerUrl: contextMenu.targetUrl, fileId: (contextMenu as any).fileId });
                      alert("Stiker muvaffaqiyatli saqlandi!");
                    }
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <RiDownloadLine size={14} style={{ marginRight: '6px' }} />
                {contextMenu.type === 'chat_gif' ? 'Saqlash (GIFlarimga)' : 'Saqlash (Stikerlarimga)'}
              </div>
              <div 
                className="context-menu-item danger" 
                onClick={() => {
                  if (socket && activeChatId && contextMenu.messageId) {
                    socket.emit('DELETE_MESSAGE', { chatId: activeChatId, messageId: contextMenu.messageId });
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <RiDeleteBinLine size={14} style={{ marginRight: '6px' }} />
                Xabarni o'chirish
              </div>
            </>
          ) : (
            <div 
              className="context-menu-item danger" 
              onClick={() => {
                if (socket) {
                  if (contextMenu.type === 'saved_gif') {
                    socket.emit('DELETE_SAVED_GIF', { gifUrl: contextMenu.targetUrl });
                  } else {
                    socket.emit('DELETE_SAVED_STICKER', { stickerUrl: contextMenu.targetUrl });
                  }
                }
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              <RiDeleteBinLine size={14} style={{ marginRight: '6px' }} />
              {contextMenu.type === 'saved_gif' ? 'GIFlarimdan o\'chirish' : 'Stikerlarimdan o\'chirish'}
            </div>
          )}
        </div>
      )}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
    </div>
  );
}
