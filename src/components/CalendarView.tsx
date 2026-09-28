import React, { useState, useEffect } from 'react';
import { api, type Booking } from '../api';
import {
  RiCalendarLine,
  RiTimeLine,
  RiUser3Line,
  RiAddLine,
  RiAlertLine,
  RiCheckLine,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiScissors2Line,
  RiCustomerService2Line,
  RiUserStarLine
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import './CalendarView.css';

interface Specialist {
  id: string;
  name: string;
  role: string;
  color: string;
}

const SPECIALISTS: Specialist[] = [
  { id: 'sp-1', name: 'Jasur Aliyev', role: 'Katta usta / Master', color: '#2563eb' },
  { id: 'sp-2', name: 'Madina Rahimova', role: 'Vizajist / Stilist', color: '#ec4899' },
  { id: 'sp-3', name: 'Bobur Usmonov', role: 'Servis muhandisi', color: '#10b981' },
  { id: 'sp-4', name: 'Kamola Karimova', role: 'Maslahatchi / Konsultant', color: '#8b5cf6' },
];

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b-1',
    clientName: 'Aziz Rahimov',
    clientPhone: '+998 90 123 45 67',
    service: 'Erkaklar sochi turmagi',
    specialistId: 'sp-1',
    date: '2026-09-08',
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    price: '150,000 UZS',
  },
  {
    id: 'b-2',
    clientName: 'Nodira Salimova',
    clientPhone: '+998 93 987 65 43',
    service: 'Kechki vizaj',
    specialistId: 'sp-2',
    date: '2026-09-08',
    startTime: '11:00',
    endTime: '12:00',
    status: 'confirmed',
    price: '300,000 UZS',
  },
  {
    id: 'b-3',
    clientName: 'Sardor Qodirov',
    clientPhone: '+998 97 555 44 33',
    service: 'Diagnostika va sozlash',
    specialistId: 'sp-3',
    date: '2026-09-08',
    startTime: '14:00',
    endTime: '15:00',
    status: 'confirmed',
    price: '200,000 UZS',
  },
  {
    id: 'b-4',
    clientName: 'Kamola Karimova',
    clientPhone: '+998 91 222 33 44',
    service: 'Individual konsultatsiya',
    specialistId: 'sp-4',
    date: '2026-09-08',
    startTime: '16:00',
    endTime: '17:00',
    status: 'confirmed',
    price: '250,000 UZS',
  }
];

