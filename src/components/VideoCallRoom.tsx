import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhoneOff, FiUser } from 'react-icons/fi';
import './VideoCallRoom.css';

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
    // Agar stream bo'lmasa, mik o'chiq bo'lsa yoki audio treklar bo'lmasa tekis chiziq chizamiz
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

      // Mobil brauzerda AudioContextni faollashtirish (Resume)
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
        
        // Ovoz balandligini hisoblash (Visual amplituda)
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

        // 1-to'lqin (Asosiy yorqin to'lqin)
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

        // Soyalarni o'chirish (Keyingi chiziqlar toza chiqishi uchun)
        ctx.shadowBlur = 0;

        // 2-to'lqin (Orqa fondagi yumshoqroq shaffof to'lqin)
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = color + '55'; // 33% shaffoflik
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
      width={300} 
      height={100} 
      style={{ 
        width: '100%', 
        maxHeight: '100px', 
        display: 'block',
        pointerEvents: 'none'
      }} 
    />
  );
}

// ---------------- MAIN VIDEO CALL ROOM COMPONENT ----------------
export default function VideoCallRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [localStreamLoaded, setLocalStreamLoaded] = useState(false);
  
  // Real-time audio streams monitoring uchun state
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  // 1. Kamerani birinchi marta preview uchun yoqish (On Mount)
  useEffect(() => {
    const getLocalStream = async () => {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        console.error("Camera & Mic permission failed:", err);
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
      setLocalStreamLoaded(true);
      
      if (localVideoRef.current && stream && stream.getVideoTracks().length > 0) {
        localVideoRef.current.srcObject = stream;
      }
    };

    getLocalStream();

    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  // Preview dagi o'zgarishlar localVideo elementiga ta'sir qilishi uchun
  useEffect(() => {
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(e => console.log('Local video play error:', e));
    }
  }, [localStreamLoaded, hasJoined, isVideoOff]);

  const toggleMute = () => {
    if (localStream.current && localStream.current.getAudioTracks().length > 0) {
      const nextMuted = !isMuted;
      localStream.current.getAudioTracks()[0].enabled = isMuted; // true -> false, false -> true
      setIsMuted(nextMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream.current && localStream.current.getVideoTracks().length > 0) {
      const nextVideoOff = !isVideoOff;
      localStream.current.getVideoTracks()[0].enabled = isVideoOff; // true -> false, false -> true
      setIsVideoOff(nextVideoOff);
    }
  };

  // 2. Qo'shilish bosilganda WebRTC ulanishni boshlash (Autoplay muammolarini hal qilish)
  const handleJoin = () => {
    setHasJoined(true);

    // Audio va video elementlarini foydalanuvchi bosgan lahzada o'zida "unlock" qilamiz
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().catch(e => console.log("Audio unlock on gesture:", e));
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play().catch(e => console.log("Video unlock on gesture:", e));
    }

    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : window.location.origin;

    const newSocket = io(socketUrl);
    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.emit('JOIN_ROOM', { chatId: id });

    const candidateQueue: any[] = [];
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.xten.com' }
      ]
    });
    peerConnection.current = pc;

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        track.enabled = true; // Ulanish paytida barcha treklarni yoqish
        pc.addTrack(track, localStream.current!);
      });
    }

    pc.ontrack = (event) => {
      const rStream = event.streams[0];
      setRemoteStream(rStream);

      // Remote video - video treklarini ko'rsatish uchun (muted EMAS)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = rStream;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.play().catch(err => console.error("Remote video play failed:", err));
      }
      // Alohida audio element - mobil qurilmalarda ovoz eshitilishini kafolatlaydi
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = rStream;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(err => console.error("Remote audio play failed:", err));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        newSocket.emit('WEBRTC_ICE_CANDIDATE', { chatId: id, candidate: event.candidate });
      }
    };

    newSocket.on('WEBRTC_OFFER', async (offer) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      newSocket.emit('WEBRTC_ANSWER', { chatId: id, answer });
      
      while (candidateQueue.length > 0) {
        const cand = candidateQueue.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.error("Ice candidate processing error:", err);
        }
      }
    });

    newSocket.on('WEBRTC_ICE_CANDIDATE', async (candidate) => {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          candidateQueue.push(candidate);
        }
      } catch (e) {
         console.error(e);
      }
    });

    newSocket.on('CALL_ENDED', () => {
      endCall();
    });
  };

  const endCall = () => {
    setCallEnded(true);
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    const currentSocket = socketRef.current;
    if (currentSocket) {
      currentSocket.emit('END_CALL', { chatId: id });
      currentSocket.disconnect();
      socketRef.current = null;
    }
  };

  const handleBackToTelegram = () => {
    if ((window as any).Telegram?.WebApp) {
      try {
        (window as any).Telegram.WebApp.close();
        return;
      } catch (e) {
        console.error("Telegram WebApp close error:", e);
      }
    }

    try {
      window.close();
    } catch (e) {
      console.error("Window close error:", e);
    }

    setTimeout(() => {
      window.location.href = "tg://resolve?domain=odim_crm_boo_bot";
    }, 300);

    setTimeout(() => {
      window.location.href = "https://t.me/odim_crm_boo_bot";
    }, 1500);
  };

  useEffect(() => {
    if (callEnded) {
      const timer = setTimeout(() => {
        handleBackToTelegram();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [callEnded]);

  // Menejer kamerasi o'chig'ligini yoki hali qo'shilmaganligini aniqlash
  const isRemoteVideoOff = !remoteStream || remoteStream.getVideoTracks().length === 0 || !remoteStream.getVideoTracks()[0].enabled;

  return (
    <div className="video-call-room">
      {/* Ovozni ijro etuvchi alohida yashirin audio element - DOIM DOM da turadi */}
      {/* muted YO'Q - aks holda telefonda ovoz chiqmaydi */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      
      {callEnded ? (
        <div className="call-ended-screen">
          <h2>Qo'ng'iroq yakunlandi</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 10px 0', fontSize: '14px' }}>
            Muloqot uchun rahmat! Telegramga qaytmoqdasiz...
          </p>
          <button onClick={handleBackToTelegram} className="back-chat-btn">Telegramga qaytish</button>
        </div>
      ) : (
        <>
          {/* Remote Video Container - always rendered, but hidden when !hasJoined */}
          <div className="video-container" style={{ display: hasJoined ? 'flex' : 'none' }}>
            {/* Remote video - muted EMAS, ovoz shu orqali yoki alohida audio orqali chiqadi */}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="remote-video" 
              style={{ display: isRemoteVideoOff ? 'none' : 'block' }}
            />
            
            {/* Agar menejer kamerasi o'chirilgan bo'lsa - Premium Visualizer chiqadi */}
            {isRemoteVideoOff && (
              <div className="remote-video-placeholder">
                <div className="avatar-wave-wrapper">
                  <div className="remote-avatar">
                    <FiUser size={48} color="#fff" />
                  </div>
                  <div className="pulsing-waves-holder">
                    <AudioVisualizer stream={remoteStream} color="#007aff" isMuted={false} />
                  </div>
                </div>
                <span className="placeholder-text">Menejer ovozi eshitilmoqda...</span>
              </div>
            )}
          </div>

          {/* Local Video Element - Single element styled differently based on mode */}
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className={hasJoined ? "local-video" : "preview-video"} 
            style={{ display: isVideoOff ? 'none' : 'block' }}
          />

          {/* Camera Off Placeholders */}
          {isVideoOff && (
            <div className={hasJoined ? "local-video no-cam-placeholder-client" : "preview-video no-cam-placeholder-client"} style={hasJoined ? { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', justifyContent: 'center' } : {}}>
              <FiVideoOff size={hasJoined ? 24 : 48} color="#888" style={{ marginBottom: hasJoined ? '0px' : '10px' }} />
              <span>Kamera {hasJoined ? 'yopiq' : 'o\'chirilgan'}</span>
            </div>
          )}

          {/* Preview Mode UI Overlays */}
          {!hasJoined && (
            <div className="preview-mode-overlay-container">
              <div className="preview-overlay">
                <h2>Video Qo'ng'iroq</h2>
                <p>Kamera va mikrofoningizni sozlang</p>
              </div>

              {/* O'z ovozini test qilish uchun to'lqinlar */}
              {localStream.current && (
                <div className="preview-audio-waves">
                  <AudioVisualizer stream={localStream.current} color="#30d158" isMuted={isMuted} />
                  <span className="wave-caption">Mikrofon to'lqini (gapirib ko'ring)</span>
                </div>
              )}

              <div className="preview-controls-row">
                <button className={`control-btn ${isMuted ? 'danger' : ''}`} onClick={toggleMute}>
                  {isMuted ? <FiMicOff /> : <FiMic />}
                </button>
                <button className={`control-btn ${isVideoOff ? 'danger' : ''}`} onClick={toggleVideo}>
                  {isVideoOff ? <FiVideoOff /> : <FiVideo />}
                </button>
              </div>

              <button className="join-call-btn" onClick={handleJoin}>
                Qo'shilish
              </button>
            </div>
          )}

          {/* Active Call UI Overlays */}
          {hasJoined && (
            <>
              {/* Har xil to'lqinlar chiqaruvchi visualizer panel (gapirganda to'lqinlar chiqishi uchun) */}
              <div className="audio-waves-container">
                <div className="wave-box">
                  <span className="wave-label">Siz</span>
                  <AudioVisualizer stream={localStream.current} color="#30d158" isMuted={isMuted} />
                </div>
                <div className="wave-box">
                  <span className="wave-label">Suhbatdosh</span>
                  <AudioVisualizer stream={remoteStream} color="#007aff" isMuted={false} />
                </div>
              </div>
              
              <div className="call-controls">
                <button className={`control-btn ${isMuted ? 'danger' : ''}`} onClick={toggleMute}>
                  {isMuted ? <FiMicOff /> : <FiMic />}
                </button>
                <button className="control-btn end-call" onClick={endCall}>
                  <FiPhoneOff />
                </button>
                <button className={`control-btn ${isVideoOff ? 'danger' : ''}`} onClick={toggleVideo}>
                  {isVideoOff ? <FiVideoOff /> : <FiVideo />}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
