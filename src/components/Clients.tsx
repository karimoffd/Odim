import React, { useState, useEffect } from 'react';
import { api, type ClientItem } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  RiUser3Line,
  RiBuilding4Line,
  RiSearchLine,
  RiFilter3Line,
  RiAddLine,
  RiPhoneLine,
  RiMailLine,
  RiTelegramFill,
  RiInstagramFill,
  RiFacebookFill,
  RiCloseLine,
  RiShoppingBag3Line,
  RiMoneyDollarCircleLine,
  RiHistoryLine,
  RiCheckLine,
} from 'react-icons/ri';
import './Clients.css';

export default function Clients() {
  const { hasPermission } = useAuth();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'individual' | 'company'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newType, setNewType] = useState<'individual' | 'company'>('individual');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
      if (data.length > 0 && !selectedClient) {
        setSelectedClient(data[0]);
      }
    } catch (e) {
      console.error('Failed to load clients:', e);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter((cl) => {
    const matchesTab = activeTab === 'all' || cl.type === activeTab;
    const matchesSearch =
      cl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cl.companyName && cl.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cl.phone.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  const handleAddClient = async () => {
    if (!newName || !newPhone) return;

    try {
      const res = await api.createClient({
        type: newType,
        name: newName,
        companyName: newType === 'company' ? newCompany : undefined,
        phone: newPhone,
        email: `${newName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        socials: { telegram: '@yangi_mijoz' },
        status: 'active',
        responsibleManager: 'Sardor Qodirov',
      });

      if (res.success) {
        await loadClients();
        setAddModalOpen(false);
        setNewName('');
        setNewPhone('');
        setNewCompany('');
        setSuccessToast(`Yangi mijoz bazaga saqlandi: ${newName}`);
        setTimeout(() => setSuccessToast(null), 3500);
      }
    } catch {
      setSuccessToast('Xatolik: Mijoz saqlanmadi');
    }
  };

  return (
    <div className="clients-page-container">
      {successToast && (
        <div className="clients-toast">
          <RiCheckLine size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* TOP CONTROLS */}
      <div className="clients-top-bar">
        <div className="clients-tabs">
          <button
            className={`c-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Barchasi ({clients.length})
          </button>
          <button
            className={`c-tab ${activeTab === 'individual' ? 'active' : ''}`}
            onClick={() => setActiveTab('individual')}
          >
            <RiUser3Line size={15} />
            <span>Jismoniy shaxslar</span>
          </button>
          <button
            className={`c-tab ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            <RiBuilding4Line size={15} />
            <span>Kompaniyalar (B2B)</span>
          </button>
        </div>

        <div className="clients-actions">
          <div className="clients-search">
            <RiSearchLine size={16} className="c-search-icon" />
            <input
              type="text"
              placeholder="Mijoz nomi, kompaniya yoki telefon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {hasPermission('clients', 'create') && (
            <button className="add-client-btn" onClick={() => setAddModalOpen(true)}>
              <RiAddLine size={18} />
              <span>Mijoz qo'shish</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTENT GRID: TABLE + DETAIL DRAWER */}
      <div className="clients-layout-grid">
        <div className="clients-table-card">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Mijoz / Kompaniya</th>
                <th>Telefon raqami</th>
                <th>Ijtimoiy tarmoqlar</th>
                <th>Bitimlar</th>
                <th>Umumiy to'lov</th>
                <th>Mas'ul xodim</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                return (
                  <tr
                    key={client.id}
                    className={`client-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <td>
                      <div className="client-cell-name">
                        <div className={`c-avatar-mini ${client.type}`}>
                          {client.type === 'company' ? <RiBuilding4Line size={20} /> : <RiUser3Line size={20} />}
                        </div>
                        <div>
                          <span className="c-name">{client.name}</span>
                          {client.companyName && <span className="c-company">{client.companyName}</span>}
                        </div>
                      </div>
                    </td>
                    <td><span className="c-phone">{client.phone}</span></td>
                    <td>
                      <div className="c-socials">
                        {client.socials?.telegram && <span className="soc-badge tg" title={client.socials.telegram}><RiTelegramFill size={13} /></span>}
                        {client.socials?.instagram && <span className="soc-badge ig" title={client.socials.instagram}><RiInstagramFill size={13} /></span>}
                        {client.socials?.facebook && <span className="soc-badge fb" title={client.socials.facebook}><RiFacebookFill size={13} /></span>}
                      </div>
                    </td>
                    <td><span className="c-deals-count">{client.totalDeals} ta bitim</span></td>
                    <td><span className="c-paid-sum">{client.totalPaid}</span></td>
                    <td><span className="c-manager">{client.responsibleManager}</span></td>
                    <td>
                      <span className={`c-status-badge ${client.status}`}>
                        {client.status === 'active' ? 'Faol mijoz' : client.status === 'potential' ? 'Potentsial' : 'Arxiv'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RIGHT DETAIL DRAWER */}
        {selectedClient && (
          <div className="client-drawer-card">
            <div className="drawer-header">
              <div className="dh-avatar">
                {selectedClient.type === 'company' ? <RiBuilding4Line size={28} /> : <RiUser3Line size={28} />}
              </div>
              <div className="dh-meta">
                <h3>{selectedClient.name}</h3>
                <span className="dh-company">{selectedClient.companyName || 'Jismoniy shaxs'}</span>
                <span className="dh-date">Mijoz qo'shilgan: {selectedClient.createdDate}</span>
              </div>
            </div>

            <div className="drawer-tabs-content">
              {/* CONTACTS & SOCIALS */}
              <div className="drawer-section">
                <span className="ds-heading">Aloqa kanallari</span>
                <div className="contact-links-grid">
                  <div className="cl-item">
                    <RiPhoneLine size={16} className="cl-icon" />
                    <span>{selectedClient.phone}</span>
                  </div>
                  {selectedClient.email && (
                    <div className="cl-item">
                      <RiMailLine size={16} className="cl-icon" />
                      <span>{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.socials?.telegram && (
                    <div className="cl-item social">
                      <RiTelegramFill size={16} className="cl-icon tg" />
                      <span>{selectedClient.socials.telegram}</span>
                    </div>
                  )}
                  {selectedClient.socials?.instagram && (
                    <div className="cl-item social">
                      <RiInstagramFill size={16} className="cl-icon ig" />
                      <span>{selectedClient.socials.instagram}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DEAL HISTORY */}
              <div className="drawer-section">
                <div className="ds-header-row">
                  <span className="ds-heading">O'tgan bitimlar tarixi</span>
                  <span className="ds-count">{(selectedClient.dealHistory || []).length} ta</span>
                </div>
                <div className="deal-history-list">
                  {(selectedClient.dealHistory || []).length === 0 ? (
                    <p className="empty-subtext">Hozircha bitimlar yo'q</p>
                  ) : (
                    (selectedClient.dealHistory || []).map((d: any) => (
                      <div key={d.id} className="deal-history-item">
                        <div className="dhi-top">
                          <span className="dhi-title">{d.title}</span>
                          <span className="dhi-status">{d.status}</span>
                        </div>
                        <div className="dhi-bottom">
                          <span className="dhi-price">{d.amount}</span>
                          <span className="dhi-date">{d.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PAYMENTS HISTORY */}
              <div className="drawer-section">
                <div className="ds-header-row">
                  <span className="ds-heading">To'lovlar tarixi</span>
                  <span className="ds-count">{(selectedClient.paymentHistory || []).length} ta</span>
                </div>
                <div className="payment-history-list">
                  {(selectedClient.paymentHistory || []).length === 0 ? (
                    <p className="empty-subtext">To'lovlar qayd etilmagan</p>
                  ) : (
                    (selectedClient.paymentHistory || []).map((p: any) => (
                      <div key={p.id} className="payment-history-item">
                        <div className="phi-row">
                          <span className="phi-amount">{p.amount}</span>
                          <span className="phi-method">{p.method}</span>
                        </div>
                        <span className="phi-date">{p.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CALL LOGS */}
              <div className="drawer-section">
                <div className="ds-header-row">
                  <span className="ds-heading">Qo'ng'iroq yozuvlari</span>
                  <span className="ds-count">{(selectedClient.callHistory || []).length} ta</span>
                </div>
                <div className="call-history-mini-list">
                  {(selectedClient.callHistory || []).length === 0 ? (
                    <p className="empty-subtext">Qo'ng'iroqlar tarixi yo'q</p>
                  ) : (
                    (selectedClient.callHistory || []).map((c: any) => (
                      <div key={c.id} className="call-log-item">
                        <RiPhoneLine size={14} className="cli-icon" />
                        <div className="cli-info">
                          <span className="cli-type">{c.type}</span>
                          <span className="cli-date">{c.date} • {c.duration}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD CLIENT MODAL */}
      {addModalOpen && (
        <div className="clients-modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="clients-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cm-header">
              <h3>Yangi mijoz qo'shish</h3>
              <button className="cm-close" onClick={() => setAddModalOpen(false)}><RiCloseLine size={20} /></button>
            </div>
            <div className="cm-body">
              <div className="cm-field">
                <label>Mijoz turi</label>
                <div className="type-toggle-row">
                  <button
                    type="button"
                    className={`type-btn ${newType === 'individual' ? 'active' : ''}`}
                    onClick={() => setNewType('individual')}
                  >
                    Jismoniy shaxs
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${newType === 'company' ? 'active' : ''}`}
                    onClick={() => setNewType('company')}
                  >
                    Kompaniya (B2B)
                  </button>
                </div>
              </div>
              <div className="cm-field">
                <label>F.I.SH / Mijoz ismi</label>
                <input
                  type="text"
                  placeholder="Masalan: Sardor Aliyev"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              {newType === 'company' && (
                <div className="cm-field">
                  <label>Kompaniya nomi</label>
                  <input
                    type="text"
                    placeholder="Masalan: Orient Express MCHJ"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                  />
                </div>
              )}
              <div className="cm-field">
                <label>Telefon raqami</label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="cm-footer">
              <button className="cm-btn-cancel" onClick={() => setAddModalOpen(false)}>Bekor qilish</button>
              <button className="cm-btn-submit" onClick={handleAddClient}>Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
