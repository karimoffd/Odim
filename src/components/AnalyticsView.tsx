import React, { useState, useEffect } from 'react';
import {
  RiLineChartLine,
  RiPieChartLine,
  RiUserStarLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiMoneyDollarCircleLine,
  RiFilter3Line,
  RiTelegramFill,
  RiInstagramFill,
  RiPhoneLine,
  RiGlobalLine,
  RiShareForwardLine,
  RiTrophyLine,
  RiMedalLine,
  RiAwardLine,
  RiCheckboxCircleLine,
  RiFlashlightLine,
  RiSpeedUpLine
} from 'react-icons/ri';
import './AnalyticsView.css';

interface LeadSource {
  channel: string;
  name: string;
  icon: any;
  leads: number;
  deals: number;
  conversion: number;
  revenue: string;
  color: string;
  sharePercent: number;
}

interface ManagerStats {
  id: string;
  name: string;
  role: string;
  dealsCount: number;
  revenue: string;
  conversionRate: number;
  avgCheck: string;
  rank: number;
}

const PERIOD_DATA = {
  today: {
    revenue: 28400000,
    deals: 14,
    conversion: 382, // 38.2%
    avgCheck: 4800000,
    revenueTrend: "+4.2% kechagiga nisbatan",
    dealsTrend: "+3 ta yangi bitim",
    convTrend: "+2.1% o'sish",
    checkTrend: "-0.5% barqaror"
  },
  week: {
    revenue: 184200000,
    deals: 92,
    conversion: 338, // 33.8%
    avgCheck: 5050000,
    revenueTrend: "+12.1% o'tgan haftaga nisbatan",
    dealsTrend: "+8 ta yangi bitim",
    convTrend: "+1.8% o'sish",
    checkTrend: "+1.2% o'sish"
  },
  month: {
    revenue: 700900000,
    deals: 351,
    conversion: 315, // 31.5%
    avgCheck: 5100000,
    revenueTrend: "+18.4% o'tgan oyga nisbatan",
    dealsTrend: "+12 ta yangi bitim",
    convTrend: "+3.2% o'sish",
    checkTrend: "-1.1% barqaror"
  },
  year: {
    revenue: 8450000000,
    deals: 4210,
    conversion: 321, // 32.1%
    avgCheck: 5200000,
    revenueTrend: "+24.5% o'tgan yilga nisbatan",
    dealsTrend: "+340 ta yangi bitim",
    convTrend: "+4.5% o'sish",
    checkTrend: "+3.8% o'sish"
  }
};

const LEAD_SOURCES: LeadSource[] = [
  {
    channel: 'instagram',
    name: 'Instagram Direct & Target',
    icon: RiInstagramFill,
    leads: 410,
    deals: 112,
    conversion: 27.3,
    revenue: '215,800,000 UZS',
    color: '#e1306c',
    sharePercent: 30.8
  },
  {
    channel: 'telegram',
    name: 'Telegram Bot & Chat',
    icon: RiTelegramFill,
    leads: 342,
    deals: 98,
    conversion: 28.6,
    revenue: '185,400,000 UZS',
    color: '#0088cc',
    sharePercent: 26.5
  },
  {
    channel: 'phone',
    name: 'Kiruvchi Call-markaz (Telefoniya)',
    icon: RiPhoneLine,
    leads: 185,
    deals: 74,
    conversion: 40.0,
    revenue: '142,000,000 UZS',
    color: '#10b981',
    sharePercent: 20.3
  },
  {
    channel: 'referral',
    name: 'Tavsiyalar (Mijozdan mijozga)',
    icon: RiShareForwardLine,
    leads: 58,
    deals: 36,
    conversion: 62.0,
    revenue: '89,500,000 UZS',
    color: '#f59e0b',
    sharePercent: 12.8
  },
  {
    channel: 'website',
    name: 'Veb-sayt arizalari',
    icon: RiGlobalLine,
    leads: 120,
    deals: 31,
    conversion: 25.8,
    revenue: '68,200,000 UZS',
    color: '#6366f1',
    sharePercent: 9.7
  }
];

