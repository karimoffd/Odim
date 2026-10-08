import { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  RiFacebookCircleFill,
  RiInstagramFill,
  RiCheckDoubleLine,
  RiAlertLine,
  RiLoader4Line,
  RiCloseLine,
  RiShieldCheckLine
} from 'react-icons/ri';
import './IntegrationsModals.css';

export interface DiscoveredPage {
  pageId: string;
  pageName: string;
  category: string;
  pagePicture?: string;
  hasInstagram: boolean;
  instagram?: {
    id: string;
    username: string;
    name: string;
    profilePicture?: string;
  } | null;
}

interface Props {
  sessionId: string;
  onSuccess: (connectedPage: string, connectedIg?: string) => void;
  onClose: () => void;
}

export default function MetaAccountSelectorModal({ sessionId, onSuccess, onClose }: Props) {
  const [pages, setPages] = useState<DiscoveredPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [connectFacebook, setConnectFacebook] = useState(true);
  const [connectInstagram, setConnectInstagram] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDiscovered() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getMetaDiscoveredAccounts(sessionId);
        if (res.success && res.pages) {
          setPages(res.pages);
          if (res.pages.length > 0) {
            setSelectedPageId(res.pages[0].pageId);
          }
        } else {
          setError(res.error || 'Meta sahifalarini yuklab bo\'lmadi');
        }
      } catch {
        setError('Server bilan bog\'lanishda xato');
      } finally {
        setLoading(false);
      }
    }
    loadDiscovered();
  }, [sessionId]);

  const handleConfirm = async () => {
    if (!selectedPageId) {
      setError('Iltimos, ulamoqchi bo\'lgan Facebook sahifangizni tanlang');
      return;
    }

    const selectedPage = pages.find(p => p.pageId === selectedPageId);
    const selectedIgId = selectedPage?.instagram?.id;

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.selectMetaAccount({
        sessionId,
        selectedPageId,
        connectFacebook,
        connectInstagram: connectInstagram && !!selectedIgId,
        selectedInstagramId: selectedIgId
      });

      if (res.success) {
        onSuccess(res.connectedPage || selectedPage?.pageName || '', res.connectedInstagram);
      } else {
        setError(res.error || res.message || 'Ulanishni tasdiqlashda xatolik yuz berdi');
      }
    } catch {
      setError('Server bilan aloqa xatosi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="odim-modal-backdrop" onClick={onClose}>
      <div className="odim-selector-modal" onClick={e => e.stopPropagation()}>
        <div className="selector-modal-header">
          <div className="selector-brand-badges">
            <span className="badge-fb"><RiFacebookCircleFill size={22} /> Facebook</span>
            <span className="badge-sep">+</span>
            <span className="badge-ig"><RiInstagramFill size={22} /> Instagram</span>
          </div>
          <button className="modal-close-x" onClick={onClose}><RiCloseLine size={20} /></button>
        </div>

        <div className="selector-modal-title">
          <h3>Meta Sahifasi va Instagram Akkauntini Tanlang</h3>
          <p>Profilingizga tegishli sahifalardan qaysi birini Odim CRM tizimiga ulamoqchisiz?</p>
        </div>

        {error && (
          <div className="selector-modal-error">
            <RiAlertLine size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="selector-modal-loading">
            <RiLoader4Line className="integ-spin" size={32} color="#002BFF" />
            <p>Meta hisobingizdagi biznes sahifalar tahlil qilinmoqda...</p>
          </div>
        ) : (
          <div className="selector-pages-list">
            {pages.length === 0 ? (
              <div className="selector-empty-box">
                <RiAlertLine size={32} color="#F59E0B" />
                <p>Ushbu Meta akkauntida hech qanday Facebook sahifasi topilmadi.</p>
                <a
                  href="https://www.facebook.com/pages/create"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-create-page-link"
                >
                  Facebookda yangi sahifa ochish ➔
                </a>
              </div>
            ) : (
              pages.map(page => {
                const isSelected = selectedPageId === page.pageId;
                return (
                  <label
                    key={page.pageId}
                    className={`page-select-card ${isSelected ? 'is-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="metaPageSelection"
                      checked={isSelected}
                      onChange={() => setSelectedPageId(page.pageId)}
                    />
                    <div className="page-card-avatar">
                      {page.pagePicture ? (
                        <img src={page.pagePicture} alt={page.pageName} />
                      ) : (
                        <RiFacebookCircleFill size={36} color="#1877F2" />
                      )}
                    </div>
                    <div className="page-card-meta">
                      <div className="page-card-name-row">
                        <h4>{page.pageName}</h4>
                        <span className="page-cat-tag">{page.category}</span>
                      </div>

                      {page.instagram ? (
                        <div className="linked-ig-pill">
                          <RiInstagramFill size={15} color="#E1306C" />
                          <span>Bog'langan: <strong>@{page.instagram.username}</strong></span>
                        </div>
                      ) : (
                        <div className="unlinked-ig-pill">
                          <span>⚠️ Instagram bog'lanmagan (Faqat Facebook ulanadi)</span>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        )}

        {/* Feature Switches */}
        <div className="selector-toggles-box">
          <label className="selector-toggle-item">
            <input
              type="checkbox"
              checked={connectFacebook}
              onChange={e => setConnectFacebook(e.target.checked)}
            />
            <div>
              <strong>Facebook Messenger & Postlarni qabul qilish</strong>
              <small>Mijozlarning Facebook Messenger yozishmalari to'g'ridan-to'g'ri Inboxga tushadi</small>
            </div>
          </label>

          <label className="selector-toggle-item">
            <input
              type="checkbox"
              checked={connectInstagram}
              onChange={e => setConnectInstagram(e.target.checked)}
            />
            <div>
              <strong>Instagram Direct & Izohlarni yoqish</strong>
              <small>Instagram DM va post ostidagi barcha sharhlar avto-lidga aylanadi</small>
            </div>
          </label>
        </div>

        <div className="selector-security-note">
          <RiShieldCheckLine size={16} color="#10B981" />
          <span>Barcha ruxsat kalitlari AES-256-GCM standarti bo'yicha shifrlanadi.</span>
        </div>

        <div className="selector-modal-actions">
          <button type="button" className="odim-btn-cancel" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </button>
          <button
            type="button"
            className="odim-btn-confirm"
            onClick={handleConfirm}
            disabled={submitting || loading || pages.length === 0}
          >
            {submitting ? (
              <>
                <RiLoader4Line className="integ-spin" size={17} />
                <span>Ulanmoqda...</span>
              </>
            ) : (
              <>
                <RiCheckDoubleLine size={17} />
                <span>Ulashni Tasdiqlash</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
