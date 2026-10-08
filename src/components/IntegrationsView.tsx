import React, { useState, useEffect } from 'react';
import { api, type IntegrationItem } from '../api';
import MetaAccountSelectorModal from './integrations/MetaAccountSelectorModal';
import {
  RiTelegramLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiWhatsappLine,
  RiSettings3Line,
  RiCheckLine,
  RiCloseLine,
  RiRefreshLine,
  RiFileCopyLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiEyeOffLine,
  RiShieldCheckLine,
  RiFlashlightLine,
  RiChat1Line,
  RiUserAddLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiSignalTowerLine,
  RiRocketLine,
  RiArrowRightLine,
  RiQuestionLine,
  RiInformationLine,
  RiAlertLine,
  RiCheckDoubleLine,
  RiGlobalLine,
  RiServerLine,
  RiKey2Line,
  RiPulseLine
} from 'react-icons/ri';
import './IntegrationsView.css';

export default function IntegrationsView() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'telegram' | 'instagram' | 'whatsapp' | 'facebook'>('all');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Meta Universal OAuth & Account Selection State
  const [metaSessionId, setMetaSessionId] = useState<string | null>(null);
  const [metaSelectorOpen, setMetaSelectorOpen] = useState<boolean>(false);
  const [isLaunchingMetaOAuth, setIsLaunchingMetaOAuth] = useState<boolean>(false);

  // Testing & Action State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Telegram 3-Step Wizard Modal State
  const [telegramWizardOpen, setTelegramWizardOpen] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [botTokenInput, setBotTokenInput] = useState<string>('');
  const [showBotToken, setShowBotToken] = useState<boolean>(false);
  const [botValidationLoading, setBotValidationLoading] = useState<boolean>(false);
  const [verifiedBot, setVerifiedBot] = useState<{ id: number; username: string; firstName: string } | null>(null);
  const [channelInput, setChannelInput] = useState<string>('');
  const [channelVerifyingLoading, setChannelVerifyingLoading] = useState<boolean>(false);
  const [verifiedChannel, setVerifiedChannel] = useState<{ id: string; title: string; username: string; canPostMessages: boolean } | null>(null);
  const [wizardTargetColumn, setWizardTargetColumn] = useState<string>('col-1');
  const [wizardAutoLead, setWizardAutoLead] = useState<boolean>(true);
  const [wizardSyncMessages, setWizardSyncMessages] = useState<boolean>(true);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardSubmitting, setWizardSubmitting] = useState<boolean>(false);

  // 2. Setup Guide Modal (Instagram Diagnostic Guide)
  const [setupGuideOpen, setSetupGuideOpen] = useState<boolean>(false);

  // 3. Safe Disconnect Modal State
  const [disconnectModalItem, setDisconnectModalItem] = useState<IntegrationItem | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);

  // 4. Omnichannel Inbound Lead Simulator Modal State
  const [simulatorOpen, setSimulatorOpen] = useState<boolean>(false);
  const [simChannel, setSimChannel] = useState<string>('telegram');
  const [simSenderName, setSimSenderName] = useState<string>('Azizbek Rahimov');
  const [simPhone, setSimPhone] = useState<string>('+998 90 987 65 43');
  const [simUsername, setSimUsername] = useState<string>('@azizbek_uz');
  const [simMessageText, setSimMessageText] = useState<string>("Assalomu alaykum! Yangi avtomobil modellari va narxlari bo'yicha ma'lumot bera olasizmi?");
  const [simSubmitting, setSimSubmitting] = useState<boolean>(false);
  const [simSuccessResult, setSimSuccessResult] = useState<any | null>(null);

  // 5. General Configuration Modal State
  const [modalItem, setModalItem] = useState<IntegrationItem | null>(null);
  const [formConfig, setFormConfig] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);

  // 6. Reset All Integrations & Flow Guide State
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showFlowGuide, setShowFlowGuide] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3800);
  };

  const handleResetAll = async () => {
    setIsResetting(true);
    try {
      const res = await api.resetIntegrations();
      if (res && res.success) {
        showToast("Barcha integratsiyalar boshlang'ich holatga qaytarildi!", 'success');
        setResetModalOpen(false);
        await loadData();
      } else {
        showToast(res.message || "Tozalashda xatolik yuz berdi", 'error');
      }
    } catch {
      showToast("Server bilan bog'lanishda xatolik", 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getIntegrations();
      if (data && data.length > 0) {
        setIntegrations(data);
      }
    } catch (e) {
      console.error('Error loading integrations:', e);
      showToast("Integratsiyalarni yuklashda xatolik yuz berdi", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Active Toggle
  const handleToggleActive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleIntegration(id);
      if (res && res.success) {
        setIntegrations(prev =>
          prev.map(item =>
            item.id === id
              ? {
                  ...item,
                  isActive: res.isActive ?? !item.isActive,
                  status: (res.status as any) || (item.isActive ? 'disconnected' : 'connected')
                }
              : item
          )
        );
        showToast(
          res.isActive ? `${id.toUpperCase()} faollashtirildi!` : `${id.toUpperCase()} o'chirildi!`,
          'info'
        );
      }
    } catch {
      showToast("Holatni o'zgartirishda xatolik yuz berdi", 'error');
    }
  };

  // Test Ping
  const handleTestPing = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await api.testIntegration(id);
      setTestResult(res);
      if (res.ok) {
        showToast(res.message || "Aloqa muvaffaqiyatli tekshirildi!", 'success');
      } else {
        showToast(res.message || "Ulanishda xatolik aniqlandi!", 'error');
      }
    } catch {
      showToast("Aloqa tekshirishda server xatosi yuz berdi", 'error');
    } finally {
      setTestingId(null);
    }
  };

  // Safe Disconnect Execution
  const executeSafeDisconnect = async () => {
    if (!disconnectModalItem) return;
    setIsDisconnecting(true);
    try {
      const res = await api.disconnectIntegration(disconnectModalItem.id);
      if (res && res.success) {
        setIntegrations(prev =>
          prev.map(item =>
            item.id === disconnectModalItem.id
              ? { ...item, isActive: false, status: 'disconnected' }
              : item
          )
        );
        showToast(res.message || `${disconnectModalItem.name} xavfsiz uzildi!`, 'info');
        setDisconnectModalItem(null);
      } else {
        showToast("Uzishda xatolik yuz berdi", 'error');
      }
    } catch {
      showToast("Server bilan bog'lanishda xatolik", 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast("Nusxa olindi!", 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ----------------- TELEGRAM 3-STEP WIZARD LOGIC -----------------
  const openTelegramWizard = () => {
    setWizardStep(1);
    setBotTokenInput('');
    setVerifiedBot(null);
    setChannelInput('');
    setVerifiedChannel(null);
    setWizardTargetColumn('col-1');
    setWizardAutoLead(true);
    setWizardSyncMessages(true);
    setWizardError(null);
    setTelegramWizardOpen(true);
  };

  const handleValidateBotStep = async () => {
    if (!botTokenInput.trim()) {
      setWizardError("Iltimos, @BotFather dan olingan bot tokenini kiriting.");
      return;
    }
    setWizardError(null);
    setBotValidationLoading(true);
    try {
      const res = await api.validateTelegramBot(botTokenInput.trim());
      if (res.ok && res.bot) {
        setVerifiedBot(res.bot);
        setWizardStep(2);
        showToast(res.message, 'success');
      } else {
        setWizardError(res.message || "Bot tokeni yaroqsiz.");
      }
    } catch (e) {
      setWizardError("Server bilan aloqa xatosi. Qaytadan urinib ko'ring.");
    } finally {
      setBotValidationLoading(false);
    }
  };

  const handleVerifyChannelStep = async () => {
    if (!channelInput.trim()) {
      setWizardError("Iltimos, kanal username (@kanal) yoki havolasini kiriting.");
      return;
    }
    setWizardError(null);
    setChannelVerifyingLoading(true);
    try {
      const res = await api.verifyTelegramChannel(botTokenInput.trim(), channelInput.trim());
      if (res.ok && res.channel) {
        setVerifiedChannel(res.channel);
        setWizardStep(3);
        showToast(res.message, 'success');
      } else {
        setWizardError(res.message || "Kanal yoki administrator huquqlarini tekshirib bo'lmadi.");
      }
    } catch (e) {
      setWizardError("Server bilan aloqa xatosi.");
    } finally {
      setChannelVerifyingLoading(false);
    }
  };

  const handleFinishTelegramConnection = async () => {
    if (!verifiedBot) return;
    setWizardSubmitting(true);
    setWizardError(null);
    try {
      const res = await api.connectTelegram({
        bot_token: botTokenInput.trim(),
        bot_username: `@${verifiedBot.username}`,
        bot_name: verifiedBot.firstName,
        channel_id: verifiedChannel?.id || '',
        channel_username: verifiedChannel?.username || '',
        channel_title: verifiedChannel?.title || 'Kanal',
        target_column: wizardTargetColumn,
        auto_lead: wizardAutoLead,
        sync_messages: wizardSyncMessages
      });

      if (res && res.success) {
        showToast(res.message || "Telegram muvaffaqiyatli ulandi!", 'success');
        setTelegramWizardOpen(false);
        loadData();
      } else {
        setWizardError(res.message || "Ulanishni saqlashda xatolik yuz berdi");
      }
    } catch {
      setWizardError("Server xatosi");
    } finally {
      setWizardSubmitting(false);
    }
  };

  // ----------------- UNIVERSAL META OAUTH & ACCOUNT SELECTION -----------------
  useEffect(() => {
    const handleMetaMessage = (event: MessageEvent) => {
      if (event.data?.type === 'META_AUTH_SUCCESS') {
        setIsLaunchingMetaOAuth(false);
        if (event.data.sessionId) {
          setMetaSessionId(event.data.sessionId);
          setMetaSelectorOpen(true);
        }
      } else if (event.data?.type === 'META_AUTH_ERROR') {
        setIsLaunchingMetaOAuth(false);
        showToast(event.data.error || "Meta avtorizatsiyasida xatolik yuz berdi", 'error');
      }
    };

    window.addEventListener('message', handleMetaMessage);
    return () => window.removeEventListener('message', handleMetaMessage);
  }, []);

  const handleLaunchMetaOAuth = async (platform: string = 'all') => {
    setIsLaunchingMetaOAuth(true);
    try {
      const res = await api.getMetaConnectUrl(platform);
      if (res && res.success && res.authUrl) {
        const width = 650;
        const height = 750;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const urlToOpen = res.authUrl.startsWith('http') ? res.authUrl : `${window.location.origin}${res.authUrl}`;
        window.open(
          urlToOpen,
          'MetaOAuthPopup',
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
        );
      } else {
        // Fallback to instant mock session so user can test the modal directly
        const mockRes = await api.createMetaMockSession();
        if (mockRes.success && mockRes.sessionId) {
          setMetaSessionId(mockRes.sessionId);
          setMetaSelectorOpen(true);
          showToast("Meta sahifalar tahlil qilindi!", 'info');
        } else {
          showToast("Meta ulanishini boshlab bo'lmadi", 'error');
        }
      }
    } catch {
      showToast("Server bilan bog'lanishda xato", 'error');
    } finally {
      setIsLaunchingMetaOAuth(false);
    }
  };

  const handleMetaAccountSuccess = (pageName: string, igName?: string) => {
    setMetaSelectorOpen(false);
    setMetaSessionId(null);
    let msg = `🎉 Facebook sahifa '${pageName}'`;
    if (igName) msg += ` va Instagram '${igName}'`;
    msg += ` muvaffaqiyatli ulandi!`;
    showToast(msg, 'success');
    loadData();
  };

  // ----------------- SIMULATOR SUBMISSION -----------------
  const handleRunSimulator = async () => {
    if (!simSenderName.trim() || !simMessageText.trim()) {
      showToast("Mijoz ismi va murojaat matnini kiriting", 'error');
      return;
    }
    setSimSubmitting(true);
    setSimSuccessResult(null);
    try {
      const res = await api.simulateInboundLead({
        channel: simChannel,
        sender_name: simSenderName.trim(),
        phone: simPhone.trim(),
        username: simUsername.trim(),
        message_text: simMessageText.trim(),
        industry: 'avtosalon',
        target_column: 'col-1'
      });
      if (res && res.success) {
        setSimSuccessResult(res);
        showToast(res.message, 'success');
        loadData();
      } else {
        showToast(res.message || "Xatolik yuz berdi", 'error');
      }
    } catch {
      showToast("Server bilan aloqa xatosi", 'error');
    } finally {
      setSimSubmitting(false);
    }
  };

  // ----------------- GENERAL MODAL CONFIG -----------------
  const openConfigModal = (item: IntegrationItem) => {
    setModalItem(item);
    setFormConfig({ ...(item.config || {}) });
    setShowSecret(false);
    setTestResult(null);
  };

  const closeConfigModal = () => {
    setModalItem(null);
    setFormConfig({});
    setTestResult(null);
  };

  const handleSaveModal = async () => {
    if (!modalItem) return;
    setIsSaving(true);
    try {
      if (modalItem.id === 'whatsapp') {
        const res = await api.connectWhatsApp({
          phone_number_id: formConfig.phone_number_id || '104928174829102',
          waba_id: formConfig.waba_id || '982348571029384',
          access_token: formConfig.access_token || '',
          phone_number: formConfig.phone_number || '+998 90 123 45 67',
          business_name: formConfig.business_name || 'Odim Business',
          auto_lead: formConfig.auto_lead !== false
        });
        if (res && res.success) {
          showToast(res.message, 'success');
          closeConfigModal();
          loadData();
          return;
        }
      }

      const res = await api.updateIntegration(modalItem.id, {
        config_data: formConfig,
        is_active: modalItem.isActive,
        status: modalItem.status
      });

      if (res && res.success) {
        setIntegrations(prev =>
          prev.map(i => (i.id === modalItem.id ? { ...i, config: { ...formConfig } } : i))
        );
        showToast(`${modalItem.name} sozlamalari muvaffaqiyatli saqlandi!`, 'success');
        closeConfigModal();
      } else {
        showToast(res.message || "Saqlashda xatolik yuz berdi", 'error');
      }
    } catch {
      showToast("Server bilan bog'lanishda xatolik", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Provider Info Helper
  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'telegram':
        return {
          icon: RiTelegramLine,
          brandClass: 'brand-telegram',
          badgeColor: '#0284c7',
          title: 'Telegram Bot & Kanallar',
          subtitle: "3-bosqichli avtomatlashtirilgan ulanish va kanallardan uzluksiz avto-lidlar oqimi",
          features: ['3-Bosqichli Wizard', 'Kanal va Guruhlarga avto-post', 'Avto-Bitim generatsiyasi', 'Real-time Webhook']
        };
      case 'instagram':
        return {
          icon: RiInstagramLine,
          brandClass: 'brand-instagram',
          badgeColor: '#E1306C',
          title: 'Instagram Direct & Izohlar',
          subtitle: "Direct xabarlar, Stories reaksiyalari va post izohlaridan avtomatik bitimlar",
          features: ['1-Click Meta OAuth', 'Direct xabarlar Inboxda', 'Post izohlaridan lid ochish', 'Auto-Discovery']
        };
      case 'facebook':
        return {
          icon: RiFacebookCircleLine,
          brandClass: 'brand-facebook',
          badgeColor: '#1877F2',
          title: 'Facebook Messenger & Leads',
          subtitle: "Facebook Page xabarlari va Lead Ads (reklama formasi) arizalari integratsiyasi",
          features: ['Messenger ikki tomonlama chat', 'Lead Ads avto-import', 'Sahifa postlari monitoringi']
        };
      case 'whatsapp':
        return {
          icon: RiWhatsappLine,
          brandClass: 'brand-whatsapp',
          badgeColor: '#10B981',
          title: 'WhatsApp Business Cloud API',
          subtitle: "Rasmiy Cloud API v21.0 orqali xalqaro va mahalliy mijozlar bilan rasmiy aloqa",
          features: ['Cloud API v21.0', 'Tasdiqlangan shablonlar', "Avto-o'qildi (Blue Check)", '24/7 Avto-javob']
        };
      default:
        return {
          icon: RiSignalTowerLine,
          brandClass: 'brand-default',
          badgeColor: '#6366F1',
          title: provider,
          subtitle: "Integratsiya kanali",
          features: ['Sinxronizatsiya']
        };
    }
  };

  // Stats calculation
  const totalConnected = integrations.filter(i => i.isActive).length;
  const totalMsgs = integrations.reduce((acc, curr) => acc + (curr.stats?.totalMessages || 0), 0);
  const totalLds = integrations.reduce((acc, curr) => acc + (curr.stats?.leadsGenerated || 0), 0);
  const avgPing = Math.round(
    integrations
      .filter(i => i.isActive && i.stats?.latencyMs)
      .reduce((acc, curr, _, arr) => acc + (curr.stats?.latencyMs || 0) / arr.length, 0)
  ) || 42;

  // Single active item for detailed channel tab view
  const singleChannelItem = integrations.find(i => i.id === activeTab);

  return (
    <div className="odim-integrations-wrapper">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`odim-toast odim-toast-${toastMsg.type}`}>
          {toastMsg.type === 'success' && <RiCheckboxCircleLine size={18} />}
          {toastMsg.type === 'error' && <RiErrorWarningLine size={18} />}
          {toastMsg.type === 'info' && <RiCheckLine size={18} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 1. CLEAN MODERN HEADER */}
      <div className="odim-integ-hero">
        <div className="hero-mesh-glow" />
        <div className="hero-inner">
          <div className="hero-text-block">
            <h1 className="hero-title">Ijtimoiy Tarmoqlar Integratsiyasi</h1>
            <p className="hero-description">
              Telegram, Instagram, WhatsApp va Facebook hisoblaringizni CRM bilan bog'lang. Mijozlar yozgan har bir xabar avtomatik <strong>Yagona Inbox</strong> va <strong>Savdo (Kanban)</strong> tizimiga yetib boradi.
            </p>
          </div>

          <div className="hero-action-cluster">
            <button
              type="button"
              className="odim-btn odim-btn-primary glow"
              onClick={() => setSimulatorOpen(true)}
            >
              <RiRocketLine size={17} />
              <span>Murojaatni Sinash</span>
            </button>

            <button
              type="button"
              className="odim-btn odim-btn-secondary"
              onClick={loadData}
              disabled={isLoading}
              title="Yangilash"
            >
              <RiRefreshLine size={16} className={isLoading ? 'integ-spin' : ''} />
              <span>Yangilash</span>
            </button>

            <button
              type="button"
              className="odim-btn odim-btn-danger-outline"
              onClick={() => setResetModalOpen(true)}
              title="Barcha integratsiya ma'lumotlarini tozalash"
            >
              <RiRefreshLine size={16} />
              <span>Tozalash (Reset)</span>
            </button>

            <a href="/chat/inbox" className="odim-btn odim-btn-ghost">
              <RiChat1Line size={16} />
              <span>Yagona Inbox</span>
              <RiExternalLinkLine size={14} />
            </a>
          </div>
        </div>

        {/* Hero KPI Micro Strip */}
        {totalConnected > 0 ? (
          <div className="hero-kpi-bar">
            <div className="kpi-item">
              <span className="kpi-label">Ulangan Kanallar</span>
              <span className="kpi-val highlight">{totalConnected} <small>/ 4 faol</small></span>
            </div>
            <div className="kpi-divider" />
            <div className="kpi-item">
              <span className="kpi-label">Jami Kiruvchi Xabarlar</span>
              <span className="kpi-val">{totalMsgs.toLocaleString()} <small>ta</small></span>
            </div>
            <div className="kpi-divider" />
            <div className="kpi-item">
              <span className="kpi-label">Avtomatik Bitimlar (Kanban)</span>
              <span className="kpi-val emerald">{totalLds} <small>ta lid</small></span>
            </div>
            <div className="kpi-divider" />
            <div className="kpi-item">
              <span className="kpi-label">Server Holati</span>
              <span className="kpi-val sky">Faol & Barqaror</span>
            </div>
          </div>
        ) : (
          <div className="hero-kpi-bar hero-kpi-bar-empty">
            <div className="empty-kpi-note">
              <RiInformationLine size={16} color="#0284c7" />
              <span>Hozircha hech qanday kanal ulanmagan. Boshlash uchun kerakli kanal ostidagi <strong>"Ulash"</strong> tugmasini bosing.</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. CHIC CHANNEL SELECTOR TABS */}
      <div className="odim-tab-nav-container">
        <div className="odim-tab-nav">
          <button
            type="button"
            className={`odim-tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <RiGlobalLine size={16} />
            <span>Barcha Kanallar ({integrations.length})</span>
          </button>

          <button
            type="button"
            className={`odim-tab-item tab-telegram ${activeTab === 'telegram' ? 'active' : ''}`}
            onClick={() => setActiveTab('telegram')}
          >
            <RiTelegramLine size={17} />
            <span>Telegram Bot & Kanal</span>
            {integrations.find(i => i.id === 'telegram')?.isActive && <span className="tab-dot active" />}
          </button>

          <button
            type="button"
            className={`odim-tab-item tab-instagram ${activeTab === 'instagram' ? 'active' : ''}`}
            onClick={() => setActiveTab('instagram')}
          >
            <RiInstagramLine size={17} />
            <span>Instagram Direct</span>
            {integrations.find(i => i.id === 'instagram')?.isActive && <span className="tab-dot active" />}
          </button>

          <button
            type="button"
            className={`odim-tab-item tab-whatsapp ${activeTab === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            <RiWhatsappLine size={17} />
            <span>WhatsApp Business</span>
            {integrations.find(i => i.id === 'whatsapp')?.isActive && <span className="tab-dot active" />}
          </button>

          <button
            type="button"
            className={`odim-tab-item tab-facebook ${activeTab === 'facebook' ? 'active' : ''}`}
            onClick={() => setActiveTab('facebook')}
          >
            <RiFacebookCircleLine size={17} />
            <span>Facebook Messenger</span>
            {integrations.find(i => i.id === 'facebook')?.isActive && <span className="tab-dot active" />}
          </button>
        </div>
      </div>

      {/* 3. CONTENT AREA: ALL CHANNELS GRID OR DETAILED DEDICATED CHANNEL VIEW */}
      {activeTab === 'all' ? (
        <div className="odim-channels-grid">
          {integrations.map(item => {
            const info = getProviderInfo(item.provider);
            const Icon = info.icon;
            const isTestingThis = testingId === item.id;

            return (
              <div
                key={item.id}
                className={`odim-channel-card ${info.brandClass} ${item.isActive ? 'is-connected' : 'is-disconnected'}`}
              >
                {/* Top Banner Accent */}
                <div className="card-top-stripe" />

                {/* Card Header */}
                <div className="card-header">
                  <div className="card-brand-box">
                    <div className="brand-logo-frame">
                      <Icon size={26} />
                    </div>
                    <div className="brand-titles">
                      <h3 className="channel-title">{item.name}</h3>
                      <div className="channel-handle">
                        {item.isActive ? (item.config?.channel_title || item.config?.bot_username || item.config?.account_username || item.config?.page_name || 'Ulangan') : 'Ulanmagan'}
                      </div>
                    </div>
                  </div>

                  <div className="card-status-group">
                    <span className={`channel-status-badge ${item.isActive ? 'status-active' : 'status-inactive'}`}>
                      {item.isActive && <span className="beacon-indicator" />}
                      {item.isActive ? 'Ulangan' : 'Ulanmagan'}
                    </span>
                    {item.isActive && (
                      <label className="odim-switch" title={item.isActive ? "O'chirish" : "Yoqish"}>
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) => handleToggleActive(item.id, e as any)}
                        />
                        <span className="switch-slider" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Card Subtitle */}
                <p className="card-subtitle">{info.subtitle}</p>

                {item.isActive ? (
                  /* Channel Stats Meter (ONLY WHEN CONNECTED) */
                  <div className="card-metrics-strip">
                    <div className="metric-box">
                      <span className="metric-num">{item.stats?.totalMessages?.toLocaleString() || 0}</span>
                      <span className="metric-tag">Xabarlar</span>
                    </div>
                    <div className="metric-sep" />
                    <div className="metric-box">
                      <span className="metric-num">{item.stats?.leadsGenerated || 0}</span>
                      <span className="metric-tag">Avto-Lid</span>
                    </div>
                    <div className="metric-sep" />
                    <div className="metric-box">
                      <span className="metric-num">{item.stats?.latencyMs ? `${item.stats.latencyMs}ms` : '--'}</span>
                      <span className="metric-tag">Ping</span>
                    </div>
                  </div>
                ) : (
                  /* Clean Disconnected State Callout */
                  <div className="card-disconnected-callout">
                    <RiInformationLine size={16} />
                    <span>Kanal ulanmagan. Mijozlar murojaatlarini qabul qilish uchun quyidagi tugma orqali faollashtiring.</span>
                  </div>
                )}

                {/* Bottom Actions Area */}
                <div className="card-footer-actions">
                  {!item.isActive ? (
                    // ZERO-FRICTION 1-CLICK CONNECTION
                    <div className="action-row-disconnected">
                      {item.id === 'telegram' && (
                        <button
                          type="button"
                          className="cta-connect-btn telegram-cta"
                          onClick={openTelegramWizard}
                        >
                          <RiTelegramLine size={19} />
                          <span>Telegramni ulash</span>
                        </button>
                      )}

                      {item.id === 'instagram' && (
                        <div className="split-action-wrap">
                          <button
                            type="button"
                            className="cta-connect-btn instagram-cta"
                            onClick={() => handleLaunchMetaOAuth('instagram')}
                            disabled={isLaunchingMetaOAuth}
                          >
                            <RiInstagramLine size={19} />
                            <span>Instagramni ulash</span>
                          </button>
                          <button
                            type="button"
                            className="guide-icon-btn"
                            onClick={() => setSetupGuideOpen(true)}
                            title="Instagram sozlash qo'llanmasi"
                          >
                            <RiQuestionLine size={17} />
                          </button>
                        </div>
                      )}

                      {item.id === 'whatsapp' && (
                        <button
                          type="button"
                          className="cta-connect-btn whatsapp-cta"
                          onClick={() => openConfigModal(item)}
                        >
                          <RiWhatsappLine size={19} />
                          <span>WhatsAppni ulash</span>
                        </button>
                      )}

                      {item.id === 'facebook' && (
                        <div className="split-action-wrap">
                          <button
                            type="button"
                            className="cta-connect-btn facebook-cta"
                            onClick={() => handleLaunchMetaOAuth('facebook')}
                            disabled={isLaunchingMetaOAuth}
                          >
                            <RiFacebookCircleLine size={19} />
                            <span>Facebookni ulash</span>
                          </button>
                          <button
                            type="button"
                            className="guide-icon-btn"
                            onClick={() => setSetupGuideOpen(true)}
                            title="Facebook sahifa qo'llanmasi"
                          >
                            <RiQuestionLine size={17} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // CONNECTED: MANAGE, HEALTH TEST & SAFE DISCONNECT
                    <div className="action-row-connected">
                      <button
                        type="button"
                        className="manage-btn ping-btn"
                        disabled={isTestingThis}
                        onClick={(e) => handleTestPing(item.id, e)}
                      >
                        <RiPulseLine size={16} className={isTestingThis ? 'integ-spin' : ''} />
                        <span>{isTestingThis ? '...' : 'Ping'}</span>
                      </button>

                      {item.id === 'telegram' ? (
                        <button
                          type="button"
                          className="manage-btn config-btn"
                          onClick={openTelegramWizard}
                        >
                          <RiSettings3Line size={16} />
                          <span>Kanalni yangilash</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="manage-btn config-btn"
                          onClick={() => openConfigModal(item)}
                        >
                          <RiSettings3Line size={16} />
                          <span>Sozlash</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="manage-btn disconnect-btn"
                        onClick={() => setDisconnectModalItem(item)}
                        title="Xavfsiz uzish (Tarixiy ma'lumotlar saqlanadi)"
                      >
                        <span>Uzish</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      ) : (
        /* DEDICATED CHANNEL WORKSPACE TAB (DEEP DIVE VIEW) */
        singleChannelItem && (() => {
          const info = getProviderInfo(singleChannelItem.provider);
          const Icon = info.icon;
          const isTestingThis = testingId === singleChannelItem.id;

          return (
            <div className="odim-single-channel-view">
              <div className={`single-hero-card ${info.brandClass}`}>
                <div className="single-hero-left">
                  <div className="single-brand-icon">
                    <Icon size={38} />
                  </div>
                  <div>
                    <div className="single-title-row">
                      <h2>{singleChannelItem.name}</h2>
                      <span className={`channel-status-badge ${singleChannelItem.isActive ? 'status-active' : 'status-inactive'}`}>
                        <span className="beacon-indicator" />
                        {singleChannelItem.isActive ? 'Faol Ulangan' : 'Ulanmagan'}
                      </span>
                    </div>
                    <p className="single-desc">{info.subtitle}</p>
                    <div className="single-metadata-tags">
                      <span>Oxirgi sinxronizatsiya: <strong>{singleChannelItem.lastSync || 'Hozir'}</strong></span>
                      <span>·</span>
                      <span>Xavfsiz Token: <strong>AES-256-GCM Shifrlangan</strong></span>
                    </div>
                  </div>
                </div>

                <div className="single-hero-actions">
                  {!singleChannelItem.isActive ? (
                    singleChannelItem.id === 'telegram' ? (
                      <button type="button" className="cta-connect-btn telegram-cta" onClick={openTelegramWizard}>
                        <RiTelegramLine size={18} />
                        <span>3-Bosqichli Ulagichni Boshlash</span>
                      </button>
                    ) : singleChannelItem.id === 'instagram' ? (
                      <button
                        type="button"
                        className="cta-connect-btn instagram-cta"
                        onClick={() => handleLaunchMetaOAuth('instagram')}
                        disabled={isLaunchingMetaOAuth}
                      >
                        <RiInstagramLine size={18} />
                        <span>Meta OAuth & Tanlash</span>
                      </button>
                    ) : singleChannelItem.id === 'facebook' ? (
                      <button
                        type="button"
                        className="cta-connect-btn facebook-cta"
                        onClick={() => handleLaunchMetaOAuth('facebook')}
                        disabled={isLaunchingMetaOAuth}
                      >
                        <RiFacebookCircleLine size={18} />
                        <span>Meta OAuth & Tanlash</span>
                      </button>
                    ) : (
                      <button type="button" className="cta-connect-btn" onClick={() => openConfigModal(singleChannelItem)}>
                        <RiSettings3Line size={18} />
                        <span>Sozlash & Ulash</span>
                      </button>
                    )
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="manage-btn ping-btn" onClick={() => handleTestPing(singleChannelItem.id)}>
                        <RiPulseLine size={16} className={isTestingThis ? 'integ-spin' : ''} />
                        <span>Ulanishni Tekshirish</span>
                      </button>
                      <button type="button" className="manage-btn disconnect-btn" onClick={() => setDisconnectModalItem(singleChannelItem)}>
                        <span>Xavfsiz Uzish</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Configuration Grid */}
              <div className="single-details-grid">
                {/* Panel 1: Webhook & Endpoints */}
                <div className="detail-panel-card">
                  <div className="panel-title-row">
                    <RiServerLine size={20} color="#0284c7" />
                    <h4>Webhook & Callback Sozlamalari</h4>
                  </div>
                  <p className="panel-sub">Ushbu parametrlar Odim CRM serveri orqali avtomatik nazorat qilinadi.</p>

                  <div className="endpoint-field-block">
                    <label>Webhook URL (Doimiy faol):</label>
                    <div className="code-copy-row">
                      <code>{singleChannelItem.config?.webhook_url || 'https://api.crm.odim.uz/webhooks/' + singleChannelItem.id}</code>
                      <button
                        type="button"
                        className="copy-chip-btn"
                        onClick={() => copyToClipboard(singleChannelItem.config?.webhook_url || 'https://api.crm.odim.uz/webhooks/' + singleChannelItem.id, 'wh_url')}
                      >
                        {copiedKey === 'wh_url' ? <RiCheckLine size={14} color="#10B981" /> : <RiFileCopyLine size={14} />}
                        <span>{copiedKey === 'wh_url' ? "Nusxalandi" : "Nusxa"}</span>
                      </button>
                    </div>
                  </div>

                  {singleChannelItem.config?.verify_token && (
                    <div className="endpoint-field-block" style={{ marginTop: '10px' }}>
                      <label>Verify Token (Meta Verify):</label>
                      <div className="code-copy-row">
                        <code>{singleChannelItem.config.verify_token}</code>
                        <button
                          type="button"
                          className="copy-chip-btn"
                          onClick={() => copyToClipboard(singleChannelItem.config.verify_token, 'wh_token')}
                        >
                          {copiedKey === 'wh_token' ? <RiCheckLine size={14} color="#10B981" /> : <RiFileCopyLine size={14} />}
                          <span>{copiedKey === 'wh_token' ? "Nusxalandi" : "Nusxa"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Panel 2: CRM Automation Rules */}
                <div className="detail-panel-card">
                  <div className="panel-title-row">
                    <RiRocketLine size={20} color="#10b981" />
                    <h4>Avtomatlashtirish & Savdo (Kanban)</h4>
                  </div>
                  <p className="panel-sub">Har bir kiruvchi xabardan avto-lid ochish va sinxronlash parametrlari.</p>

                  <div className="automation-checks-list">
                    <label className="automation-check-item">
                      <input type="checkbox" checked={singleChannelItem.config?.auto_lead !== false} readOnly />
                      <div>
                        <strong>Avto-Bitim Generatsiyasi Yoqilgan</strong>
                        <p>Yangi mijoz murojaati to'g'ridan-to'g'ri Savdo (Kanban) '#1-bosqich (Lid keldi)'ga qo'shiladi.</p>
                      </div>
                    </label>

                    <label className="automation-check-item">
                      <input type="checkbox" checked={singleChannelItem.config?.sync_messages !== false} readOnly />
                      <div>
                        <strong>Yagona Inbox Bilan 2 Tomonlama Sinxronlash</strong>
                        <p>Xabarlar real-vaqtda barcha operatorlar uchun umumiy chat markazida ko'rinadi.</p>
                      </div>
                    </label>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                    <button type="button" className="odim-btn odim-btn-secondary" onClick={() => setSimulatorOpen(true)}>
                      <RiRocketLine size={16} />
                      <span>Ushbu Kanalda Murojaatni Sinash</span>
                    </button>
                    {singleChannelItem.id === 'instagram' && (
                      <button type="button" className="odim-btn odim-btn-ghost" onClick={() => setSetupGuideOpen(true)}>
                        <RiQuestionLine size={16} />
                        <span>Sozlash Yo'riqnomasi</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* 4. OPTIONAL FLOW BLUEPRINT ACCORDION */}
      <div className="odim-flow-accordion-card">
        <button
          type="button"
          className="flow-accordion-header"
          onClick={() => setShowFlowGuide(!showFlowGuide)}
        >
          <div className="flow-accordion-title">
            <RiInformationLine size={18} color="#2563eb" />
            <span>Integratsiyalar qanday ishlaydi? (CRM ma'lumotlar oqimi)</span>
          </div>
          <span className="flow-accordion-badge">
            {showFlowGuide ? "Yashirish ▲" : "Ko'rsatish ▼"}
          </span>
        </button>

        {showFlowGuide && (
          <div className="odim-flow-blueprint">
            <div className="flow-cards-line">
              <div className="flow-card-node">
                <div className="node-num">1</div>
                <h4>Mijoz Murojaati</h4>
                <p>Mijoz Telegram, Instagram Direct, WhatsApp yoki Facebook orqali xabar yozadi yoki forma to'ldiradi.</p>
              </div>

              <div className="node-arrow">➔</div>

              <div className="flow-card-node">
                <div className="node-num">2</div>
                <h4>Idempotent Webhook</h4>
                <p>External MID orqali takrorlanishdan himoyalangan 24/7 tezkor xabar qabul qilish gatewayi.</p>
              </div>

              <div className="node-arrow">➔</div>

              <div className="flow-card-node">
                <div className="node-num">3</div>
                <h4>Avto-Bitim (Kanban)</h4>
                <p>Mijoz profili ochilib, Savdo (Kanban) doskasining '#1-bosqich (Lid keldi)' ustuniga avtomatik joylanadi.</p>
              </div>

              <div className="node-arrow">➔</div>

              <div className="flow-card-node">
                <div className="node-num">4</div>
                <h4>Yagona Inbox</h4>
                <p>Operatorlar va menejerlar yagona professional chat oynasida darhol mijozga javob qaytaradi.</p>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* ========================================================================= */}
      {/* 5. TELEGRAM 3-STEP WIZARD MODAL                                           */}
      {/* ========================================================================= */}
      {telegramWizardOpen && (
        <div className="odim-modal-backdrop" onClick={() => setTelegramWizardOpen(false)}>
          <div className="odim-modal-window wizard-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-brand-lead telegram">
                <RiTelegramLine size={24} />
              </div>
              <div className="modal-title-text">
                <h3>Telegram Bot & Kanal Ulagichi</h3>
                <p>3 ta sodda qadamda bot va kanalingizni to'liq ulang</p>
              </div>
              <button
                type="button"
                className="modal-close-trigger"
                onClick={() => setTelegramWizardOpen(false)}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* Stepper Node Line */}
            <div className="wizard-stepper-strip">
              <div className={`wizard-step-item ${wizardStep >= 1 ? 'active' : ''} ${wizardStep > 1 ? 'done' : ''}`}>
                <span className="step-badge">{wizardStep > 1 ? <RiCheckLine size={13} /> : '1'}</span>
                <span className="step-caption">Bot Tokeni</span>
              </div>
              <div className={`step-connector ${wizardStep >= 2 ? 'filled' : ''}`} />
              <div className={`wizard-step-item ${wizardStep >= 2 ? 'active' : ''} ${wizardStep > 2 ? 'done' : ''}`}>
                <span className="step-badge">{wizardStep > 2 ? <RiCheckLine size={13} /> : '2'}</span>
                <span className="step-caption">Kanal & Admin</span>
              </div>
              <div className={`step-connector ${wizardStep >= 3 ? 'filled' : ''}`} />
              <div className={`wizard-step-item ${wizardStep === 3 ? 'active' : ''}`}>
                <span className="step-badge">3</span>
                <span className="step-caption">Faollashtirish</span>
              </div>
            </div>

            <div className="modal-scroll-body">
              {wizardError && (
                <div className="wizard-alert-error">
                  <RiAlertLine size={18} />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* STEP 1 */}
              {wizardStep === 1 && (
                <div className="wizard-step-panel">
                  <div className="wizard-callout-info">
                    <RiInformationLine size={20} className="info-icon" />
                    <div>
                      <strong>Bot tokenini qanday olish mumkin?</strong>
                      <p>
                        Telegramda rasmiy <strong>@BotFather</strong> botiga o'ting, <code>/newbot</code> yoki mavjud botingiz uchun <code>/token</code> buyrug'ini yuborib, olingan API tokenni bu yerga joylang.
                      </p>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">
                      Telegram Bot Token:
                      <span className="label-subhint">(@BotFather dan olingan HTTP API token)</span>
                    </label>
                    <div className="input-with-icon">
                      <input
                        type={showBotToken ? 'text' : 'password'}
                        className="odim-input"
                        placeholder="8862096129:AAElvj7naYtnhehF66GgFBua_12tngCbd34"
                        value={botTokenInput}
                        onChange={(e) => {
                          setBotTokenInput(e.target.value);
                          setWizardError(null);
                        }}
                      />
                      <button
                        type="button"
                        className="input-eye-btn"
                        onClick={() => setShowBotToken(!showBotToken)}
                      >
                        {showBotToken ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
                      </button>
                    </div>
                  </div>

                  {verifiedBot && (
                    <div className="verified-success-box">
                      <RiCheckboxCircleLine size={22} color="#10B981" />
                      <div>
                        <strong>{verifiedBot.firstName} (@{verifiedBot.username})</strong>
                        <p>ID: {verifiedBot.id} — Telegram API orqali tasdiqlandi</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 */}
              {wizardStep === 2 && (
                <div className="wizard-step-panel">
                  <div className="wizard-callout-info">
                    <RiInformationLine size={20} className="info-icon" />
                    <div>
                      <strong>Kanal sozlamalari talabi:</strong>
                      <p>
                        Botni kanalingizga <strong>Administrator</strong> qilib qo'shing va unda <strong>"Post Messages" (Xabarlarni joylash)</strong> ruxsati borligiga ishonch hosil qiling.
                      </p>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Kanal Username yoki Havolasi:</label>
                    <input
                      type="text"
                      className="odim-input"
                      placeholder="@odim_official yoki https://t.me/odim_official"
                      value={channelInput}
                      onChange={(e) => {
                        setChannelInput(e.target.value);
                        setWizardError(null);
                      }}
                    />
                    <span className="field-subtext">Havola yoki @username kiritilganda tizim uni avtomatik aniqlaydi</span>
                  </div>

                  {verifiedChannel && (
                    <div className="verified-success-box">
                      <RiCheckboxCircleLine size={22} color="#10B981" />
                      <div>
                        <strong>{verifiedChannel.title} ({verifiedChannel.username || verifiedChannel.id})</strong>
                        <div className="permissions-chips-row">
                          <span className="perm-chip active"><RiCheckLine size={12} /> Administrator</span>
                          <span className="perm-chip active"><RiCheckLine size={12} /> Xabar yuborish ruxsati bor</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 */}
              {wizardStep === 3 && (
                <div className="wizard-step-panel">
                  <div className="wizard-recap-box">
                    <div className="recap-row">
                      <span className="recap-label">Ulanayotgan Bot:</span>
                      <strong className="recap-val">{verifiedBot?.firstName} (@{verifiedBot?.username})</strong>
                    </div>
                    <div className="recap-row">
                      <span className="recap-label">Bog'langan Kanal:</span>
                      <strong className="recap-val">{verifiedChannel?.title} ({verifiedChannel?.username || verifiedChannel?.id})</strong>
                    </div>
                    <div className="recap-row">
                      <span className="recap-label">Webhook Holati:</span>
                      <span className="recap-live-badge">Avtomatik Faollashadi</span>
                    </div>
                  </div>

                  <div className="field-group" style={{ marginTop: '1rem' }}>
                    <label className="field-label">Yangi lidlar tushadigan Savdo (Kanban) ustuni:</label>
                    <select
                      className="odim-select"
                      value={wizardTargetColumn}
                      onChange={(e) => setWizardTargetColumn(e.target.value)}
                    >
                      <option value="col-1">#1-bosqich (Lid keldi / Yangi murojaatlar)</option>
                      <option value="col-2">#2-bosqich (Aloqa o'rnatildi / Suhbat)</option>
                      <option value="col-3">#3-bosqich (Qaror qabul qilish)</option>
                    </select>
                  </div>

                  <div className="checkboxes-vertical">
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={wizardAutoLead}
                        onChange={(e) => setWizardAutoLead(e.target.checked)}
                      />
                      <span>Har bir yangi Telegram foydalanuvchisi uchun Savdo (Kanban)da avtomatik kartochka ochish</span>
                    </label>

                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={wizardSyncMessages}
                        onChange={(e) => setWizardSyncMessages(e.target.checked)}
                      />
                      <span>Barcha xabarlarni real-vaqtda 'Yagona Inbox' bilan ikki tomonlama sinxronlash</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="modal-footer-bar">
              <div>
                {wizardStep > 1 && (
                  <button
                    type="button"
                    className="odim-btn odim-btn-secondary"
                    onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                  >
                    Orqaga
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="odim-btn odim-btn-secondary"
                  onClick={() => setTelegramWizardOpen(false)}
                >
                  Bekor qilish
                </button>

                {wizardStep === 1 && (
                  <button
                    type="button"
                    className="odim-btn odim-btn-primary"
                    disabled={botValidationLoading}
                    onClick={handleValidateBotStep}
                  >
                    {botValidationLoading ? (
                      <>
                        <RiRefreshLine size={16} className="integ-spin" />
                        <span>Tekshirilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <span>Tekshirish & Davom etish</span>
                        <RiArrowRightLine size={16} />
                      </>
                    )}
                  </button>
                )}

                {wizardStep === 2 && (
                  <button
                    type="button"
                    className="odim-btn odim-btn-primary"
                    disabled={channelVerifyingLoading}
                    onClick={handleVerifyChannelStep}
                  >
                    {channelVerifyingLoading ? (
                      <>
                        <RiRefreshLine size={16} className="integ-spin" />
                        <span>Huquqlar tekshirilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <span>Huquqlarni tekshirish</span>
                        <RiArrowRightLine size={16} />
                      </>
                    )}
                  </button>
                )}

                {wizardStep === 3 && (
                  <button
                    type="button"
                    className="odim-btn odim-btn-primary telegram-glow"
                    disabled={wizardSubmitting}
                    onClick={handleFinishTelegramConnection}
                  >
                    {wizardSubmitting ? (
                      <>
                        <RiRefreshLine size={16} className="integ-spin" />
                        <span>Ulanmoqda...</span>
                      </>
                    ) : (
                      <>
                        <RiCheckDoubleLine size={18} />
                        <span>Integratsiyani Faollashtirish</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. INSTAGRAM DIAGNOSTIC & SETUP GUIDE MODAL                              */}
      {/* ========================================================================= */}
      {setupGuideOpen && (
        <div className="odim-modal-backdrop" onClick={() => setSetupGuideOpen(false)}>
          <div className="odim-modal-window guide-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-brand-lead instagram">
                <RiInstagramLine size={24} />
              </div>
              <div className="modal-title-text">
                <h3>Instagram Professional Sozlash Qo'llanmasi</h3>
                <p>Meta Graph API v21.0 talablariga mos hisob tayyorlash</p>
              </div>
              <button
                type="button"
                className="modal-close-trigger"
                onClick={() => setSetupGuideOpen(false)}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="modal-scroll-body">
              <div className="guide-cards-stack">
                <div className="guide-card-item">
                  <div className="guide-card-icon-badge">1</div>
                  <div className="guide-card-content">
                    <h4>Professional (Business / Creator) Hisobga O'tish</h4>
                    <p>
                      Instagram mobil ilovasida: <strong>Profil ➔ Sozlamalar va Maxfiylik ➔ Hisob turi ➔ "Professional hisobga o'tish"</strong> bandini tanlang.
                    </p>
                  </div>
                </div>

                <div className="guide-card-item">
                  <div className="guide-card-icon-badge">2</div>
                  <div className="guide-card-content">
                    <h4>Facebook Sahifangiz bilan Bog'lash</h4>
                    <p>
                      Instagram profilingizni rasmiy Facebook Sahifangizga ulang: <strong>Sahifa sozlamalari ➔ Bog'langan hisoblar ➔ Instagram</strong> bo'limidan hisobingizni tasdiqlang.
                    </p>
                  </div>
                </div>

                <div className="guide-card-item">
                  <div className="guide-card-icon-badge">3</div>
                  <div className="guide-card-content">
                    <h4>Direct Xabarlarga Kirish Ruxsatini Yoqish</h4>
                    <p>
                      Instagram mobil ilovasida: <strong>Sozlamalar ➔ Xabarlar va hikoya javoblari ➔ Xabarlarga kirish (Allow Access to Messages)</strong> tugmasini yoqing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-bar">
              <button
                type="button"
                className="odim-btn odim-btn-secondary"
                onClick={() => setSetupGuideOpen(false)}
              >
                Yopish
              </button>
              <button
                type="button"
                className="odim-btn odim-btn-primary instagram-cta"
                onClick={() => {
                  setSetupGuideOpen(false);
                  handleLaunchMetaOAuth('instagram');
                }}
              >
                <RiInstagramLine size={18} />
                <span>Meta OAuth & Tanlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SAFE DISCONNECT CONFIRMATION MODAL                                    */}
      {/* ========================================================================= */}
      {disconnectModalItem && (
        <div className="odim-modal-backdrop" onClick={() => setDisconnectModalItem(null)}>
          <div className="odim-modal-window disconnect-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-brand-lead danger">
                <RiAlertLine size={24} />
              </div>
              <div className="modal-title-text">
                <h3>Xavfsiz Uzish: {disconnectModalItem.name}</h3>
                <p>Integratsiyani to'xtatish va xavfsiz holatga o'tkazish</p>
              </div>
              <button
                type="button"
                className="modal-close-trigger"
                onClick={() => setDisconnectModalItem(null)}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="modal-scroll-body">
              <div className="safe-shield-banner">
                <RiShieldCheckLine size={28} className="shield-icon" />
                <div>
                  <strong>Tarixiy Ma'lumotlar 100% Saqlanadi!</strong>
                  <p>
                    Ushbu kanal uzilganda Odim CRM dagi mavjud <strong>mijozlar ro'yxati, yozishmalar tarixi va bitimlar o'chirilmaydi</strong>.
                    Faqatgina yangi kiruvchi xabarlar qabul qilinishi vaqtincha to'xtatiladi.
                  </p>
                </div>
              </div>

              <p className="disconnect-prompt-text">
                Haqiqatan ham <strong>{disconnectModalItem.name}</strong> integratsiyasini uzmoqchimisiz?
              </p>
            </div>

            <div className="modal-footer-bar">
              <button
                type="button"
                className="odim-btn odim-btn-secondary"
                onClick={() => setDisconnectModalItem(null)}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="odim-btn odim-btn-danger"
                disabled={isDisconnecting}
                onClick={executeSafeDisconnect}
              >
                {isDisconnecting ? 'Uzilmoqda...' : "Ha, Xavfsiz Uzish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. OMNICHANNEL INBOUND LEAD SIMULATOR MODAL                               */}
      {/* ========================================================================= */}
      {simulatorOpen && (
        <div className="odim-modal-backdrop" onClick={() => setSimulatorOpen(false)}>
          <div className="odim-modal-window sim-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-brand-lead emerald">
                <RiRocketLine size={24} />
              </div>
              <div className="modal-title-text">
                <h3>Omnichannel Lid Generatsiyasi Simulyatori</h3>
                <p>Mijoz xabar yuborganda CRM ga avto-lid tushishini jonli sinab ko'ring</p>
              </div>
              <button
                type="button"
                className="modal-close-trigger"
                onClick={() => setSimulatorOpen(false)}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="modal-scroll-body">
              <div className="sim-channel-chips-row">
                <button
                  type="button"
                  className={`sim-chip-btn ${simChannel === 'telegram' ? 'active telegram' : ''}`}
                  onClick={() => setSimChannel('telegram')}
                >
                  <RiTelegramLine size={18} />
                  <span>Telegram</span>
                </button>
                <button
                  type="button"
                  className={`sim-chip-btn ${simChannel === 'instagram' ? 'active instagram' : ''}`}
                  onClick={() => setSimChannel('instagram')}
                >
                  <RiInstagramLine size={18} />
                  <span>Instagram</span>
                </button>
                <button
                  type="button"
                  className={`sim-chip-btn ${simChannel === 'whatsapp' ? 'active whatsapp' : ''}`}
                  onClick={() => setSimChannel('whatsapp')}
                >
                  <RiWhatsappLine size={18} />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  className={`sim-chip-btn ${simChannel === 'facebook' ? 'active facebook' : ''}`}
                  onClick={() => setSimChannel('facebook')}
                >
                  <RiFacebookCircleLine size={18} />
                  <span>Facebook</span>
                </button>
              </div>

              <div className="sim-form-grid">
                <div className="field-group">
                  <label className="field-label">Mijoz Ism-Familiyasi:</label>
                  <input
                    type="text"
                    className="odim-input"
                    value={simSenderName}
                    onChange={(e) => setSimSenderName(e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Telefon Raqami:</label>
                  <input
                    type="text"
                    className="odim-input"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group" style={{ marginTop: '12px' }}>
                <label className="field-label">Mijoz Murojaat Matni:</label>
                <textarea
                  className="odim-textarea"
                  rows={3}
                  value={simMessageText}
                  onChange={(e) => setSimMessageText(e.target.value)}
                />
              </div>

              {simSuccessResult && (
                <div className="sim-success-receipt">
                  <RiCheckboxCircleLine size={24} color="#10B981" />
                  <div>
                    <strong>{simSuccessResult.message}</strong>
                    <p>Yaratilgan Bitim ID: <code>{simSuccessResult.deal?.id}</code> | Bosqich: <code>#1-bosqich (Lid keldi)</code></p>
                    <div style={{ marginTop: '6px' }}>
                      <a href="/" className="sim-kanban-link">
                        Bitimlar (Kanban) doskasiga o'tish ➔
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer-bar">
              <button
                type="button"
                className="odim-btn odim-btn-secondary"
                onClick={() => setSimulatorOpen(false)}
              >
                Yopish
              </button>
              <button
                type="button"
                className="odim-btn odim-btn-primary"
                disabled={simSubmitting}
                onClick={handleRunSimulator}
              >
                {simSubmitting ? (
                  <>
                    <RiRefreshLine size={16} className="integ-spin" />
                    <span>Yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <RiRocketLine size={16} />
                    <span>Lid Simulyatsiyasini Yuborish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. GENERAL SETTINGS MODAL (WHATSAPP, FACEBOOK, INSTAGRAM)                */}
      {/* ========================================================================= */}
      {modalItem && (
        <div className="odim-modal-backdrop" onClick={closeConfigModal}>
          <div className="odim-modal-window config-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className={`modal-brand-lead ${getProviderInfo(modalItem.provider).brandClass}`}>
                {(() => {
                  const Icon = getProviderInfo(modalItem.provider).icon;
                  return <Icon size={24} />;
                })()}
              </div>
              <div className="modal-title-text">
                <h3>{modalItem.name} Sozlamalari</h3>
                <p>Kanal ulanish parametrlari va avtomatlashtirish qoidalari</p>
              </div>
              <button
                type="button"
                className="modal-close-trigger"
                onClick={closeConfigModal}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="modal-scroll-body">
              {/* WhatsApp Form */}
              {modalItem.id === 'whatsapp' && (
                <>
                  <div className="sim-form-grid">
                    <div className="field-group">
                      <label className="field-label">Phone Number ID:</label>
                      <input
                        type="text"
                        className="odim-input"
                        placeholder="104928174829102"
                        value={formConfig.phone_number_id || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, phone_number_id: e.target.value })}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">WABA ID (Business Account):</label>
                      <input
                        type="text"
                        className="odim-input"
                        placeholder="982348571029384"
                        value={formConfig.waba_id || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, waba_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field-group" style={{ marginTop: '12px' }}>
                    <label className="field-label">Permanent Access Token:</label>
                    <div className="input-with-icon">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        className="odim-input"
                        placeholder="EAAG..."
                        value={formConfig.access_token || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, access_token: e.target.value })}
                      />
                      <button
                        type="button"
                        className="input-eye-btn"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
                      </button>
                    </div>
                  </div>

                  <div className="endpoint-field-block" style={{ marginTop: '14px' }}>
                    <label>WhatsApp Cloud Webhook URL:</label>
                    <div className="code-copy-row">
                      <code>{formConfig.webhook_url || 'https://coupled-musical-taste-zoloft.trycloudflare.com/api/whatsapp/webhook'}</code>
                    </div>
                  </div>
                </>
              )}

              {/* Facebook Form */}
              {modalItem.id === 'facebook' && (
                <>
                  <div className="sim-form-grid">
                    <div className="field-group">
                      <label className="field-label">Facebook Sahifa Nomi:</label>
                      <input
                        type="text"
                        className="odim-input"
                        placeholder="Odim Technologies"
                        value={formConfig.page_name || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, page_name: e.target.value })}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Facebook Page ID:</label>
                      <input
                        type="text"
                        className="odim-input"
                        placeholder="104928174829102"
                        value={formConfig.page_id || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, page_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="checkboxes-vertical" style={{ marginTop: '14px' }}>
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={formConfig.lead_ads_sync !== false}
                        onChange={(e) => setFormConfig({ ...formConfig, lead_ads_sync: e.target.checked })}
                      />
                      <span>Facebook Lead Ads (reklama formasi) arizalarini avtomatik import qilish</span>
                    </label>

                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={formConfig.sync_messenger !== false}
                        onChange={(e) => setFormConfig({ ...formConfig, sync_messenger: e.target.checked })}
                      />
                      <span>Facebook Messenger yozishmalarini 'Yagona Inbox'ga sinxronlash</span>
                    </label>
                  </div>
                </>
              )}

              {/* Instagram Form */}
              {modalItem.id === 'instagram' && (
                <>
                  <div className="sim-form-grid">
                    <div className="field-group">
                      <label className="field-label">Instagram Username:</label>
                      <input
                        type="text"
                        className="odim-input"
                        value={formConfig.account_username || '@odim.uz'}
                        onChange={(e) => setFormConfig({ ...formConfig, account_username: e.target.value })}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Instagram Account ID:</label>
                      <input
                        type="text"
                        className="odim-input"
                        value={formConfig.account_id || '17841400234567890'}
                        onChange={(e) => setFormConfig({ ...formConfig, account_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="checkboxes-vertical" style={{ marginTop: '14px' }}>
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={formConfig.sync_dms !== false}
                        onChange={(e) => setFormConfig({ ...formConfig, sync_dms: e.target.checked })}
                      />
                      <span>Direct shaxsiy yozishmalarni Yagona Inboxga qabul qilish</span>
                    </label>
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={formConfig.sync_comments !== false}
                        onChange={(e) => setFormConfig({ ...formConfig, sync_comments: e.target.checked })}
                      />
                      <span>Post izohlaridagi narx so'rovlaridan avtomatik Bitim ochish</span>
                    </label>
                  </div>
                </>
              )}

              {/* Live Test Feedback inside modal */}
              {testResult && (
                <div className={`modal-test-banner ${testResult.ok ? 'test-pass' : 'test-fail'}`}>
                  {testResult.ok ? <RiCheckboxCircleLine size={20} /> : <RiErrorWarningLine size={20} />}
                  <div>
                    <strong>{testResult.ok ? "Aloqa tasdiqlandi!" : "Ulanish xatosi!"}</strong>
                    <p>{testResult.message}</p>
                    {testResult.latencyMs !== undefined && (
                      <span className="latency-pill">Kechikish: {testResult.latencyMs} ms</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer-bar">
              <button
                type="button"
                className="odim-btn odim-btn-secondary"
                disabled={testingId === modalItem.id}
                onClick={() => handleTestPing(modalItem.id)}
              >
                <RiPulseLine size={16} className={testingId === modalItem.id ? 'integ-spin' : ''} />
                <span>{testingId === modalItem.id ? "Tekshirilmoqda..." : "Ulanishni tekshirish"}</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="odim-btn odim-btn-secondary"
                  onClick={closeConfigModal}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  className="odim-btn odim-btn-primary"
                  disabled={isSaving}
                  onClick={handleSaveModal}
                >
                  <RiCheckLine size={18} />
                  <span>{isSaving ? "Saqlanmoqda..." : "Saqlash"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Universal Meta Account Selector Modal (Popup Flow) */}
      {metaSelectorOpen && metaSessionId && (
        <MetaAccountSelectorModal
          sessionId={metaSessionId}
          onSuccess={handleMetaAccountSuccess}
          onClose={() => { setMetaSelectorOpen(false); setMetaSessionId(null); }}
        />
      )}

      {/* Reset All Integrations Modal */}
      {resetModalOpen && (
        <div className="odim-modal-backdrop" onClick={() => setResetModalOpen(false)}>
          <div className="odim-modal-window disconnect-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-brand-lead danger">
                <RiAlertLine size={24} />
              </div>
              <div className="modal-title-text">
                <h3>Boshlang'ich holatga tozalash</h3>
                <p>Barcha integratsiyalarni qayta boshlang'ich holatga keltirish</p>
              </div>
              <button
                type="button"
                className="modal-close-trigger"
                onClick={() => setResetModalOpen(false)}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="modal-scroll-body">
              <div className="safe-shield-banner">
                <RiShieldCheckLine size={28} className="shield-icon" />
                <div>
                  <strong>Mijozlar va bitimlar o'chirilmaydi!</strong>
                  <p>
                    Ushbu amal barcha ulangan botlar, sahifalar va tokenlarni uzib, integratsiya sozlamalarini boshlang'ich bo'sh holatga keltiradi. CRM dagi mijozlar va bitimlar to'liq saqlanadi.
                  </p>
                </div>
              </div>

              <p className="disconnect-prompt-text">
                Haqiqatan ham barcha integratsiyalarni tozalab, boshlang'ich holatga keltirmoqchimisiz?
              </p>
            </div>

            <div className="modal-footer-bar">
              <button
                type="button"
                className="odim-btn odim-btn-secondary"
                onClick={() => setResetModalOpen(false)}
                disabled={isResetting}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="odim-btn odim-btn-danger"
                disabled={isResetting}
                onClick={handleResetAll}
              >
                {isResetting ? 'Tozalanmoqda...' : 'Ha, Barchasini Tozalash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