const MANAGERS_LEADERBOARD: ManagerStats[] = [
  {
    id: 'm-1',
    name: 'Sardor Qodirov',
    role: 'Katta sotuv menejeri',
    dealsCount: 42,
    revenue: '245,000,000 UZS',
    conversionRate: 34.5,
    avgCheck: '5,833,000 UZS',
    rank: 1
  },
  {
    id: 'm-2',
    name: 'Malika Karimova',
    role: 'Mijozlar bilan ishlash menejeri',
    dealsCount: 38,
    revenue: '210,500,000 UZS',
    conversionRate: 31.8,
    avgCheck: '5,540,000 UZS',
    rank: 2
  },
  {
    id: 'm-3',
    name: 'Jasur Aliyev',
    role: 'Texnik maslahatchi',
    dealsCount: 29,
    revenue: '162,000,000 UZS',
    conversionRate: 28.4,
    avgCheck: '5,586,000 UZS',
    rank: 3
  },
  {
    id: 'm-4',
    name: 'Madina Rahimova',
    role: 'Salonda qabul koordinatori',
    dealsCount: 24,
    revenue: '83,400,000 UZS',
    conversionRate: 26.0,
    avgCheck: '3,475,000 UZS',
    rank: 4
  }
];

const FUNNEL_STAGES = [
  {
    step: 1,
    stage: 'Kiruvchi lidlar',
    count: 1115,
    percent: 100,
    drop: 'Barcha murojaatlar',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    bg: '#eff6ff',
    badgeColor: '#1d4ed8',
    icon: RiUserStarLine
  },
  {
    step: 2,
    stage: 'Muloqot boshlandi',
    count: 864,
    percent: 77.5,
    drop: "-22.5% yo'qotish",
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
    bg: '#ecfeff',
    badgeColor: '#0284c7',
    icon: RiFilter3Line
  },
  {
    step: 3,
    stage: 'KP / Taklif yuborildi',
    count: 540,
    percent: 48.4,
    drop: "-37.5% yo'qotish",
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    bg: '#f5f3ff',
    badgeColor: '#6d28d9',
    icon: RiLineChartLine
  },
  {
    step: 4,
    stage: 'Muzokara & Shartnoma',
    count: 412,
    percent: 36.9,
    drop: "-23.7% yo'qotish",
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    bg: '#fffbeb',
    badgeColor: '#d97706',
    icon: RiMoneyDollarCircleLine
  },
  {
    step: 5,
    stage: "To'lov va muvaffaqiyat",
    count: 351,
    percent: 31.5,
    drop: '+31.5% umumiy konversiya',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    bg: '#ecfdf5',
    badgeColor: '#059669',
    icon: RiCheckboxCircleLine
  }
];

