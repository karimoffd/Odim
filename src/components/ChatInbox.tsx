import React, { useState, useEffect, useRef } from 'react';
import { FiUser, FiSend, FiMoreVertical, FiMessageSquare, FiUsers, FiClock, FiArchive, FiStar, FiVideo, FiPhoneOff, FiMic, FiMicOff } from 'react-icons/fi';
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


interface Message { 
  id: string | number; 
  text: string; 
  time: string; 
  isMe: boolean; 
  type?: string; 
  mediaUrl?: string | null; 
  fileId?: string | null; 
}
interface ChatContact { chatId: string; name: string; lastMessage: string; time: string; source: string; unreadCount: number; messages: Message[]; isOnline?: boolean; }

export default function ChatInbox() {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
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
      setContacts(history);
      if (history.length > 0 && !activeChatId) {
        setActiveChatId(history[0].chatId);
      }
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
    <div className="chat-layout">
      {/* 1. Left Nav */}
      <div className="chat-nav-panel">
        <div className="chat-sidebar-item active"><div className="cs-item-left"><FiUser /><span>Barcha suhbatlar</span></div></div>
        <div className="chat-sidebar-item"><div className="cs-item-left"><FiMessageSquare /><span>Yangi habarlar</span></div></div>
        <div className="chat-sidebar-item"><div className="cs-item-left"><FiUsers /><span>Mijozlar</span></div></div>
      </div>

      {/* 2. Contacts Panel */}
      <div className="chat-contacts-panel">
        <h2 className="contacts-title">Contact list</h2>
        <div className="contacts-list">
          {contacts.length === 0 ? (
            <div style={{padding: '20px', color: '#999', textAlign: 'center'}}>Hozircha suhbatlar yo'q</div>
          ) : (
            contacts.map(c => (
              <div key={c.chatId} className={`contact-item ${activeChatId === c.chatId ? 'active' : ''}`} onClick={() => selectChat(c.chatId)}>
                <div className="contact-avatar-wrapper">
                  <div className="contact-avatar"><FiUser size={24} /></div>
                  <div className={`status-dot ${c.isOnline ? 'online' : ''}`}></div>
                </div>
                <div className="contact-info">
                  <div className="contact-header"><h4>{c.name}</h4><span className="contact-time">{c.time}</span></div>
                  <div className="contact-last-msg"><p>{c.lastMessage}</p>{c.unreadCount > 0 && <span className="unread-badge">{c.unreadCount}</span>}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Chat Window */}
      <div className="chat-window-panel">
        {activeChat ? (
          <>
            <div className="chat-window-header">
              <div className="cw-header-left">
                <div className="contact-avatar"><FiUser size={24} /></div>
                <div className="cw-header-info"><h3>{activeChat.name}</h3><span>{activeChat.isOnline ? 'Onlayn' : 'Ofline'}</span></div>
              </div>
              <div style={{display: 'flex', gap: '16px', position: 'relative'}}>
                <FiVideo size={20} color="#002BFF" style={{cursor: 'pointer'}} onClick={startCall} />
                <FiMoreVertical 
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
                      🗑️ Tarixni tozalash
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Video Call Overlay inside Chat Window - Always in DOM but display toggled */}
            <div className="inchat-video-call" style={{ display: isCalling ? 'flex' : 'none' }}>
              {!isClientJoined && <div className="calling-overlay">Mijoz qo'shilishi kutilmoqda... (havola jo'natildi)</div>}
               <video ref={remoteVideoRef} autoPlay playsInline className="inchat-remote-video" />
               <video ref={localVideoRef} autoPlay playsInline muted className="inchat-local-video" />
              
              {/* Har xil to'lqinlar chiqaruvchi visualizer panel (gapirganda to'lqinlar chiqishi uchun) */}
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
                <button onClick={toggleMute} className="icon-btn">{isMuted ? <FiMicOff /> : <FiMic />}</button>
                <button onClick={endCall} className="icon-btn danger"><FiPhoneOff /></button>
              </div>
            </div>

            <div className="chat-messages-area">
              <div className="chat-divider"><span>Bugun</span></div>
              {activeChat.messages.map((msg: any, i) => (
                <div key={i} className={`message-wrapper ${msg.isMe ? 'is-me' : 'is-other'}`}>
                  <div className={`message-bubble ${msg.type === 'sticker' || msg.type === 'video_sticker' ? 'sticker-bubble' : ''}`}>
                    {msg.type === 'photo' && msg.mediaUrl ? (
                      <div className="chat-media-wrapper" onClick={() => setActiveLightboxUrl(msg.mediaUrl)} style={{ cursor: 'zoom-in' }}>
                        <img src={msg.mediaUrl} alt="Telegram Rasm" className="chat-media-image" />
                        {msg.text && msg.text !== '[Rasm]' && <p>{msg.text}</p>}
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
                          <img src={msg.mediaUrl} alt="Telegram GIF" className="chat-media-gif" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px' }} />
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
                            📥 Saqlash
                          </button>
                        )}
                        {msg.text && msg.text !== '[GIF]' && <p>{msg.text}</p>}
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
                          <img src={msg.mediaUrl} alt="Telegram Stiker" className="chat-media-sticker" />
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
                            📥 Saqlash
                          </button>
                        )}
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                    <span className="message-time">{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

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

              <div className="chat-input-wrapper">
                <button 
                  className={`gif-toggle-btn ${isGifPanelOpen ? 'active' : ''}`} 
                  onClick={() => setIsGifPanelOpen(!isGifPanelOpen)}
                  title="GIF panelini ochish"
                >
                  GIF
                </button>
                <input type="text" placeholder="Xabar yozing (Skrinshot joylash uchun Ctrl + V)" value={replyText} onChange={e => setReplyText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} onPaste={handlePaste} />
                <button className="btn-send" onClick={handleSend}><FiSend size={20} color="#fff" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <FiMessageSquare size={48} color="#002BFF" style={{ marginBottom: '16px' }} />
            <p style={{ margin: 0, fontSize: '15px', color: '#666', fontWeight: 500 }}>Muloqotni boshlash uchun chatni tanlang</p>
            
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
                {contextMenu.type === 'chat_gif' ? '📥 Saqlash (GIFlarimga)' : '📥 Saqlash (Stikerlarimga)'}
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
                🗑️ Xabarni o'chirish
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
              {contextMenu.type === 'saved_gif' ? '🗑️ GIFlarimdan o\'chirish' : '🗑️ Stikerlarimdan o\'chirish'}
            </div>
          )}
        </div>
      )}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
    </div>
  );
}
