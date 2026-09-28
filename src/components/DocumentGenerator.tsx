import React, { useState } from 'react';
import {
  RiFileTextLine,
  RiFileList3Line,
  RiPrinterLine,
  RiDownload2Line,
  RiCheckLine,
  RiBuilding4Line,
  RiUser3Line,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiSendPlaneLine,
  RiAddLine
} from 'react-icons/ri';
import './DocumentGenerator.css';

type DocType = 'kp' | 'invoice' | 'contract';

interface DealOption {
  id: string;
  clientName: string;
  companyName: string;
  inn: string;
  title: string;
  amount: string;
  items: { name: string; qty: number; price: string; total: string }[];
}

const DEALS_DATA: DealOption[] = [
  {
    id: 'd-1',
    clientName: 'Otabek Mirzayev',
    companyName: 'Silk Road Logistics MCHJ',
    inn: '304918274',
    title: 'Avtopark uchun ehtiyot qismlar va moy ta\'minoti',
    amount: '45,000,000 UZS',
    items: [
      { name: 'Moy filtri Mann W712 (Avtoservis)', qty: 50, price: '85,000 UZS', total: '4,250,000 UZS' },
      { name: 'Sintetik motor moyi 5W-40 (200L bochka)', qty: 2, price: '18,500,000 UZS', total: '37,000,000 UZS' },
      { name: 'Diagnostika va texnik ko\'rik xizmati', qty: 15, price: '250,000 UZS', total: '3,750,000 UZS' }
    ]
  },
  {
    id: 'd-2',
    clientName: 'Nodir Karimov',
    companyName: 'Orient Media Agency',
    inn: '201948572',
    title: 'Oylik SMM va brending xizmatlari shartnomasi',
    amount: '18,000,000 UZS',
    items: [
      { name: 'SMM va Kontent Marketing (1 oy)', qty: 3, price: '6,000,000 UZS', total: '18,000,000 UZS' }
    ]
  },
  {
    id: 'd-3',
    clientName: 'Sanjar Rahimov',
    companyName: 'Buxoro Qurilish Savdo',
    inn: '308119420',
    title: 'Katta partiya santexnika quvurlari va kranlar',
    amount: '68,500,000 UZS',
    items: [
      { name: 'Polipropilen quvur 25mm (Santexnika)', qty: 1200, price: '22,000 UZS', total: '26,400,000 UZS' },
      { name: 'Latun kran 1/2 dyuym (Italy style)', qty: 450, price: '62,000 UZS', total: '27,900,000 UZS' },
      { name: 'Santexnika o\'rnatish va montaj xizmati', qty: 1, price: '14,200,000 UZS', total: '14,200,000 UZS' }
    ]
  }
];

