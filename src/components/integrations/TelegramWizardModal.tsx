import { useState } from 'react';
import { api } from '../../api';
import {
  RiTelegramFill,
  RiCheckDoubleLine,
  RiAlertLine,
  RiLoader4Line,
  RiCloseLine,
  RiShieldCheckLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowRightLine,
  RiCheckLine
} from 'react-icons/ri';
import './IntegrationsModals.css';

interface Props {
  onSuccess: (channelTitle: string, botUsername: string) => void;
  onClose: () => void;
}

export default function TelegramWizardModal({ onSuccess, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [botToken, setBotToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [channelInput, setChannelInput] = useState('');
  const [targetColumn, setTargetColumn] = useState('col-1');
  const [autoLead, setAutoLead] = useState(true);
  const [syncMessages, setSyncMessages] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [validatedBot, setValidatedBot] = useState<any>(null);
  const [verifiedChannel, setVerifiedChannel] = useState<any>(null);

  // Step 1: Validate Bot Token
  const handleValidateBot = async () => {
    const cleanToken = botToken.trim();
    if (!cleanToken) {
      setError('Iltimos, @BotFather dan olingan Telegram Bot Tokenini kiriting');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.validateTelegramBot(cleanToken);
      if (res.ok && res.bot) {
        setValidatedBot(res.bot);
        setStep(2);
      } else {
        setError(res.message || 'Bot tokeni yaroqsiz');
      }
    } catch {
      setError('Server bilan aloqa xatosi');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Channel Admin Rights
  const handleVerifyChannel = async () => {
    const cleanChannel = channelInput.trim();
    if (!cleanChannel) {
      setError('Iltimos, Telegram kanal @username yoki havolasini kiriting');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyTelegramChannel(botToken.trim(), cleanChannel);
      if (res.ok && res.channel) {
        setVerifiedChannel(res.channel);
        setStep(3);
      } else {
        setError(res.message || 'Kanal huquqlarini tekshirib bo\'lmadi');
      }
    } catch {
      setError('Server bilan aloqa xatosi');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Finish & Save
  const handleFinishConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.connectTelegram({
        bot_token: botToken.trim(),
        bot_username: `@${validatedBot.username}`,
        bot_name: validatedBot.firstName,
        channel_id: verifiedChannel?.id || '',
        channel_username: verifiedChannel?.username || '',
        channel_title: verifiedChannel?.title || 'Kanal',
        target_column: targetColumn,
        auto_lead: autoLead,
        sync_messages: syncMessages
      });

      if (res.success) {
        onSuccess(verifiedChannel?.title || 'Kanal', `@${validatedBot.username}`);
      } else {
        setError(res.message || 'Ulanishni saqlashda xatolik yuz berdi');
      }
    } catch {
      setError('Server xatosi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="odim-modal-backdrop" onClick={onClose}>
      <div className="odim-telegram-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tg-modal-header">
          <div className="tg-brand-badge">
            <RiTelegramFill size={24} color="#0088cc" />
            <span>Telegram Bot & Kanal Ulagich</span>
          </div>
          <button className="modal-close-x" onClick={onClose}><RiCloseLine size={20} /></button>
        </div>

        {/* Wizard Steps Stepper Bar */}
        <div className="tg-wizard-steps-bar">
          <div className={`step-node ${step >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-lbl">Bot Token</span>
          </div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-node ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-lbl">Kanal & Huquqlar</span>
          </div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`step-node ${step === 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-lbl">Tayyor</span>
          </div>
        </div>

        {error && (
          <div className="selector-modal-error">
            <RiAlertLine size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: BOT TOKEN */}
        {step === 1 && (
          <div className="tg-step-content">
            <h4>1-Qadam: Bot Tokenini Kiriting</h4>
            <p className="tg-step-desc">
              Telegramda <b>@BotFather</b> ga o'tib <code>/newbot</code> buyrug'i orqali bot oching va berilgan tokenni bu yerga kiriting:
            </p>

            <div className="tg-input-wrap">
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="Masalan: 7123456789:AAH..."
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                className="tg-modal-input"
              />
              <button
                type="button"
                className="tg-eye-btn"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
              </button>
            </div>

            <div className="tg-footer-actions">
              <button type="button" className="odim-btn-cancel" onClick={onClose}>
                Bekor qilish
              </button>
              <button
                type="button"
                className="odim-btn-confirm"
                onClick={handleValidateBot}
                disabled={loading || !botToken.trim()}
              >
                {loading ? <RiLoader4Line className="integ-spin" size={17} /> : <RiArrowRightLine size={17} />}
                <span>{loading ? 'Tekshirilmoqda...' : 'Keyingisi: Kanalni tanlash'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CHANNEL USERNAME & RIGHTS */}
        {step === 2 && (
          <div className="tg-step-content">
            <div className="tg-verified-bot-banner">
              <RiCheckLine size={20} color="#10B981" />
              <span>Bot tasdiqlandi: <strong>@{validatedBot?.username}</strong> ({validatedBot?.firstName})</span>
            </div>

            <h4>2-Qadam: Kanal Manzili va Huquqlar</h4>
            <div className="tg-instructions-box">
              <p>1. Telegramdagi kanalingizga kiring ➔ <i>Sozlamalar ➔ Administrators</i>.</p>
              <p>2. <b>@{validatedBot?.username}</b> botini Administrator qilib qo'shing.</p>
              <p>3. <b>"Post Messages"</b> (Xabarlarni nashr qilish) ruxsatini yoqing.</p>
            </div>

            <label className="tg-field-label">Kanalingiz @username yoki havolasi:</label>
            <input
              type="text"
              placeholder="@odim_yangiliklar yoki https://t.me/odim_yangiliklar"
              value={channelInput}
              onChange={e => setChannelInput(e.target.value)}
              className="tg-modal-input"
            />

            <div className="tg-footer-actions">
              <button type="button" className="odim-btn-cancel" onClick={() => setStep(1)} disabled={loading}>
                Ortga
              </button>
              <button
                type="button"
                className="odim-btn-confirm"
                onClick={handleVerifyChannel}
                disabled={loading || !channelInput.trim()}
              >
                {loading ? <RiLoader4Line className="integ-spin" size={17} /> : <RiCheckDoubleLine size={17} />}
                <span>{loading ? 'Huquqlar tekshirilmoqda...' : 'Kanalni Tekshirish'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRM & AUTOMATION */}
        {step === 3 && (
          <div className="tg-step-content">
            <div className="tg-success-summary-box">
              <div className="tg-success-circle">
                <RiCheckDoubleLine size={32} color="#10B981" />
              </div>
              <h4>Kanal Huquqlari Tasdiqlandi!</h4>
              <p>Kanal: <strong>{verifiedChannel?.title}</strong> ({verifiedChannel?.username || verifiedChannel?.id})</p>
              <div className="tg-rights-badges">
                <span className="tg-right-badge active">✅ Administrator</span>
                <span className="tg-right-badge active">✅ Xabar yozish ruxsati</span>
                <span className="tg-right-badge active">✅ AES-256-GCM Shifrlangan</span>
              </div>
            </div>

            <div className="selector-toggles-box" style={{ marginTop: '16px' }}>
              <label className="selector-toggle-item">
                <input
                  type="checkbox"
                  checked={autoLead}
                  onChange={e => setAutoLead(e.target.checked)}
                />
                <div>
                  <strong>Avtomatik Lid va Bitim Yaratish</strong>
                  <small>Kanal yoki botdan kelgan murojaatlar avtomatik Savdo (Kanban) doskasiga tushadi</small>
                </div>
              </label>

              <label className="selector-toggle-item">
                <input
                  type="checkbox"
                  checked={syncMessages}
                  onChange={e => setSyncMessages(e.target.checked)}
                />
                <div>
                  <strong>Yagona Inbox bilan sinxronizatsiya</strong>
                  <small>Operatorlar barcha yozishmalarga to'g'ridan-to'g'ri CRM dan javob qaytara oladilar</small>
                </div>
              </label>
            </div>

            <div className="tg-footer-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="odim-btn-cancel" onClick={() => setStep(2)} disabled={loading}>
                Ortga
              </button>
              <button
                type="button"
                className="odim-btn-confirm"
                onClick={handleFinishConnection}
                disabled={loading}
              >
                {loading ? <RiLoader4Line className="integ-spin" size={17} /> : <RiCheckLine size={17} />}
                <span>{loading ? 'Saqlanmoqda...' : 'Tayyor! Ulanishni Yakunlash'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
