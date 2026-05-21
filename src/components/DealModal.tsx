import React, { useState } from 'react';
import { 
  FiX, FiEdit2, FiChevronDown, FiSettings, FiPlus, 
  FiMoreHorizontal, FiBell, FiSearch, FiUser, FiBriefcase,
  FiCalendar, FiDollarSign, FiLink, FiEye
} from 'react-icons/fi';
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
}

interface DealModalProps {
  task: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const DealModal: React.FC<DealModalProps> = ({ task, onClose, onSave, onDelete }) => {
  const [activeTab, setActiveTab] = useState('Сделки');
  const [activityTab, setActivityTab] = useState('Сделки');
  const [editedTask, setEditedTask] = useState<Task>(task);

  const navTabs = ['Сделки', 'Товары', 'Предложение', 'Работы', 'Счета'];

  return (
    <div className="deal-modal-overlay" onClick={onClose}>
      <div className="deal-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="deal-modal-header">
          <div className="header-left">
            <h2 className="deal-brand">Deal 1951</h2>
            <button className="icon-btn edit-title-btn"><FiEdit2 size={14} /></button>
            <div className="status-badge">
              <span className="status-dot" style={{ backgroundColor: editedTask.color }}></span>
              <span>Новая</span>
              <FiChevronDown size={14} />
            </div>
          </div>
          <div className="header-right">
            <div className="dropdown-btn">Документ <FiChevronDown size={14} /></div>
            <div className="dropdown-btn">Предложение <FiChevronDown size={14} /></div>
            <button className="text-btn cancel-btn" onClick={onClose}>Отменить</button>
            <button className="save-btn" onClick={() => onSave(editedTask)}>Сохранить</button>
            <button className="icon-btn-rounded settings-btn"><FiSettings size={18} /></button>
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
        <div className={`deal-modal-body ${activeTab !== 'Сделки' ? 'full-width' : ''}`}>
          {activeTab === 'Сделки' ? (
            <>
              {/* Left Panel: CRM Data */}
              <div className="crm-data-panel">
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
                        <input type="text" defaultValue={editedTask.title} />
                        <FiSettings className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Стадия</label>
                      <div className="crm-input-wrapper">
                        <div className="crm-select-styled">Новая <FiChevronDown /></div>
                        <FiSettings className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Дата завершения</label>
                      <div className="crm-input-wrapper">
                        <input type="text" defaultValue="08.05.2027" />
                        <FiCalendar className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Сумма и валюта</label>
                      <div className="crm-input-wrapper price-input">
                        <input type="text" defaultValue={editedTask.price} />
                        <div className="currency-selector">
                          $ <FiChevronDown />
                        </div>
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Клиент</label>
                      <div className="crm-input-wrapper contact-field">
                        <FiUser className="contact-avatar-icon" />
                        <input type="text" placeholder="Имя контакта" />
                        <FiSearch className="field-action-icon" />
                        <FiPlus className="field-action-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Компания</label>
                      <div className="crm-input-wrapper contact-field">
                        <FiBriefcase className="contact-avatar-icon" />
                        <input type="text" placeholder="Название компании" />
                        <FiSearch className="field-action-icon" />
                      </div>
                      <FiSettings className="field-icon-float" />
                    </div>

                    <div className="crm-checkbox-field">
                      <input type="checkbox" id="public-access" />
                      <label htmlFor="public-access">Доступно для всех</label>
                    </div>

                    <div className="crm-field">
                      <label>Ответственный</label>
                      <div className="crm-input-wrapper contact-field">
                        <div className="user-avatar-small">DK</div>
                        <span className="user-email">dildora93aziz@gmail.com</span>
                        <FiX className="field-action-icon" />
                      </div>
                      <FiSettings className="field-icon-float" />
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
                        <div className="crm-select-styled">Продажа <FiChevronDown /></div>
                        <FiSettings className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Источник</label>
                      <div className="crm-input-wrapper">
                        <div className="crm-select-styled">Новая <FiChevronDown /></div>
                        <FiSettings className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Дополнительно об источнике</label>
                      <div className="crm-input-wrapper">
                        <textarea rows={3}></textarea>
                        <FiSettings className="field-icon" />
                      </div>
                    </div>

                    <div className="crm-field">
                      <label>Дата завершения</label>
                      <div className="crm-input-wrapper">
                        <input type="text" defaultValue="08.05.2027" />
                        <FiCalendar className="field-icon" />
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
                        <FiSettings className="field-icon" />
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
                        <FiPlus /> Добавить
                      </button>
                      <FiSettings className="field-icon-float" />
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
                      <FiCalendar className="control-icon" />
                      <div className="action-picker">
                        Действие <FiChevronDown size={14} />
                      </div>
                    </div>
                    <div className="feed-form-btns">
                      <button className="feed-save-btn">Сохранить</button>
                      <button className="feed-cancel-btn">Отменить</button>
                    </div>
                  </div>
                </div>

                <div className="feed-placeholder-card">
                  <div className="placeholder-icon-circle"><FiPlus /></div>
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
                      <FiMoreHorizontal className="feed-more-icon" />
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
                  <div className="col-settings"><FiSettings /></div>
                  <div className="col-title">Товары</div>
                  <div className="col-price">Цена</div>
                  <div className="col-quantity">Количество</div>
                  <div className="col-discount">Скидки</div>
                </div>

                <div className="products-table-row">
                  <div className="col-drag"><FiX style={{ transform: 'rotate(45deg)' }} /></div>
                  <div className="col-index">1.</div>
                  <div className="col-search">
                    <div className="product-search-input">
                      <input type="text" placeholder="Найти или создать товар" />
                      <FiSearch className="search-icon" />
                    </div>
                  </div>
                  <div className="col-price-val">
                    <div className="product-val-input">
                      <input type="text" defaultValue="0 $" />
                      <div className="stepper-arrows">
                        <FiChevronDown className="up" />
                        <FiChevronDown className="down" />
                      </div>
                    </div>
                  </div>
                  <div className="col-quantity-val">
                    <div className="product-val-input">
                      <input type="text" defaultValue="1 шт" />
                      <div className="stepper-arrows">
                        <FiChevronDown className="up" />
                        <FiChevronDown className="down" />
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
          ) : (
            <div className="empty-tab-content">
              <h3>Раздел {activeTab} находится в разработке</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealModal;
