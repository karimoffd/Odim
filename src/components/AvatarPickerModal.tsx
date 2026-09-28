import React, { useState, useRef } from 'react';
import {
  AVATAR_PRESETS,
  AVATAR_BG_COLORS,
  getDefaultAvatar
} from '../utils/avatars';
import {
  TbX,
  TbUpload,
  TbCheck,
  TbTrash,
  TbPalette,
  TbSparkles
} from 'react-icons/tb';
import './AvatarPickerModal.css';

interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatar?: string;
  userName?: string;
  onClose: () => void;
  onSave: (newAvatar: string) => Promise<void> | void;
}

export default function AvatarPickerModal({
  isOpen,
  currentAvatar,
  userName = 'Foydalanuvchi',
  onClose,
  onSave
}: AvatarPickerModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ava-green-cap');
  const [selectedBg, setSelectedBg] = useState<string>('#d9f99d');
  const [customImageData, setCustomImageData] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize preview on modal open
  React.useEffect(() => {
    if (isOpen) {
      if (currentAvatar) {
        if (currentAvatar.startsWith('data:image/svg+xml') || currentAvatar.startsWith('http')) {
          // Check if it matches any preset
          const matched = AVATAR_PRESETS.find(p => p.renderSvg(p.defaultBg) === currentAvatar);
          if (matched) {
            setSelectedPresetId(matched.id);
            setSelectedBg(matched.defaultBg);
            setCustomImageData(null);
          } else {
            setCustomImageData(currentAvatar);
          }
        } else {
          setCustomImageData(currentAvatar);
        }
      } else {
        setSelectedPresetId('ava-green-cap');
        setSelectedBg('#d9f99d');
        setCustomImageData(null);
      }
    }
  }, [isOpen, currentAvatar]);

  if (!isOpen) return null;

  // Active preview image
  const currentPreview = customImageData
    ? customImageData
    : getDefaultAvatar(selectedPresetId, selectedBg);

  const activePresetObj = AVATAR_PRESETS.find(p => p.id === selectedPresetId) || AVATAR_PRESETS[0];

  const filteredPresets = AVATAR_PRESETS.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const handleSelectPreset = (id: string, defBg: string) => {
    setSelectedPresetId(id);
    setSelectedBg(defBg);
    setCustomImageData(null);
  };

  const handleSelectBg = (hex: string) => {
    setSelectedBg(hex);
    setCustomImageData(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, size, size, 0, 0, 256, 256);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setCustomImageData(compressed);
        }
      };
      img.src = loadEvt.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToInitials = async () => {
    setIsSaving(true);
    try {
      await onSave('');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(currentPreview);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="apm-overlay" onClick={onClose}>
      <div className="apm-card" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="apm-header">
          <div className="apm-title-group">
            <h3>Profil uchun rang-barang avatar tanlang</h3>
            <p>O'zingizga yoqqan rasmni yoki orqa fon rangini tanlang</p>
          </div>
          <button className="apm-close-btn" onClick={onClose} title="Yopish">
            <TbX size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="apm-body">
          {/* TOP LIVE PREVIEW BOX */}
          <div className="apm-preview-box">
            <div className="apm-preview-circle">
              <img src={currentPreview} alt={userName} />
            </div>

            <div className="apm-preview-info">
              {!customImageData ? (
                <div>
                  <div className="apm-color-swatches-title">
                    <TbPalette size={14} />
                    <span>Orqa fon rangini almashtirish:</span>
                  </div>
                  <div className="apm-color-swatches">
                    {AVATAR_BG_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={`apm-color-swatch ${selectedBg === c.hex ? 'active' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => handleSelectBg(c.hex)}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="apm-color-swatches-title">
                  <TbSparkles size={14} />
                  <span>Maxsus rasm yuklangan</span>
                </div>
              )}
            </div>
          </div>

          {/* CATEGORY TABS */}
          <div className="apm-category-tabs">
            <button
              type="button"
              className={`apm-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <TbSparkles size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
              Barchasi ({AVATAR_PRESETS.length})
            </button>
            <button
              type="button"
              className={`apm-tab-btn ${activeCategory === 'boys' ? 'active' : ''}`}
              onClick={() => setActiveCategory('boys')}
            >
              O'g'il bolalar
            </button>
            <button
              type="button"
              className={`apm-tab-btn ${activeCategory === 'girls' ? 'active' : ''}`}
              onClick={() => setActiveCategory('girls')}
            >
              Qizlar
            </button>
            <button
              type="button"
              className={`apm-tab-btn ${activeCategory === 'classic' ? 'active' : ''}`}
              onClick={() => setActiveCategory('classic')}
            >
              Klassik & Biznes
            </button>
            <button
              type="button"
              className={`apm-tab-btn ${activeCategory === 'creative' ? 'active' : ''}`}
              onClick={() => setActiveCategory('creative')}
            >
              Ijodiy
            </button>
          </div>

          {/* PRESETS GRID */}
          <div className="apm-grid">
            {filteredPresets.map(p => {
              const isSelected = !customImageData && selectedPresetId === p.id;
              // Render with chosen color if selected, else default
              const previewSvg = p.renderSvg(isSelected ? selectedBg : p.defaultBg);

              return (
                <div
                  key={p.id}
                  className={`apm-grid-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(p.id, p.defaultBg)}
                >
                  <img src={previewSvg} alt="Avatar" className="apm-grid-img" />
                  {isSelected && (
                    <div className="apm-check-badge">
                      <TbCheck size={12} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* UPLOAD & RESET ROW */}
          <div className="apm-upload-row">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="apm-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <TbUpload size={16} />
                <span>O'z rasmingizni yuklash</span>
              </button>
            </div>

            {currentAvatar && (
              <button
                type="button"
                className="apm-reset-btn"
                onClick={handleResetToInitials}
                title="Avatarni o'chirish va bosh harflarga qaytarish"
              >
                <TbTrash size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                <span>Avatarni o'chirish</span>
              </button>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="apm-footer">
          <button type="button" className="apm-btn-cancel" onClick={onClose}>
            Bekor qilish
          </button>
          <button
            type="button"
            className="apm-btn-save"
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Saqlanmoqda..." : "Avatarni saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
