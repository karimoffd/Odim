import React, { useState, useEffect, useMemo } from 'react';
import {
  TbX, TbCrown, TbHistory, TbTrendingUp, TbClock, TbUser,
  TbBuildingStore, TbCheck, TbSearch, TbRefresh, TbChevronDown,
  TbChevronUp, TbArrowRight, TbFlame, TbAward, TbCash, TbCalendar,
  TbFilter
} from 'react-icons/tb';
import { api, type StaffSalesStat, type KanbanAuditHistoryItem } from '../api';
import { formatDurationUz, formatDateTimeUz } from '../utils/timeFormatters';

interface SuperAdminAuditModalProps {
  industry?: string;
  onClose?: () => void;
  isFullPage?: boolean;
}

export const SuperAdminAuditModal: React.FC<SuperAdminAuditModalProps> = ({
  industry = 'avtosalon',
  onClose,
  isFullPage = false
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'audit'>('stats');
  const [loading, setLoading] = useState<boolean>(true);
  const [staffStats, setStaffStats] = useState<StaffSalesStat[]>([]);
  const [auditHistory, setAuditHistory] = useState<KanbanAuditHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [onlySalesFilter, setOnlySalesFilter] = useState<boolean>(false);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, auditRes] = await Promise.all([
        api.getStaffSalesStats(industry),
        api.getKanbanAuditHistory(undefined, industry, 300)
      ]);
      if (statsRes.success && statsRes.staffStats) {
        setStaffStats(statsRes.staffStats);
      }
      if (auditRes.success && auditRes.audit) {
        setAuditHistory(auditRes.audit);
      }
    } catch (e) {
      console.error('SuperAdminAuditModal error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [industry]);

  // Aggregated KPIs
  const totalClosedSales = useMemo(() => {
    return staffStats.reduce((sum, s) => sum + s.totalSalesCount, 0);
  }, [staffStats]);

  const totalRevenue = useMemo(() => {
    return staffStats.reduce((sum, s) => sum + s.totalRevenueUZS, 0);
  }, [staffStats]);

  const overallAvgSaleTime = useMemo(() => {
    const totalSales = staffStats.reduce((sum, s) => sum + s.totalSalesCount, 0);
    const totalDuration = staffStats.reduce((sum, s) => sum + s.totalSaleDurationSeconds, 0);
    return totalSales > 0 ? Math.round(totalDuration / totalSales) : 0;
  }, [staffStats]);

  const fastestSale = useMemo(() => {
    let min: number | null = null;
    staffStats.forEach(s => {
      if (s.fastestSaleDurationSeconds && (min === null || s.fastestSaleDurationSeconds < min)) {
        min = s.fastestSaleDurationSeconds;
      }
    });
    return min;
  }, [staffStats]);

  // Filtered Staff Stats
  const filteredStaffStats = useMemo(() => {
    let list = staffStats;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        s.staffName.toLowerCase().includes(q) ||
        s.roleTitle.toLowerCase().includes(q) ||
        s.soldDeals.some(d => d.title.toLowerCase().includes(q))
      );
    }
    return list;
  }, [staffStats, searchQuery]);

  // Filtered Audit History
  const filteredAudit = useMemo(() => {
    let list = auditHistory;
    if (onlySalesFilter) {
      list = list.filter(item => item.isSale);
    }
    if (selectedStaffFilter !== 'all') {
      list = list.filter(item => item.movedById === selectedStaffFilter || item.movedByName === selectedStaffFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item =>
        item.dealTitle.toLowerCase().includes(q) ||
        item.movedByName.toLowerCase().includes(q) ||
        item.toColumnTitle.toLowerCase().includes(q) ||
        item.fromColumnTitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [auditHistory, onlySalesFilter, selectedStaffFilter, searchQuery]);

  const toggleExpand = (staffId: string) => {
    setExpandedStaffId(prev => prev === staffId ? null : staffId);
  };

  const content = (
    <div className={`superadmin-audit-modal ${isFullPage ? 'is-fullpage' : ''}`} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="superadmin-audit-header">
        <div className="superadmin-header-title-box">
          <div className="superadmin-crown-icon-wrap">
            <TbCrown className="superadmin-crown-icon" />
          </div>
          <div>
            <div className="superadmin-header-badges">
              <span className="superadmin-badge-royal">Super Admin Nazorati</span>
              <span className="superadmin-badge-industry">{industry.toUpperCase()}</span>
            </div>
            <h2 className="superadmin-title">Xodimlar Harakatlari va Sotuv Vaqtlari Tahlili</h2>
            <p className="superadmin-subtitle">
              Har bir xodim qaysi bitimni qaysi kanban ustuniga qachon o'tkazgani va mahsulot sotishga ketgan umumiy vaqt ko'rsatkichlari
            </p>
          </div>
        </div>

        <div className="superadmin-header-actions">
          <button
            className={`superadmin-refresh-btn ${loading ? 'loading' : ''}`}
            onClick={fetchData}
            title="Ma'lumotlarni yangilash"
          >
            <TbRefresh className="btn-icon" />
            <span>Yangilash</span>
          </button>
          {onClose && (
            <button className="superadmin-close-btn" onClick={onClose} title="Yopish">
              <TbX />
            </button>
          )}
        </div>
      </div>

        {/* Top Aggregate KPI Metrics Bar */}
        <div className="superadmin-kpi-grid">
          <div className="superadmin-kpi-card">
            <div className="kpi-icon-wrap kpi-sales">
              <TbAward />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Jami Sotuvlar</span>
              <span className="kpi-value">{totalClosedSales} ta bitim</span>
              <span className="kpi-sub">Barcha xodimlar hisobida</span>
            </div>
          </div>

          <div className="superadmin-kpi-card">
            <div className="kpi-icon-wrap kpi-time">
              <TbClock />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">O'rtacha Sotish Vaqti</span>
              <span className="kpi-value">
                {overallAvgSaleTime > 0 ? formatDurationUz(overallAvgSaleTime) : "Ma'lumot kam"}
              </span>
              <span className="kpi-sub">Boshlanishidan yopilishigacha</span>
            </div>
          </div>

          <div className="superadmin-kpi-card">
            <div className="kpi-icon-wrap kpi-fastest">
              <TbFlame />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Eng Tezkor Sotuv</span>
              <span className="kpi-value">
                {fastestSale ? formatDurationUz(fastestSale) : "—"}
              </span>
              <span className="kpi-sub">Rekord tsikl vaqti</span>
            </div>
          </div>

          <div className="superadmin-kpi-card">
            <div className="kpi-icon-wrap kpi-revenue">
              <TbCash />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Umumiy Tushum</span>
              <span className="kpi-value">{totalRevenue.toLocaleString('uz-UZ')} so'm</span>
              <span className="kpi-sub">Muvaffaqiyatli yopilgan</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="superadmin-nav-bar">
          <div className="superadmin-tabs">
            <button
              className={`superadmin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <TbTrendingUp className="tab-icon" />
              <span>Xodimlar Sotuv Tahlili ({staffStats.length})</span>
            </button>
            <button
              className={`superadmin-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <TbHistory className="tab-icon" />
              <span>Harakatlar Auditi ({auditHistory.length})</span>
            </button>
          </div>

          <div className="superadmin-filters-row">
            <div className="superadmin-search-wrap">
              <TbSearch className="search-icon" />
              <input
                type="text"
                placeholder={activeTab === 'stats' ? "Xodim yoki bitim nomi bo'yicha qidirish..." : "Bitim, xodim yoki bosqichni qidirish..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="superadmin-search-input"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <TbX />
                </button>
              )}
            </div>

            {activeTab === 'audit' && (
              <>
                <div className="superadmin-select-wrap">
                  <TbUser className="select-icon" />
                  <select
                    value={selectedStaffFilter}
                    onChange={e => setSelectedStaffFilter(e.target.value)}
                    className="superadmin-staff-select"
                  >
                    <option value="all">Barcha xodimlar</option>
                    {staffStats.map(s => (
                      <option key={s.staffId} value={s.staffId}>
                        {s.staffName} ({s.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <label className="superadmin-sales-toggle">
                  <input
                    type="checkbox"
                    checked={onlySalesFilter}
                    onChange={e => setOnlySalesFilter(e.target.checked)}
                  />
                  <span>Faqat sotuvlar</span>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="superadmin-body-content">
          {loading ? (
            <div className="superadmin-loading-state">
              <div className="superadmin-spinner" />
              <p>Ma'lumotlar bazadan yuklanmoqda...</p>
            </div>
          ) : activeTab === 'stats' ? (
            /* ================= TAB 1: XODIMLAR SOTUV TAHLILI ================= */
            <div className="superadmin-stats-list">
              {filteredStaffStats.length === 0 ? (
                <div className="superadmin-empty-state">
                  <TbUser className="empty-icon" />
                  <h4>Xodimlar bo'yicha ma'lumot topilmadi</h4>
                  <p>Hozircha sotilgan bitimlar yoki xodimlar mavjud emas.</p>
                </div>
              ) : (
                filteredStaffStats.map((staff, index) => {
                  const isExpanded = expandedStaffId === staff.staffId;
                  const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

                  return (
                    <div key={staff.staffId} className={`staff-analytics-card ${staff.totalSalesCount > 0 ? 'has-sales' : ''}`}>
                      <div className="staff-analytics-top" onClick={() => toggleExpand(staff.staffId)}>
                        <div className="staff-info-block">
                          <span className="staff-rank-badge">{rankMedal}</span>
                          <div className="staff-avatar-circle">
                            {staff.avatar ? (
                              <img src={staff.avatar} alt={staff.staffName} className="staff-avatar-img" />
                            ) : (
                              <div className="staff-avatar-fallback">
                                {staff.staffName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="staff-text-block">
                            <div className="staff-name-line">
                              <span className="staff-fullname">{staff.staffName}</span>
                              <span className="staff-role-pill">{staff.roleTitle || 'Xodim'}</span>
                            </div>
                            <span className="staff-id-tag">ID: {staff.staffId}</span>
                          </div>
                        </div>

                        {/* Staff Metrics in Top Row */}
                        <div className="staff-metrics-summary">
                          <div className="metric-pill">
                            <span className="m-label">Sotuvlar:</span>
                            <span className="m-val highlight">{staff.totalSalesCount} ta</span>
                          </div>

                          <div className="metric-pill">
                            <span className="m-label">O'rtacha sotuv vaqti:</span>
                            <span className="m-val time-val">
                              {staff.totalSalesCount > 0 ? formatDurationUz(staff.avgSaleDurationSeconds) : '—'}
                            </span>
                          </div>

                          <div className="metric-pill">
                            <span className="m-label">Eng tezkor:</span>
                            <span className="m-val fast-val">
                              {staff.fastestSaleDurationSeconds ? formatDurationUz(staff.fastestSaleDurationSeconds) : '—'}
                            </span>
                          </div>

                          <div className="metric-pill">
                            <span className="m-label">Tushum:</span>
                            <span className="m-val revenue-val">{staff.totalRevenueUZS.toLocaleString('uz-UZ')} so'm</span>
                          </div>

                          <button className="expand-chevron-btn" title="Batafsil">
                            {isExpanded ? <TbChevronUp /> : <TbChevronDown />}
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Sold Deals Sub-List */}
                      {isExpanded && (
                        <div className="staff-deals-collapsible">
                          <div className="collapsible-header">
                            <h5>
                              <TbCheck className="h-icon" />
                              {staff.staffName} tomonidan muvaffaqiyatli sotilgan mahsulotlar ({staff.soldDeals.length} ta)
                            </h5>
                          </div>

                          {staff.soldDeals.length === 0 ? (
                            <p className="no-deals-text">Ushbu xodim tomonidan hali sotuv yakunlanmagan.</p>
                          ) : (
                            <div className="sold-deals-table-wrap">
                              <table className="sold-deals-table">
                                <thead>
                                  <tr>
                                    <th>Bitim / Mahsulot</th>
                                    <th>Narxi</th>
                                    <th>Yaratilgan sana</th>
                                    <th>Sotilgan sana</th>
                                    <th>Sotuvga ketgan vaqt (Tsikl)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {staff.soldDeals.map(deal => (
                                    <tr key={deal.id}>
                                      <td className="deal-title-cell">
                                        <span className="deal-title-text">{deal.title}</span>
                                      </td>
                                      <td className="deal-price-cell">{deal.price}</td>
                                      <td className="deal-date-cell">{deal.createdAt ? formatDateTimeUz(deal.createdAt) : '—'}</td>
                                      <td className="deal-date-cell">{deal.soldAt ? formatDateTimeUz(deal.soldAt) : '—'}</td>
                                      <td className="deal-duration-cell">
                                        <span className="deal-duration-badge">
                                          <TbClock className="badge-icon" />
                                          {formatDurationUz(deal.saleDurationSeconds)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ================= TAB 2: HARAKATLAR AUDITI ================= */
            <div className="superadmin-audit-table-wrap">
              {filteredAudit.length === 0 ? (
                <div className="superadmin-empty-state">
                  <TbHistory className="empty-icon" />
                  <h4>Audit yozuvlari topilmadi</h4>
                  <p>Tanlangan filtrlar bo'yicha harakatlar qayd etilmagan.</p>
                </div>
              ) : (
                <table className="superadmin-audit-table">
                  <thead>
                    <tr>
                      <th>Vaqti</th>
                      <th>Mas'ul Ishchi</th>
                      <th>Bitim / Mahsulot</th>
                      <th>Bosqich Harakati</th>
                      <th>Bosqichdagi Vaqti</th>
                      <th>Bitim Jami Vaqti</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudit.map(item => (
                      <tr key={item.id} className={item.isSale ? 'audit-row-sale' : ''}>
                        <td className="audit-time-cell">
                          <div className="audit-time-box">
                            <TbCalendar className="cell-icon" />
                            <span>{formatDateTimeUz(item.createdAt)}</span>
                          </div>
                        </td>

                        <td className="audit-staff-cell">
                          <div className="audit-staff-box">
                            <div className="audit-staff-avatar">
                              {item.movedByName ? item.movedByName.slice(0, 2).toUpperCase() : 'FD'}
                            </div>
                            <div className="audit-staff-meta">
                              <span className="audit-staff-name">{item.movedByName}</span>
                              {item.movedById && <span className="audit-staff-id">{item.movedById}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="audit-deal-cell">
                          <div className="audit-deal-box">
                            <span className="audit-deal-title">{item.dealTitle}</span>
                            <span className="audit-deal-price">{item.price}</span>
                          </div>
                        </td>

                        <td className="audit-stage-cell">
                          <div className="audit-stage-flow">
                            <span className="from-stage-pill">{item.fromColumnTitle || "Boshlang'ich"}</span>
                            <TbArrowRight className="flow-arrow" />
                            <span className="to-stage-pill">{item.toColumnTitle}</span>
                          </div>
                        </td>

                        <td className="audit-duration-cell">
                          <span className="stage-time-chip">
                            <TbClock className="chip-icon" />
                            {item.durationSeconds > 0 ? formatDurationUz(item.durationSeconds) : "1 daqiqadan kam"}
                          </span>
                        </td>

                        <td className="audit-total-cell">
                          <span className="total-time-chip">
                            {item.totalDealSeconds > 0 ? formatDurationUz(item.totalDealSeconds) : '—'}
                          </span>
                        </td>

                        <td className="audit-status-cell">
                          {item.isSale ? (
                            <div className="sale-success-badge" title={`Sotuvga ketgan vaqt: ${formatDurationUz(item.saleDurationSeconds)}`}>
                              <TbAward className="badge-icon" />
                              <span>Sotildi! ({formatDurationUz(item.saleDurationSeconds)})</span>
                            </div>
                          ) : (
                            <span className="normal-move-badge">Ko'chirildi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="superadmin-audit-footer">
          <div className="footer-left">
            <span>🛡️ Barcha harakatlar SQLite ma'lumotlar bazasida doimiy saqlanadi</span>
          </div>
          <div className="footer-right">
            {onClose && (
              <button className="superadmin-footer-btn" onClick={onClose}>
                Yopish
              </button>
            )}
          </div>
        </div>
      </div>
  );

  if (isFullPage) {
    return <div className="superadmin-audit-fullpage">{content}</div>;
  }

  return (
    <div className="superadmin-audit-overlay" onClick={onClose}>
      {content}
    </div>
  );
};
