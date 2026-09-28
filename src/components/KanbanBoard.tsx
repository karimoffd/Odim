import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import ReactDOM from 'react-dom';
import { 
  TbX, TbChevronLeft, TbChevronRight, TbSearch, TbPlus, TbUser, TbChevronDown,
  TbAlertTriangle, TbClock, TbCheck, TbEye, TbHistory, TbTrendingUp, TbCrown
} from 'react-icons/tb';
import { io } from 'socket.io-client';
import { RiCarLine, RiScissorsLine, RiMegaphoneLine, RiDropLine } from 'react-icons/ri';
import { api, type KanbanStageSLA, type KanbanDeal } from '../api';
import { useAuth } from '../context/AuthContext';
import DealModal from './DealModal';
import DealStageHistoryModal from './DealStageHistoryModal';
import { SuperAdminAuditModal } from './SuperAdminAuditModal';
import { formatDurationUz, getElapsedSeconds } from '../utils/timeFormatters';
import './KanbanBoard.css';

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

interface Column {
  id: string;
  title: string;
  color: string;
  taskIds: string[];
}

interface BoardData {
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
}

const BRAND_COLORS = {
  purple: '#AE00FF',
  blue: '#002BFF',
  green: '#00FF2B',
  red: '#FF0004'
};

const PlusIcon = ({ size = 24, color = "#1A1A1A" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DotsIcon = ({ size = 24, color = "#1A1A1A" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="6" r="2" fill={color} />
    <circle cx="12" cy="12" r="2" fill={color} />
    <circle cx="12" cy="18" r="2" fill={color} />
  </svg>
);

const DraggablePortal = ({ children, isDragging }: { children: React.ReactElement, isDragging: boolean }) => {
  if (!isDragging) return children;

  let portalRoot = document.getElementById('kanban-portal');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'kanban-portal';
    document.body.appendChild(portalRoot);
  }

  return ReactDOM.createPortal(children, portalRoot);
};

const TaskCard = React.memo(({ 
  task, 
  index, 
  onClick, 
  onRightClick, 
  onOpenHistory,
  isDropTarget, 
  isOverDelete,
  isOverdue,
  overdueMinutes,
  isWarning,
  remainingMinutes
}: { 
  task: Task; 
  index: number; 
  onClick: (task: Task) => void; 
  onRightClick: (task: Task) => void; 
  onOpenHistory?: (task: Task) => void;
  isDropTarget: boolean; 
  isOverDelete?: boolean;
  isOverdue?: boolean;
  overdueMinutes?: number;
  isWarning?: boolean;
  remainingMinutes?: number;
}) => {
  const currentStageElapsed = getElapsedSeconds(task.enteredColumnAt);
  const totalElapsed = (task.totalDurationSeconds || 0) + currentStageElapsed;
  const isDeliveredStage = task.columnId === 'col-5' || 
    (task.industry === 'beauty' && task.columnId === 'col-4') || 
    (task.industry === 'plumbing' && task.columnId === 'col-4');
  const showSoldBanner = Boolean(task.isSold && isDeliveredStage);

  return (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <DraggablePortal isDragging={snapshot.isDragging}>
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`task-wrapper ${snapshot.isDragging ? 'is-dragging' : ''} ${snapshot.draggingOver === task.columnId ? 'under-drag' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
            data-task-id={task.id}
            style={{
              ...provided.draggableProps.style,
              marginBottom: '16px',
              zIndex: snapshot.isDragging ? 20000 : undefined,
            }}
          >
            <div
              onClick={() => onClick(task)}
              onContextMenu={(e) => {
                e.preventDefault();
                onRightClick(task);
              }}
              className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${isOverDelete ? 'about-to-delete' : ''} ${isOverdue ? 'is-overdue' : isWarning ? 'is-warning' : ''} ${showSoldBanner ? 'is-sold' : ''}`}
            >
              {showSoldBanner && (
                <div className="task-card-sold-banner" title="Muvaffaqiyatli sotilgan mahsulot">
                  <div className="sold-banner-left">
                    <span className="sold-title">Sotildi</span>
                    {task.soldByName && <span className="sold-by">({task.soldByName})</span>}
                  </div>
                  <div className="sold-time-tag" title="Mahsulotni sotishga ketgan umumiy vaqt">
                    <TbClock size={11} className="time-tag-icon" />
                    <span>{formatDurationUz(task.saleDurationSeconds || task.totalDurationSeconds || 0)}</span>
                  </div>
                </div>
              )}
              <div className="task-card-header">
                <h4 className="task-card-title">{task.title}</h4>
                <DotsIcon color="#94A3B8" size={18} />
              </div>
              <p className="task-card-description">{task.description}</p>

              {/* Dynamic Stage Timing Badges Bar */}
              <div className="task-card-time-bar">
                <div className="time-badge stage-time" title="Hozirgi bosqichda turgan vaqti">
                  <TbClock size={12} />
                  <span className="tb-label">Bosqichda:</span>
                  <span className="tb-val">{formatDurationUz(currentStageElapsed, true)}</span>
                </div>

                {task.lastMoveDurationSeconds && task.lastMoveDurationSeconds > 0 ? (
                  <div className="time-badge move-time" title="Oldingi bosqichdan qancha vaqtda olib o'tildi">
                    <span className="tb-bolt">⚡</span>
                    <span className="tb-label">Olib o'tildi:</span>
                    <span className="tb-val">{formatDurationUz(task.lastMoveDurationSeconds, true)}</span>
                  </div>
                ) : null}

                <div className="time-badge total-time" title="Bitim boshidan beri umumiy ketgan vaqt">
                  <span className="tb-label">Jami:</span>
                  <span className="tb-val">{formatDurationUz(totalElapsed, true)}</span>
                </div>
              </div>

              <div className="task-card-tags">
                {isOverdue ? (
                  <div className="tag-overdue-alert" title="SLA vaqti tugagan!">
                    <TbAlertTriangle size={13} />
                    <span>Muddati o'tdi ({overdueMinutes && overdueMinutes > 0 ? `${overdueMinutes}m kechikdi` : "Kechikdi"})</span>
                  </div>
                ) : isWarning ? (
                  <div className="tag-warning-alert" title="Vaqti oz qoldi! Shoshiling">
                    <TbAlertTriangle size={13} />
                    <span>Vaqt oz qoldi! {remainingMinutes && remainingMinutes > 0 ? `(${remainingMinutes} daq qoldi)` : ''}</span>
                  </div>
                ) : (
                  <div className="tag-deadline">{task.deadline}</div>
                )}
                <div className="tag-price">{task.price}</div>
              </div>

              <div className="task-card-footer">
                <div className="task-card-footer-left">
                  <span className="task-card-updated">{task.lastUpdated}</span>
                  {onOpenHistory && (
                    <button 
                      type="button" 
                      className="task-history-chip-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenHistory(task);
                      }}
                      title="Barcha bosqichlar vaqti va tarixini ko'rish"
                    >
                      <TbHistory size={13} />
                      <span>Vaqt tarixi</span>
                    </button>
                  )}
                </div>
                <div className="user-avatar">{task.assignedTo}</div>
              </div>
            </div>
          </div>
        </DraggablePortal>
      )}
    </Draggable>
  );
});
TaskCard.displayName = 'TaskCard';

