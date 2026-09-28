import React, { useState } from 'react';
import {
  RiShoppingBag3Line,
  RiServiceLine,
  RiSearchLine,
  RiAddLine,
  RiCloseLine,
  RiCheckLine,
  RiPriceTag3Line,
  RiDropboxLine,
  RiTimeLine,
  RiPercentLine,
  RiAlertLine,
  RiImageAddLine
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import './CatalogView.css';

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: string;
  sellPrice: string;
  stockQty: number;
  unit: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  image?: string;
}

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration: string; // e.g., '45 daqiqa'
  price: string;
  specialistSharePercent: number; // e.g., 40%
  description: string;
  image?: string;
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'p-1',
    sku: 'SN-PIPE-001',
    name: 'Polipropilen quvur 25mm (Santexnika)',
    category: 'Santexnika',
    costPrice: '14,000 UZS',
    sellPrice: '22,000 UZS',
    stockQty: 450,
    unit: 'metr',
    status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p-2',
    sku: 'SN-VALVE-04',
    name: 'Latun kran 1/2 dyuym (Italy style)',
    category: 'Santexnika',
    costPrice: '38,000 UZS',
    sellPrice: '62,000 UZS',
    stockQty: 8,
    unit: 'dona',
    status: 'low_stock',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p-3',
    sku: 'AV-FILTER-OIL',
    name: 'Moy filtri Mann W712 (Avtosalon & Servis)',
    category: 'Avtomobil ehtiyot qismlari',
    costPrice: '55,000 UZS',
    sellPrice: '85,000 UZS',
    stockQty: 84,
    unit: 'dona',
    status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p-4',
    sku: 'CS-SHAMP-PRO',
    name: "L'Oréal Professionnel Shampun 500ml",
    category: "Go'zallik kosmetikasi",
    costPrice: '140,000 UZS',
    sellPrice: '210,000 UZS',
    stockQty: 24,
    unit: 'flakon',
    status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'p-5',
    sku: 'ADV-BANNER-F',
    name: 'Frontlit Banner matosi 440g/m2 (3.2m)',
    category: 'Reklama materiallari',
    costPrice: '4,500 UZS',
    sellPrice: '8,000 UZS',
    stockQty: 0,
    unit: 'm2',
    status: 'out_of_stock',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80'
  }
];

const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 's-1',
    name: "To'liq Avtomobil Kompyuter Diagnostikasi",
    category: 'Avtoservis',
    duration: '45 daqiqa',
    price: '250,000 UZS',
    specialistSharePercent: 40,
    description: 'Dvigatel, korobka va sensorlarni professional skaner orqali tekshirish',
    image: '/products/diagnostic.svg'
  },
  {
    id: 's-2',
    name: 'Premium Soch turmagi va SPA parvarish',
    category: "Go'zallik saloni",
    duration: '60 daqiqa',
    price: '350,000 UZS',
    specialistSharePercent: 50,
    description: 'Bosh terisi massaji va professional uslub berish',
    image: '/products/spa.svg'
  },
  {
    id: 's-3',
    name: 'SMM va Kontent Marketing oylik paketi',
    category: 'Reklama agentligi',
    duration: '30 kun',
    price: '6,000,000 UZS',
    specialistSharePercent: 30,
    description: "15 ta post, 30 ta stories, target reklamani to'liq yuritish",
    image: '/products/smm.svg'
  },
  {
    id: 's-4',
    name: "Santexnika qozon (Kotel) o'rnatish va sozlash",
    category: 'Santexnika servisi',
    duration: '3 soat',
    price: '500,000 UZS',
    specialistSharePercent: 60,
    description: "Isitish tizimini to'liq ulash va xavfsizlik sinovlarini o'tkazish",
    image: '/products/kotel.svg'
  }
];

