import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbMessageCircle, TbX } from 'react-icons/tb';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

interface NotificationToast {
  id: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export default function NotificationListener() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const [activeToast, setActiveToast] = useState<NotificationToast | null>(null);

  // Sound chime synthesizer using Web Audio API
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5

      osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.12);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  useEffect(() => {
    // Request desktop notification permission as soon as user is logged in
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        console.log('Notification permission request:', err);
      });
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    const currentId = currentUser.id;
    const currentName = currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    const currentPhone = (currentUser.phone || '').replace(/\D/g, '');

    const handleMessageObj = (msg: any) => {
      if (!msg || !msg.id || notifiedIdsRef.current.has(msg.id)) return;

      const msgRecvId = msg.receiverId || msg.receiver_id;
      const msgRecvName = msg.receiverName || msg.receiver_name;
      const msgRecvPhone = (msg.receiverPhone || '').replace(/\D/g, '');

      // Check if message belongs to current logged in user
      const isForMe =
        msgRecvId === currentId ||
        (currentName && msgRecvName && msgRecvName.toLowerCase().includes(currentName.toLowerCase())) ||
        (currentPhone && msgRecvPhone && currentPhone === msgRecvPhone);

      if (!isForMe) return;

      // Mark as notified locally
      notifiedIdsRef.current.add(msg.id);

      // 1. Play sound chime
      playNotificationSound();

      // 2. Prepare message preview text
      const bodyText = msg.text || (msg.mediaType === 'image' ? '📷 Rasm' : msg.mediaType === 'audio' ? '🎤 Ovozli xabar' : '📎 Fayl');

      // 3. Desktop Native OS Notification (appears on Windows desktop over any application)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notif = new Notification(`${msg.senderName || 'Odim'} (Odim Chat)`, {
            body: bodyText,
            icon: '/favicon.ico',
            tag: msg.id,
          } as any);

          notif.onclick = () => {
            window.focus();
            navigate('/chat/staff');
          };
        } catch (err) {
          console.warn('Desktop notification error:', err);
        }
      }

      // 4. In-App Floating Toast Notice
      setActiveToast({
        id: msg.id,
        senderName: msg.senderName || 'Foydalanuvchi',
        text: bodyText,
        createdAt: 'Hozir'
      });

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setActiveToast(prev => (prev?.id === msg.id ? null : prev));
      }, 6000);
    };

    const checkUnread = async () => {
      try {
        const unreadMsgs = await api.getUnreadInternalMessages(currentId);
        if (Array.isArray(unreadMsgs) && unreadMsgs.length > 0) {
          unreadMsgs.forEach(handleMessageObj);
        }
      } catch (e) {
        console.error('Failed to check unread notifications:', e);
      }
    };

    const onCustomNewMessage = (e: any) => {
      if (e.detail) handleMessageObj(e.detail);
    };

    window.addEventListener('odim_new_message', onCustomNewMessage);
    window.addEventListener('storage', checkUnread);

    checkUnread();
    const interval = setInterval(checkUnread, 1500);
    return () => {
      clearInterval(interval);
      window.removeEventListener('odim_new_message', onCustomNewMessage);
      window.removeEventListener('storage', checkUnread);
    };
  }, [currentUser, navigate]);

  if (!activeToast) return null;

  return (
    <div
      onClick={() => {
        setActiveToast(null);
        navigate('/chat/staff');
      }}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        background: '#191919',
        color: '#ffffff',
        padding: '14px 20px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        cursor: 'pointer',
        maxWidth: '360px',
        border: '1.5px solid rgba(255, 255, 255, 0.15)',
        animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#0284c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <TbMessageCircle size={22} color="#ffffff" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeToast.senderName}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginLeft: '6px' }}>
            {activeToast.createdAt}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activeToast.text}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveToast(null);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.5)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <TbX size={16} />
      </button>
    </div>
  );
}
