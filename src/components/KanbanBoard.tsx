import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import ReactDOM from 'react-dom';
import { FiX, FiChevronLeft, FiChevronRight, FiSearch, FiPlus, FiUser, FiChevronDown } from 'react-icons/fi';
import { io } from 'socket.io-client';
import DealModal from './DealModal';
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

const TaskCard = React.memo(({ task, index, onClick, onRightClick, isDropTarget, isOverDelete }: { task: Task; index: number; onClick: (task: Task) => void; onRightClick: (task: Task) => void; isDropTarget: boolean; isOverDelete?: boolean }) => {
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
              className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${isOverDelete ? 'about-to-delete' : ''}`}
            >
              <div className="task-card-header">
                <h4 className="task-card-title">{task.title}</h4>
                <DotsIcon color="#94A3B8" size={18} />
              </div>
              <p className="task-card-description">{task.description}</p>

              <div className="task-card-tags">
                <div className="tag-deadline">{task.deadline}</div>
                <div className="tag-price" style={{ color: task.color === BRAND_COLORS.blue ? '#002BFF' : task.color, background: `${task.color}15` }}>{task.price}</div>
              </div>

              <div className="task-card-footer">
                <span className="task-card-updated">Updated {task.lastUpdated}</span>
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

const initialData: BoardData = {
  tasks: {
    'task-1': {
      id: 'task-1',
      title: 'Landing page design',
      description: 'Create main hero section and CTA blocks',
      assignedTo: 'DK',
      deadline: 'Today, 15:11',
      price: '0 so\'m',
      lastUpdated: '1h ago',
      color: BRAND_COLORS.purple,
      columnId: 'col-1'
    },
    'task-2': {
      id: 'task-2',
      title: 'Fix navbar spacing',
      description: 'Adjust padding and alignment on desktop',
      assignedTo: 'AZ',
      deadline: 'Today, 16:40',
      price: '0 so\'m',
      lastUpdated: '30m ago',
      color: BRAND_COLORS.purple,
      columnId: 'col-1'
    },
    'task-3': {
      id: 'task-3',
      title: 'CRM dashboard',
      description: 'Build analytics cards and kanban section',
      assignedTo: 'MR',
      deadline: 'Yesterday, 18:20',
      price: '0 so\'m',
      lastUpdated: 'Just now',
      color: BRAND_COLORS.blue,
      columnId: 'col-2'
    },
    'task-4': {
      id: 'task-4',
      title: 'Login page',
      description: 'Check validation and responsive design',
      assignedTo: 'UI',
      deadline: 'Yesterday, 11:05',
      price: '0 so\'m',
      lastUpdated: '5m ago',
      color: BRAND_COLORS.green,
      columnId: 'col-3'
    },
  },
  columns: {
    'col-1': { id: 'col-1', title: 'Main Dashboard', color: BRAND_COLORS.purple, taskIds: ['task-1', 'task-2'] },
    'col-2': { id: 'col-2', title: 'In Progress', color: BRAND_COLORS.blue, taskIds: ['task-3'] },
    'col-3': { id: 'col-3', title: 'Review', color: BRAND_COLORS.green, taskIds: ['task-4'] },
    'col-4': { id: 'col-4', title: 'Done', color: BRAND_COLORS.red, taskIds: [] },
  },
  columnOrder: ['col-1', 'col-2', 'col-3', 'col-4'],
};

const KanbanBoard: React.FC = () => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [data, setData] = useState<BoardData>(initialData);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showControls, setShowControls] = useState({ left: false, right: false });
  const [addingTaskColumnId, setAddingTaskColumnId] = useState<string | null>(null);
  const [inlineTaskData, setInlineTaskData] = useState({
    title: 'Сделка #',
    price: '',
    clients: [''],
    company: ''
  });

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowControls({
        left: scrollLeft > 10,
        right: scrollLeft < scrollWidth - clientWidth - 10
      });
    }
  };

  // --- REAL-TIME INTEGRATSIYA (Yangi Leadlarni qabul qilish) ---
  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      console.log('Socket.io: Backend bilan ulanish o\'rnatildi');
    });

    socket.on('NEW_LEAD_CREATED', (newLead: Task) => {
      console.log('Socket.io: Yangi lead keldi', newLead);
      setData(prevData => {
        // Yangi so'rovlar har doim col-1 (birinchi ustun) ga tushadi deb faraz qilamiz
        const targetColId = 'col-1';
        return {
          ...prevData,
          tasks: { ...prevData.tasks, [newLead.id]: newLead },
          columns: {
            ...prevData.columns,
            [targetColId]: {
              ...prevData.columns[targetColId],
              taskIds: [newLead.id, ...prevData.columns[targetColId].taskIds]
            }
          }
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  // --- REAL-TIME INTEGRATSIYA YAKUNI ---

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      // Check initially after layout
      setTimeout(checkScroll, 100); 
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [data.columnOrder]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 364; // Column width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
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

    setData({
      ...data,
      tasks: { ...data.tasks, [draggableId]: { ...data.tasks[draggableId], columnId: destination.droppableId } },
      columns: {
        ...data.columns,
        [start.id]: { ...start, taskIds: startTaskIds },
        [finish.id]: { ...finish, taskIds: finishTaskIds }
      }
    });
  };

  const handleAddTask = (columnId: string) => {
    setAddingTaskColumnId(columnId);
    setInlineTaskData({
      title: `Сделка #${Date.now().toString().slice(-4)}`,
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

  const handleInlineSave = (columnId: string) => {
    const id = `task-${Date.now()}`;
    const clientList = inlineTaskData.clients.filter(c => c.trim() !== '').join(', ');
    const newTask: Task = {
      id,
      title: inlineTaskData.title || 'New Task',
      description: `Clients: ${clientList || 'None'}${inlineTaskData.company ? ` | Company: ${inlineTaskData.company}` : ''}`,
      assignedTo: 'User',
      deadline: 'Today',
      price: inlineTaskData.price ? `${inlineTaskData.price} so'm` : '0 so\'m',
      lastUpdated: 'Just now',
      color: data.columns[columnId].color,
      columnId,
    };
    setData({
      ...data,
      tasks: { ...data.tasks, [id]: newTask },
      columns: { ...data.columns, [columnId]: { ...data.columns[columnId], taskIds: [id, ...data.columns[columnId].taskIds] } }
    });
    setAddingTaskColumnId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const task = data.tasks[taskId];
    if (!task) return;
    const newTasks = { ...data.tasks };
    delete newTasks[taskId];
    setData({
      ...data,
      tasks: newTasks,
      columns: { ...data.columns, [task.columnId]: { ...data.columns[task.columnId], taskIds: data.columns[task.columnId].taskIds.filter(id => id !== taskId) } }
    });
    setEditingTask(null);
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
            <FiChevronDown size={16} />
          </div>
        </div>
      </div>

      <div className="inline-form-group">
        <label>Клиент</label>
        {inlineTaskData.clients.map((client, index) => (
          <div key={index} className="inline-input-wrapper" style={{ marginBottom: index < inlineTaskData.clients.length - 1 ? '8px' : '0' }}>
            <div className="input-icon-left"><FiUser size={18} /></div>
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
                  <FiSearch size={18} />
                  <FiPlus size={18} style={{ cursor: 'pointer' }} onClick={addClientField} />
                </>
              ) : (
                <FiX size={18} style={{ cursor: 'pointer' }} onClick={() => removeClientField(index)} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="inline-form-group">
        <label>Компания</label>
        <div className="inline-input-wrapper">
          <div className="input-icon-left"><FiUser size={18} /></div>
          <input 
            type="text" 
            className="inline-input inline-input-with-icon" 
            value={inlineTaskData.company}
            onChange={(e) => setInlineTaskData({...inlineTaskData, company: e.target.value})}
            placeholder="Название компании"
          />
          <div className="input-icons-right">
            <FiSearch size={18} />
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
      <div className="drag-overlay" />
      <div className="slider-controls">
        {showControls.left && (
          <button className="slider-btn left" onClick={() => scroll('left')} aria-label="Scroll left">
            <FiChevronLeft size={24} />
          </button>
        )}
        {showControls.right && (
          <button className="slider-btn right" onClick={() => scroll('right')} aria-label="Scroll right">
            <FiChevronRight size={24} />
          </button>
        )}
      </div>

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

                        return (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onClick={setEditingTask}
                            onRightClick={setEditingTask}
                            isDropTarget={isDropTarget}
                            isOverDelete={isDraggingThis && dragState.destinationColumn === 'action-delete'}
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
                  <FiPlus size={20} />
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

      {editingTask && (
        <DealModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(updatedTask) => {
            setData({ ...data, tasks: { ...data.tasks, [updatedTask.id]: updatedTask } });
            setEditingTask(null);
          }}
          onDelete={(taskId) => handleDeleteTask(taskId)}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
