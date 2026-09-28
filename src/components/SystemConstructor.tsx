import React, { useState, useEffect } from 'react';
import {
  RiToolsLine,
  RiCarLine,
  RiScissorsLine,
  RiMegaphoneLine,
  RiDropLine,
  RiCheckLine,
  RiAddLine,
  RiDeleteBinLine,
  RiInputField,
  RiListCheck2,
  RiCalendarEventLine,
  RiHashtag,
  RiRestartLine
} from 'react-icons/ri';
import './SystemConstructor.css';

interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  stages: string[];
  sampleCustomFields: string[];
}

interface CustomField {
  id: string;
  target: 'deal' | 'client';
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  required: boolean;
}

const INDUSTRIES: IndustryTemplate[] = [
  {
    id: 'car_dealership',
    name: 'Avtosalon va Servis',
    description: 'Avtomobillarni tanlash, test-drayv, kredit/lizing shartnomasi va kafolatli servis.',
    icon: RiCarLine,
    stages: ['Yangi lid', 'Test-drayv belgilandi', 'Kredit/Lizing tasdiqlash', 'Shartnoma & Sug\'urta', 'Mashina topshirildi'],
    sampleCustomFields: ['Mashina modeli', 'Ishlab chiqarilgan yili', 'VIN kod', 'Kuzov rangi']
  },
  {
    id: 'beauty_salon',
    name: 'Go\'zallik saloni va SPA',
    description: 'Masterlar bo\'yicha bron, xizmat ko\'rsatish, kosmetika sotuvi va mijozga qayta eslatma.',
    icon: RiScissorsLine,
    stages: ['Yozilish so\'rovi', 'Masterga biriktirildi', 'Xizmat jarayonida', 'To\'lov va Kassa', 'Qayta taklif (15 kundan so\'ng)'],
    sampleCustomFields: ['Usta tanlovi', 'Soch/Teri turi', 'Oxirgi tashrif sanasi']
  },
  {
    id: 'marketing_agency',
    name: 'Reklama va Marketing agentligi',
    description: 'B2B mijozlar, brifing, tijorat taklifi, mediaplan va loyiha topshirish bosqichlari.',
    icon: RiMegaphoneLine,
    stages: ['Birlamchi brif', 'Tijorat taklifi (KP)', 'Shartnoma va Preyskurant', 'Ishga tushirish (Target/SMM)', 'Hisobot va Yopilish'],
    sampleCustomFields: ['Oylik reklama byudjeti', 'Soha yo\'nalishi', 'Maqsadli auditoriya']
  },
  {
    id: 'plumbing_store',
    name: 'Santexnika va Qurilish do\'koni',
    description: 'Chakana va ulgurji savdo, smeta hisoblash, ombordan yetkazib berish va o\'rnatish.',
    icon: RiDropLine,
    stages: ['So\'rov keldi', 'Smeta hisoblandi', 'Ombordan zaxiralash', 'Yetkazib berish (Dostavka)', 'O\'rnatish & To\'lov'],
    sampleCustomFields: ['Yetkazib berish manzili', 'Santexnik mutaxassis kerakmi', 'Ulgurji chegirma foizi']
  }
];

const INITIAL_CUSTOM_FIELDS: CustomField[] = [
  { id: 'cf-1', target: 'deal', label: 'Avtomobil modeli / Mahsulot artikuli', type: 'text', required: true },
  { id: 'cf-2', target: 'deal', label: 'Mijoz tomonidan to\'langan avans', type: 'number', required: false },
  { id: 'cf-3', target: 'client', label: 'Mijoz toifasi (VIP, Standart, B2B)', type: 'select', required: true },
  { id: 'cf-4', target: 'client', label: 'Mijozning tug\'ilgan kuni', type: 'date', required: false }
];

