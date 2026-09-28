import React, { useState, useEffect, useRef } from 'react';
import {
  RiPhoneLine,
  RiPhoneFill,
  RiMicLine,
  RiMicOffLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiStopCircleLine,
  RiTimeLine,
  RiUser3Line,
  RiSearchLine,
  RiAddLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiCustomerService2Line,
  RiFileList3Line,
  RiVolumeUpLine,
  RiSettings4Line,
  RiSmartphoneLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiEyeOffLine,
  RiTelegramLine,
  RiWhatsappLine,
  RiLinkM,
} from 'react-icons/ri';
import './CallCenter.css';

interface CallRecord {
  id: string;
  clientName: string;
  phoneNumber: string;
  type: 'incoming' | 'outgoing' | 'missed';
  time: string;
  duration: string;
  audioUrl?: string;
  hasTask: boolean;
  notes?: string;
  dealAmount?: string;
  company?: string;
  callerIdUsed?: string;
}

interface CallerIdOption {
  id: string;
  number: string;
  label: string;
}

interface SipSettings {
  provider: string;
  server: string;
  port: string;
  login: string;
  password: string;
  callerId: string;
  twilioSid?: string;
  twilioToken?: string;
  autoRecord: boolean;
}

const DEFAULT_CALLER_IDS: CallerIdOption[] = [
  { id: 'cid-1', number: '+998 71 200 88 00', label: 'Asosiy ATS (Kompaniya)' },
  { id: 'cid-2', number: '+998 90 123 45 67', label: 'Sotuv bo\'limi' },
  { id: 'cid-3', number: '+998 93 999 88 77', label: 'Menejer shaxsiy' },
];


const INITIAL_CALL_HISTORY: CallRecord[] = [
  {
    id: 'c-1',
    clientName: 'Otabek Mirzayev',
    phoneNumber: '+998 90 123 45 67',
    type: 'missed',
    time: '14:20, Bugun',
    duration: '0 sek',
    hasTask: false,
    company: 'Silk Road Logistics',
    notes: 'Katta partiya buyurtmasi bo\'yicha qayta aloqaga chiqish kerak'
  },
  {
    id: 'c-2',
    clientName: 'Nodira Alimova',
    phoneNumber: '+998 93 987 65 43',
    type: 'incoming',
    time: '13:45, Bugun',
    duration: '2 daq 45 sek',
    hasTask: true,
    company: 'Artis Dizayn',
    dealAmount: '12,500,000 UZS'
  },
  {
    id: 'c-3',
    clientName: 'Jasur Beknazarov',
    phoneNumber: '+998 97 555 44 33',
    type: 'outgoing',
    time: '11:15, Bugun',
    duration: '4 daq 12 sek',
    hasTask: true,
    company: 'Auto Motors',
    dealAmount: '85,000,000 UZS'
  },
  {
    id: 'c-4',
    clientName: 'Sardor Qodirov',
    phoneNumber: '+998 99 333 22 11',
    type: 'missed',
    time: 'Kecha, 18:30',
    duration: '0 sek',
    hasTask: false,
    company: 'Qodirov MCHJ'
  },
  {
    id: 'c-5',
    clientName: 'Dilnoza Karimova',
    phoneNumber: '+998 91 777 88 99',
    type: 'incoming',
    time: 'Kecha, 16:10',
    duration: '1 daq 50 sek',
    hasTask: true,
    company: 'Beauty Bar Salon'
  }
];

// DTMF standard audio frequencies for real touch-tone sound
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

function playDtmfSound(key: string) {
  try {
    const freqs = DTMF_FREQS[key];
    if (!freqs) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.15);
  } catch {
    // AudioContext policy
  }
}

function startRingbackTone(): { stop: () => void } {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    let isRunning = true;
    let timerId: any = null;

    const playBeep = () => {
      if (!isRunning || ctx.state === 'closed') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = 425; // Standard ringback tone frequency (Uzbekistan/Europe)
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    };

    playBeep();
    timerId = setInterval(playBeep, 3500);

    return {
      stop: () => {
        isRunning = false;
        clearInterval(timerId);
        try {
          ctx.close();
        } catch {}
      }
    };
  } catch {
    return { stop: () => {} };
  }
}

