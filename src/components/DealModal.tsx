import React, { useState, useEffect } from 'react';
import { 
  TbX, TbEdit, TbChevronDown, TbSettings, TbPlus, 
  TbDots, TbBell, TbSearch, TbUser, TbBriefcase,
  TbCalendar, TbCurrencyDollar, TbLink, TbEye, TbClock,
  TbArrowRight, TbAward, TbHistory, TbTrendingUp, TbCheck, TbTimeline
} from 'react-icons/tb';
import { api, type DealStageHistoryItem } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDurationUz, formatDateTimeUz, getElapsedSeconds } from '../utils/timeFormatters';
import './DealModal.css';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  deadline: string;
  price: string;
  lastUpdated: string;
  color: string;
  columnId: string;
  industry?: string;
  enteredColumnAt?: string;
  createdAt?: string;
  totalDurationSeconds?: number;
  lastMoveDurationSeconds?: number;
  transitionsCount?: number;
  isSold?: boolean;
  soldAt?: string;
  soldById?: string;
  soldByName?: string;
  saleDurationSeconds?: number;
}

interface DealModalProps {
  task: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenHistory?: (task: Task) => void;
}

const DealModal: React.FC<DealModalProps> = ({ task, onClose, onSave, onDelete, onOpenHistory }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Bitim ma\'lumotlari');
  const [activityTab, setActivityTab] = useState('Сделки');
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [historyList, setHistoryList] = useState<DealStageHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [currentElapsed, setCurrentElapsed] = useState<number>(() => getElapsedSeconds(task.enteredColumnAt));

  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const data = await api.getDealStageHistory(task.id);
        if (mounted) setHistoryList(data);
      } catch (e) {
        console.error('Error fetching deal history:', e);
      } finally {
        if (mounted) setLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => { mounted = false; };
  }, [task.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentElapsed(getElapsedSeconds(editedTask.enteredColumnAt));
    }, 10000);
    return () => clearInterval(timer);
  }, [editedTask.enteredColumnAt]);

  const handleMarkAsSold = async () => {
    const nowIso = new Date().toISOString();
    const activeStaffId = currentUser?.id || 'st-1';
    const activeStaffName = currentUser?.name || 'Diyor Karimov';
    const currentDur = getElapsedSeconds(editedTask.enteredColumnAt);
    const newTotal = (editedTask.totalDurationSeconds || 0) + currentDur;

    const updated: Task = {
      ...editedTask,
      columnId: 'col-5',
      isSold: true,
      soldAt: nowIso,
      soldById: activeStaffId,
      soldByName: activeStaffName,
      saleDurationSeconds: newTotal,
      totalDurationSeconds: newTotal,
      lastMoveDurationSeconds: currentDur,
      lastUpdated: 'Hozir'
    };

    setEditedTask(updated);
    onSave(updated);

    try {
      await api.recordDealMove({
        deal_id: updated.id,
        deal_title: updated.title,
        from_column_id: editedTask.columnId,
        from_column_title: 'Joriy bosqich',
        to_column_id: 'col-5',
        to_column_title: 'Mashina topshirildi',
        moved_by_id: activeStaffId,
        moved_by_name: activeStaffName,
        duration_seconds: currentDur,
        total_deal_seconds: newTotal,
        is_sold: true,
        industry: editedTask.industry || 'avtosalon'
      });
      const fresh = await api.getDealStageHistory(updated.id);
      setHistoryList(fresh);
    } catch (e) {
      console.error('Failed to record sale move:', e);
    }
  };

  const navTabs = ['Bitim ma\'lumotlari', 'Vaqt va Harakatlar Tarixi', 'Товары', 'Работы'];

  return (
    <div className="deal-modal-overlay" onClick={onClose}>
      <div className="deal-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="deal-modal-header">
          <div className="header-left">
            <h2 className="deal-brand">Deal 1951</h2>
            <button className="icon-btn edit-title-btn"><TbEdit size={14} /></button>
            <div className="status-badge">
              <span className="status-dot" style={{ backgroundColor: editedTask.color }}></span>
              <span>Новая</span>
              <TbChevronDown size={14} />
            </div>
          </div>
          <div className="header-right">
            <div className="dropdown-btn">Документ <TbChevronDown size={14} /></div>
            <div className="dropdown-btn">Предложение <TbChevronDown size={14} /></div>
            <button className="text-btn cancel-btn" onClick={onClose}>Отменить</button>
            <button className="save-btn" onClick={() => onSave(editedTask)}>Сохранить</button>
            <button className="icon-btn-rounded settings-btn"><TbSettings size={18} /></button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="deal-modal-nav">
          <div className="nav-tabs-container">
            {navTabs.map(tab => (
              <button 
                key={tab} 
                className={`nav-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`deal-modal-body ${activeTab !== 'Bitim ma\'lumotlari' ? 'full-width' : ''}`}>
          {activeTab === 'Bitim ma\'lumotlari' ? (
            <>
              {/* Left Panel: CRM Data */}
              <div className="crm-data-panel">
                {/* Sale / Progress Timing Banner */}
                {editedTask.isSold ? (
                  <div className="deal-sold-highlight-banner">
                    <div className="deal-sold-banner-left">
                      <span className="trophy-badge"><TbCheck size={18} /></span>
                      <div>
                        <h4 className="deal-sold-banner-title">Muvaffaqiyatli sotilgan mahsulot</h4>
                        <p className="deal-sold-banner-sub">
                          Mas'ul xodim: <strong>{editedTask.soldByName || editedTask.assignedTo}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="deal-sold-banner-right">
                      <span className="sold-time-label">Sotuvga ketgan umumiy vaqt:</span>
                      <strong className="sold-time-duration">
                        ⏱️ {formatDurationUz(editedTask.saleDurationSeconds || editedTask.totalDurationSeconds || 0)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="deal-progress-banner">
                    <div className="deal-progress-timing">
                      <span>⏱️ Bosqichda: <strong>{formatDurationUz(currentElapsed)}</strong></span>
                      <span>Jami: <strong>{formatDurationUz((editedTask.totalDurationSeconds || 0) + currentElapsed)}</strong></span>
                    </div>
                    <button 
                      type="button" 
                      className="mark-as-sold-action-btn"
                      onClick={handleMarkAsSold}
                      title="Bitimni muvaffaqiyatli yakunlash va o'z hisobingizga sotuv sifatida yozish"
                    >
                      <TbAward size={16} />
                      <span>Sotuv deb yakunlash</span>
                    </button>
                  </div>
                )}

                {/* Section: About Deal */}
                <div className="crm-section">
                  <div className="crm-section-header">
                    <h3>О сделке</h3>
                    <button className="crm-cancel-link">Отменить</button>
                  </div>
                  
                  <div className="crm-fields-list">
                    <div className="crm-field">
                      <label>Название</label>
                      <div className="crm-input-wrapper">
                        <input 
                          type="text" 
                          value={editedTask.title} 
                          onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                          placeholder="Bitim nomi"
                        />
                        <TbSettings className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ margin: 0 }}>Стадия</label>
                        {onOpenHistory && (
                          <button
                            type="button"
                            onClick={() => onOpenHistory(editedTask)}
                            style={{
                              background: 'rgba(0, 43, 255, 0.08)',
                              color: '#002BFF',
                              border: '1px solid rgba(0, 43, 255, 0.2)',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <TbClock size={12} /> Bosqichlar vaqti
                          </button>
                        )}
                      </div>
                      <div className="crm-input-wrapper">
                        <div className="crm-select-styled">
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: editedTask.color, marginRight: '6px' }}></span>
                          {editedTask.columnId || 'Новая'} <TbChevronDown />
                        </div>
                        <TbSettings className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Срок / Дата завершения</label>
                      <div className="crm-input-wrapper">
                        <input 
                          type="text" 
                          value={editedTask.deadline} 
                          onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
                          placeholder="Masalan: Bugun, 18:00"
                        />
                        <TbCalendar className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Сумма</label>
                      <div className="crm-input-wrapper price-input">
                        <input 
                          type="text" 
                          value={editedTask.price} 
                          onChange={(e) => setEditedTask({ ...editedTask, price: e.target.value })}
                          placeholder="0 UZS"
                        />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Tavsif / Mijoz ma'lumoti</label>
                      <div className="crm-input-wrapper">
                        <input 
                          type="text" 
                          value={editedTask.description} 
                          onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                          placeholder="Mijoz ismi, telefon raqami yoki eslatma"
                        />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Mas'ul xodim</label>
                      <div className="crm-input-wrapper contact-field">
                        <div className="user-avatar-small">{editedTask.assignedTo || 'DK'}</div>
                        <input 
                          type="text" 
                          value={editedTask.assignedTo} 
                          onChange={(e) => setEditedTask({ ...editedTask, assignedTo: e.target.value })}
                          placeholder="Xodim initsiali (masalan: JK)"
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (window.confirm("Rostdan ham ushbu kartochkani o'chirmoqchimisiz?")) {
                            onDelete(editedTask.id);
                            onClose();
                          }
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <TbX size={16} /> Kartochkani o'chirish
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section: Additional */}
                <div className="crm-section">
                  <div className="crm-section-header">
                    <h3>Дополнительно</h3>
                    <button className="crm-cancel-link">Отменить</button>
                  </div>
                  
                  <div className="crm-fields-list">
                    <div className="crm-field">
                      <label>Тип сделки</label>
                      <div className="crm-input-wrapper">
                        <div className="crm-select-styled">Продажа <TbChevronDown /></div>
                        <TbSettings className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Источник</label>
                      <div className="crm-input-wrapper">
                        <div className="crm-select-styled">Новая <TbChevronDown /></div>
                        <TbSettings className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Дополнительно об источнике</label>
                      <div className="crm-input-wrapper">
                        <textarea rows={3}></textarea>
                        <TbSettings className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Дата завершения</label>
                      <div className="crm-input-wrapper">
                        <input type="text" defaultValue="08.05.2027" />
                        <TbCalendar className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Наблюдатель</label>
                      <button className="add-observer-btn">+ Добавить наблюдателя</button>
                    </div>

                    <div className="crm-field">
                      <label>Комментарий</label>
                      <div className="crm-input-wrapper">
                        <textarea rows={3}></textarea>
                        <TbSettings className="field-icon" />
                      </div>
                    </div>
                  </div>

                  <div className="crm-section-footer">
                    <button className="footer-btn">Выбрать поля</button>
                    <button className="footer-btn">Создать поле</button>
                  </div>
                </div>

                {/* Section: Products */}
                <div className="crm-section">
                  <div className="crm-section-header">
                    <h3>Товары</h3>
                    <button className="crm-cancel-link">Отменить</button>
                  </div>
                  <div className="crm-fields-list">
                    <div className="crm-field">
                      <label>Товары</label>
                      <button className="add-product-btn">
                        <TbPlus /> Добавить
                      </button>
                      <TbSettings className="field-icon-float" />
                    </div>
                  </div>
                  <div className="crm-section-footer">
                    <button className="footer-btn">Выбрать поля</button>
                    <button className="footer-btn">Создать поле</button>
                  </div>
                </div>

                <button className="add-section-btn">+ Создать раздел</button>
              </div>

              {/* Right Panel: Feed */}
              <div className="feed-panel">
                <div className="feed-input-card">
                  <div className="feed-tabs">
                    {navTabs.map(tab => (
                      <button 
                        key={tab} 
                        className={`feed-tab ${activityTab === tab ? 'active' : ''}`}
                        onClick={() => setActivityTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="feed-form">
                    <div className="feed-form-title">Связаться с клиентом:</div>
                    <textarea placeholder="Что нужно сделать" className="feed-textarea"></textarea>
                    <div className="feed-form-controls">
                      <TbCalendar className="control-icon" />
                      <div className="action-picker">
                        Действие <TbChevronDown size={14} />
                      </div>
                    </div>
                    <div className="feed-form-btns">
                      <button className="feed-save-btn">Сохранить</button>
                      <button className="feed-cancel-btn">Отменить</button>
                    </div>
                  </div>
                </div>

                <div className="feed-placeholder-card">
                  <div className="placeholder-icon-circle"><TbPlus /></div>
                  <div className="placeholder-text">
                    <div className="p-title">Создайте дело</div>
                    <div className="p-subtitle">Запланируйте следующий шаг по сделке</div>
                  </div>
                </div>

                <div className="feed-items-list">
                  <div className="feed-item-card task-highlight">
                    <div className="feed-item-header">Связаться с клиентом</div>
                    <div className="feed-item-content">
                      <div className="feed-avatar-rect"></div>
                      <div className="feed-details">
                        <div className="feed-deadline">Сделать до: <b>Вт, 28 апреля, 12:00</b></div>
                        <div className="feed-text">Связаться с клиентом</div>
                      </div>
                    </div>
                    <div className="feed-item-footer">
                      <button className="retry-btn">Повторить</button>
                      <TbDots className="feed-more-icon" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'Товары' ? (
            <div className="products-tab-content">
              <div className="products-header-actions">
                <button className="add-products-black-btn">Добавить товары</button>
                <button className="select-product-white-btn">Выбрать товар</button>
              </div>

              <div className="products-table-container">
                <div className="products-table-header">
                  <div className="col-settings"><TbSettings /></div>
                  <div className="col-title">Товары</div>
                  <div className="col-price">Цена</div>
                  <div className="col-quantity">Количество</div>
                  <div className="col-discount">Скидки</div>
                </div>

                <div className="products-table-row">
                  <div className="col-drag"><TbX style={{ transform: 'rotate(45deg)' }} /></div>
                  <div className="col-index">1.</div>
                  <div className="col-search">
                    <div className="product-search-input">
                      <input type="text" placeholder="Найти или создать товар" />
                      <TbSearch className="search-icon" />
                    </div>
                  </div>
                  <div className="col-price-val">
                    <div className="product-val-input">
                      <input type="text" defaultValue="0 $" />
                      <div className="stepper-arrows">
                        <TbChevronDown className="up" />
                        <TbChevronDown className="down" />
                      </div>
                    </div>
                  </div>
                  <div className="col-quantity-val">
                    <div className="product-val-input">
                      <input type="text" defaultValue="1 шт" />
                      <div className="stepper-arrows">
                        <TbChevronDown className="up" />
                        <TbChevronDown className="down" />
                      </div>
                    </div>
                  </div>
                  <div className="col-discount-val">
                    <div className="product-val-input">
                      <input type="text" defaultValue="%" />
                    </div>
                  </div>
                </div>

                <div className="products-summary-section">
                  <div className="summary-list">
                    <div className="summary-row">
                      <span>Сумма без скидки и налогов:</span>
                      <span>0$</span>
                    </div>
                    <div className="summary-row">
                      <span>Сумма доставки:</span>
                      <span>0$</span>
                    </div>
                    <div className="summary-row">
                      <span>Сумма скидки:</span>
                      <span>0$</span>
                    </div>
                    <div className="summary-row">
                      <span>Сумма без налога:</span>
                      <span>0$</span>
                    </div>
                    <div className="summary-row">
                      <span>Сумма налога:</span>
                      <span>0$</span>
                    </div>
                  </div>
                  <div className="summary-total">
                    <span>Общая сумма:</span>
                    <span className="total-val">0$</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'Vaqt va Harakatlar Tarixi' ? (
            <div className="deal-history-tab-view">
              <div className="deal-history-stats-row">
                <div className="deal-kpi-card stage">
                  <div className="deal-kpi-icon">
                    <TbClock />
                  </div>
                  <div>
                    <span className="deal-kpi-label">Hozirgi bosqichda</span>
                    <strong className="deal-kpi-val">{formatDurationUz(currentElapsed)}</strong>
                  </div>
                </div>

                <div className="deal-kpi-card total">
                  <div className="deal-kpi-icon">
                    <TbTrendingUp />
                  </div>
                  <div>
                    <span className="deal-kpi-label">Jami ketgan vaqt</span>
                    <strong className="deal-kpi-val">{formatDurationUz((editedTask.totalDurationSeconds || 0) + currentElapsed)}</strong>
                  </div>
                </div>

                <div className="deal-kpi-card sale">
                  <div className="deal-kpi-icon">
                    <TbAward />
                  </div>
                  <div>
                    <span className="deal-kpi-label">Sotuv ko'rsatkichi</span>
                    <strong className="deal-kpi-val">
                      {editedTask.isSold ? `Sotildi (${formatDurationUz(editedTask.saleDurationSeconds || editedTask.totalDurationSeconds || 0)})` : 'Jarayonda'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="deal-timeline-section">
                <h4 className="deal-timeline-header-title">
                  <TbTimeline />
                  <span>Kanban bosqichlaridan o'tish xronologiyasi va xodimlar harakati</span>
                </h4>

                {loadingHistory ? (
                  <p style={{ color: '#64748b' }}>Tarix yuklanmoqda...</p>
                ) : historyList.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Hozircha oldingi ko'chirishlar mavjud emas. Kartochka joriy ustunda yaratilgan.</p>
                ) : (
                  <div className="deal-timeline-items">
                    {historyList.map((item, idx) => (
                      <div key={item.id || idx} className={`deal-timeline-entry ${item.isSale ? 'is-sale-entry' : ''}`}>
                        <div className="entry-top-row">
                          <div className="entry-columns">
                            <span className="entry-from-col">{item.fromColumnTitle || 'Boshlang\'ich'}</span>
                            <TbArrowRight size={14} />
                            <span className="entry-to-col">{item.toColumnTitle}</span>
                          </div>
                          <span className="entry-time-badge">
                            ⏱️ {formatDurationUz(item.durationSeconds)}
                          </span>
                        </div>

                        <div className="entry-meta-grid">
                          <div className="entry-meta-item">
                            <TbCalendar size={13} />
                            <span>Vaqti: <strong>{formatDateTimeUz(item.createdAt)}</strong></span>
                          </div>
                          <div className="entry-meta-item">
                            <TbUser size={13} />
                            <span>Mas'ul ishchi: <strong>{item.movedByName || 'Foydalanuvchi'}</strong></span>
                          </div>
                          {item.totalDealSeconds ? (
                            <div className="entry-meta-item">
                              <TbTrendingUp size={13} />
                              <span>O'sha paytdagi jami: <strong>{formatDurationUz(item.totalDealSeconds)}</strong></span>
                            </div>
                          ) : null}
                        </div>

                        {item.isSale && (
                          <div className="entry-sale-celebration">
                            <TbAward size={16} />
                            <span>🎉 Muvaffaqiyatli sotuv qayd etildi! Mahsulotni sotishga ketgan umumiy vaqt: {formatDurationUz(item.saleDurationSeconds || item.totalDealSeconds || 0)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-tab-content">
              <h3>Bo'lim {activeTab} ishlab chiqilmoqda</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealModal;