export default function SystemConstructor() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>(() => {
    return localStorage.getItem('odim_selected_industry') || 'car_dealership';
  });
  const [customFields, setCustomFields] = useState<CustomField[]>(INITIAL_CUSTOM_FIELDS);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New field state
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'select' | 'date'>('text');
  const [fieldTarget, setFieldTarget] = useState<'deal' | 'client'>('deal');
  const [fieldRequired, setFieldRequired] = useState(false);

  const handleSelectIndustry = (id: string) => {
    setSelectedIndustry(id);
    localStorage.setItem('odim_selected_industry', id);
    const ind = INDUSTRIES.find(i => i.id === id);
    setToastMsg(`Soha o'zgartirildi: "${ind?.name}". Kanban voronkasi avtomatik yangilandi!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleAddField = () => {
    if (!fieldLabel.trim()) return;
    const newField: CustomField = {
      id: `cf-${Date.now()}`,
      label: fieldLabel,
      type: fieldType,
      target: fieldTarget,
      required: fieldRequired
    };
    setCustomFields([...customFields, newField]);
    setFieldLabel('');
    setToastMsg(`Yangi maydon qo'shildi: "${newField.label}"`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDeleteField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
    setToastMsg('Maydon o\'chirildi');
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="constructor-page-container">
      {toastMsg && (
        <div className="const-toast">
          <RiCheckLine size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="const-header">
        <div>
          <h2 className="const-title">Tizim Konstruktori (1-Click Industry Builder)</h2>
          <span className="const-sub">Biznesingiz yo'nalishini tanlang — Odim CRM butun voronka, bosqichlar va kartalarni moslashtiradi</span>
        </div>
      </div>

      {/* 1-CLICK INDUSTRY TEMPLATES */}
      <div className="const-section">
        <h3 className="section-title">1. Tayyor soha shablonlari (Bitta bosish bilan almashtirish)</h3>
        <div className="industry-cards-grid">
          {INDUSTRIES.map((ind) => {
            const isSelected = selectedIndustry === ind.id;
            const Icon = ind.icon;
            return (
              <div
                key={ind.id}
                className={`industry-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectIndustry(ind.id)}
              >
                <div className="ic-top">
                  <div className="ic-icon-box">
                    <Icon size={24} />
                  </div>
                  {isSelected && (
                    <span className="ic-active-badge">
                      <RiCheckLine size={14} />
                      Faol soha
                    </span>
                  )}
                </div>

                <h4 className="ic-name">{ind.name}</h4>
                <p className="ic-desc">{ind.description}</p>

                <div className="ic-stages-box">
                  <span className="ic-stages-label">Voronka bosqichlari:</span>
                  <div className="ic-stages-pills">
                    {ind.stages.map((stage, idx) => (
                      <span key={idx} className="ic-pill">{idx + 1}. {stage}</span>
                    ))}
                  </div>
                </div>

                <button className={`ic-select-btn ${isSelected ? 'active' : ''}`}>
                  {isSelected ? (
                    <>
                      <RiCheckLine size={16} />
                      <span>Tanlangan</span>
                    </>
                  ) : (
                    <span>Shablonni qo'llash</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CUSTOM FIELDS CONSTRUCTOR */}
      <div className="const-section">
        <h3 className="section-title">2. Maxsus maydonlar konstruktori (Custom Fields Builder)</h3>
        <p className="section-desc">Mijoz kartochkasi yoki Bitim oynasida ko'rinadigan maxsus qo'shimcha maydonlarni sozlang</p>

        <div className="fields-builder-grid">
          {/* LEFT: ADD NEW FIELD FORM */}
          <div className="field-create-card">
            <h4 className="fcc-title">Yangi maydon kiritish</h4>

            <div className="fcc-field">
              <label>Qaysi bo'limga qo'shilsin?</label>
              <div className="target-toggle">
                <button
                  type="button"
                  className={`tt-btn ${fieldTarget === 'deal' ? 'active' : ''}`}
                  onClick={() => setFieldTarget('deal')}
                >
                  Bitim (Kanban) kartasiga
                </button>
                <button
                  type="button"
                  className={`tt-btn ${fieldTarget === 'client' ? 'active' : ''}`}
                  onClick={() => setFieldTarget('client')}
                >
                  Mijoz kartochkasiga
                </button>
              </div>
            </div>

            <div className="fcc-field">
              <label>Maydon nomi / Savol</label>
              <input
                type="text"
                placeholder="Masalan: Mashina VIN kodi yoki Manzil"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
              />
            </div>

            <div className="fcc-field">
              <label>Ma'lumot turi (Field Type)</label>
              <select value={fieldType} onChange={(e) => setFieldType(e.target.value as any)}>
                <option value="text">Matn (Text)</option>
                <option value="number">Raqam (Number / Summa)</option>
                <option value="select">Tanlov ro'yxati (Dropdown)</option>
                <option value="date">Sana (Date)</option>
              </select>
            </div>

            <div className="fcc-checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={fieldRequired}
                  onChange={(e) => setFieldRequired(e.target.checked)}
                />
                <span>To'ldirilishi majburiy maydon</span>
              </label>
            </div>

            <button className="add-field-btn" onClick={handleAddField}>
              <RiAddLine size={18} />
              <span>Maydonni tizimga qo'shish</span>
            </button>
          </div>

          {/* RIGHT: CURRENT ACTIVE FIELDS LIST */}
          <div className="active-fields-card">
            <h4 className="fcc-title">Mavjud maxsus maydonlar ({customFields.length})</h4>

            <div className="fields-table-wrap">
              <table className="fields-table">
                <thead>
                  <tr>
                    <th>Maydon nomi</th>
                    <th>Qayerda</th>
                    <th>Turi</th>
                    <th>Majburiylik</th>
                    <th>Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {customFields.map((f) => (
                    <tr key={f.id}>
                      <td><b>{f.label}</b></td>
                      <td>
                        <span className={`target-badge ${f.target}`}>
                          {f.target === 'deal' ? 'Bitim' : 'Mijoz'}
                        </span>
                      </td>
                      <td>
                        <span className="type-badge">
                          {f.type === 'text' ? 'Matn' : f.type === 'number' ? 'Raqam' : f.type === 'select' ? 'Tanlov' : 'Sana'}
                        </span>
                      </td>
                      <td>
                        {f.required ? (
                          <span className="req-badge yes">Ha (Majburiy)</span>
                        ) : (
                          <span className="req-badge no">Ixtiyoriy</span>
                        )}
                      </td>
                      <td>
                        <button className="del-field-btn" onClick={() => handleDeleteField(f.id)}>
                          <RiDeleteBinLine size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