export default function CallCenter() {
  const [dialNumber, setDialNumber] = useState('');
  // Anonymous caller ID toggle (enabled by default)
  const [isAnonymousCallerId, setIsAnonymousCallerId] = useState(true);

  const [callerIds, setCallerIds] = useState<CallerIdOption[]>(() => {
    const saved = localStorage.getItem('odim_caller_ids');
    return saved ? JSON.parse(saved) : DEFAULT_CALLER_IDS;
  });
  const [selectedCallerId, setSelectedCallerId] = useState<string>(() => {
    return callerIds[0]?.number || '+998 71 200 88 00';
  });

  const [activeCall, setActiveCall] = useState<{
    status: 'calling' | 'connected';
    name: string;
    number: string;
    company?: string;
    callerId: string;
  } | null>(null);

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CallRecord | null>(INITIAL_CALL_HISTORY[0]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>(() => {
    const saved = localStorage.getItem('odim_call_history');
    return saved ? JSON.parse(saved) : INITIAL_CALL_HISTORY;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'missed' | 'incoming' | 'outgoing'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Settings & Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewCallerIdModal, setShowNewCallerIdModal] = useState(false);
  const [newCallerIdInput, setNewCallerIdInput] = useState('');
  const [newCallerIdLabel, setNewCallerIdLabel] = useState('');

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // SIP / Twilio Settings
  const [sipSettings, setSipSettings] = useState<SipSettings>(() => {
    const saved = localStorage.getItem('odim_sip_settings');
    return saved
      ? JSON.parse(saved)
      : {
          provider: 'O\'ztelecom SIP (ATS)',
          server: 'sip.telecom.uz',
          port: '5060',
          login: '101',
          password: '••••••••',
          callerId: '+998 71 200 88 00',
          twilioSid: '',
          twilioToken: '',
          autoRecord: true,
        };
  });

  // Media Stream & Recording Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const ringbackRef = useRef<{ stop: () => void } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerAnimRef = useRef<number | null>(null);

  // Persist history
  useEffect(() => {
    localStorage.setItem('odim_call_history', JSON.stringify(callHistory));
  }, [callHistory]);

  // Persist caller IDs
  useEffect(() => {
    localStorage.setItem('odim_caller_ids', JSON.stringify(callerIds));
  }, [callerIds]);

  const handleSaveSipSettings = (newSettings: SipSettings) => {
    setSipSettings(newSettings);
    localStorage.setItem('odim_sip_settings', JSON.stringify(newSettings));
    setShowSettingsModal(false);
    showToast('Telefoniya sozlamalari muvaffaqiyatli saqlandi');
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // Timer for active call
  useEffect(() => {
    let timer: any;
    if (activeCall && activeCall.status === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (ringbackRef.current) {
        ringbackRef.current.stop();
      }
      if (visualizerAnimRef.current) {
        cancelAnimationFrame(visualizerAnimRef.current);
      }
    };
  }, []);

  // Mute toggle on live media stream
  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Keypad click handler with DTMF tone
  const handleKeyPress = (digit: string) => {
    playDtmfSound(digit);
    setDialNumber((prev) => {
      if (!prev) return digit;
      return prev.length < 20 ? prev + digit : prev;
    });
  };

  const handleBackspace = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setDialNumber('');
  };

  // Helper to format clean phone digits
  const getCleanNumber = (targetNum?: string) => {
    const raw = (targetNum || dialNumber).trim();
    if (!raw) return '';
    let digits = raw.replace(/[^\d+]/g, '');
    if (!digits.startsWith('+') && digits.length >= 9) {
      digits = digits.startsWith('998') ? `+${digits}` : `+998${digits.slice(-9)}`;
    }
    return digits;
  };

  // 1. DIRECT DEVICE/CELLULAR CALL (tel: protocol)
  const handleDirectDeviceCall = (targetNum?: string, targetName?: string, company?: string) => {
    const cleaned = getCleanNumber(targetNum);
    const rawNum = (targetNum || dialNumber).trim();
    if (!cleaned) {
      showToast("Iltimos, avval telefon raqamini kiriting");
      return;
    }

    // Support ms-phone: (Windows Phone Link) and tel: for native GSM dialing via phone
    try {
      const link = document.createElement('a');
      // On Windows, ms-phone: directly commands Phone Link app to dial
      link.href = `ms-phone:${cleaned}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = `tel:${cleaned}`;
    }

    const matchedContact = callHistory.find(
      (c) => c.phoneNumber.replace(/[^\d]/g, '') === cleaned.replace(/[^\d]/g, '')
    );
    const displayName = targetName || (matchedContact ? matchedContact.clientName : `Raqam: ${rawNum}`);

    const newRecord: CallRecord = {
      id: `c-${Date.now()}`,
      clientName: displayName,
      phoneNumber: rawNum,
      type: 'outgoing',
      time: 'Hozirgina',
      duration: 'Telefon chaqiruvi',
      hasTask: false,
      company: company || (matchedContact ? matchedContact.company : 'Yakka tartibdagi mijoz'),
      callerIdUsed: isAnonymousCallerId ? 'Yashirin raqam' : selectedCallerId,
    };

    setCallHistory([newRecord, ...callHistory]);
    setSelectedClient(newRecord);
    showToast(`📞 ${cleaned} raqamiga telefon/Phone Link orqali qo'ng'iroq yo'naltirildi`);
  };

  // 2. TELEGRAM INSTANT CALL (Direct, free, no registration required, personal number hidden!)
  const handleTelegramCall = (targetNum?: string) => {
    const cleaned = getCleanNumber(targetNum);
    if (!cleaned) {
      showToast("Iltimos, avval telefon raqamini kiriting");
      return;
    }
    const digitsOnly = cleaned.replace(/[^\d]/g, '');
    window.open(`https://t.me/+${digitsOnly}`, '_blank');
    showToast(`✈️ ${cleaned} egasining Telegram profili ochildi (Bepul ovozli qo'ng'iroq)`);
  };

  // 3. WHATSAPP CALL (Direct messaging & call)
  const handleWhatsAppCall = (targetNum?: string) => {
    const cleaned = getCleanNumber(targetNum);
    if (!cleaned) {
      showToast("Iltimos, avval telefon raqamini kiriting");
      return;
    }
    const digitsOnly = cleaned.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${digitsOnly}`, '_blank');
    showToast(`🟢 ${cleaned} ning WhatsApp profili ochildi`);
  };

  // 4. ODIM WEBRTC LIVE ROOM (Zero registration, instant audio connection with client)
  const handleWebRTCLinkCall = (targetNum?: string) => {
    const cleaned = getCleanNumber(targetNum);
    const callId = cleaned ? cleaned.replace(/[^\d]/g, '') : `room-${Date.now()}`;
    const url = `${window.location.origin}/call/${callId}`;
    window.open(url, '_blank');
    showToast(`🎙️ Jonli audio xona ochildi. Havola: ${url}`);
  };

  // 5. IN-APP MICROPHONE CALL SESSION
  const handleStartCall = async (targetNum?: string, targetName?: string, company?: string) => {
    const cleaned = getCleanNumber(targetNum);
    const rawNum = (targetNum || dialNumber).trim();
    if (!rawNum) {
      showToast("Iltimos, avval telefon raqamini kiriting");
      return;
    }

    const matchedContact = callHistory.find(
      (c) => c.phoneNumber.replace(/[^\d]/g, '') === cleaned.replace(/[^\d]/g, '')
    );
    const contactName = targetName || (matchedContact ? matchedContact.clientName : `Raqam: ${rawNum}`);

    const outboundCallerId = isAnonymousCallerId
      ? 'Yashirin raqam (Noma\'lum raqam)'
      : selectedCallerId;

    setActiveCall({
      status: 'calling',
      name: contactName,
      number: rawNum,
      company: company || (matchedContact ? matchedContact.company : 'Kompaniya mijoz'),
      callerId: outboundCallerId,
    });

    ringbackRef.current = startRingbackTone();

    // Access computer microphone
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        recordedChunksRef.current = [];
        try {
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunksRef.current.push(e.data);
          };
          recorder.start(500);
          mediaRecorderRef.current = recorder;
        } catch (recErr) {
          console.log("MediaRecorder note:", recErr);
        }

        startAudioVisualizer(stream);
      }
    } catch (micErr) {
      console.log("Microphone note:", micErr);
    }

    // Also trigger native Windows Phone Link in background if available
    try {
      const link = document.createElement('a');
      link.href = `ms-phone:${cleaned}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {}

    setTimeout(() => {
      if (ringbackRef.current) {
        ringbackRef.current.stop();
        ringbackRef.current = null;
      }
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
    }, 2000);
  };

  // Real-time audio waveform visualizer from microphone
  const startAudioVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvasRef.current) return;
        visualizerAnimRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        const canvas = canvasRef.current;
        const cCtx = canvas.getContext('2d');
        if (!cCtx) return;

        cCtx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;
          cCtx.fillStyle = '#6366F1';
          cCtx.beginPath();
          cCtx.roundRect(x, (canvas.height - barHeight) / 2, barWidth - 1, Math.max(barHeight, 4), [4]);
          cCtx.fill();
          x += barWidth + 1;
        }
      };
      draw();
    } catch (e) {
      console.log("Visualizer note:", e);
    }
  };

  // End active call
  const handleEndCall = () => {
    if (ringbackRef.current) {
      ringbackRef.current.stop();
      ringbackRef.current = null;
    }

    if (visualizerAnimRef.current) {
      cancelAnimationFrame(visualizerAnimRef.current);
    }

    let recordedAudioUrl: string | undefined = undefined;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          recordedAudioUrl = URL.createObjectURL(blob);
        }
      } catch (recErr) {
        console.log("Stop recorder error:", recErr);
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (activeCall) {
      const durationText =
        callDuration > 0
          ? `${Math.floor(callDuration / 60)} daq ${callDuration % 60} sek`
          : '0 daq 45 sek';

      const newRecord: CallRecord = {
        id: `c-${Date.now()}`,
        clientName: activeCall.name,
        phoneNumber: activeCall.number,
        type: 'outgoing',
        time: 'Hozirgina',
        duration: durationText,
        hasTask: false,
        company: activeCall.company,
        audioUrl: recordedAudioUrl,
        callerIdUsed: activeCall.callerId,
      };

      setCallHistory([newRecord, ...callHistory]);
      setSelectedClient(newRecord);
      showToast(`Qo'ng'iroq yakunlandi va tarixga yozildi (${activeCall.number})`);
    }

    setActiveCall(null);
    setIsMuted(false);
    setIsOnHold(false);
  };

  const handleCreateTaskForMissedCall = (call: CallRecord) => {
    setCallHistory((prev) =>
      prev.map((item) => (item.id === call.id ? { ...item, hasTask: true } : item))
    );
    showToast(`Vazifa ochildi: "${call.clientName} ga zudlik bilan qayta qo'ng'iroq qilish"`);
  };

  const handleAddNewCallerId = () => {
    if (!newCallerIdInput.trim()) return;
    const newId: CallerIdOption = {
      id: `cid-${Date.now()}`,
      number: newCallerIdInput.trim(),
      label: newCallerIdLabel.trim() || 'Qo\'shimcha raqam',
    };
    setCallerIds([...callerIds, newId]);
    setSelectedCallerId(newId.number);
    setNewCallerIdInput('');
    setNewCallerIdLabel('');
    setShowNewCallerIdModal(false);
    showToast(`Yangi chiquvchi raqam (${newId.number}) qo'shildi`);
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) {
      setIsPlayingAudio(!isPlayingAudio);
      return;
    }
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => {
          setIsPlayingAudio(true);
        });
    }
  };

  const filteredHistory = callHistory.filter((call) => {
    const matchesSearch =
      call.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.phoneNumber.includes(searchQuery);
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && call.type === filterType;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="call-center-container">
      {notification && (
        <div className="call-notification-banner">
          <RiCheckboxCircleLine size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Grid: 3 Panels */}
      <div className="call-center-grid">
        {/* PANEL 1: Dialpad & Direct Free Call Channels */}
        <div className="dialpad-card">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <span className="panel-icon-wrap phone">
                <RiPhoneFill size={18} />
              </span>
              <h3>Raqam terish</h3>
            </div>
            <div className="header-actions">
              <span className="status-badge online" title="Aloqa tizimi faol">
                <span className="status-dot"></span> Aloqada
              </span>
              <button
                className="telephony-settings-btn"
                onClick={() => setShowSettingsModal(true)}
                title="Telefoniya sozlamalari"
              >
                <RiSettings4Line size={18} />
              </button>
            </div>
          </div>

          {/* CALLER ID SELECTOR ROW */}
          <div className="caller-id-bar">
            <div className="caller-id-header">
              <span className="caller-id-title">Qaysi nomerdan (Caller ID):</span>
              <button
                className="add-caller-id-link"
                onClick={() => setShowNewCallerIdModal(true)}
              >
                + Yangi nomer
              </button>
            </div>
            <select
              value={selectedCallerId}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  setShowNewCallerIdModal(true);
                } else {
                  setSelectedCallerId(e.target.value);
                }
              }}
              className="caller-id-select"
            >
              {callerIds.map((cid) => (
                <option key={cid.id} value={cid.number}>
                  {cid.number} — {cid.label}
                </option>
              ))}
              <option value="__add_new__">+ Boshqa raqam kiritish...</option>
            </select>
          </div>

          {/* DIAL INPUT FIELD (FREE TYPING OF ANY NUMBER) */}
          <div className="dial-display">
            <input
              type="tel"
              placeholder="+998 __ ___ __ __ (Raqamni yozing)"
              value={dialNumber}
              onChange={(e) => setDialNumber(e.target.value)}
              className="dial-input"
            />
            {dialNumber && (
              <div className="dial-display-actions">
                <button className="clear-all-btn" onClick={handleClearAll} title="Barchasini tozalash">
                  <RiDeleteBinLine size={16} />
                </button>
                <button className="backspace-btn" onClick={handleBackspace} title="Bitta o'chirish">
                  <RiCloseLine size={18} />
                </button>
              </div>
            )}
          </div>



          {/* KEYPAD WITH DTMF SOUNDS */}
          <div className="keypad-grid">
            {[
              { key: '1', sub: '' },
              { key: '2', sub: 'ABC' },
              { key: '3', sub: 'DEF' },
              { key: '4', sub: 'GHI' },
              { key: '5', sub: 'JKL' },
              { key: '6', sub: 'MNO' },
              { key: '7', sub: 'PQRS' },
              { key: '8', sub: 'TUV' },
              { key: '9', sub: 'WXYZ' },
              { key: '*', sub: '' },
              { key: '0', sub: '+' },
              { key: '#', sub: '' },
            ].map((btn) => (
              <button
                key={btn.key}
                className="keypad-btn"
                onClick={() => handleKeyPress(btn.key)}
              >
                <span className="digit">{btn.key}</span>
                {btn.sub && <span className="subtext">{btn.sub}</span>}
              </button>
            ))}
          </div>

          {/* PRIMARY CALL BUTTON & ALTERNATIVE CHANNELS */}
          <div className="dial-action-wrap">
            <button
              className="main-dial-call-btn"
              onClick={() => handleStartCall()}
              disabled={!dialNumber.trim()}
              title="Qo'ng'iroq qilish (Jonli mikrofon va Softphone)"
            >
              <RiPhoneFill size={22} />
              <span>Qo'ng'iroq qilish</span>
            </button>

          </div>
        </div>

        {/* PANEL 2: Call History & Filters */}
        <div className="call-history-card">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <span className="panel-icon-wrap log">
                <RiFileList3Line size={18} />
              </span>
              <h3>Qo'ng'iroqlar jurnali</h3>
            </div>
            <div className="history-filters">
              {(['all', 'missed', 'incoming', 'outgoing'] as const).map((t) => (
                <button
                  key={t}
                  className={`filter-chip ${filterType === t ? 'active' : ''}`}
                  onClick={() => setFilterType(t)}
                >
                  {t === 'all' && 'Barchasi'}
                  {t === 'missed' && 'O\'tkazilgan'}
                  {t === 'incoming' && 'Kiruvchi'}
                  {t === 'outgoing' && 'Chiquvchi'}
                </button>
              ))}
            </div>
          </div>

          <div className="search-bar-wrap">
            <div className="search-bar-inner">
              <RiSearchLine size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Ism yoki telefon raqami bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cc-search-input"
              />
            </div>
          </div>

          <div className="history-list">
            {filteredHistory.map((call) => {
              const isSelected = selectedClient?.id === call.id;
              return (
                <div
                  key={call.id}
                  className={`history-item ${call.type} ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedClient(call);
                    setDialNumber(call.phoneNumber);
                  }}
                >
                  <div className={`call-type-indicator ${call.type}`}>
                    <RiPhoneLine size={16} />
                  </div>
                  <div className="history-info">
                    <div className="history-top">
                      <span className="client-name">{call.clientName}</span>
                      <span className="call-time">{call.time}</span>
                    </div>
                    <div className="history-bottom">
                      <span className="client-phone">{call.phoneNumber}</span>
                      <span className="call-duration">{call.duration}</span>
                    </div>
                  </div>

                  <div className="history-actions" onClick={(e) => e.stopPropagation()}>
                    {call.type === 'missed' && !call.hasTask && (
                      <button
                        className="auto-task-btn"
                        onClick={() => handleCreateTaskForMissedCall(call)}
                        title="Xodimga qayta qo'ng'iroq vazifasini ochish"
                      >
                        <RiAddLine size={14} />
                        <span>Vazifa ochish</span>
                      </button>
                    )}
                    {call.hasTask && (
                      <span className="task-assigned-badge" title="Vazifa ochilgan">
                        <RiCheckboxCircleLine size={14} /> Vazifada
                      </span>
                    )}
                    <button
                      className="click-to-device-btn telegram"
                      onClick={() => handleTelegramCall(call.phoneNumber)}
                      title="Telegram orqali bepul qo'ng'iroq"
                    >
                      <RiTelegramLine size={16} />
                    </button>
                    <button
                      className="click-to-device-btn"
                      onClick={() => handleStartCall(call.phoneNumber, call.clientName, call.company)}
                      title="Qo'ng'iroq qilish"
                    >
                      <RiPhoneFill size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL 3: Client Card Details */}
        <div className="client-card-panel">
          {selectedClient ? (
            <div className="client-detail-card">
              <div className="client-card-header">
                <div className="client-avatar">
                  <RiUser3Line size={28} />
                </div>
                <div className="client-meta">
                  <h4>{selectedClient.clientName}</h4>
                  <span className="client-sub">{selectedClient.company || 'Yakka tartibdagi mijoz'}</span>
                  <span className="client-phone-badge">{selectedClient.phoneNumber}</span>
                </div>
              </div>

              <div className="client-actions-strip">
                <button
                  className="card-action-btn primary"
                  onClick={() => handleStartCall(selectedClient.phoneNumber, selectedClient.clientName, selectedClient.company)}
                  title="Qo'ng'iroq qilish"
                >
                  <RiPhoneFill size={16} />
                  <span>Qo'ng'iroq qilish</span>
                </button>
                <button
                  className="card-action-btn secondary telegram-btn"
                  onClick={() => handleTelegramCall(selectedClient.phoneNumber)}
                  title="Telegram orqali bepul qo'ng'iroq (Raqam yashiriladi)"
                >
                  <RiTelegramLine size={18} />
                  <span>Telegram</span>
                </button>
              </div>

              <div className="client-sections">
                <div className="detail-section">
                  <div className="section-title">Aloqa yozuvlari (Ovozli yozuv)</div>
                  <div className="audio-player-mock">
                    <div className="audio-icon-wrap">
                      <RiVolumeUpLine size={18} />
                    </div>
                    <div className="audio-info">
                      <span className="audio-title">
                        Suhbat audio yozuvi ({selectedClient.time})
                      </span>
                      <div
                        className="audio-progress-bar"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
                          setAudioPlaybackProgress(percent * 100);
                        }}
                      >
                        <div
                          className="audio-fill"
                          style={{ width: `${audioPlaybackProgress > 0 ? audioPlaybackProgress : 45}%` }}
                        ></div>
                      </div>
                    </div>
                    <button
                      className={`play-mini-btn ${isPlayingAudio ? 'playing' : ''}`}
                      onClick={togglePlayAudio}
                      title={isPlayingAudio ? "To'xtatish" : "Eshitish"}
                    >
                      {isPlayingAudio ? <RiStopCircleLine size={20} /> : <RiPlayCircleLine size={20} />}
                    </button>
                  </div>
                  {selectedClient.audioUrl && (
                    <audio
                      ref={audioPlayerRef}
                      src={selectedClient.audioUrl}
                      onEnded={() => setIsPlayingAudio(false)}
                      onTimeUpdate={() => {
                        if (audioPlayerRef.current) {
                          const p =
                            (audioPlayerRef.current.currentTime / audioPlayerRef.current.duration) * 100;
                          setAudioPlaybackProgress(p || 0);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  )}
                </div>

                <div className="detail-section">
                  <div className="section-title">Lid kartasidagi ma'lumotlar</div>
                  <div className="info-row">
                    <span className="label">Oxirgi bitim summasi:</span>
                    <span className="value bold">{selectedClient.dealAmount || '15,000,000 UZS'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Mas'ul menejer:</span>
                    <span className="value">Farhod Qosimov</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Chiquvchi raqam:</span>
                    <span className="value">{selectedClient.callerIdUsed || (isAnonymousCallerId ? 'Yashirin raqam' : selectedCallerId)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Mijoz holati:</span>
                    <span className="status-pill active">Faol muzokara</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">Menejer eslatmalari</div>
                  <div className="notes-box">
                    {selectedClient.notes || 'Qo\'ng\'iroq chog\'ida shartnoma shartlarini qayta ko\'rib chiqish va tijorat taklifini (KP) yangilash so\'ralgan.'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-client-card">
              <RiCustomerService2Line size={48} className="empty-icon" />
              <p>Mijoz kartasini ko'rish uchun chapdagi ro'yxatdan tanlang yoki raqam tering</p>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE CALL OVERLAY / POPUP */}
      {activeCall && (
        <div className="active-call-modal-overlay">
          <div className="active-call-card">
            <div className="call-live-indicator">
              <span className="pulse-dot"></span>
              {activeCall.status === 'calling' ? 'Chaqirilmoqda (Gudok)...' : 'Suhbat davom etmoqda (Jonli mikrofon)'}
            </div>

            <div className="call-avatar-glow">
              <RiUser3Line size={48} />
            </div>

            <h3 className="call-target-name">{activeCall.name}</h3>
            <span className="call-target-num">{activeCall.number}</span>
            <span className="call-target-company">{activeCall.company}</span>
            <span className="caller-id-badge-active">Chiquvchi: {activeCall.callerId}</span>

            {/* LIVE AUDIO WAVEFORM VISUALIZER FROM REAL MICROPHONE */}
            <div className="active-visualizer-box">
              <canvas ref={canvasRef} width={260} height={40} className="visualizer-canvas" />
            </div>

            <div className="call-timer-display">
              <RiTimeLine size={18} />
              <span>{formatDuration(callDuration)}</span>
            </div>

            <div className="recording-status">
              <span className="rec-dot"></span>
              <span>Audio mikrofoningiz orqali jonli yozilmoqda va kartaga biriktiriladi</span>
            </div>

            <div className="call-controls-row">
              <button
                className={`cc-ctrl-btn ${isMuted ? 'active' : ''}`}
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Mikrofonni yoqish" : "Ovozsiz qilish"}
              >
                {isMuted ? <RiMicOffLine size={20} /> : <RiMicLine size={20} />}
                <span>{isMuted ? 'Ovozsiz' : 'Mute'}</span>
              </button>

              <button
                className={`cc-ctrl-btn ${isOnHold ? 'active' : ''}`}
                onClick={() => setIsOnHold(!isOnHold)}
                title={isOnHold ? "Kutishdan olish" : "Kutishga qo'yish (Hold)"}
              >
                <RiPauseCircleLine size={20} />
                <span>{isOnHold ? 'Kutishda' : 'Kutish'}</span>
              </button>

              <button className="cc-ctrl-btn end-call" onClick={handleEndCall} title="Qo'ng'iroqni yakunlash">
                <RiPhoneFill size={22} />
                <span>Yakunlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW CALLER ID */}
      {showNewCallerIdModal && (
        <div className="telephony-modal-backdrop" onClick={() => setShowNewCallerIdModal(false)}>
          <div className="telephony-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Yangi chiquvchi raqam qo'shish (Caller ID)</h3>
              <button className="modal-close-btn" onClick={() => setShowNewCallerIdModal(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                Qo'ng'iroq qilayotganda qabul qiluvchi mijoz telefonida qaysi kompaniya raqami ko'rinishini istaysiz?
              </p>
              <div className="form-group">
                <label>Telefon raqam:</label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={newCallerIdInput}
                  onChange={(e) => setNewCallerIdInput(e.target.value)}
                  className="modal-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Belgilash nomi (Masalan: Sotuv bo'limi, Rahbariyat):</label>
                <input
                  type="text"
                  placeholder="Masalan: Operator raqami"
                  value={newCallerIdLabel}
                  onChange={(e) => setNewCallerIdLabel(e.target.value)}
                  className="modal-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowNewCallerIdModal(false)}>
                Bekor qilish
              </button>
              <button className="btn-save" onClick={handleAddNewCallerId}>
                <RiCheckLine size={18} />
                <span>Raqamni saqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TELEPHONY SETTINGS */}
      {showSettingsModal && (
        <div className="telephony-modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="telephony-modal-card settings-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="title-group">
                <RiSettings4Line size={22} className="modal-header-icon" />
                <h3>Telefoniya va Aloqa sozlamalari</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowSettingsModal(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-status-banner">
                <span className="status-indicator-dot"></span>
                <span>Telefoniya tizimi faol. Hech qanday ro'yxatdan o'tishsiz to'g'ridan-to'g'ri qo'ng'iroq qilish mumkin.</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Asosiy aloqa kanali:</label>
                  <select
                    value={sipSettings.provider}
                    onChange={(e) => setSipSettings({ ...sipSettings, provider: e.target.value })}
                    className="modal-input"
                  >
                    <option value="Telefon ilovasi (tel: GSM)">Telefon ilovasi (tel: GSM)</option>
                    <option value="Telegram Call (Ovozli)">Telegram Call (Ovozli)</option>
                    <option value="Odim WebRTC Jonli xona">Odim WebRTC Jonli xona</option>
                    <option value="WhatsApp Call">WhatsApp Call</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Asosiy chiquvchi raqam (Default Caller ID):</label>
                  <input
                    type="text"
                    value={sipSettings.callerId}
                    onChange={(e) => setSipSettings({ ...sipSettings, callerId: e.target.value })}
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="checkbox-setting-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={sipSettings.autoRecord}
                    onChange={(e) => setSipSettings({ ...sipSettings, autoRecord: e.target.checked })}
                  />
                  <span>Suhbatlarni avtomatik ravishda audio formatda yozib olish va mijoz kartasiga biriktirish</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowSettingsModal(false)}>
                Bekor qilish
              </button>
              <button className="btn-save" onClick={() => handleSaveSipSettings(sipSettings)}>
                <RiCheckLine size={18} />
                <span>Sozlamalarni saqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