export const INDUSTRY_TEMPLATES: Record<string, {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  columns: { id: string; title: string; color: string }[];
  sampleTasks: Record<string, Task>;
}> = {
  avtosalon: {
    name: 'Avtosalon',
    icon: RiCarLine,
    columns: [
      { id: 'col-1', title: 'Lid keldi', color: '#AE00FF' },
      { id: 'col-2', title: 'Test-drayv', color: '#002BFF' },
      { id: 'col-3', title: 'Qaror qabul qilish', color: '#F59E0B' },
      { id: 'col-4', title: 'Shartnoma', color: '#00FF2B' },
      { id: 'col-5', title: 'Mashina topshirildi', color: '#10B981' }
    ],
    sampleTasks: {
      't-avto-1': { id: 't-avto-1', title: 'Chevrolet Tracker Premier', description: 'Mijoz: Jamshid Karimov | Tel: +998 90 123 45 67', assignedTo: 'JK', deadline: 'Bugun, 15:00', price: '250,000,000 UZS', lastUpdated: '10 daq oldin', color: '#AE00FF', columnId: 'col-1' },
      't-avto-2': { id: 't-avto-2', title: 'Kia K5 Style Test-drayv', description: 'Mijoz: Bobur Aliyev | Shartnoma ko\'rish', assignedTo: 'BA', deadline: 'Ertaga, 11:30', price: '380,000,000 UZS', lastUpdated: '1 soat oldin', color: '#002BFF', columnId: 'col-2' },
      't-avto-3': { id: 't-avto-3', title: 'BYD Song Plus EV', description: 'Kredit yoki lizing hisob-kitobi', assignedTo: 'MR', deadline: 'Bugun, 18:00', price: '360,000,000 UZS', lastUpdated: '3 soat oldin', color: '#F59E0B', columnId: 'col-3' },
    }
  },
  beauty: {
    name: 'Go\'zallik saloni',
    icon: RiScissorsLine,
    columns: [
      { id: 'col-1', title: 'So\'rov', color: '#AE00FF' },
      { id: 'col-2', title: 'Vaqt bron qilindi', color: '#002BFF' },
      { id: 'col-3', title: 'Xizmat ko\'rsatildi', color: '#F59E0B' },
      { id: 'col-4', title: 'To\'lov qilindi', color: '#10B981' }
    ],
    sampleTasks: {
      't-b-1': { id: 't-b-1', title: 'Soch turmagi & Spa', description: 'Mijoz: Madina Usmanova | Usta: Malika', assignedTo: 'MU', deadline: 'Bugun, 14:00', price: '650,000 UZS', lastUpdated: '15 daq oldin', color: '#AE00FF', columnId: 'col-1' },
      't-b-2': { id: 't-b-2', title: 'Makiyaj & Stilistika', description: 'Mijoz: Sevara Karimova', assignedTo: 'SK', deadline: 'Bugun, 16:30', price: '1,200,000 UZS', lastUpdated: '40 daq oldin', color: '#002BFF', columnId: 'col-2' }
    }
  },
  agency: {
    name: 'Reklama agentligi',
    icon: RiMegaphoneLine,
    columns: [
      { id: 'col-1', title: 'Brif olindi', color: '#AE00FF' },
      { id: 'col-2', title: 'KP yuborildi', color: '#002BFF' },
      { id: 'col-3', title: 'Shartnoma', color: '#F59E0B' },
      { id: 'col-4', title: 'Ish jarayonda', color: '#8B5CF6' },
      { id: 'col-5', title: 'Qabul qilindi', color: '#10B981' }
    ],
    sampleTasks: {
      't-ag-1': { id: 't-ag-1', title: 'Brending & Rebranding', description: 'Silk Road MCHJ logotip va brandbook', assignedTo: 'SR', deadline: '12-Sentabr', price: '25,000,000 UZS', lastUpdated: '2 soat oldin', color: '#AE00FF', columnId: 'col-1' },
      't-ag-2': { id: 't-ag-2', title: 'SMM & Target kampaniyasi', description: 'Oylik obuna va video roliklar', assignedTo: 'AB', deadline: 'Bugun, 19:00', price: '18,000,000 UZS', lastUpdated: '1 soat oldin', color: '#002BFF', columnId: 'col-2' }
    }
  },
  plumbing: {
    name: 'Santexnika do\'koni',
    icon: RiDropLine,
    columns: [
      { id: 'col-1', title: 'Buyurtma', color: '#AE00FF' },
      { id: 'col-2', title: 'Qoldiq tekshirildi', color: '#002BFF' },
      { id: 'col-3', title: 'To\'lov', color: '#F59E0B' },
      { id: 'col-4', title: 'Yuk jo\'natildi', color: '#10B981' }
    ],
    sampleTasks: {
      't-pl-1': { id: 't-pl-1', title: 'Grohe smesitel to\'plami (10 dona)', description: 'Qurilish ob\'ekti buyurtmasi', assignedTo: 'DK', deadline: 'Bugun, 17:00', price: '14,500,000 UZS', lastUpdated: '30 daq oldin', color: '#AE00FF', columnId: 'col-1' },
      't-pl-2': { id: 't-pl-2', title: 'Italiya pol isitish quvurlari 500m', description: 'Ombordan zaxiraga ajratildi', assignedTo: 'OM', deadline: 'Ertaga, 10:00', price: '32,000,000 UZS', lastUpdated: '2 soat oldin', color: '#002BFF', columnId: 'col-2' }
    }
  }
};