export default function DocumentGenerator() {
  const [docType, setDocType] = useState<DocType>('kp');
  const [selectedDealId, setSelectedDealId] = useState<string>(DEALS_DATA[0].id);
  const [docNumber, setDocNumber] = useState('ODIM-2026/09-104');
  const [docDate, setDocDate] = useState('2026-09-08');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const selectedDeal = DEALS_DATA.find(d => d.id === selectedDealId) || DEALS_DATA[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setToastMsg(`Hujjat PDF formatida yuklab olindi (${docNumber}.pdf)`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSendToClient = () => {
    setToastMsg(`Hujjat ${selectedDeal.clientName} ga Telegram orqali yuborildi!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="doc-page-container">
      {toastMsg && (
        <div className="doc-toast">
          <RiCheckLine size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP CONTROLS */}
      <div className="doc-top-bar">
        <div className="doc-type-pills">
          <button
            className={`dt-btn ${docType === 'kp' ? 'active' : ''}`}
            onClick={() => setDocType('kp')}
          >
            <RiFileList3Line size={17} />
            <span>Tijorat taklifi (KP)</span>
          </button>
          <button
            className={`dt-btn ${docType === 'invoice' ? 'active' : ''}`}
            onClick={() => setDocType('invoice')}
          >
            <RiMoneyDollarCircleLine size={17} />
            <span>Hisob-faktura (Schet)</span>
          </button>
          <button
            className={`dt-btn ${docType === 'contract' ? 'active' : ''}`}
            onClick={() => setDocType('contract')}
          >
            <RiFileTextLine size={17} />
            <span>Rasmiy Shartnoma</span>
          </button>
        </div>

        <div className="doc-actions-row">
          <button className="doc-action-btn secondary" onClick={handlePrint}>
            <RiPrinterLine size={17} />
            <span>Chop etish</span>
          </button>
          <button className="doc-action-btn secondary" onClick={handleDownload}>
            <RiDownload2Line size={17} />
            <span>PDF yuklab olish</span>
          </button>
          <button className="doc-action-btn primary" onClick={handleSendToClient}>
            <RiSendPlaneLine size={17} />
            <span>Mijozga yuborish</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT: SETTINGS ON LEFT, A4 PREVIEW ON RIGHT */}
      <div className="doc-layout-grid">
        {/* LEFT CONFIG CARD */}
        <div className="doc-config-card">
          <h3 className="dcc-title">Hujjat parametrlari</h3>

          <div className="dcc-field">
            <label>Bitim va mijozni tanlang</label>
            <select
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
            >
              {DEALS_DATA.map(d => (
                <option key={d.id} value={d.id}>
                  {d.companyName} — {d.title}
                </option>
              ))}
            </select>
          </div>

          <div className="dcc-row">
            <div className="dcc-field">
              <label>Hujjat raqami</label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
              />
            </div>
            <div className="dcc-field">
              <label>Sana</label>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
              />
            </div>
          </div>

          <div className="dcc-divider" />

          <h4 className="dcc-subtitle">Mijoz rekvizitlari</h4>
          <div className="dcc-info-box">
            <div className="dib-row">
              <span className="dib-lbl">Mijoz:</span>
              <span className="dib-val">{selectedDeal.clientName}</span>
            </div>
            <div className="dib-row">
              <span className="dib-lbl">Kompaniya:</span>
              <span className="dib-val">{selectedDeal.companyName}</span>
            </div>
            <div className="dib-row">
              <span className="dib-lbl">STIR (INN):</span>
              <span className="dib-val">{selectedDeal.inn}</span>
            </div>
          </div>

          <h4 className="dcc-subtitle">Bizning rekvizitlar (Odim ERP)</h4>
          <div className="dcc-info-box">
            <div className="dib-row">
              <span className="dib-lbl">Tashkilot:</span>
              <span className="dib-val">"ODIM TECH" MCHJ</span>
            </div>
            <div className="dib-row">
              <span className="dib-lbl">Hisob raqam:</span>
              <span className="dib-val">2020 8000 9005 1234 5001</span>
            </div>
            <div className="dib-row">
              <span className="dib-lbl">Bank:</span>
              <span className="dib-val">ATB "Kapitalbank" Toshkent b-mi</span>
            </div>
            <div className="dib-row">
              <span className="dib-lbl">MFO:</span>
              <span className="dib-val">01058</span>
            </div>
          </div>
        </div>

        {/* RIGHT: A4 DOCUMENT PREVIEW */}
        <div className="doc-preview-wrapper">
          <div className="a4-sheet">
            {/* SHEET HEADER */}
            <div className="sheet-header">
              <div className="sheet-brand">
                <div className="sheet-logo-mark">O</div>
                <div>
                  <h2 className="brand-name">ODIM TECH SOLUTIONS</h2>
                  <span className="brand-tagline">Avtomatlashtirish va biznes boshqaruvi tizimi</span>
                </div>
              </div>
              <div className="sheet-doc-meta">
                <span className="sd-badge">
                  {docType === 'kp' ? 'TIJORAT TAKLIFI' : docType === 'invoice' ? 'HISOB-FAKTURA' : 'RASMIY SHARTNOMA'}
                </span>
                <span className="sd-no">№ {docNumber}</span>
                <span className="sd-date">Sana: {docDate}</span>
              </div>
            </div>

            <div className="sheet-divider" />

            {/* PARTIES INFO */}
            <div className="sheet-parties-grid">
              <div className="sp-col">
                <span className="sp-label">IJROCHI / YETKAZIB BERUVCHI:</span>
                <span className="sp-name">"ODIM TECH" MCHJ</span>
                <span className="sp-detail">Manzil: Toshkent sh., Chilonzor tumani, 5-mavze, 12-uy</span>
                <span className="sp-detail">STIR: 308 921 445 | MFO: 01058</span>
                <span className="sp-detail">H/R: 2020 8000 9005 1234 5001</span>
              </div>
              <div className="sp-col">
                <span className="sp-label">BUYURTMACHI / XARIDOR:</span>
                <span className="sp-name">{selectedDeal.companyName}</span>
                <span className="sp-detail">Vakil: {selectedDeal.clientName}</span>
                <span className="sp-detail">STIR: {selectedDeal.inn}</span>
                <span className="sp-detail">Bitim: {selectedDeal.title}</span>
              </div>
            </div>

            {/* INTRO TEXT BASED ON DOC TYPE */}
            <div className="sheet-intro-text">
              {docType === 'kp' && (
                <p>Hurmatli {selectedDeal.clientName}! Sizning so'rovingizga binoan yuqori sifatli mahsulotlar va xizmatlarni taqdim etish bo'yicha maxsus tijorat taklifimizni taqdim etamiz. Narxlar 10 kun davomida o'zgarmas saqlanadi.</p>
              )}
              {docType === 'invoice' && (
                <p>Quyidagi tovar va xizmatlar uchun to'lovni 3 (uch) bank kuni ichida yuqorida ko'rsatilgan bank hisob raqamiga o'tkazishingiz so'raladi.</p>
              )}
              {docType === 'contract' && (
                <p>Ushbu Shartnoma bir tomondan "ODIM TECH" MCHJ (Ijrochi) va ikkinchi tomondan {selectedDeal.companyName} (Buyurtmachi) o'rtasida quyidagi moddalar asosida tuzildi.</p>
              )}
            </div>

            {/* ITEMS TABLE */}
            <table className="sheet-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>№</th>
                  <th>Nomi / Xizmat turi</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Soni</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Narxi</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Jami summa</th>
                </tr>
              </thead>
              <tbody>
                {selectedDeal.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><b>{item.name}</b></td>
                    <td style={{ textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right' }}>{item.price}</td>
                    <td style={{ textAlign: 'right' }}><b>{item.total}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTALS */}
            <div className="sheet-total-box">
              <div className="st-row">
                <span>Oraliq summa:</span>
                <span>{selectedDeal.amount}</span>
              </div>
              <div className="st-row">
                <span>QQS (12%):</span>
                <span>0 UZS (QQSsiz narxlar)</span>
              </div>
              <div className="st-row grand-total">
                <span>JAMI TO'LANISHI KERAK:</span>
                <span>{selectedDeal.amount}</span>
              </div>
            </div>

            {/* SIGNATURES */}
            <div className="sheet-signatures">
              <div className="sign-col">
                <span className="sign-title">Ijrochi nomidan:</span>
                <div className="sign-line" />
                <span className="sign-name">Bosh direktor: S. Qodirov</span>
                <span className="sign-seal">(M.O'. / Imzo)</span>
              </div>
              <div className="sign-col">
                <span className="sign-title">Buyurtmachi nomidan:</span>
                <div className="sign-line" />
                <span className="sign-name">Rahbar: {selectedDeal.clientName}</span>
                <span className="sign-seal">(M.O'. / Imzo)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
