import React, { useState, useEffect } from 'react';
import { api, type TaskItem } from '../api';
import {
  RiCheckboxCircleLine,
  RiCheckboxBlankCircleLine,
  RiCalendarEventLine,
  RiAlarmWarningLine,
  RiTimeLine,
  RiAddLine,
  RiUser3Line,
  RiSearchLine,
  RiFilter3Line,
  RiCloseLine,
  RiCheckLine,
  RiFlagLine,
  RiFileTextLine
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import './TasksView.css';

export default function TasksView() {
  const { hasPermission } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'overdue' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New task form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newDueCategory, setNewDueCategory] = useState<'today' | 'tomorrow' | 'upcoming'>('today');
  const [newManager, setNewManager] = useState('Sardor Qodirov');

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const toggleTask = async (taskId: string) => {
    try {
      const res = await api.toggleTask(taskId);
      setTasks(tasks.map(t => (t.id === taskId ? { ...t, completed: res.completed } : t)));
      setToastMsg(res.completed ? 'Vazifa bajarildi deb belgilandi!' : 'Vazifa qayta ochildi');
      setTimeout(() => setToastMsg(null), 3000);
    } catch {
      setToastMsg('Xatolik: Vazifa holatini o\'zgartirib bo\'lmadi');
    }
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;

    try {
      const res = await api.createTask({
        title: newTitle,
        description: newDesc,
        clientName: newClient || undefined,
        responsibleManager: newManager,
        dueDate: newDueCategory === 'today' ? '2026-09-08 18:00' : '2026-09-09 18:00',
        dueCategory: newDueCategory,
        priority: newPriority,
        completed: false,
      });

      if (res.success) {
        await loadTasks();
        setIsModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewClient('');
        setToastMsg(`Yangi vazifa bazaga qo'shildi: ${newTitle}`);
        setTimeout(() => setToastMsg(null), 3500);
      }
    } catch {
      setToastMsg('Xatolik: Vazifa saqlanmadi');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'overdue'
        ? t.dueCategory === 'overdue' && !t.completed
        : t.dueCategory === activeTab;

    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.clientName && t.clientName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const todayCount = tasks.filter(t => t.dueCategory === 'today' && !t.completed).length;
  const tomorrowCount = tasks.filter(t => t.dueCategory === 'tomorrow' && !t.completed).length;
  const overdueCount = tasks.filter(t => t.dueCategory === 'overdue' && !t.completed).length;

  return (
    <div className="tasks-page-container">
      {toastMsg && (
        <div className="tasks-toast">
          <RiCheckLine size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP BAR */}
      <div className="tasks-top-bar">
        <div className="tasks-tabs">
          <button
            className={`t-tab ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <RiTimeLine size={15} />
            <span>Bugun ({todayCount})</span>
          </button>
          <button
            className={`t-tab ${activeTab === 'tomorrow' ? 'active' : ''}`}
            onClick={() => setActiveTab('tomorrow')}
          >
            <RiCalendarEventLine size={15} />
            <span>Ertaga ({tomorrowCount})</span>
          </button>
          <button
            className={`t-tab overdue ${activeTab === 'overdue' ? 'active' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            <RiAlarmWarningLine size={15} />
            <span>Muddati o'tgan ({overdueCount})</span>
          </button>
          <button
            className={`t-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>Barchasi ({tasks.length})</span>
          </button>
        </div>

        <div className="tasks-actions">
          <div className="tasks-search">
            <RiSearchLine size={16} className="t-search-icon" />
            <input
              type="text"
              placeholder="Vazifalar bo'yicha qidiruv..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {hasPermission('tasks', 'create') && (
            <button className="add-task-btn" onClick={() => setIsModalOpen(true)}>
              <RiAddLine size={18} />
              <span>Yangi vazifa</span>
            </button>
          )}
        </div>
      </div>

      {/* TASKS LIST */}
      <div className="tasks-list-card">
        {filteredTasks.length === 0 ? (
          <div className="tasks-empty-state">
            <RiCheckboxCircleLine size={48} className="empty-icon" />
            <h4>Ushbu bo'limda vazifalar yo'q</h4>
            <p>Barcha vazifalar bajarilgan yoki hali yangi vazifalar belgilanmagan.</p>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div key={t.id} className={`task-item-row ${t.completed ? 'completed' : ''} ${t.dueCategory}`}>
              <button className="task-checkbox-btn" onClick={() => toggleTask(t.id)}>
                {t.completed ? (
                  <RiCheckboxCircleLine size={22} className="check-icon-active" />
                ) : (
                  <RiCheckboxBlankCircleLine size={22} className="check-icon-inactive" />
                )}
              </button>

              <div className="task-main-details">
                <div className="task-title-line">
                  <span className={`task-title ${t.completed ? 'strikethrough' : ''}`}>{t.title}</span>
                  <span className={`task-priority-badge ${t.priority}`}>
                    <RiFlagLine size={12} />
                    {t.priority === 'high' ? 'Yuqori' : t.priority === 'medium' ? 'O\'rta' : 'Past'}
                  </span>
                </div>

                {t.description && <p className="task-desc">{t.description}</p>}

                <div className="task-meta-tags">
                  {t.clientName && (
                    <span className="task-client-tag">
                      <RiUser3Line size={13} />
                      {t.clientName}
                    </span>
                  )}
                  {t.dealName && (
                    <span className="task-deal-tag">
                      <RiFileTextLine size={13} />
                      {t.dealName}
                    </span>
                  )}
                  <span className="task-manager-tag">
                    Mas'ul: <b>{t.responsibleManager}</b>
                  </span>
                  <span className="task-due-date">
                    <RiTimeLine size={13} />
                    {t.dueDate}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* NEW TASK MODAL */}
      {isModalOpen && (
        <div className="tasks-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="tasks-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tm-header">
              <h3>Yangi vazifa yaratish</h3>
              <button className="tm-close" onClick={() => setIsModalOpen(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="tm-body">
              <div className="tm-field">
                <label>Vazifa nomi / Maqsadi *</label>
                <input
                  type="text"
                  placeholder="Masalan: Mijoz bilan shartnomani imzolash"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="tm-field">
                <label>Batafsil tavsif</label>
                <textarea
                  placeholder="Qo'shimcha izohlar, eslatmalar..."
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="tm-field">
                <label>Biriktirilgan mijoz (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Masalan: Otabek Mirzayev (Silk Road Logistics)"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                />
              </div>

              <div className="tm-row">
                <div className="tm-field">
                  <label>Muddati</label>
                  <select
                    value={newDueCategory}
                    onChange={(e) => setNewDueCategory(e.target.value as any)}
                  >
                    <option value="today">Bugun (2026-09-08)</option>
                    <option value="tomorrow">Ertaga (2026-09-09)</option>
                    <option value="upcoming">Keyinroq</option>
                  </select>
                </div>

                <div className="tm-field">
                  <label>Muhimlik darajasi</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                  >
                    <option value="high">Yuqori daraja (High)</option>
                    <option value="medium">O'rta (Medium)</option>
                    <option value="low">Past (Low)</option>
                  </select>
                </div>
              </div>

              <div className="tm-field">
                <label>Mas'ul xodim</label>
                <select
                  value={newManager}
                  onChange={(e) => setNewManager(e.target.value)}
                >
                  <option value="Sardor Qodirov">Sardor Qodirov (Administrator)</option>
                  <option value="Malika Karimova">Malika Karimova (Menejer)</option>
                  <option value="Jasur Aliyev">Jasur Aliyev (Usta / Mutaxassis)</option>
                </select>
              </div>
            </div>

            <div className="tm-footer">
              <button className="tm-btn-cancel" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
              <button className="tm-btn-submit" onClick={handleCreateTask}>Vazifani saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
