import React, { useState, useEffect } from 'react';
import { 
  TbX, TbClock, TbHistory, TbArrowRight, TbCheck, TbUser,
  TbCalendar, TbTrendingUp, TbTimeline
} from 'react-icons/tb';
import { api, type DealStageHistoryItem } from '../api';
import { formatDurationUz, formatDateTimeUz, getElapsedSeconds } from '../utils/timeFormatters';

interface DealStageHistoryModalProps {
  dealId: string;
  dealTitle: string;
  currentColumnTitle: string;
  currentColumnColor?: string;
  enteredColumnAt?: string;
  totalDurationSeconds?: number;
  lastMoveDurationSeconds?: number;
  transitionsCount?: number;
  onClose: () => void;
}

export const DealStageHistoryModal: React.FC<DealStageHistoryModalProps> = ({
  dealId,
  dealTitle,
  currentColumnTitle,
  currentColumnColor = '#002BFF',
  enteredColumnAt,
  totalDurationSeconds = 0,
  lastMoveDurationSeconds = 0,
  transitionsCount = 0,
  onClose
}) => {
  const [history, setHistory] = useState<DealStageHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentElapsed, setCurrentElapsed] = useState<number>(() => getElapsedSeconds(enteredColumnAt));

  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await api.getDealStageHistory(dealId);
        if (mounted) {
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to fetch deal history:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [dealId]);

  // Live timer tick every 10 seconds for current stage
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentElapsed(getElapsedSeconds(enteredColumnAt));
    }, 10000);
    return () => clearInterval(timer);
  }, [enteredColumnAt]);

  const liveTotalSeconds = totalDurationSeconds + currentElapsed;

  return (
    <div className="stage-history-overlay" onClick={onClose}>
      <div className="stage-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="stage-history-header">
          <div className="history-header-info">
            <div className="history-badge">
              <TbHistory size={16} />
              <span>Bosqichlar vaqti va harakatlar tarixi</span>
            </div>
            <h2 className="history-deal-title">{dealTitle}</h2>
            <div className="history-current-stage">
              <span className="stage-dot" style={{ backgroundColor: currentColumnColor }}></span>
              <span>Joriy bosqich: <strong>{currentColumnTitle}</strong></span>
            </div>
          </div>
          <button className="history-close-btn" onClick={onClose} title="Yopish">
            <TbX size={20} />
          </button>
        </div>

        {/* Highlight Stats Row */}
        <div className="history-stats-grid">
          <div className="history-stat-card current-stat">
            <div className="stat-icon-wrap" style={{ background: 'rgba(0, 43, 255, 0.1)', color: '#002BFF' }}>
              <TbClock size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Hozirgi bosqichda</span>
              <strong className="stat-value">{formatDurationUz(currentElapsed)}</strong>
              <span className="stat-hint">{enteredColumnAt ? `${formatDateTimeUz(enteredColumnAt)} dan beri` : 'Jonli hisob'}</span>
            </div>
          </div>

          <div className="history-stat-card total-stat">
            <div className="stat-icon-wrap" style={{ background: 'rgba(174, 0, 255, 0.1)', color: '#AE00FF' }}>
              <TbTrendingUp size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Umumiy ketgan vaqt</span>
              <strong className="stat-value">{formatDurationUz(liveTotalSeconds)}</strong>
              <span className="stat-hint">Boshidan hozirgacha</span>
            </div>
          </div>

          <div className="history-stat-card last-move-stat">
            <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <TbTimeline size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Oxirgi bosqich vaqti</span>
              <strong className="stat-value">{lastMoveDurationSeconds > 0 ? formatDurationUz(lastMoveDurationSeconds) : (history[0]?.durationSeconds ? formatDurationUz(history[0].durationSeconds) : 'Boshlang\'ich')}</strong>
              <span className="stat-hint">O'tgan bosqich davomiyligi</span>
            </div>
          </div>

          <div className="history-stat-card transitions-stat">
            <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
              <TbCheck size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Jami ko'chirishlar</span>
              <strong className="stat-value">{Math.max(transitionsCount, history.length)} marta</strong>
              <span className="stat-hint">Bosqichlar almashinuvi</span>
            </div>
          </div>
        </div>

        {/* Timeline Body */}
        <div className="history-timeline-section">
          <h3 className="timeline-title">
            <TbClock size={18} />
            Bosqichma-bosqich o'tishlar ketma-ketligi
          </h3>

          {loading ? (
            <div className="history-loading">
              <div className="spinner"></div>
              <span>Bosqichlar tarixi yuklanmoqda...</span>
            </div>
          ) : (
            <div className="history-timeline-list">
              {/* Active Current Stage */}
              <div className="timeline-item current-active">
                <div className="timeline-marker active-pulse"></div>
                <div className="timeline-content-card">
                  <div className="timeline-item-header">
                    <div className="timeline-stage-title active-title">
                      <span className="pulse-indicator"></span>
                      <span>{currentColumnTitle}</span>
                      <span className="active-tag">Hozirgi bosqich</span>
                    </div>
                    <span className="timeline-time-badge live-badge">
                      ⏱️ {formatDurationUz(currentElapsed)}
                    </span>
                  </div>
                  <div className="timeline-meta-row">
                    <span>Kirgan vaqti: <strong>{formatDateTimeUz(enteredColumnAt)}</strong></span>
                    <span className="live-status-text">Davom etmoqda...</span>
                  </div>
                </div>
              </div>

              {/* Past Stages List */}
              {history.length === 0 ? (
                <div className="history-empty">
                  <p>Hozircha oldingi bosqich ko'chirishlari mavjud emas. Kartochka ushbu bosqichda yaratilgan.</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <div key={item.id || idx} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content-card">
                      <div className="timeline-item-header">
                        <div className="timeline-stage-title">
                          <span className="from-stage">{item.fromColumnTitle || 'Boshlang\'ich'}</span>
                          <TbArrowRight className="arrow-icon" size={16} />
                          <span className="to-stage">{item.toColumnTitle}</span>
                        </div>
                        <span className="timeline-time-badge">
                          ⏱️ {formatDurationUz(item.durationSeconds)}
                        </span>
                      </div>

                      <div className="timeline-details-grid">
                        <div className="detail-pill">
                          <TbCalendar size={14} />
                          <span>Ko'chirilgan: <strong>{formatDateTimeUz(item.createdAt)}</strong></span>
                        </div>
                        <div className="detail-pill">
                          <TbClock size={14} />
                          <span>Ushbu bosqichda: <strong>{formatDurationUz(item.durationSeconds)}</strong></span>
                        </div>
                        {item.totalDealSeconds ? (
                          <div className="detail-pill">
                            <TbTrendingUp size={14} />
                            <span>O'sha paytdagi jami: <strong>{formatDurationUz(item.totalDealSeconds)}</strong></span>
                          </div>
                        ) : null}
                        <div className="detail-pill">
                          <TbUser size={14} />
                          <span>Mas'ul: <strong>{item.movedByName || 'Foydalanuvchi'}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="stage-history-footer">
          <div className="footer-summary">
            <span>Baza holati: <strong>Barcha ko'chish vaqtlari SQLite bazasida saqlanmoqda</strong></span>
          </div>
          <button className="history-close-action-btn" onClick={onClose}>
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
export default DealStageHistoryModal;