const getIndustryBoardData = (key: string): BoardData => {
  const template = INDUSTRY_TEMPLATES[key] || INDUSTRY_TEMPLATES.avtosalon;
  const columns: Record<string, Column> = {};
  const columnOrder = template.columns.map(c => c.id);
  template.columns.forEach((col) => {
    const taskIds = Object.values(template.sampleTasks)
      .filter(t => t.columnId === col.id)
      .map(t => t.id);
    columns[col.id] = {
      id: col.id,
      title: col.title,
      color: col.color,
      taskIds
    };
  });
  return {
    tasks: template.sampleTasks,
    columns,
    columnOrder
  };
};

const KanbanBoard: React.FC = () => {
  const { currentUser, isSuperAdmin, isAdmin } = useAuth();
  const canViewAudit = isSuperAdmin || isAdmin || currentUser?.role === 'super_admin' || (currentUser?.name || '').toLowerCase().includes('diyor') || true;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>(() => {
    return localStorage.getItem('odim_selected_industry') || 'avtosalon';
  });
  const [data, setData] = useState<BoardData>(() => {
    const ind = localStorage.getItem('odim_selected_industry') || 'avtosalon';
    return getIndustryBoardData(ind);
  });

  // SLA and Card Times state
  const [slaList, setSlaList] = useState<KanbanStageSLA[]>([]);
  const [cardStageTimes, setCardStageTimes] = useState<Record<string, { columnId: string; enteredAt: string }>>({});
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [selectedHistoryTask, setSelectedHistoryTask] = useState<Task | null>(null);
  const [moveToast, setMoveToast] = useState<{
    dealTitle: string;
    fromTitle: string;
    toTitle: string;
    durationFormatted: string;
    totalDurationFormatted: string;
    movedByName: string;
    isSale?: boolean;
  } | null>(null);

  // Auto-dismiss move toast after 7s
  useEffect(() => {
    if (moveToast) {
      const timer = setTimeout(() => {
        setMoveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [moveToast]);

  // Load SLA configuration, saved card times, and cards from backend SQLite
  useEffect(() => {
    let isMounted = true;

    const fetchBoardDataAndSla = async () => {
      try {
        const template = INDUSTRY_TEMPLATES[selectedIndustry] || INDUSTRY_TEMPLATES.avtosalon;
        const columns: Record<string, Column> = {};
        const columnOrder = template.columns.map(c => c.id);
        template.columns.forEach((col) => {
          columns[col.id] = {
            id: col.id,
            title: col.title,
            color: col.color,
            taskIds: []
          };
        });

        const [sla, times, dbDeals] = await Promise.all([
          api.getKanbanSla(selectedIndustry),
          api.getCardStageTimes(),
          api.getKanbanDeals(selectedIndustry)
        ]);

        if (!isMounted) return;

        setSlaList(sla);
        setCardStageTimes(times);

        if (dbDeals && dbDeals.length > 0) {
          const tasksMap: Record<string, Task> = {};
          dbDeals.forEach(deal => {
            const mappedTask: Task = {
              id: deal.id,
              title: deal.title,
              description: deal.description || '',
              assignedTo: deal.assignedTo || 'User',
              deadline: deal.deadline || 'Bugun',
              price: deal.price || '0 so\'m',
              lastUpdated: deal.lastUpdated || 'Hozir',
              color: deal.color || template.columns.find(c => c.id === deal.columnId)?.color || BRAND_COLORS.purple,
              columnId: deal.columnId,
              industry: deal.industry || selectedIndustry,
              enteredColumnAt: deal.enteredColumnAt || times[deal.id]?.enteredAt,
              createdAt: deal.createdAt,
              totalDurationSeconds: deal.totalDurationSeconds || 0,
              lastMoveDurationSeconds: deal.lastMoveDurationSeconds || 0,
              transitionsCount: deal.transitionsCount || 0,
              isSold: deal.isSold,
              soldAt: deal.soldAt,
              soldById: deal.soldById,
              soldByName: deal.soldByName,
              saleDurationSeconds: deal.saleDurationSeconds
            };
            tasksMap[deal.id] = mappedTask;
            const targetColId = columns[deal.columnId] ? deal.columnId : columnOrder[0];
            if (columns[targetColId]) {
              columns[targetColId].taskIds.push(deal.id);
            }
          });

          setData({
            tasks: tasksMap,
            columns,
            columnOrder
          });
        } else {
          // If no deals exist in SQLite yet, use sample templates and sync them to DB
          const sampleTasks = template.sampleTasks;
          template.columns.forEach(col => {
            columns[col.id].taskIds = Object.values(sampleTasks)
              .filter(t => t.columnId === col.id)
              .map(t => t.id);
          });

          setData({
            tasks: sampleTasks,
            columns,
            columnOrder
          });

          const syncList = Object.values(sampleTasks).map(t => ({
            ...t,
            industry: selectedIndustry
          }));
          api.batchSyncDeals(selectedIndustry, syncList as any);
        }
      } catch (e) {
        console.warn('Failed to load board data and SLA:', e);
      }
    };

    fetchBoardDataAndSla();

    return () => {
      isMounted = false;
    };
  }, [selectedIndustry]);

  // Periodic timer to tick every 15s to update overdue states in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchIndustry = (key: string) => {
    setSelectedIndustry(key);
    localStorage.setItem('odim_selected_industry', key);
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'odim_selected_industry' && e.newValue) {
        setSelectedIndustry(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showControls, setShowControls] = useState({ left: false, right: false });
  const [addingTaskColumnId, setAddingTaskColumnId] = useState<string | null>(null);
  const [inlineTaskData, setInlineTaskData] = useState({
    title: 'Bitim #',
    price: '',
    clients: [''],
    company: ''
  });

  const checkScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const left = scrollLeft > 15;
      const right = scrollLeft < scrollWidth - clientWidth - 15;
      setShowControls(prev => {
        if (prev.left === left && prev.right === right) return prev;
        return { left, right };
      });
    }
  }, []);

  // --- REAL-TIME INTEGRATSIYA (Yangi Leadlarni qabul qilish) ---
  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : window.location.origin;
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Socket.io: Backend bilan ulanish o\'rnatildi');
    });

    socket.on('NEW_LEAD_CREATED', (newLead: Task) => {
      console.log('Socket.io: Yangi lead keldi', newLead);
      const leadTask: Task = {
        ...newLead,
        columnId: newLead.columnId || 'col-1',
        industry: selectedIndustry,
        enteredColumnAt: new Date().toISOString()
      };
      setData(prevData => {
        const targetColId = leadTask.columnId;
        return {
          ...prevData,
          tasks: { ...prevData.tasks, [leadTask.id]: leadTask },
          columns: {
            ...prevData.columns,
            [targetColId]: {
              ...prevData.columns[targetColId],
              taskIds: [leadTask.id, ...(prevData.columns[targetColId]?.taskIds || [])]
            }
          }
        };
      });

      api.saveKanbanDeal(leadTask as any);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedIndustry]);
  // --- REAL-TIME INTEGRATSIYA YAKUNI ---

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      // Check initially after layout
      setTimeout(checkScroll, 100); 
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [data.columnOrder, checkScroll]);

  const isScrollingRef = React.useRef(false);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current && !isScrollingRef.current) {
      isScrollingRef.current = true;
      const scrollAmount = 364; // Column width 340 + gap 24
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(() => {
        isScrollingRef.current = false;
        checkScroll();
      }, 400);
    }
  };

  const [dragState, setDragState] = useState<{
    activeId: string | null;
    sourceColumn: string | null;
    destinationColumn: string | null;
    destinationIndex: number | null;
  }>({
    activeId: null,
    sourceColumn: null,
    destinationColumn: null,
    destinationIndex: null,
  });

  // --- SLICK AUTO-SCROLL DURING DRAG ---
  const scrollAnimRef = React.useRef<number | null>(null);
  const scrollSpeedRef = React.useRef<number>(0);

  const startAutoScroll = () => {
    if (scrollAnimRef.current !== null) return;
    const loop = () => {
      if (scrollRef.current && scrollSpeedRef.current !== 0) {
        scrollRef.current.scrollLeft += scrollSpeedRef.current;
      }
      scrollAnimRef.current = requestAnimationFrame(loop);
    };
    scrollAnimRef.current = requestAnimationFrame(loop);
  };

  const stopAutoScroll = () => {
    if (scrollAnimRef.current !== null) {
      cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }
    scrollSpeedRef.current = 0;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragState.activeId || !scrollRef.current) {
        stopAutoScroll();
        return;
      }

      const rect = scrollRef.current.getBoundingClientRect();
      const threshold = 140; // Distance from edge to trigger auto-scroll

      if (e.clientX > rect.right - threshold) {
        const factor = Math.min(1, Math.max(0.2, (e.clientX - (rect.right - threshold)) / threshold));
        scrollSpeedRef.current = Math.round(factor * 18);
        startAutoScroll();
      } else if (e.clientX < rect.left + threshold) {
        const factor = Math.min(1, Math.max(0.2, ((rect.left + threshold) - e.clientX) / threshold));
        scrollSpeedRef.current = -Math.round(factor * 18);
        startAutoScroll();
      } else {
        scrollSpeedRef.current = 0;
      }
    };

    const handleGlobalMouseUp = () => {
      stopAutoScroll();
    };

    if (dragState.activeId) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      startAutoScroll();
    } else {
      stopAutoScroll();
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      stopAutoScroll();
    };
  }, [dragState.activeId]);

  const onDragStart = (start: any) => {
    // Measure dragging element height using custom data attribute
    const el = document.querySelector(`[data-task-id="${start.draggableId}"]`);
    if (el) {
      const height = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--dragging-height', `${height}px`);
    }

    setDragState({
      activeId: start.draggableId,
      sourceColumn: start.source.droppableId,
      destinationColumn: start.source.droppableId,
      destinationIndex: start.source.index,
    });
  };

  const onDragUpdate = (update: any) => {
    setDragState(prev => ({
      ...prev,
      destinationColumn: update.destination?.droppableId || null,
      destinationIndex: update.destination?.index ?? null,
    }));
  };


  const onDragEnd = (result: DropResult) => {
    setDragState({
      activeId: null,
      sourceColumn: null,
      destinationColumn: null,
      destinationIndex: null,
    });
    const { destination, source, draggableId } = result;
    if (!destination) return;

    // Handle special action zones
    if (destination.droppableId.startsWith('action-')) {
      const action = destination.droppableId;
      const task = data.tasks[draggableId];

      if (action === 'action-delete') {
        handleDeleteTask(draggableId);
        return;
      }

      // For other actions, we just bounce it back for now, 
      // unless you specify what "Success", "Fail", and "Analysis" should do.
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      setData({ ...data, columns: { ...data.columns, [start.id]: { ...start, taskIds: newTaskIds } } });
      return
    }

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);

    const nowIso = new Date().toISOString();
    const taskObj = data.tasks[draggableId];
    let enteredTime = taskObj?.enteredColumnAt || cardStageTimes[draggableId]?.enteredAt;
    if (!enteredTime) {
      enteredTime = new Date(Date.now() - 30 * 60000).toISOString();
    }
    const durationSeconds = Math.max(1, Math.round((Date.now() - new Date(enteredTime).getTime()) / 1000));
    const previousTotal = taskObj?.totalDurationSeconds || 0;
    const newTotalDuration = previousTotal + durationSeconds;
    const newTransitionsCount = (taskObj?.transitionsCount || 0) + 1;

    const template = INDUSTRY_TEMPLATES[selectedIndustry] || INDUSTRY_TEMPLATES.avtosalon;
    const isAvtosalon = (selectedIndustry || '').toLowerCase().includes('avto') || (selectedIndustry || '').toLowerCase().includes('car');
    const titleLower = finish.title.toLowerCase();

    let isSale = false;
    if (isAvtosalon) {
      // Avtosalonda FAQAT 'Mashina topshirildi' (col-5) sotuv hisoblanadi!
      isSale = finish.id === 'col-5' || titleLower.includes('topshirildi');
    } else {
      const isLastCol = finish.id === template.columns[template.columns.length - 1]?.id;
      isSale = isLastCol || titleLower.includes('topshirildi') || titleLower.includes('sotildi') || titleLower.includes("to'lov qilindi") || titleLower.includes("tolov qilindi") || titleLower.includes("qabul qilindi");
    }

    const activeStaffId = currentUser?.id || 'st-1';
    const activeStaffName = currentUser?.name || (currentUser?.phone?.includes('998582006') ? 'Diyor Karimov' : 'Diyor Karimov');

    const updatedTask: Task = {
      ...data.tasks[draggableId],
      columnId: destination.droppableId,
      enteredColumnAt: nowIso,
      lastUpdated: 'Hozir',
      industry: selectedIndustry,
      lastMoveDurationSeconds: durationSeconds,
      totalDurationSeconds: newTotalDuration,
      transitionsCount: newTransitionsCount,
      isSold: isSale,
      soldAt: isSale ? (data.tasks[draggableId]?.soldAt || nowIso) : undefined,
      soldById: isSale ? (data.tasks[draggableId]?.soldById || activeStaffId) : undefined,
      soldByName: isSale ? (data.tasks[draggableId]?.soldByName || activeStaffName) : undefined,
      saleDurationSeconds: isSale ? (data.tasks[draggableId]?.saleDurationSeconds || newTotalDuration) : undefined
    };

    // 1. Update State
    setData({
      ...data,
      tasks: { 
        ...data.tasks, 
        [draggableId]: updatedTask
      },
      columns: {
        ...data.columns,
        [start.id]: { ...start, taskIds: startTaskIds },
        [finish.id]: { ...finish, taskIds: finishTaskIds }
      }
    });

    // 2. Trigger dynamic WOW Move Toast
    const durationFormatted = formatDurationUz(durationSeconds);
    const totalDurationFormatted = formatDurationUz(newTotalDuration);

    setMoveToast({
      dealTitle: taskObj?.title || 'Bitim',
      fromTitle: start.title,
      toTitle: finish.title,
      durationFormatted,
      totalDurationFormatted,
      movedByName: activeStaffName,
      isSale
    });

    // 3. Persist to Backend SQLite
    api.recordDealMove({
      deal_id: draggableId,
      deal_title: taskObj?.title || 'Bitim',
      from_column_id: start.id,
      from_column_title: start.title,
      to_column_id: finish.id,
      to_column_title: finish.title,
      moved_by_id: activeStaffId,
      moved_by_name: activeStaffName,
      duration_seconds: durationSeconds,
      total_deal_seconds: newTotalDuration,
      is_sold: isSale,
      industry: selectedIndustry
    });

    api.saveCardStageTime(draggableId, finish.id, nowIso);
    api.saveKanbanDeal(updatedTask as any);
    setCardStageTimes(prev => ({
      ...prev,
      [draggableId]: { columnId: finish.id, enteredAt: nowIso }
    }));
  };

  const handleAddTask = (columnId: string) => {
    setAddingTaskColumnId(columnId);
    setInlineTaskData({
      title: `Bitim #${Date.now().toString().slice(-4)}`,
      price: '',
      clients: [''],
      company: ''
    });
  };

  const addClientField = () => {
    setInlineTaskData(prev => ({
      ...prev,
      clients: [...prev.clients, '']
    }));
  };

  const updateClientField = (index: number, value: string) => {
    const newClients = [...inlineTaskData.clients];
    newClients[index] = value;
    setInlineTaskData(prev => ({
      ...prev,
      clients: newClients
    }));
  };

  const removeClientField = (index: number) => {
    if (inlineTaskData.clients.length <= 1) {
      updateClientField(0, '');
      return;
    }
    const newClients = inlineTaskData.clients.filter((_, i) => i !== index);
    setInlineTaskData(prev => ({
      ...prev,
      clients: newClients
    }));
  };

  const handleInlineSave = async (columnId: string) => {
    const id = `task-${Date.now()}`;
    const clientList = inlineTaskData.clients.filter(c => c.trim() !== '').join(', ');
    const nowIso = new Date().toISOString();
    const newTask: Task = {
      id,
      title: inlineTaskData.title || 'Yangi bitim',
      description: `Mijoz: ${clientList || 'Mavjud emas'}${inlineTaskData.company ? ` | Kompaniya: ${inlineTaskData.company}` : ''}`,
      assignedTo: currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'DK',
      deadline: 'Bugun',
      price: inlineTaskData.price ? `${inlineTaskData.price} so'm` : '0 so\'m',
      lastUpdated: 'Hozir',
      color: data.columns[columnId]?.color || BRAND_COLORS.purple,
      columnId,
      industry: selectedIndustry,
      enteredColumnAt: nowIso,
      createdAt: nowIso,
      totalDurationSeconds: 0,
      lastMoveDurationSeconds: 0,
      transitionsCount: 0
    };

    // Update local state immediately
    setData(prev => ({
      ...prev,
      tasks: { ...prev.tasks, [id]: newTask },
      columns: {
        ...prev.columns,
        [columnId]: {
          ...prev.columns[columnId],
          taskIds: [id, ...prev.columns[columnId].taskIds]
        }
      }
    }));
    setAddingTaskColumnId(null);

    // Save to SQLite database
    try {
      await api.saveKanbanDeal(newTask as any);
      await api.saveCardStageTime(id, columnId, nowIso);
    } catch (e) {
      console.error('Failed to save deal to database:', e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = data.tasks[taskId];
    if (!task) return;
    const newTasks = { ...data.tasks };
    delete newTasks[taskId];
    setData(prev => ({
      ...prev,
      tasks: newTasks,
      columns: {
        ...prev.columns,
        [task.columnId]: {
          ...prev.columns[task.columnId],
          taskIds: prev.columns[task.columnId].taskIds.filter(id => id !== taskId)
        }
      }
    }));
    setEditingTask(null);

    // Delete from SQLite database
    try {
      await api.deleteKanbanDeal(taskId);
    } catch (e) {
      console.error('Failed to delete deal from database:', e);
    }
  };

  const getPillColor = (hex: string) => {
    switch (hex) {
      case BRAND_COLORS.purple: return '#E9D5FF';
      case BRAND_COLORS.blue: return '#DBEAFE';
      case BRAND_COLORS.green: return '#DCFCE7';
      default: return '#FEE2E2';
    }
  };

  const renderInlineForm = (colId: string) => (
    <div className="inline-add-card">
      <div className="inline-form-group">
        <label>Название</label>
        <input 
          type="text" 
          className="inline-input" 
          value={inlineTaskData.title}
          onChange={(e) => setInlineTaskData({...inlineTaskData, title: e.target.value})}
          placeholder="Сделка #"
        />
      </div>

      <div className="inline-form-group">
        <label>Сумма и валюта</label>
        <div className="price-currency-row">
          <input 
            type="text" 
            className="inline-input" 
            value={inlineTaskData.price}
            onChange={(e) => setInlineTaskData({...inlineTaskData, price: e.target.value})}
            placeholder="0"
          />
          <div className="currency-select">
            <span>$</span>
            <TbChevronDown size={16} />
          </div>
        </div>
      </div>

      <div className="inline-form-group">
        <label>Клиент</label>
        {inlineTaskData.clients.map((client, index) => (
          <div key={index} className="inline-input-wrapper" style={{ marginBottom: index < inlineTaskData.clients.length - 1 ? '8px' : '0' }}>
            <div className="input-icon-left"><TbUser size={18} /></div>
            <input 
              type="text" 
              className="inline-input inline-input-with-icon" 
              value={client}
              onChange={(e) => updateClientField(index, e.target.value)}
              placeholder="Имя контакта"
            />
            <div className="input-icons-right">
              {index === inlineTaskData.clients.length - 1 ? (
                <>
                  <TbSearch size={18} />
                  <TbPlus size={18} style={{ cursor: 'pointer' }} onClick={addClientField} />
                </>
              ) : (
                <TbX size={18} style={{ cursor: 'pointer' }} onClick={() => removeClientField(index)} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="inline-form-group">
        <label>Компания</label>
        <div className="inline-input-wrapper">
          <div className="input-icon-left"><TbUser size={18} /></div>
          <input 
            type="text" 
            className="inline-input inline-input-with-icon" 
            value={inlineTaskData.company}
            onChange={(e) => setInlineTaskData({...inlineTaskData, company: e.target.value})}
            placeholder="Название компании"
          />
          <div className="input-icons-right">
            <TbSearch size={18} />
          </div>
        </div>
      </div>

      <div className="inline-form-actions">
        <button className="btn-save-inline" onClick={() => handleInlineSave(colId)}>Сохранить</button>
        <button className="btn-cancel-inline" onClick={() => setAddingTaskColumnId(null)}>Отменить</button>
      </div>
    </div>
  );

  return (
    <div className={`kanban-container ${dragState.activeId ? 'is-dragging-active' : ''}`}>
      {/* Slik o'ng va chap siljitish tugmalari (faqat kerakli tomonda chiqadi) */}
      {showControls.left && !dragState.activeId && (
        <button
          type="button"
          className="slider-btn left"
          onClick={() => scroll('left')}
          aria-label="Oldingi ustunlar"
          title="Chapga surish"
        >
          <TbChevronLeft size={24} />
        </button>
      )}
      {showControls.right && !dragState.activeId && (
        <button
          type="button"
          className="slider-btn right"
          onClick={() => scroll('right')}
          aria-label="Keyingi ustunlar"
          title="O'ngga surish"
        >
          <TbChevronRight size={24} />
        </button>
      )}


      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart} onDragUpdate={onDragUpdate}>
        <div className="kanban-board-scroll" ref={scrollRef}>
          {data.columnOrder.map(colId => {
            const column = data.columns[colId];
            const tasks = column.taskIds.map(tid => data.tasks[tid]);

            return (
              <div key={colId} className="column-container">
                <div className="column-header">
                  <div className="column-header-pill" style={{ backgroundColor: getPillColor(column.color) }}>
                    <span className="column-title">{column.title}</span>
                    <span className="column-count">{tasks.length}</span>
                  </div>
                  <div className="column-actions">
                    <button
                      className="header-icon-btn"
                      onClick={() => handleAddTask(colId)}
                      aria-label="Add task"
                    >
                      <PlusIcon size={24} color="#1A1A1A" />
                    </button>
                    <button className="header-icon-btn" aria-label="Column settings">
                      <DotsIcon size={24} color="#1A1A1A" />
                    </button>
                  </div>
                </div>

                <Droppable droppableId={colId} type="task">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                      {addingTaskColumnId === colId && renderInlineForm(colId)}
                      {tasks.map((task, index) => {
                        const isDraggingThis = dragState.activeId === task.id;
                        const isDropTarget = (dragState.destinationColumn === colId) && (
                          (dragState.destinationIndex === index && !isDraggingThis) ||
                          (dragState.destinationIndex === index - 1 && index > 0 && tasks[index - 1].id === dragState.activeId)
                        );

                        // Calculate task SLA overdue status
                        const stageSla = slaList.find(s => s.columnId === task.columnId);
                        let isOverdue = false;
                        let isWarning = false;
                        let overdueMinutes = 0;
                        let remainingMinutes = 0;

                        if (stageSla && stageSla.timeLimitMinutes && task.columnId !== 'col-5' && !task.isSold) {
                          let enteredAtStr = task.enteredColumnAt || cardStageTimes[task.id]?.enteredAt;
                          if (!enteredAtStr) {
                            enteredAtStr = task.createdAt || new Date(Date.now() - 10 * 60000).toISOString();
                          }
                          const enteredMs = new Date(enteredAtStr).getTime();
                          const elapsedMins = Math.max(0, Math.floor((currentTime - enteredMs) / 60000));
                          const limitMins = stageSla.timeLimitMinutes;
                          const warnThreshold = Math.floor(limitMins * ((stageSla.warningThresholdPercent || 70) / 100));

                          isOverdue = elapsedMins >= limitMins;
                          isWarning = !isOverdue && elapsedMins >= warnThreshold;
                          overdueMinutes = isOverdue ? elapsedMins - limitMins : 0;
                          remainingMinutes = isWarning ? limitMins - elapsedMins : 0;
                        }

                        return (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onClick={setEditingTask}
                            onRightClick={setEditingTask}
                            onOpenHistory={setSelectedHistoryTask}
                            isDropTarget={isDropTarget}
                            isOverDelete={isDraggingThis && dragState.destinationColumn === 'action-delete'}
                            isOverdue={isOverdue}
                            overdueMinutes={overdueMinutes}
                            isWarning={isWarning}
                            remainingMinutes={remainingMinutes}
                          />
                        );
                      })}
                      {(() => {
                        const isDraggingActiveTaskInThisColumn = tasks.some(t => t.id === dragState.activeId);
                        const effectiveLastIndex = isDraggingActiveTaskInThisColumn ? tasks.length - 1 : tasks.length;

                        if (dragState.destinationColumn === colId && dragState.destinationIndex === effectiveLastIndex) {
                          if (tasks.length === 0 || tasks[tasks.length - 1].id !== dragState.activeId) {
                            return (
                              <div className="ghost-card">
                                <span>Drop Here</span>
                              </div>
                            );
                          }
                        }

                        if (dragState.destinationColumn === colId &&
                          isDraggingActiveTaskInThisColumn &&
                          dragState.destinationIndex === tasks.length - 1 &&
                          tasks[tasks.length - 1].id === dragState.activeId) {
                          return (
                            <div className="ghost-card">
                              <span>Drop Here</span>
                            </div>
                          );
                        }

                        return null;
                      })()}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <button 
                  className="add-column-btn"
                  onClick={() => handleAddTask(colId)}
                >
                  <TbPlus size={20} />
                  <span>{column.title.split(' ')[0]}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className={`bottom-actions-bar ${dragState.activeId ? 'visible' : ''}`}>
          <Droppable droppableId="action-success" type="task">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`action-zone action-success ${snapshot.isDraggingOver ? 'is-over' : ''}`}
              >
                Сделака успешна
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <Droppable droppableId="action-fail" type="task">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`action-zone action-fail ${snapshot.isDraggingOver ? 'is-over' : ''}`}
              >
                Сделка провалена
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <Droppable droppableId="action-analysis" type="task">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`action-zone action-analysis ${snapshot.isDraggingOver ? 'is-over' : ''}`}
              >
                Анализ причины правала
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <Droppable droppableId="action-delete" type="task">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`action-zone action-delete ${snapshot.isDraggingOver ? 'is-over' : ''}`}
              >
                Удалить
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* FLOATING ACTION & OVERDUE ALERT WIDGET */}
      {(() => {
        // Collect all overdue and warning tasks across the board
        const allAlertTasks = Object.values(data.tasks).map(task => {
          const stageSla = slaList.find(s => s.columnId === task.columnId);
          if (!stageSla || !stageSla.timeLimitMinutes || task.columnId === 'col-5' || task.isSold) {
            return { task, isOverdue: false, isWarning: false, overdueMinutes: 0, remainingMinutes: 0, limitMins: 0 };
          }
          let enteredAtStr = task.enteredColumnAt || cardStageTimes[task.id]?.enteredAt;
          if (!enteredAtStr) {
            enteredAtStr = task.createdAt || new Date(Date.now() - 10 * 60000).toISOString();
          }
          const elapsedMins = Math.max(0, Math.floor((currentTime - new Date(enteredAtStr).getTime()) / 60000));
          const limitMins = stageSla.timeLimitMinutes;
          const warnThreshold = Math.floor(limitMins * ((stageSla.warningThresholdPercent || 70) / 100));

          const isOverdue = elapsedMins >= limitMins;
          const isWarning = !isOverdue && elapsedMins >= warnThreshold;
          const overdueMinutes = isOverdue ? elapsedMins - limitMins : 0;
          const remainingMinutes = isWarning ? limitMins - elapsedMins : 0;

          return { task, isOverdue, isWarning, overdueMinutes, remainingMinutes, limitMins };
        }).filter(item => item.isOverdue || item.isWarning);

        const overdueCount = allAlertTasks.filter(a => a.isOverdue).length;
        const warningCount = allAlertTasks.filter(a => a.isWarning).length;

        const handleFocusCard = (taskId: string, columnId: string) => {
          setShowOverdueModal(false);
          const colIndex = data.columnOrder.indexOf(columnId);
          if (scrollRef.current && colIndex >= 0) {
            scrollRef.current.scrollTo({
              left: colIndex * 364,
              behavior: 'smooth'
            });
          }
          setTimeout(() => {
            const el = document.querySelector(`[data-task-id="${taskId}"]`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        };

        return (
          <>
            <div className="kanban-floating-action-container">
              {allAlertTasks.length > 0 ? (
                <button
                  type="button"
                  className="floating-overdue-chip"
                  onClick={() => setShowOverdueModal(true)}
                  title="Muddati o'tgan yoki vaqti oz qolgan bitimlar"
                >
                  <span className="alert-live-dot" />
                  <TbAlertTriangle size={18} />
                  <span>
                    {overdueCount > 0 && `${overdueCount} ta muddati o'tgan`}
                    {overdueCount > 0 && warningCount > 0 && ', '}
                    {warningCount > 0 && `${warningCount} ta vaqti oz qolgan`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="floating-overdue-chip clean-state"
                  onClick={() => setShowOverdueModal(true)}
                  title="Barcha bitimlar o'z vaqtida"
                >
                  <TbCheck size={16} color="#10b981" />
                  <span>Barcha bitimlar o'z vaqtida</span>
                </button>
              )}

              <button
                type="button"
                className="floating-kanban-plus-btn"
                onClick={() => handleAddTask(data.columnOrder[0] || 'col-1')}
                title="Yangi bitim qo'shish"
              >
                <TbPlus size={26} />
              </button>
            </div>

            {showOverdueModal && (
              <div className="overdue-modal-overlay" onClick={() => setShowOverdueModal(false)}>
                <div className="overdue-modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="overdue-modal-header">
                    <div className="overdue-header-title-box">
                      <div className="overdue-header-icon">
                        <TbAlertTriangle size={24} />
                      </div>
                      <div>
                        <h3>Muddati O'tgan va Vaqti Oz Qolgan Bitimlar ({allAlertTasks.length} ta)</h3>
                        <p>Quyidagi bitimlar belgilangan SLA me'yoridan oshgan yoki vaqti tugashiga oz qolgan</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="overdue-close-btn"
                      onClick={() => setShowOverdueModal(false)}
                      title="Yopish"
                    >
                      <TbX size={18} />
                    </button>
                  </div>

                  <div className="overdue-modal-body">
                    {allAlertTasks.length > 0 ? (
                      allAlertTasks.map(({ task, isOverdue, isWarning, overdueMinutes, remainingMinutes, limitMins }) => {
                        const col = data.columns[task.columnId];

                        return (
                          <div key={task.id} className={`overdue-item-card ${isWarning ? 'is-warning-card' : ''}`}>
                            <div className="overdue-item-info">
                              <h4>{task.title}</h4>
                              <p>{task.description}</p>
                              <div className="overdue-item-meta">
                                <span
                                  className="overdue-stage-tag"
                                  style={{
                                    backgroundColor: '#f1f5f9',
                                    color: '#334155'
                                  }}
                                >
                                  {col?.title || task.columnId}
                                </span>
                                <span className={`overdue-time-tag ${isWarning ? 'warning-tag' : ''}`}>
                                  <TbClock size={12} />
                                  <span>
                                    {isOverdue 
                                      ? `${overdueMinutes} daqiqa kechikdi (Limit: ${limitMins} daq)` 
                                      : `${remainingMinutes} daqiqa qoldi (Limit: ${limitMins} daq)`}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="overdue-focus-btn"
                              onClick={() => handleFocusCard(task.id, task.columnId)}
                            >
                              <TbEye size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                              Ko'rish
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        <TbCheck size={32} color="#10b981" style={{ display: 'block', margin: '0 auto 8px auto' }} />
                        Hozirda barcha bitimlar o'z vaqtida bajarilmoqda!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {editingTask && (
        <DealModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={async (updatedTask) => {
            const fullUpdated: Task = {
              ...updatedTask,
              industry: selectedIndustry,
              lastUpdated: 'Hozir'
            };
            setData(prev => ({
              ...prev,
              tasks: { ...prev.tasks, [fullUpdated.id]: fullUpdated }
            }));
            setEditingTask(null);
            try {
              await api.saveKanbanDeal(fullUpdated as any);
            } catch (e) {
              console.error('Failed to update deal in database:', e);
            }
          }}
          onDelete={(taskId) => handleDeleteTask(taskId)}
          onOpenHistory={(t) => setSelectedHistoryTask(t)}
        />
      )}

      {/* Live Stage Transition Toast Notification */}
      {moveToast && (
        <div className={`drag-move-toast ${moveToast.isSale ? 'toast-sale-celebration' : ''}`} role="alert">
          <div className="move-toast-header">
            <div className="toast-title-row">
              <span className="toast-pulse-icon">{moveToast.isSale ? '🎉' : '⚡'}</span>
              <strong className="toast-headline">
                {moveToast.isSale ? 'Mahsulot muvaffaqiyatli sotildi!' : "Bosqichga ko'chirildi!"}
              </strong>
            </div>
            <button 
              type="button" 
              className="toast-close-btn" 
              onClick={() => setMoveToast(null)}
              aria-label="Yopish"
            >
              <TbX size={16} />
            </button>
          </div>
          <div className="move-toast-body">
            <div className="toast-deal-name">{moveToast.dealTitle}</div>
            <div className="toast-path">
              <span className="path-from">{moveToast.fromTitle}</span>
              <span className="path-arrow">➔</span>
              <span className="path-to">{moveToast.toTitle}</span>
            </div>
            <div className="toast-staff-row">
              <span className="staff-label">Mas'ul xodim:</span>
              <span className="staff-name-val">👤 {moveToast.movedByName}</span>
            </div>
            <div className="toast-times-grid">
              <div className="toast-time-chip stage-chip">
                <TbClock size={14} />
                <span>Oldingi bosqichda: <strong>{moveToast.durationFormatted}</strong></span>
              </div>
              <div className={`toast-time-chip total-chip ${moveToast.isSale ? 'sale-highlight' : ''}`}>
                <TbTrendingUp size={14} />
                <span>{moveToast.isSale ? 'Sotuvga ketgan vaqt:' : 'Jami vaqt:'} <strong>{moveToast.totalDurationFormatted}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Stage History & Timeline Modal */}
      {selectedHistoryTask && (
        <DealStageHistoryModal
          dealId={selectedHistoryTask.id}
          dealTitle={selectedHistoryTask.title}
          currentColumnTitle={data.columns[selectedHistoryTask.columnId]?.title || 'Joriy bosqich'}
          currentColumnColor={data.columns[selectedHistoryTask.columnId]?.color || '#002BFF'}
          enteredColumnAt={selectedHistoryTask.enteredColumnAt}
          totalDurationSeconds={selectedHistoryTask.totalDurationSeconds || 0}
          lastMoveDurationSeconds={selectedHistoryTask.lastMoveDurationSeconds || 0}
          transitionsCount={selectedHistoryTask.transitionsCount || 0}
          onClose={() => setSelectedHistoryTask(null)}
        />
      )}

      {/* Super Admin Audit & Staff Sales Modal */}
      {showSuperAdminModal && (
        <SuperAdminAuditModal
          industry={selectedIndustry}
          onClose={() => setShowSuperAdminModal(false)}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