export default function CalendarView() {
  const { hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-09-08');

  // Load from Python backend
  const loadBookings = async () => {
    try {
      const data = await api.getBookings();
      if (data && data.length > 0) {
        setBookings(data);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // New booking form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [service, setService] = useState('');
  const [specialistId, setSpecialistId] = useState(SPECIALISTS[0].id);
  const [bookingDate, setBookingDate] = useState('2026-09-08');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [price, setPrice] = useState('250,000 UZS');
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check booking conflict (same specialist, same date, overlapping time)
  const checkConflict = (specId: string, bDate: string, sTime: string, eTime: string): boolean => {
    return bookings.some(b => {
      if (b.specialistId !== specId || b.date !== bDate) return false;
      // Simple overlap check
      return (sTime >= b.startTime && sTime < b.endTime) || (eTime > b.startTime && eTime <= b.endTime);
    });
  };

  const handleCreateBooking = async () => {
    if (!clientName || !clientPhone || !service) {
      setConflictError('Iltimos, barcha majburiy maydonlarni to\'ldiring!');
      return;
    }

    if (checkConflict(specialistId, bookingDate, startTime, endTime)) {
      const spec = SPECIALISTS.find(s => s.id === specialistId);
      setConflictError(`Diqqat! ${spec?.name} bu vaqt oralig'ida (${startTime} - ${endTime}) boshqa bron bilan band!`);
      return;
    }

    try {
      const res = await api.createBooking({
        clientName,
        clientPhone,
        service,
        specialistId,
        date: bookingDate,
        startTime,
        endTime,
        status: 'confirmed',
        price,
        notes: ''
      });

      if (res.success) {
        await loadBookings();
        setIsModalOpen(false);
        setConflictError(null);
        setClientName('');
        setClientPhone('');
        setService('');
        setToastMessage(`Yangi bron bazaga muvaffaqiyatli saqlandi! (${startTime} - ${endTime})`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch {
      setConflictError('Xatolik yuz berdi. Bron saqlanmadi.');
    }
  };

  return (
    <div className="cal-page-container">
      {toastMessage && (
        <div className="cal-toast">
          <RiCheckLine size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="cal-header-bar">
        <div className="cal-left-controls">
          <div className="cal-nav-buttons">
            <button className="cal-icon-btn"><RiArrowLeftSLine size={18} /></button>
            <span className="cal-current-label">8-Sentyabr, 2026 (Seshanba)</span>
            <button className="cal-icon-btn"><RiArrowRightSLine size={18} /></button>
          </div>
          <div className="cal-mode-switcher">
            <button
              className={`mode-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Kunlik (Masterlar)
            </button>
            <button
              className={`mode-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Haftalik
            </button>
            <button
              className={`mode-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Oylik
            </button>
          </div>
        </div>

        {hasPermission('calendar', 'create') && (
          <button className="cal-add-btn" onClick={() => setIsModalOpen(true)}>
            <RiAddLine size={18} />
            <span>Yangi bron qilish</span>
          </button>
        )}
      </div>

      {/* MAIN CALENDAR GRID - DAY VIEW WITH STAFF COLUMNS */}
      {viewMode === 'day' && (
        <div className="cal-grid-wrapper">
          <div className="cal-day-board">
            {/* Header: Specialists */}
            <div className="cal-board-header">
              <div className="cal-time-col-header">Vaqt</div>
              {SPECIALISTS.map(spec => (
                <div key={spec.id} className="cal-spec-header">
                  <div className="spec-avatar" style={{ backgroundColor: `${spec.color}15`, color: spec.color }}>
                    <RiUserStarLine size={18} />
                  </div>
                  <div className="spec-info">
                    <span className="spec-name">{spec.name}</span>
                    <span className="spec-role">{spec.role}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            <div className="cal-board-body">
              {TIME_SLOTS.map(slot => (
                <div key={slot} className="cal-time-row">
                  <div className="cal-time-label">{slot}</div>
                  {SPECIALISTS.map(spec => {
                    const matchedBookings = bookings.filter(
                      b => b.specialistId === spec.id && b.startTime.startsWith(slot.substring(0, 2))
                    );

                    return (
                      <div
                        key={spec.id}
                        className="cal-slot-cell"
                        onClick={() => {
                          setSpecialistId(spec.id);
                          setStartTime(slot);
                          setIsModalOpen(true);
                        }}
                      >
                        {matchedBookings.map(b => (
                          <div
                            key={b.id}
                            className={`booking-card ${b.status}`}
                            style={{ borderLeftColor: spec.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Mijoz: ${b.clientName}\nXizmat: ${b.service}\nVaqt: ${b.startTime} - ${b.endTime}\nNarx: ${b.price}`);
                            }}
                          >
                            <div className="bc-time-badge">
                              <RiTimeLine size={12} />
                              <span>{b.startTime} - {b.endTime}</span>
                            </div>
                            <span className="bc-client">{b.clientName}</span>
                            <span className="bc-service">{b.service}</span>
                            <span className="bc-price">{b.price}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="cal-week-board">
          {['Dushanba 07', 'Seshanba 08', 'Chorshanba 09', 'Payshanba 10', 'Juma 11', 'Shanba 12', 'Yakshanba 13'].map((day, idx) => (
            <div key={day} className={`week-col ${idx === 1 ? 'today' : ''}`}>
              <div className="week-col-header">
                <span>{day}</span>
                {idx === 1 && <span className="today-chip">Bugun</span>}
              </div>
              <div className="week-col-content">
                {idx === 1 ? (
                  bookings.map(b => (
                    <div key={b.id} className="week-booking-chip">
                      <span className="wbc-time">{b.startTime}</span>
                      <span className="wbc-title">{b.clientName} - {b.service}</span>
                    </div>
                  ))
                ) : (
                  <div className="week-empty-slot">Bronlar yo'q</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="cal-month-board">
          {Array.from({ length: 30 }, (_, i) => i + 1).map(dayNum => (
            <div key={dayNum} className={`month-day-cell ${dayNum === 8 ? 'active-day' : ''}`}>
              <span className="mdc-number">{dayNum}</span>
              {dayNum === 8 && (
                <div className="mdc-events">
                  <span className="mdc-badge">{bookings.length} ta bron</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NEW BOOKING MODAL WITH CONFLICT DETECTION */}
      {isModalOpen && (
        <div className="cal-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="cal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cal-m-header">
              <div className="cmh-title">
                <RiCalendarLine size={22} className="cmh-icon" />
                <h3>Yangi bron qilish</h3>
              </div>
              <button className="cmh-close" onClick={() => setIsModalOpen(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="cal-m-body">
              {conflictError && (
                <div className="conflict-alert-box">
                  <RiAlertLine size={18} />
                  <span>{conflictError}</span>
                </div>
              )}

              <div className="cal-form-group">
                <label>Mutaxassis / Xodim</label>
                <select
                  value={specialistId}
                  onChange={(e) => {
                    setSpecialistId(e.target.value);
                    setConflictError(null);
                  }}
                >
                  {SPECIALISTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="cal-form-row">
                <div className="cal-form-group">
                  <label>Mijoz ismi</label>
                  <input
                    type="text"
                    placeholder="Masalan: Dilnoza Islomova"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="cal-form-group">
                  <label>Telefon raqami</label>
                  <input
                    type="text"
                    placeholder="+998 90 123 45 67"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="cal-form-group">
                <label>Xizmat turi</label>
                <input
                  type="text"
                  placeholder="Masalan: Konsultatsiya, Massaj, Diagnostika..."
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                />
              </div>

              <div className="cal-form-row">
                <div className="cal-form-group">
                  <label>Boshlanish vaqti</label>
                  <select
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setConflictError(null);
                    }}
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="cal-form-group">
                  <label>Tugash vaqti</label>
                  <select
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setConflictError(null);
                    }}
                  >
                    {['10:00', '11:00', '11:30', '12:00', '13:00', '14:30', '16:00', '17:00', '18:00', '19:00'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cal-form-group">
                <label>Xizmat narxi</label>
                <input
                  type="text"
                  placeholder="250,000 UZS"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="cal-m-footer">
              <button className="cal-btn-cancel" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
              <button className="cal-btn-submit" onClick={handleCreateBooking}>Bronni tasdiqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
