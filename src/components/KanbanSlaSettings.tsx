import React, { useState, useEffect } from 'react';
import { api, type KanbanStageSLA } from '../api';
import {
  TbClock,
  TbDeviceFloppy,
  TbCheck,
  TbShieldCheck
} from 'react-icons/tb';
import { RiCarLine, RiScissorsLine, RiMegaphoneLine, RiDropLine } from 'react-icons/ri';
import './KanbanSlaSettings.css';

const INDUSTRIES = [
  { id: 'avtosalon', name: 'Avtosalon', icon: RiCarLine },
  { id: 'beauty', name: "Go'zallik saloni", icon: RiScissorsLine },
  { id: 'agency', name: 'Reklama agentligi', icon: RiMegaphoneLine },
  { id: 'plumbing', name: "Santexnika do'koni", icon: RiDropLine }
];

export default function KanbanSlaSettings() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>(() => {
    return localStorage.getItem('odim_selected_industry') || 'avtosalon';
  });
  const [slaList, setSlaList] = useState<KanbanStageSLA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Time unit state per stage: { [stageId]: { value: number, unit: 'minutes' | 'hours' | 'days' } }
  const [unitState, setUnitState] = useState<Record<string, { value: number; unit: 'minutes' | 'hours' | 'days' }>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async (industry: string) => {
    setIsLoading(true);
    try {
      const sla = await api.getKanbanSla(industry);
      setSlaList(sla);

      // Initialize unit state
      const initialUnits: Record<string, { value: number; unit: 'minutes' | 'hours' | 'days' }> = {};
      sla.forEach(item => {
        const mins = item.timeLimitMinutes;
        if (mins >= 1440 && mins % 1440 === 0) {
          initialUnits[item.id] = { value: mins / 1440, unit: 'days' };
        } else if (mins >= 60 && mins % 60 === 0) {
          initialUnits[item.id] = { value: mins / 60, unit: 'hours' };
        } else {
          initialUnits[item.id] = { value: mins, unit: 'minutes' };
        }
      });
      setUnitState(initialUnits);
    } catch (e) {
      console.error("Error loading SLA data:", e);
      showToast("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedIndustry);
  }, [selectedIndustry]);

  const handleUnitChange = (id: string, newUnit: 'minutes' | 'hours' | 'days') => {
    setUnitState(prev => {
      const current = prev[id] || { value: 60, unit: 'minutes' };
      return {
        ...prev,
        [id]: { ...current, unit: newUnit }
      };
    });
  };

  const handleValueChange = (id: string, newVal: number) => {
    setUnitState(prev => {
      const current = prev[id] || { value: 60, unit: 'minutes' };
      return {
        ...prev,
        [id]: { ...current, value: Math.max(1, newVal) }
      };
    });
  };

  const handleWarningChange = (id: string, val: number) => {
    setSlaList(prev => prev.map(item => item.id === id ? { ...item, warningThresholdPercent: val } : item));
  };

  const calculateMinutes = (val: number, unit: 'minutes' | 'hours' | 'days'): number => {
    if (unit === 'days') return val * 1440;
    if (unit === 'hours') return val * 60;
    return val;
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const payload = slaList.map(item => {
        const state = unitState[item.id] || { value: item.timeLimitMinutes, unit: 'minutes' };
        const totalMinutes = calculateMinutes(state.value, state.unit);
        return {
          id: item.id,
          time_limit_minutes: totalMinutes,
          warning_threshold_percent: item.warningThresholdPercent || 80
        };
      });

      const ok = await api.updateKanbanSla(payload);
      if (ok) {
        showToast("✓ Kanban SLA vaqtlari muvaffaqiyatli saqlandi!");
        // Reload to sync
        await loadData(selectedIndustry);
      } else {
        showToast("Xatolik: Sozlamalarni saqlab bo'lmadi");
      }
    } catch {
      showToast("Xatolik: Aloqa uzildi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="kanban-sla-container">
      {toastMsg && (
        <div className="sla-toast">
          <TbCheck size={18} color="#38bdf8" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. HERO HEADER */}
      <div className="sla-header-card">
        <div className="sla-header-left">
          <div className="sla-header-icon-box">
            <TbClock size={28} />
          </div>
          <div className="sla-header-titles">
            <h2>Kanban Vaqtlari va SLA Boshqaruvi</h2>
            <p>Har bir bosqich uchun me'yoriy vaqt chegarasini va ogohlantirish foizini belgilang</p>
          </div>
        </div>

        <div className="sla-header-actions">
          <button
            type="button"
            className="sla-save-btn"
            disabled={isSaving || isLoading}
            onClick={handleSaveAll}
          >
            <TbDeviceFloppy size={18} />
            <span>{isSaving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}</span>
          </button>
        </div>
      </div>

      {/* 2. INDUSTRY SELECTOR TABS */}
      <div className="sla-industry-tabs">
        {INDUSTRIES.map(ind => {
          const Icon = ind.icon;
          const isActive = selectedIndustry === ind.id;
          return (
            <button
              key={ind.id}
              type="button"
              className={`sla-ind-tab ${isActive ? 'active' : ''}`}
              onClick={() => {
                setSelectedIndustry(ind.id);
                localStorage.setItem('odim_selected_industry', ind.id);
              }}
            >
              <Icon size={18} />
              <span>{ind.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3. SLA STAGES CARDS */}
      <div className="sla-stages-grid">
        {slaList.map((stage, idx) => {
          const currentUnitObj = unitState[stage.id] || { value: stage.timeLimitMinutes, unit: 'minutes' };
          const totalMins = calculateMinutes(currentUnitObj.value, currentUnitObj.unit);

          return (
            <div key={stage.id} className="sla-stage-card">
              <div className="sla-stage-card-top">
                <div
                  className="sla-stage-pill"
                  style={{ backgroundColor: `${stage.color}18`, color: stage.color }}
                >
                  <span className="sla-stage-dot" style={{ backgroundColor: stage.color }} />
                  <span>{stage.columnTitle}</span>
                </div>
                <span className="sla-stage-order">#{idx + 1}-bosqich</span>
              </div>

              <div className="sla-time-input-group">
                <label className="sla-input-label">
                  <TbClock size={15} />
                  <span>Maksimal turish vaqti (SLA):</span>
                </label>
                <div className="sla-input-row">
                  <input
                    type="number"
                    min="1"
                    className="sla-number-input"
                    value={currentUnitObj.value}
                    onChange={(e) => handleValueChange(stage.id, parseInt(e.target.value) || 1)}
                  />
                  <select
                    className="sla-unit-select"
                    value={currentUnitObj.unit}
                    onChange={(e) => handleUnitChange(stage.id, e.target.value as any)}
                  >
                    <option value="minutes">Daqiqa</option>
                    <option value="hours">Soat</option>
                    <option value="days">Kun</option>
                  </select>
                </div>
              </div>

              <div className="sla-preview-text">
                <TbShieldCheck size={15} />
                <span>Limit: {totalMins} daqiqa (muddat oshganda kartochka qizil yonadi)</span>
              </div>

              <div className="sla-warning-range-box">
                <div className="sla-range-row">
                  <span>Ogohlantirish chegarasi:</span>
                  <span>{stage.warningThresholdPercent || 80}% vaqtda</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  className="sla-range-slider"
                  value={stage.warningThresholdPercent || 80}
                  onChange={(e) => handleWarningChange(stage.id, parseInt(e.target.value))}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
