import React, { useState, useEffect } from 'react';
import { api, type IntegrationItem } from '../api';
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
  RiSignalTowerLine
} from 'react-icons/ri';
import './IntegrationsView.css';

interface StatSummary {
  connectedChannels: number;
  totalMessages: number;
  totalLeads: number;
  avgLatency: number;
}

export default function IntegrationsView() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'social' | 'messenger'>('all');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal State
  const [modalItem, setModalItem] = useState<IntegrationItem | null>(null);
  const [formConfig, setFormConfig] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getIntegrations();
      if (data && data.length > 0) {
        setIntegrations(data);
      } else {
        // Fallback default mock
        setIntegrations([
          {
            id: 'telegram',
            provider: 'telegram',
            name: 'Telegram Bot & Kanallar',
            isActive: true,
            status: 'connected',
            config: {
              bot_token: '8862096129:AAElvj7naYtnhehF66GgFBua_12tngCbd34',
              bot_username: '@odim_crm_boo_bot',
              auto_lead: true,
              sync_messages: true,
              webhook_url: 'https://coupled-musical-taste-zoloft.trycloudflare.com/api/telegram/webhook'
            },
            stats: { totalMessages: 1420, leadsGenerated: 86, latencyMs: 38 }
          },
          {
            id: 'instagram',
            provider: 'instagram',
            name: 'Instagram Direct & Izohlar',
            isActive: true,
            status: 'connected',
            config: {
              account_username: '@odim.uz',
              account_id: '17841400234567890',
              sync_dms: true,
              sync_comments: true,
              auto_lead: true,
              webhook_url: 'https://coupled-musical-taste-zoloft.trycloudflare.com/api/instagram/webhook',
              verify_token: 'odim_insta_secret_token_2026'
            },
            stats: { totalMessages: 890, leadsGenerated: 54, latencyMs: 62 }
          },
          {
            id: 'facebook',
            provider: 'facebook',
            name: 'Facebook Messenger & Leads',
            isActive: true,
            status: 'connected',
            config: {
              page_name: 'Odim Technologies',
              page_id: '104928174829102',
              sync_messenger: true,
              lead_ads_sync: true,
              auto_lead: true,
              webhook_url: 'https://coupled-musical-taste-zoloft.trycloudflare.com/api/facebook/webhook',
              verify_token: 'odim_fb_secret_token_2026'
            },
            stats: { totalMessages: 640, leadsGenerated: 41, latencyMs: 75 }
          },
          {
            id: 'whatsapp',
            provider: 'whatsapp',
            name: 'WhatsApp Business API',
            isActive: false,
            status: 'disconnected',
            config: {
              phone_number_id: '',
              waba_id: '',
              access_token: '',
              sync_messages: false,
              webhook_url: 'https://coupled-musical-taste-zoloft.trycloudflare.com/api/whatsapp/webhook'
            },
            stats: { totalMessages: 0, leadsGenerated: 0, latencyMs: 0 }
          }
        ]);
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

  const handleToggleActive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleIntegration(id);
      if (res && res.success) {
        setIntegrations(prev =>
          prev.map(item =>
            item.id === id
              ? { ...item, isActive: res.isActive ?? !item.isActive, status: (res.status as any) || (item.isActive ? 'disconnected' : 'connected') }
              : item
          )
        );
        showToast(
          res.isActive ? `${id.toUpperCase()} integratsiyasi yoqildi!` : `${id.toUpperCase()} integratsiyasi o'chirildi!`,
          'info'
        );
      }
    } catch {
      showToast("Holatni o'zgartirishda xatolik yuz berdi", 'error');
    }
  };

  const handleTestPing = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await api.testIntegration(id);
      setTestResult(res);
      if (res.ok) {
        showToast(res.message || "Ulanish muvaffaqiyatli tekshirildi!", 'success');
      } else {
        showToast(res.message || "Ulanishda xatolik aniqlandi!", 'error');
      }
    } catch {
      showToast("Aloqa tekshirishda xatolik yuz berdi", 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleSendTestInstagramMessage = async () => {
    try {
      const resp = await fetch('http://localhost:3001/api/social/simulate-test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'instagram',
          senderName: formConfig.account_username ? `${formConfig.account_username} (Direct)` : 'Nilufar (Instagram Direct)',
          text: "Assalomu alaykum! Profilingizdan ko'rdim, tovarlar narxi qancha? Yetkazib berish bormi?"
        })
      });
      const data = await resp.json();
      if (data.success) {
        showToast("🎉 Instagram Direct'dan yangi test xabar 'Chat' bo'limiga yuborildi!", 'success');
      }
    } catch {
      showToast("Test xabar yuborishda xatolik yuz berdi", 'error');
    }
  };

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

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast("Nusxa olindi!", 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Filtered List
  const filteredIntegrations = integrations.filter(item => {
    if (activeTab === 'active') return item.isActive;
    if (activeTab === 'social') return item.id === 'instagram' || item.id === 'facebook';
    if (activeTab === 'messenger') return item.id === 'telegram' || item.id === 'whatsapp';
    return true;
  });

  // Calculate Overall Stats
  const stats: StatSummary = {
    connectedChannels: integrations.filter(i => i.isActive).length,
    totalMessages: integrations.reduce((acc, curr) => acc + (curr.stats?.totalMessages || 0), 0),
    totalLeads: integrations.reduce((acc, curr) => acc + (curr.stats?.leadsGenerated || 0), 0),
    avgLatency: Math.round(
      integrations
        .filter(i => i.isActive && i.stats?.latencyMs)
        .reduce((acc, curr, _, arr) => acc + (curr.stats?.latencyMs || 0) / arr.length, 0)
    ) || 45
  };

  // Helper for provider visual theme
  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'telegram':
        return {
          icon: RiTelegramLine,
          brandClass: 'brand-telegram',
          badgeColor: '#229ED9',
          title: 'Telegram Bot & Kanallar',
          subtitle: 'Mijozlar bilan ikki tomonlama yozishmalar va lid generatsiyasi',
          features: ['Yagona Inbox sinxronlangan', 'Avto-lid ochish yoqilgan', 'Guruh va shaxsiy chatlar']
        };
      case 'instagram':
        return {
          icon: RiInstagramLine,
          brandClass: 'brand-instagram',
          badgeColor: '#E1306C',
          title: 'Instagram Direct & Izohlar',
          subtitle: 'Direct xabarlar, Stories javoblari va post izohlaridan avto-lidlar',
          features: ['Direct xabarlar', 'Stories javoblari', 'Post izohlaridan avto-lid']
        };
      case 'facebook':
        return {
          icon: RiFacebookCircleLine,
          brandClass: 'brand-facebook',
          badgeColor: '#1877F2',
          title: 'Facebook Messenger & Leads',
          subtitle: 'Facebook Page xabarlari va Lead Ads (reklama formasi) arizalari',
          features: ['Messenger chat', 'Lead Ads avto-import', 'Sahifa arizalari']
        };
      case 'whatsapp':
        return {
          icon: RiWhatsappLine,
          brandClass: 'brand-whatsapp',
          badgeColor: '#25D366',
          title: 'WhatsApp Business API',
          subtitle: 'Cloud API orqali xalqaro mijozlar bilan rasmiy aloqa kanali',
          features: ['Cloud API v20.0', 'Tasdiqlangan shablonlar', '24/7 Avto-javob']
        };
      default:
        return {
          icon: RiSignalTowerLine,
          brandClass: 'brand-default',
          badgeColor: '#6366F1',
          title: provider,
          subtitle: 'Integratsiya kanali',
          features: ['Sinxronizatsiya']
        };
    }
  };

  return (
    <div className="integrations-page-container">
      {toastMsg && (
        <div className={`integ-toast integ-toast-${toastMsg.type}`}>
          {toastMsg.type === 'success' && <RiCheckboxCircleLine size={18} />}
          {toastMsg.type === 'error' && <RiErrorWarningLine size={18} />}
          {toastMsg.type === 'info' && <RiCheckLine size={18} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 1. HERO HEADER */}
      <div className="integ-hero-card">
        <div className="integ-hero-left">
          <div className="integ-hero-icon-box">
            <RiSignalTowerLine size={32} />
          </div>
          <div className="integ-hero-titles">
            <div className="integ-title-badge-row">
              <h2>Ijtimoiy Tarmoqlar va Aloqa Integratsiyalari</h2>
              <span className="integ-live-badge">
                <span className="integ-pulse-dot" />
                Webhook Live
              </span>
            </div>
            <p>
              Telegram, Instagram va Facebook orqali kelgan barcha mijoz xabarlari va arizalarini Odim CRM 
              <strong> Yagona Inbox</strong> va <strong>Savdo / Bitimlar (Kanban)</strong> bilan uzviy bog'lang.
            </p>
          </div>
        </div>

        <div className="integ-hero-actions">
          <button
            type="button"
            className="integ-refresh-btn"
            onClick={loadData}
            disabled={isLoading}
            title="Yangilash"
          >
            <RiRefreshLine size={18} className={isLoading ? 'integ-spin' : ''} />
            <span>Yangilash</span>
          </button>
          <a
            href="/chat/inbox"
            className="integ-inbox-link-btn"
          >
            <RiChat1Line size={18} />
            <span>Yagona Inboxga o'tish</span>
          </a>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="integ-stats-grid">
        <div className="integ-stat-card">
          <div className="integ-stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563EB' }}>
            <RiSignalTowerLine size={24} />
          </div>
          <div className="integ-stat-content">
            <span className="integ-stat-label">Ulangan Kanallar</span>
            <div className="integ-stat-val-row">
              <span className="integ-stat-value">{stats.connectedChannels} ta</span>
              <span className="integ-stat-sub">/ 4 umumiy</span>
            </div>
          </div>
        </div>

        <div className="integ-stat-card">
          <div className="integ-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
            <RiChat1Line size={24} />
          </div>
          <div className="integ-stat-content">
            <span className="integ-stat-label">Qabul qilingan xabarlar</span>
            <div className="integ-stat-val-row">
              <span className="integ-stat-value">{stats.totalMessages.toLocaleString()}</span>
              <span className="integ-stat-sub">barcha kanallardan</span>
            </div>
          </div>
        </div>

        <div className="integ-stat-card">
          <div className="integ-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706' }}>
            <RiUserAddLine size={24} />
          </div>
          <div className="integ-stat-content">
            <span className="integ-stat-label">Avtomatik Yaratilgan Lidlar</span>
            <div className="integ-stat-val-row">
              <span className="integ-stat-value">{stats.totalLeads} ta</span>
              <span className="integ-stat-sub">Kanbanga tushdi</span>
            </div>
          </div>
        </div>

        <div className="integ-stat-card">
          <div className="integ-stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#4F46E5' }}>
            <RiFlashlightLine size={24} />
          </div>
          <div className="integ-stat-content">
            <span className="integ-stat-label">O'rtacha Server Ping</span>
            <div className="integ-stat-val-row">
              <span className="integ-stat-value">{stats.avgLatency} ms</span>
              <span className="integ-stat-sub">barqaror aloqa</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS */}
      <div className="integ-filter-bar">
        <div className="integ-filter-tabs">
          <button
            type="button"
            className={`integ-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Barchasi ({integrations.length})
          </button>
          <button
            type="button"
            className={`integ-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Faol ({integrations.filter(i => i.isActive).length})
          </button>
          <button
            type="button"
            className={`integ-tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            Ijtimoiy Tarmoqlar (Instagram, FB)
          </button>
          <button
            type="button"
            className={`integ-tab-btn ${activeTab === 'messenger' ? 'active' : ''}`}
            onClick={() => setActiveTab('messenger')}
          >
            Messangerlar (Telegram, WA)
          </button>
        </div>
      </div>

      {/* 4. INTEGRATIONS GRID */}
      <div className="integ-cards-grid">
        {filteredIntegrations.map(item => {
          const info = getProviderInfo(item.provider);
          const Icon = info.icon;
          const isTestingThis = testingId === item.id;

          return (
            <div
              key={item.id}
              className={`integ-card ${info.brandClass} ${item.isActive ? 'is-active' : 'is-inactive'}`}
            >
              {/* Card Top: Icon, Provider, Status & Toggle */}
              <div className="integ-card-header">
                <div className="integ-card-brand-left">
                  <div className="integ-brand-icon-box">
                    <Icon size={26} />
                  </div>
                  <div>
                    <h3 className="integ-card-title">{item.name}</h3>
                    <span className="integ-provider-sub">
                      {item.config?.bot_username || item.config?.account_username || item.config?.page_name || 'Kanal sozlanmagan'}
                    </span>
                  </div>
                </div>

                <div className="integ-card-actions-top">
                  <span className={`integ-status-pill ${item.isActive ? 'status-active' : 'status-inactive'}`}>
                    <span className="integ-status-dot" />
                    {item.isActive ? 'Ulangan' : "O'chirilgan"}
                  </span>
                  <label className="integ-toggle-switch" title={item.isActive ? "O'chirish" : "Yoqish"}>
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(e) => handleToggleActive(item.id, e as any)}
                    />
                    <span className="integ-toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Card Body: Description & Feature Pills */}
              <p className="integ-card-desc">{info.subtitle}</p>

              <div className="integ-feature-tags">
                {info.features.map((feat, idx) => (
                  <span key={idx} className="integ-feature-chip">
                    <RiCheckLine size={13} />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>

              {/* Card Channel Metrics */}
              <div className="integ-card-metrics-box">
                <div className="integ-card-metric-col">
                  <span className="integ-card-metric-num">{item.stats?.totalMessages?.toLocaleString() || 0}</span>
                  <span className="integ-card-metric-title">Xabarlar</span>
                </div>
                <div className="integ-card-metric-divider" />
                <div className="integ-card-metric-col">
                  <span className="integ-card-metric-num">{item.stats?.leadsGenerated || 0}</span>
                  <span className="integ-card-metric-title">Yangi Lidlar</span>
                </div>
                <div className="integ-card-metric-divider" />
                <div className="integ-card-metric-col">
                  <span className="integ-card-metric-num">{item.stats?.latencyMs ? `${item.stats.latencyMs}ms` : '--'}</span>
                  <span className="integ-card-metric-title">Ping</span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="integ-card-footer">
                <button
                  type="button"
                  className="integ-test-btn"
                  disabled={isTestingThis || !item.isActive}
                  onClick={(e) => handleTestPing(item.id, e)}
                >
                  <RiShieldCheckLine size={16} className={isTestingThis ? 'integ-spin' : ''} />
                  <span>{isTestingThis ? 'Tekshirilmoqda...' : 'Ulanishni tekshirish'}</span>
                </button>

                <button
                  type="button"
                  className="integ-config-btn"
                  onClick={() => openConfigModal(item)}
                >
                  <RiSettings3Line size={16} />
                  <span>Sozlash</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. ARCHITECTURE WORKFLOW GUIDE */}
      <div className="integ-guide-card">
        <div className="integ-guide-header">
          <div className="integ-guide-badge">Qanday ishlaydi?</div>
          <h3>Ijtimoiy Tarmoqlar va Odim CRM Ma'lumotlar Oqimi</h3>
          <p>
            Mijoz Telegram, Instagram yoki Facebook orqali murojaat qilganida xabar soniyaning ichida CRM ga uzatiladi:
          </p>
        </div>

        <div className="integ-flow-steps">
          <div className="integ-flow-step">
            <div className="integ-flow-number">1</div>
            <h4>Mijoz murojaati</h4>
            <p>Mijoz Telegram botga yozadi, Instagram Direct orqali so'rov jo'natadi yoki Facebook Lead formasini to'ldiradi.</p>
          </div>

          <div className="integ-flow-arrow">→</div>

          <div className="integ-flow-step">
            <div className="integ-flow-number">2</div>
            <h4>Cloudflare & Webhook</h4>
            <p>Meta va Telegram API serverimizdagi xavfsiz Webhook manziliga xabarni va mijoz ma'lumotlarini yetkazadi.</p>
          </div>

          <div className="integ-flow-arrow">→</div>

          <div className="integ-flow-step">
            <div className="integ-flow-number">3</div>
            <h4>Yagona Inbox & Real-time</h4>
            <p>Socket.io orqali 'Yagona Inbox'da darhol bildirishnoma ko'rinadi va operatorlar mijozga real vaqtda javob qaytaradi.</p>
          </div>

          <div className="integ-flow-arrow">→</div>

          <div className="integ-flow-step">
            <div className="integ-flow-number">4</div>
            <h4>Avto-Bitim (Kanban)</h4>
            <p>Tizim yangi mijoz kartochkasini yaratib, avtomatik tarzda tegishli soha bo'yicha '#1-bosqich (Lid keldi)'ga qo'shadi.</p>
          </div>
        </div>
      </div>

      {/* 6. CONFIGURATION MODAL */}
      {modalItem && (
        <div className="integ-modal-overlay" onClick={closeConfigModal}>
          <div className="integ-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="integ-modal-header">
              <div className="integ-modal-header-left">
                {(() => {
                  const info = getProviderInfo(modalItem.provider);
                  const Icon = info.icon;
                  return (
                    <div className="integ-modal-brand-icon">
                      <Icon size={24} />
                    </div>
                  );
                })()}
                <div>
                  <h3>{modalItem.name} Sozlamalari</h3>
                  <p>Kanal ulanish parametrlari va avtomatlashtirish qoidalari</p>
                </div>
              </div>
              <button
                type="button"
                className="integ-modal-close-btn"
                onClick={closeConfigModal}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* Modal Body: Form Fields depending on provider */}
            <div className="integ-modal-body">
              {/* Telegram Form */}
              {modalItem.id === 'telegram' && (
                <>
                  <div className="integ-form-group">
                    <label className="integ-form-label">
                      Telegram Bot Token:
                      <span className="integ-label-hint">(@BotFather dan olingan HTTP API token)</span>
                    </label>
                    <div className="integ-input-with-action">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        className="integ-text-input"
                        placeholder="8862096129:AAElvj7naYtnhehF66GgFBua_12tngCbd34"
                        value={formConfig.bot_token || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, bot_token: e.target.value })}
                      />
                      <button
                        type="button"
                        className="integ-eye-btn"
                        onClick={() => setShowSecret(!showSecret)}
                        title={showSecret ? "Yashirish" : "Ko'rsatish"}
                      >
                        {showSecret ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="integ-form-row">
                    <div className="integ-form-group">
                      <label className="integ-form-label">Bot Username:</label>
                      <input
                        type="text"
                        className="integ-text-input"
                        placeholder="@odim_crm_boo_bot"
                        value={formConfig.bot_username || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, bot_username: e.target.value })}
                      />
                    </div>
                    <div className="integ-form-group">
                      <label className="integ-form-label">Tushadigan boshlang'ich bosqich:</label>
                      <select
                        className="integ-select-input"
                        value={formConfig.target_column || 'col-1'}
                        onChange={(e) => setFormConfig({ ...formConfig, target_column: e.target.value })}
                      >
                        <option value="col-1">#1-bosqich (Lid keldi)</option>
                        <option value="col-2">#2-bosqich (Test-drayv / Aloqa)</option>
                        <option value="col-3">#3-bosqich (Qaror qabul qilish)</option>
                      </select>
                    </div>
                  </div>

                  <div className="integ-form-checkboxes">
                    <label className="integ-checkbox-item">
                      <input
                        type="checkbox"
                        checked={formConfig.auto_lead !== false}
                        onChange={(e) => setFormConfig({ ...formConfig, auto_lead: e.target.checked })}
                      />
                      <span>Har bir yangi Telegram foydalanuvchisi uchun Bitimlar (Kanban)da avtomatik kartochka ochish</span>
                    </label>

                    <label className="integ-checkbox-item">
                      <input
                        type="checkbox"
                        checked={formConfig.sync_messages !== false}
                        onChange={(e) => setFormConfig({ ...formConfig, sync_messages: e.target.checked })}
                      />
                      <span>Xabarlarni real-vaqtda 'Yagona Inbox' bilan ikki tomonlama sinxronlash</span>
                    </label>
                  </div>

                  <div className="integ-webhook-box">
                    <div className="integ-webhook-header">
                      <span className="integ-webhook-title">Webhook Callback URL:</span>
                      <button
                        type="button"
                        className="integ-copy-btn"
                        onClick={() => copyToClipboard(formConfig.webhook_url || 'https://coupled-musical-taste-zoloft.trycloudflare.com/api/telegram/webhook', 'tg_wh')}
                      >
                        {copiedKey === 'tg_wh' ? <RiCheckLine size={14} color="#10B981" /> : <RiFileCopyLine size={14} />}
                        <span>{copiedKey === 'tg_wh' ? 'Nusxa olindi!' : 'Nusxa olish'}</span>
                      </button>
                    </div>
                    <code className="integ-webhook-code">
                      {formConfig.webhook_url || 'https://coupled-musical-taste-zoloft.trycloudflare.com/api/telegram/webhook'}
                    </code>
                  </div>
                </>
              )}

              {/* Instagram Form */}
              {modalItem.id === 'instagram' && (
                <>
                  <div className="integ-form-row">
                    <div className="integ-form-group">
                      <label className="integ-form-label">Instagram Profil Username:</label>
                      <input
                        type="text"
                        className="integ-text-input"
                        placeholder="@odim.uz"
                        value={formConfig.account_username || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, account_username: e.target.value })}
                      />
                    </div>
                    <div className="integ-form-group">
                      <label className="integ-form-label">Instagram Business ID:</label>
                      <input
                        type="text"
                        className="integ-text-input"
                        placeholder="17841400234567890"
                        value={formConfig.account_id || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, account_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="integ-form-group">
                    <label className="integ-form-label">Meta Graph API Access Token:</label>
                    <div className="integ-input-with-action">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        className="integ-text-input"
                        placeholder="EAABwzLixnjYBA..."
                        value={formConfig.access_token || 'EAABwzLixnjYBAOnv98234y189312...'}
                        onChange={(e) => setFormConfig({ ...formConfig, access_token: e.target.value })}
                      />
                      <button
                        type="button"
                        className="integ-eye-btn"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="integ-form-checkboxes">
                    <label className="integ-checkbox-item">
                      <input
                        type="checkbox"
                        checked={formConfig.sync_dms !== false}
                        onChange={(e) => setFormConfig({ ...formConfig, sync_dms: e.target.checked })}
                      />
                      <span>Direct (shaxsiy) yozishmalarni 'Yagona Inbox'ga qabul qilish</span>
                    </label>

                    <label className="integ-checkbox-item">
                      <input
                        type="checkbox"
                        checked={formConfig.sync_comments !== false}
                        onChange={(e) => setFormConfig({ ...formConfig, sync_comments: e.target.checked })}
                      />
                      <span>Post izohlaridagi narx so'rovlaridan avtomatik ravishda Bitim (Lid) yaratish</span>
                    </label>
                  </div>

                  <div className="integ-webhook-box">
                    <div className="integ-webhook-header">
                      <span className="integ-webhook-title">Meta Webhook Callback URL:</span>
                      <button
                        type="button"
                        className="integ-copy-btn"
                        onClick={() => copyToClipboard(formConfig.webhook_url || 'https://coating-promotes-comp-buy.trycloudflare.com/api/instagram/webhook', 'ig_wh')}
                      >
                        {copiedKey === 'ig_wh' ? <RiCheckLine size={14} color="#10B981" /> : <RiFileCopyLine size={14} />}
                        <span>Nusxa olish</span>
                      </button>
                    </div>
                    <code className="integ-webhook-code">
                      {formConfig.webhook_url || 'https://coating-promotes-comp-buy.trycloudflare.com/api/instagram/webhook'}
                    </code>

                    <div className="integ-verify-token-row">
                      <span>Verify Token: <strong>{formConfig.verify_token || 'odim_insta_secret_token_2026'}</strong></span>
                      <button
                        type="button"
                        className="integ-copy-btn-sm"
                        onClick={() => copyToClipboard(formConfig.verify_token || 'odim_insta_secret_token_2026', 'ig_vt')}
                      >
                        {copiedKey === 'ig_vt' ? 'Ko\'chirildi!' : 'Nusxa'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Facebook Form */}
              {modalItem.id === 'facebook' && (
                <>
                  <div className="integ-form-row">
                    <div className="integ-form-group">
                      <label className="integ-form-label">Facebook Sahifa Nomi:</label>
                      <input
                        type="text"
                        className="integ-text-input"
                        placeholder="Odim Technologies"
                        value={formConfig.page_name || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, page_name: e.target.value })}
                      />
                    </div>
                    <div className="integ-form-group">
                      <label className="integ-form-label">Facebook Page ID:</label>
                      <input
                        type="text"
                        className="integ-text-input"
                        placeholder="104928174829102"
                        value={formConfig.page_id || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, page_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="integ-form-group">
                    <label className="integ-form-label">Facebook Page Access Token:</label>
                    <div className="integ-input-with-action">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        className="integ-text-input"
                        placeholder="EAAK... (Page access token)"
                        value={formConfig.page_token || 'EAAKs923485y291834y12984...'}
                        onChange={(e) => setFormConfig({ ...formConfig, page_token: e.target.value })}
                      />
                      <button
                        type="button"
                        className="integ-eye-btn"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="integ-form-checkboxes">
                    <label className="integ-checkbox-item">
                      <input
                        type="checkbox"
                        checked={formConfig.lead_ads_sync !== false}
                        onChange={(e) => setFormConfig({ ...formConfig, lead_ads_sync: e.target.checked })}
                      />
                      <span>Facebook Lead Ads (Reklama formasi) orqali yuborilgan arizalarni avto-import qilish</span>
                    </label>

                    <label className="integ-checkbox-item">
                      <input
                        type="checkbox"
                        checked={formConfig.sync_messenger !== false}
                        onChange={(e) => setFormConfig({ ...formConfig, sync_messenger: e.target.checked })}
                      />
                      <span>Facebook Messenger xabarlarini 'Yagona Inbox'ga sinxronlash</span>
                    </label>
                  </div>

                  <div className="integ-webhook-box">
                    <div className="integ-webhook-header">
                      <span className="integ-webhook-title">Facebook Webhook Callback URL:</span>
                      <button
                        type="button"
                        className="integ-copy-btn"
                        onClick={() => copyToClipboard(formConfig.webhook_url || 'https://coupled-musical-taste-zoloft.trycloudflare.com/api/facebook/webhook', 'fb_wh')}
                      >
                        {copiedKey === 'fb_wh' ? <RiCheckLine size={14} color="#10B981" /> : <RiFileCopyLine size={14} />}
                        <span>Nusxa olish</span>
                      </button>
                    </div>
                    <code className="integ-webhook-code">
                      {formConfig.webhook_url || 'https://coupled-musical-taste-zoloft.trycloudflare.com/api/facebook/webhook'}
                    </code>
                  </div>
                </>
              )}

              {/* WhatsApp Form */}
              {modalItem.id === 'whatsapp' && (
                <>
                  <div className="integ-form-row">
                    <div className="integ-form-group">
                      <label className="integ-form-label">Phone Number ID:</label>
                      <input
                        type="text"
                        className="integ-text-input"
                        placeholder="104928174829102"
                        value={formConfig.phone_number_id || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, phone_number_id: e.target.value })}
                      />
                    </div>
                    <div className="integ-form-group">
                      <label className="integ-form-label">WABA ID (Business Account):</label>
                      <input
                        type="text"
                        className="integ-text-input"
                        placeholder="982348571029384"
                        value={formConfig.waba_id || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, waba_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="integ-form-group">
                    <label className="integ-form-label">Permanent Access Token:</label>
                    <input
                      type="password"
                      className="integ-text-input"
                      placeholder="EAAG..."
                      value={formConfig.access_token || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, access_token: e.target.value })}
                    />
                  </div>

                  <div className="integ-webhook-box">
                    <span className="integ-webhook-title">WhatsApp Cloud Webhook URL:</span>
                    <code className="integ-webhook-code">
                      {formConfig.webhook_url || 'https://coupled-musical-taste-zoloft.trycloudflare.com/api/whatsapp/webhook'}
                    </code>
                  </div>
                </>
              )}

              {/* Live Test Feedback inside modal */}
              {testResult && (
                <div className={`integ-modal-test-banner ${testResult.ok ? 'test-ok' : 'test-err'}`}>
                  {testResult.ok ? <RiCheckboxCircleLine size={20} /> : <RiErrorWarningLine size={20} />}
                  <div>
                    <strong>{testResult.ok ? "Aloqa tasdiqlandi!" : "Ulanish xatosi!"}</strong>
                    <p>{testResult.message}</p>
                    {testResult.latencyMs !== undefined && (
                      <span className="integ-ping-badge">Kechikish: {testResult.latencyMs} ms</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="integ-modal-footer">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="integ-modal-test-btn"
                  disabled={testingId === modalItem.id}
                  onClick={() => handleTestPing(modalItem.id)}
                >
                  <RiShieldCheckLine size={16} className={testingId === modalItem.id ? 'integ-spin' : ''} />
                  <span>{testingId === modalItem.id ? "Tekshirilmoqda..." : "Ulanishni tekshirish"}</span>
                </button>
                {modalItem.id === 'instagram' && (
                  <button
                    type="button"
                    className="integ-modal-test-btn"
                    style={{ background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)', color: '#ffffff', border: 'none' }}
                    onClick={handleSendTestInstagramMessage}
                  >
                    <RiInstagramLine size={16} />
                    <span>Test xabar jo'natish</span>
                  </button>
                )}
              </div>

              <div className="integ-modal-footer-right">
                <button
                  type="button"
                  className="integ-modal-cancel-btn"
                  onClick={closeConfigModal}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  className="integ-modal-save-btn"
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
    </div>
  );
}