export default function CatalogView() {
  const { hasPermission } = useAuth();
  const [mode, setMode] = useState<'products' | 'services'>('products');
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New product form
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategory, setProdCategory] = useState('Santexnika');
  const [prodCost, setProdCost] = useState('');
  const [prodSell, setProdSell] = useState('');
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodUnit, setProdUnit] = useState('dona');
  const [prodImage, setProdImage] = useState('');

  // New service form
  const [servName, setServName] = useState('');
  const [servCategory, setServCategory] = useState('Avtoservis');
  const [servDuration, setServDuration] = useState('60 daqiqa');
  const [servPrice, setServPrice] = useState('');
  const [servShare, setServShare] = useState<number>(40);
  const [servDesc, setServDesc] = useState('');
  const [servImage, setServImage] = useState('');

  const handleAddItem = () => {
    if (mode === 'products') {
      if (!prodName || !prodSell) return;
      const newP: ProductItem = {
        id: `p-${Date.now()}`,
        sku: prodSku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: prodName,
        category: prodCategory,
        costPrice: prodCost ? `${prodCost} UZS` : '0 UZS',
        sellPrice: `${prodSell} UZS`,
        stockQty: Number(prodStock),
        unit: prodUnit,
        status: Number(prodStock) <= 0 ? 'out_of_stock' : Number(prodStock) < 10 ? 'low_stock' : 'in_stock',
        image: prodImage || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=200&auto=format&fit=crop&q=80'
      };
      setProducts([newP, ...products]);
      setToastMsg(`Yangi tovar omborga qo'shildi: ${newP.name}`);
      setProdName('');
      setProdSku('');
      setProdCost('');
      setProdSell('');
      setProdImage('');
    } else {
      if (!servName || !servPrice) return;
      const newS: ServiceItem = {
        id: `s-${Date.now()}`,
        name: servName,
        category: servCategory,
        duration: servDuration,
        price: `${servPrice} UZS`,
        specialistSharePercent: Number(servShare),
        description: servDesc,
        image: servImage || 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80'
      };
      setServices([newS, ...services]);
      setToastMsg(`Yangi xizmat qo'shildi: ${newS.name}`);
      setServName('');
      setServPrice('');
      setServDesc('');
      setServImage('');
    }

    setIsModalOpen(false);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="cat-page-container">
      {toastMsg && (
        <div className="cat-toast">
          <RiCheckLine size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP CONTROLS */}
      <div className="cat-top-bar">
        {/* MODE SWITCHER: TOVAR REJIMI VS XIZMAT REJIMI */}
        <div className="cat-mode-selector">
          <button
            className={`cms-btn ${mode === 'products' ? 'active' : ''}`}
            onClick={() => setMode('products')}
          >
            <RiShoppingBag3Line size={19} />
            <span>Tovar rejimi (Ombor & Mahsulotlar)</span>
          </button>
          <button
            className={`cms-btn ${mode === 'services' ? 'active' : ''}`}
            onClick={() => setMode('services')}
          >
            <RiServiceLine size={19} />
            <span>Xizmat rejimi (Servislar & Vaqt)</span>
          </button>
        </div>

        <div className="cat-actions">
          <div className="cat-search">
            <RiSearchLine size={18} className="cat-search-icon" />
            <input
              type="text"
              placeholder={mode === 'products' ? "Tovar nomi, SKU yoki toifa..." : "Xizmat nomi yoki toifa..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {hasPermission('catalog', 'create') && (
            <button className="add-cat-btn" onClick={() => setIsModalOpen(true)}>
              <RiAddLine size={20} />
              <span>{mode === 'products' ? "Tovar qo'shish" : "Xizmat qo'shish"}</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE CONTENT */}
      {mode === 'products' ? (
        <div className="cat-table-card">
          <table className="cat-table">
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th>Artikul (SKU)</th>
                <th>Kategoriya</th>
                <th>Tannarxi</th>
                <th>Sotuv narxi</th>
                <th>Ombordagi qoldiq</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="prod-cell">
                      <div className="prod-img-wrap">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="prod-img"
                          />
                        ) : (
                          <div className="prod-img-fallback">
                            <RiShoppingBag3Line size={22} />
                          </div>
                        )}
                      </div>
                      <div className="prod-cell-info">
                        <span className="prod-name">{p.name}</span>
                        <span className="prod-unit-badge">{p.unit}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="sku-badge">{p.sku}</span></td>
                  <td><span className="category-tag">{p.category}</span></td>
                  <td><span className="cost-sum">{p.costPrice}</span></td>
                  <td><span className="sell-sum">{p.sellPrice}</span></td>
                  <td>
                    <span className="stock-qty-text">
                      <b>{p.stockQty}</b> {p.unit}
                    </span>
                  </td>
                  <td>
                    <span className={`stock-status-chip ${p.status}`}>
                      {p.status === 'in_stock' ? 'Yetarli' : p.status === 'low_stock' ? 'Kam qolgan' : 'Tugagan'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cat-table-card">
          <table className="cat-table">
            <thead>
              <tr>
                <th>Xizmat</th>
                <th>Kategoriya</th>
                <th>Davomiyligi</th>
                <th>Belgilangan narx</th>
                <th>Mutaxassis ulushi (%)</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="prod-cell">
                      <div className="serv-img-wrap">
                        {s.image ? (
                          <img
                            src={s.image}
                            alt={s.name}
                            className="prod-img"
                          />
                        ) : (
                          <div className="serv-img-fallback">
                            <RiServiceLine size={22} />
                          </div>
                        )}
                      </div>
                      <div className="prod-cell-info">
                        <span className="prod-name">{s.name}</span>
                        <span className="service-desc-text">{s.description}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="category-tag">{s.category}</span></td>
                  <td>
                    <span className="duration-tag">
                      <RiTimeLine size={14} />
                      {s.duration}
                    </span>
                  </td>
                  <td><span className="sell-sum">{s.price}</span></td>
                  <td>
                    <span className="share-percent">
                      <RiPercentLine size={13} />
                      {s.specialistSharePercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD MODAL */}
      {isModalOpen && (
        <div className="cat-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="cat-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cat-m-header">
              <h3>{mode === 'products' ? "Yangi tovar kiritish (Ombor)" : "Yangi xizmat qo'shish"}</h3>
              <button className="cat-m-close" onClick={() => setIsModalOpen(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="cat-m-body">
              {mode === 'products' ? (
                <>
                  <div className="cat-form-group">
                    <label>Mahsulot nomi *</label>
                    <input
                      type="text"
                      placeholder="Masalan: Polipropilen quvur 25mm"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                    />
                  </div>
                  <div className="cat-form-row">
                    <div className="cat-form-group">
                      <label>SKU / Artikul</label>
                      <input
                        type="text"
                        placeholder="SN-001"
                        value={prodSku}
                        onChange={(e) => setProdSku(e.target.value)}
                      />
                    </div>
                    <div className="cat-form-group">
                      <label>Kategoriya</label>
                      <input
                        type="text"
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="cat-form-row">
                    <div className="cat-form-group">
                      <label>Tannarxi (UZS)</label>
                      <input
                        type="text"
                        placeholder="15000"
                        value={prodCost}
                        onChange={(e) => setProdCost(e.target.value)}
                      />
                    </div>
                    <div className="cat-form-group">
                      <label>Sotuv narxi (UZS) *</label>
                      <input
                        type="text"
                        placeholder="25000"
                        value={prodSell}
                        onChange={(e) => setProdSell(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="cat-form-row">
                    <div className="cat-form-group">
                      <label>Boshlang'ich qoldiq</label>
                      <input
                        type="number"
                        value={prodStock}
                        onChange={(e) => setProdStock(Number(e.target.value))}
                      />
                    </div>
                    <div className="cat-form-group">
                      <label>O'lchov birligi</label>
                      <select value={prodUnit} onChange={(e) => setProdUnit(e.target.value)}>
                        <option value="dona">dona</option>
                        <option value="metr">metr</option>
                        <option value="kg">kg</option>
                        <option value="m2">m2</option>
                        <option value="komplekt">komplekt</option>
                      </select>
                    </div>
                  </div>
                  <div className="cat-form-group">
                    <label>Rasm havolasi (URL)</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="cat-form-group">
                    <label>Xizmat nomi *</label>
                    <input
                      type="text"
                      placeholder="Masalan: Soch bo'yash yoki Motor diagnostikasi"
                      value={servName}
                      onChange={(e) => setServName(e.target.value)}
                    />
                  </div>
                  <div className="cat-form-row">
                    <div className="cat-form-group">
                      <label>Kategoriya</label>
                      <input
                        type="text"
                        value={servCategory}
                        onChange={(e) => setServCategory(e.target.value)}
                      />
                    </div>
                    <div className="cat-form-group">
                      <label>Davomiyligi</label>
                      <input
                        type="text"
                        placeholder="60 daqiqa"
                        value={servDuration}
                        onChange={(e) => setServDuration(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="cat-form-row">
                    <div className="cat-form-group">
                      <label>Xizmat narxi (UZS) *</label>
                      <input
                        type="text"
                        placeholder="300000"
                        value={servPrice}
                        onChange={(e) => setServPrice(e.target.value)}
                      />
                    </div>
                    <div className="cat-form-group">
                      <label>Mutaxassis ulushi (%)</label>
                      <input
                        type="number"
                        value={servShare}
                        onChange={(e) => setServShare(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="cat-form-group">
                    <label>Rasm havolasi (URL)</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={servImage}
                      onChange={(e) => setServImage(e.target.value)}
                    />
                  </div>
                  <div className="cat-form-group">
                    <label>Tavsif</label>
                    <textarea
                      rows={3}
                      placeholder="Xizmat haqida qisqacha ma'lumot..."
                      value={servDesc}
                      onChange={(e) => setServDesc(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="cat-m-footer">
              <button className="cat-btn-cancel" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
              <button className="cat-btn-submit" onClick={handleAddItem}>Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
