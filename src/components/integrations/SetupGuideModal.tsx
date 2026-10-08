import { RiCloseLine, RiCheckLine, RiExternalLinkLine, RiQuestionLine } from 'react-icons/ri';
import { RiFacebookCircleFill, RiInstagramFill } from 'react-icons/ri';
import './IntegrationsModals.css';

interface Props {
  issueType?: 'no_page' | 'no_ig_business' | 'general';
  onClose: () => void;
}

export default function SetupGuideModal({ issueType = 'general', onClose }: Props) {
  return (
    <div className="odim-modal-backdrop" onClick={onClose}>
      <div className="odim-guide-modal" onClick={e => e.stopPropagation()}>
        <div className="guide-modal-header">
          <div className="guide-title-box">
            <RiQuestionLine size={24} color="#002BFF" />
            <h3>
              {issueType === 'no_page'
                ? 'Facebook Biznes Sahifa Ochish Qo\'llanmasi'
                : 'Instagram Professional & Meta Bog\'lash Qo\'llanmasi'}
            </h3>
          </div>
          <button className="modal-close-x" onClick={onClose}><RiCloseLine size={20} /></button>
        </div>

        <div className="guide-modal-body">
          {issueType === 'no_page' ? (
            <div className="guide-step-cards">
              <p className="guide-intro">
                Meta orqali ulash uchun hisobingizda kamida bitta Facebook Biznes Sahifasi bo'lishi kerak.
              </p>
              <div className="guide-card">
                <span className="guide-badge">1-Qadam</span>
                <strong>Facebook Sahifa Yaratish</strong>
                <p>Facebook hisobingizga kiring va yangi brend/biznes sahifa oching.</p>
                <a
                  href="https://www.facebook.com/pages/create"
                  target="_blank"
                  rel="noreferrer"
                  className="guide-link-btn"
                >
                  <RiFacebookCircleFill size={18} />
                  <span>Facebookda Sahifa Ochish</span>
                  <RiExternalLinkLine size={15} />
                </a>
              </div>
              <div className="guide-card">
                <span className="guide-badge">2-Qadam</span>
                <strong>Odim CRM ga qaytish</strong>
                <p>Sahifa yaratilgach, Odim CRM da "Meta bilan ulash" tugmasini bosing va yangi ochilgan sahifangizni tanlang.</p>
              </div>
            </div>
          ) : (
            <div className="guide-step-cards">
              <p className="guide-intro">
                Instagram xabarlari (Direct) va izohlarini Odim CRM ga tushishi uchun quyidagi 3 ta oddiy qadamni bajaring:
              </p>

              <div className="guide-card">
                <span className="guide-badge">1-Qadam</span>
                <strong>Professional (Biznes) Hisobga O'tish</strong>
                <p>Instagram mobil ilovasida: <i>Sozlamalar ➔ Hisob turi va asboblari ➔ Professional hisobga o'tish (Switch to Professional Account)</i> ni tanlang.</p>
              </div>

              <div className="guide-card">
                <span className="guide-badge">2-Qadam</span>
                <strong>Facebook Sahifasiga Bog'lash</strong>
                <p>Instagram profilida: <i>Profilni tahrirlash (Edit Profile) ➔ Sahifa (Page)</i> bo'limidan o'zingizning Facebook sahifangizni tanlang va tasdiqlang.</p>
              </div>

              <div className="guide-card">
                <span className="guide-badge">3-Qadam</span>
                <strong>Xabarlarga Ruxsat Berish</strong>
                <p>Instagram ilovasida: <i>Sozlamalar ➔ Xabarlar va hikoyalarga javoblar ➔ Bog'langan vositalar ➔ Xabarlarga kirish (Allow access to messages)</i> tugmachasini <strong>ON (Yoqilgan)</strong> qiling.</p>
              </div>
            </div>
          )}
        </div>

        <div className="guide-modal-footer">
          <button type="button" className="odim-btn-confirm" onClick={onClose}>
            <RiCheckLine size={18} />
            <span>Tushundim, Tayyor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