// Animated Number Component with smooth easing
function AnimatedNumber({
  value,
  duration = 900,
  formatter
}: {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(value * ease);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span className="anim-number">{formatter ? formatter(displayValue) : displayValue.toLocaleString('uz-UZ')}</span>;
}

export default function AnalyticsView() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, [period]);

  const currentKPI = PERIOD_DATA[period];

  return (
    <div className="analytics-page-container">
      {/* TOP HEADER */}
      <div className="an-header-bar">
        <div>
          <h2 className="an-title">Analitika va Hisobotlar</h2>
          <span className="an-subtitle">Kompaniyaning umumiy savdo voronkasi, manbalar va menejerlar unumdorligi</span>
        </div>

        <div className="an-period-switcher">
          <button
            className={`an-p-btn ${period === 'today' ? 'active' : ''}`}
            onClick={() => setPeriod('today')}
          >
            Bugun
          </button>
          <button
            className={`an-p-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            Hafta
          </button>
          <button
            className={`an-p-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Shu oy
          </button>
          <button
            className={`an-p-btn ${period === 'year' ? 'active' : ''}`}
            onClick={() => setPeriod('year')}
          >
            Yillik
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS WITH ANIMATED COUNTER */}
      <div className="an-kpi-grid">
        <div className="an-kpi-card">
          <div className="ak-top">
            <span className="ak-label">Umumiy tushum</span>
            <div className="ak-icon-badge revenue">
              <RiMoneyDollarCircleLine size={20} />
            </div>
          </div>
          <div className="ak-value">
            <AnimatedNumber
              key={`rev-${period}`}
              value={currentKPI.revenue}
              formatter={(val) => val.toLocaleString('uz-UZ') + ' UZS'}
            />
          </div>
          <div className="ak-trend positive">
            <RiArrowUpLine size={15} />
            <span>{currentKPI.revenueTrend}</span>
          </div>
        </div>

        <div className="an-kpi-card">
          <div className="ak-top">
            <span className="ak-label">Muvaffaqiyatli bitimlar</span>
            <div className="ak-icon-badge deals">
              <RiCheckboxCircleLine size={20} />
            </div>
          </div>
          <div className="ak-value">
            <AnimatedNumber
              key={`deals-${period}`}
              value={currentKPI.deals}
              formatter={(val) => val.toLocaleString('uz-UZ') + ' ta'}
            />
          </div>
          <div className="ak-trend positive">
            <RiArrowUpLine size={15} />
            <span>{currentKPI.dealsTrend}</span>
          </div>
        </div>

        <div className="an-kpi-card">
          <div className="ak-top">
            <span className="ak-label">O'rtacha konversiya (Lid → Xarid)</span>
            <div className="ak-icon-badge conv">
              <RiLineChartLine size={20} />
            </div>
          </div>
          <div className="ak-value">
            <AnimatedNumber
              key={`conv-${period}`}
              value={currentKPI.conversion}
              formatter={(val) => (val / 10).toFixed(1) + '%'}
            />
          </div>
          <div className="ak-trend positive">
            <RiArrowUpLine size={15} />
            <span>{currentKPI.convTrend}</span>
          </div>
        </div>

        <div className="an-kpi-card">
          <div className="ak-top">
            <span className="ak-label">O'rtacha chek</span>
            <div className="ak-icon-badge check">
              <RiSpeedUpLine size={20} />
            </div>
          </div>
          <div className="ak-value">
            <AnimatedNumber
              key={`check-${period}`}
              value={currentKPI.avgCheck}
              formatter={(val) => val.toLocaleString('uz-UZ') + ' UZS'}
            />
          </div>
          <div className="ak-trend negative">
            <RiArrowDownLine size={15} />
            <span>{currentKPI.checkTrend}</span>
          </div>
        </div>
      </div>

      {/* SALES FUNNEL & LEAD SOURCES */}
      <div className="an-two-cols">
        {/* ENHANCED SALES FUNNEL CARD WITH ANIMATED PROGRESS */}
        <div className="an-card">
          <div className="an-card-header">
            <div>
              <h3>Savdo voronkasi (Sales Funnel)</h3>
              <p className="an-card-sub">Lidlar oqimining xaridgacha bo'lgan har bir bosqichi</p>
            </div>
            <span className="an-card-tag">Konversiya bosqichlari</span>
          </div>

          <div className="funnel-container">
            {FUNNEL_STAGES.map((fs) => {
              const StageIcon = fs.icon;
              return (
                <div key={fs.step} className="funnel-tier-card">
                  <div className="ft-header">
                    <div className="ft-left">
                      <div className="ft-step-badge" style={{ background: fs.gradient }}>
                        <StageIcon size={16} color="#fff" />
                        <span>{fs.step}</span>
                      </div>
                      <div className="ft-info">
                        <span className="ft-title">{fs.stage}</span>
                        <span className="ft-drop">{fs.drop}</span>
                      </div>
                    </div>
                    <div className="ft-right">
                      <span className="ft-count"><b>{fs.count}</b> ta</span>
                      <span className="ft-percent-chip" style={{ color: fs.badgeColor, background: fs.bg }}>
                        {fs.percent}%
                      </span>
                    </div>
                  </div>

                  <div className="ft-bar-track">
                    <div
                      className="ft-bar-fill"
                      style={{
                        width: loaded ? `${fs.percent}%` : '0%',
                        background: fs.gradient
                      }}
                    >
                      <div className="ft-glow-dot"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="funnel-summary-box">
            <div className="fs-item">
              <span className="fs-label">Boshlang'ich lidlar:</span>
              <span className="fs-val">1,115 ta</span>
            </div>
            <div className="fs-divider"></div>
            <div className="fs-item">
              <span className="fs-label">Yakunlangan savdo:</span>
              <span className="fs-val highlight">351 ta (31.5%)</span>
            </div>
            <div className="fs-divider"></div>
            <div className="fs-item">
              <span className="fs-label">O'rtacha sikl vaqti:</span>
              <span className="fs-val">4.2 kun</span>
            </div>
          </div>
        </div>

        {/* ENHANCED LEAD SOURCES CARD WITH ANIMATED PROGRESS */}
        <div className="an-card">
          <div className="an-card-header">
            <div>
              <h3>Lidlar manbasi (Traffic Sources)</h3>
              <p className="an-card-sub">Qaysi reklama va aloqa kanali eng ko'p daromad keltirdi?</p>
            </div>
            <span className="an-card-tag">Daromad ulushi</span>
          </div>

          <div className="sources-list">
            {LEAD_SOURCES.map((ls) => {
              const Icon = ls.icon;
              return (
                <div key={ls.channel} className={`source-pill-card ${ls.channel}`}>
                  <div className="sp-left">
                    <div className={`sp-brand-icon ${ls.channel}`}>
                      <Icon size={22} color="#ffffff" />
                    </div>
                    <div className="sp-details">
                      <span className="sp-name">{ls.name}</span>
                      <div className="sp-tags">
                        <span className="sp-tag">{ls.leads} ta lid</span>
                        <span className="sp-tag-dot">•</span>
                        <span className="sp-tag">{ls.deals} ta bitim</span>
                        <span className="sp-tag-dot">•</span>
                        <span className="sp-share-tag">{ls.sharePercent}% ulush</span>
                      </div>
                      <div className="sp-progress-track">
                        <div
                          className={`sp-progress-fill ${ls.channel}`}
                          style={{ width: loaded ? `${ls.sharePercent * 2.8}%` : '0%' }}
                        >
                          <div className="sp-glow-dot"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sp-right">
                    <span className="sp-rev">{ls.revenue}</span>
                    <span className="sp-conv-badge">
                      {ls.conversion}% konversiya
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MANAGERS LEADERBOARD */}
      <div className="an-card">
        <div className="an-card-header">
          <div>
            <h3>Menejerlar unumdorligi (Leaderboard & KPI)</h3>
            <p className="an-card-sub">Xodimlar bo'yicha sotuv hajmi, bitimlar va shaxsiy konversiya ko'rsatkichlari</p>
          </div>
          <span className="an-card-tag">Xodimlar reytingi</span>
        </div>

        <table className="leaderboard-table">
          <thead>
            <tr>
              <th style={{ width: '70px' }}>O'rin</th>
              <th>Menejer / Xodim</th>
              <th>Lavozim</th>
              <th>Yopilgan bitimlar</th>
              <th>Umumiy tushum</th>
              <th>Shaxsiy konversiya</th>
              <th>O'rtacha chek</th>
            </tr>
          </thead>
          <tbody>
            {MANAGERS_LEADERBOARD.map((m) => (
              <tr key={m.id} className="mgr-row">
                <td>
                  <span className={`rank-circle rank-${m.rank}`}>
                    {m.rank === 1 ? (
                      <RiTrophyLine size={18} color="#eab308" />
                    ) : m.rank === 2 ? (
                      <RiMedalLine size={18} color="#94a3b8" />
                    ) : m.rank === 3 ? (
                      <RiAwardLine size={18} color="#d97706" />
                    ) : (
                      m.rank
                    )}
                  </span>
                </td>
                <td>
                  <div className="mgr-cell">
                    <div className="mgr-avatar">
                      <RiUserStarLine size={18} />
                    </div>
                    <span className="mgr-name">{m.name}</span>
                  </div>
                </td>
                <td><span className="mgr-role">{m.role}</span></td>
                <td><b className="mgr-deals-bold">{m.dealsCount} ta bitim</b></td>
                <td><span className="mgr-rev">{m.revenue}</span></td>
                <td>
                  <span className="mgr-conv-badge">{m.conversionRate}%</span>
                </td>
                <td><span className="mgr-avg-check">{m.avgCheck}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
