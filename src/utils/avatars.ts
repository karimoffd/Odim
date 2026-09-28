// ==================== COLORFUL ILLUSTRATED AVATARS LIBRARY ====================
// Modern flat vector avatars with vibrant colorful round backgrounds

export interface AvatarPreset {
  id: string;
  name: string;
  category: 'boys' | 'girls' | 'classic' | 'creative';
  defaultBg: string;
  renderSvg: (bgColor?: string) => string;
}

export const AVATAR_BG_COLORS = [
  { id: 'lime', name: 'Yashil (Asl)', hex: '#d9f99d', text: '#15803d' },
  { id: 'sky', name: 'Moviy osmon', hex: '#bae6fd', text: '#0284c7' },
  { id: 'pink', name: 'Pushti', hex: '#fbcfe8', text: '#db2777' },
  { id: 'peach', name: 'Shaftoli', hex: '#fed7aa', text: '#ea580c' },
  { id: 'purple', name: 'Binafsha', hex: '#e9d5ff', text: '#9333ea' },
  { id: 'yellow', name: 'Quyosh sariq', hex: '#fef08a', text: '#ca8a04' },
  { id: 'mint', name: 'Yalpiz yashil', hex: '#a7f3d0', text: '#059669' },
  { id: 'lavender', name: 'Siren', hex: '#ddd6fe', text: '#7c3aed' },
  { id: 'rose', name: 'Atirgul', hex: '#fecdd3', text: '#e11d48' },
  { id: 'teal', name: 'Feruza', hex: '#99f6e4', text: '#0d9488' },
  { id: 'amber', name: 'Oltin rang', hex: '#fde68a', text: '#d97706' },
  { id: 'dark', name: 'Zamonaviy qora', hex: '#334155', text: '#f8fafc' },
];

export const AVATAR_PRESETS: AvatarPreset[] = [
  // 1. EXACT USER STYLE (Green cap, golden face, green shirt on light lime)
  {
    id: 'ava-green-cap',
    name: 'Yashil kepkali (Asl nusxa)',
    category: 'boys',
    defaultBg: '#d9f99d',
    renderSvg: (bg = '#d9f99d') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 24 96 C 24 76, 34 70, 50 70 C 66 70, 76 76, 76 96 Z" fill="#16a34a" />
        <path d="M 42 70 L 50 78 L 58 70 Z" fill="#15803d" />
        <rect x="44" y="58" width="12" height="14" rx="4" fill="#eab308" />
        <circle cx="50" cy="44" r="21" fill="#facc15" />
        <circle cx="39" cy="48" r="3.5" fill="#f59e0b" opacity="0.6" />
        <circle cx="61" cy="48" r="3.5" fill="#f59e0b" opacity="0.6" />
        <circle cx="43" cy="43" r="2.8" fill="#1e293b" />
        <circle cx="57" cy="43" r="2.8" fill="#1e293b" />
        <circle cx="44" cy="42" r="0.9" fill="#ffffff" />
        <circle cx="58" cy="42" r="0.9" fill="#ffffff" />
        <path d="M 45 50 Q 50 55 55 50" stroke="#78350f" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <path d="M 31 38 C 31 23, 69 23, 69 38 Z" fill="#15803d" />
        <path d="M 28 37 C 28 34, 72 34, 72 37 C 72 40, 28 40, 28 37 Z" fill="#166534" />
        <ellipse cx="50" cy="24" rx="3" ry="1.8" fill="#14532d" />
        <rect x="65" y="78" width="13" height="18" rx="3" fill="#db2777" transform="rotate(-15 65 78)" />
        <rect x="67" y="80" width="9" height="14" rx="2" fill="#fdf2f8" transform="rotate(-15 65 78)" />
      </svg>
    `)}`
  },

  // 2. Cyan Glasses & Orange Sweater
  {
    id: 'ava-cyan-glasses',
    name: "Ko'zoynakli dasturchi",
    category: 'creative',
    defaultBg: '#bae6fd',
    renderSvg: (bg = '#bae6fd') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 23 96 C 23 75, 34 68, 50 68 C 66 68, 77 75, 77 96 Z" fill="#ea580c" />
        <rect x="44" y="56" width="12" height="14" rx="4" fill="#fcd34d" />
        <circle cx="50" cy="42" r="21" fill="#fed7aa" />
        <path d="M 29 38 C 29 20, 71 18, 71 36 C 66 28, 55 24, 45 27 C 38 29, 32 33, 29 38 Z" fill="#0f172a" />
        <rect x="35" y="38" width="12" height="10" rx="3" fill="none" stroke="#0284c7" stroke-width="2.5" />
        <rect x="53" y="38" width="12" height="10" rx="3" fill="none" stroke="#0284c7" stroke-width="2.5" />
        <path d="M 47 43 L 53 43" stroke="#0284c7" stroke-width="2.5" />
        <circle cx="41" cy="43" r="2" fill="#0f172a" />
        <circle cx="59" cy="43" r="2" fill="#0f172a" />
        <path d="M 46 51 Q 50 55 54 51" stroke="#9a3412" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },

  // 3. Pink Headphones Girl
  {
    id: 'ava-pink-headphones',
    name: 'Musiqiy qizaloq',
    category: 'girls',
    defaultBg: '#fbcfe8',
    renderSvg: (bg = '#fbcfe8') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 25 96 C 25 76, 35 70, 50 70 C 65 70, 75 76, 75 96 Z" fill="#9d174d" />
        <path d="M 28 42 C 28 62, 36 68, 36 68 L 64 68 C 64 68, 72 62, 72 42 Z" fill="#581c87" />
        <circle cx="50" cy="43" r="20" fill="#fef08a" />
        <path d="M 30 40 C 30 22, 70 22, 70 40 C 64 30, 54 28, 45 31 C 36 34, 32 38, 30 40 Z" fill="#6b21a8" />
        <circle cx="41" cy="47" r="3" fill="#f472b6" opacity="0.6" />
        <circle cx="59" cy="47" r="3" fill="#f472b6" opacity="0.6" />
        <circle cx="43" cy="43" r="2.5" fill="#1e1b4b" />
        <circle cx="57" cy="43" r="2.5" fill="#1e1b4b" />
        <path d="M 46 50 Q 50 54 54 50" stroke="#831843" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 27 45 C 27 24, 73 24, 73 45" stroke="#ec4899" stroke-width="4.5" fill="none" stroke-linecap="round" />
        <rect x="24" y="38" width="7" height="15" rx="3.5" fill="#db2777" />
        <rect x="69" y="38" width="7" height="15" rx="3.5" fill="#db2777" />
      </svg>
    `)}`
  },

  // 4. Hipster Beanie & Beard
  {
    id: 'ava-orange-beanie',
    name: 'Soqolli usta (Hipster)',
    category: 'boys',
    defaultBg: '#fed7aa',
    renderSvg: (bg = '#fed7aa') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 24 96 C 24 76, 35 69, 50 69 C 65 69, 76 76, 76 96 Z" fill="#1e3a8a" />
        <circle cx="50" cy="44" r="20" fill="#fed7aa" />
        <path d="M 33 46 C 33 66, 67 66, 67 46 C 67 56, 61 62, 50 62 C 39 62, 33 56, 33 46 Z" fill="#451a03" />
        <circle cx="43" cy="41" r="2.5" fill="#1e293b" />
        <circle cx="57" cy="41" r="2.5" fill="#1e293b" />
        <path d="M 46 51 Q 50 55 54 51" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <path d="M 31 38 C 31 20, 69 20, 69 38 Z" fill="#c2410c" />
        <rect x="29" y="34" width="42" height="8" rx="4" fill="#ea580c" />
      </svg>
    `)}`
  },

  // 5. Purple High Bun Stylist
  {
    id: 'ava-purple-bun',
    name: 'Chiroyli stilist qiz',
    category: 'girls',
    defaultBg: '#e9d5ff',
    renderSvg: (bg = '#e9d5ff') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 24 96 C 24 76, 35 70, 50 70 C 65 70, 76 76, 76 96 Z" fill="#7e22ce" />
        <circle cx="50" cy="45" r="20" fill="#fde047" />
        <circle cx="40" cy="48" r="3" fill="#f59e0b" opacity="0.6" />
        <circle cx="60" cy="48" r="3" fill="#f59e0b" opacity="0.6" />
        <circle cx="43" cy="43" r="2.4" fill="#0f172a" />
        <circle cx="57" cy="43" r="2.4" fill="#0f172a" />
        <path d="M 46 50 Q 50 54 54 50" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 30 42 C 30 24, 70 24, 70 42 C 65 30, 55 27, 50 27 C 45 27, 35 30, 30 42 Z" fill="#312e81" />
        <circle cx="50" cy="20" r="10" fill="#312e81" />
        <ellipse cx="50" cy="26" rx="6" ry="2" fill="#f59e0b" />
      </svg>
    `)}`
  },

  // 6. Yellow Afro & Green Glasses
  {
    id: 'ava-yellow-curly',
    name: 'Ijodkor jingalak soch',
    category: 'creative',
    defaultBg: '#fef08a',
    renderSvg: (bg = '#fef08a') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 23 96 C 23 76, 34 69, 50 69 C 66 69, 77 76, 77 96 Z" fill="#0d9488" />
        <circle cx="34" cy="34" r="12" fill="#78350f" />
        <circle cx="66" cy="34" r="12" fill="#78350f" />
        <circle cx="50" cy="26" r="14" fill="#78350f" />
        <circle cx="33" cy="46" r="10" fill="#78350f" />
        <circle cx="67" cy="46" r="10" fill="#78350f" />
        <circle cx="50" cy="44" r="20" fill="#fed7aa" />
        <circle cx="42" cy="42" r="6" fill="none" stroke="#059669" stroke-width="2.5" />
        <circle cx="58" cy="42" r="6" fill="none" stroke="#059669" stroke-width="2.5" />
        <path d="M 48 42 L 52 42" stroke="#059669" stroke-width="2.5" />
        <circle cx="42" cy="42" r="2" fill="#0f172a" />
        <circle cx="58" cy="42" r="2" fill="#0f172a" />
        <path d="M 45 52 Q 50 56 55 52" stroke="#9a3412" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },

  // 7. Red Cap Backwards
  {
    id: 'ava-red-cap-back',
    name: "Sportchi yigit",
    category: 'boys',
    defaultBg: '#ddd6fe',
    renderSvg: (bg = '#ddd6fe') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 23 96 C 23 75, 34 68, 50 68 C 66 68, 77 75, 77 96 Z" fill="#2563eb" />
        <circle cx="50" cy="43" r="20" fill="#facc15" />
        <path d="M 31 38 C 31 22, 69 22, 69 38 Z" fill="#dc2626" />
        <path d="M 43 38 L 57 38 L 54 44 L 46 44 Z" fill="#991b1b" />
        <circle cx="41" cy="47" r="3" fill="#f59e0b" opacity="0.6" />
        <circle cx="59" cy="47" r="3" fill="#f59e0b" opacity="0.6" />
        <circle cx="43" cy="42" r="2.5" fill="#1e293b" />
        <path d="M 54 42 Q 58 39 61 42" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <path d="M 46 50 Q 50 56 55 50" stroke="#78350f" stroke-width="2.2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },

  // 8. Emerald Smart Professional
  {
    id: 'ava-emerald-smart',
    name: 'Biznes mutaxassis',
    category: 'classic',
    defaultBg: '#a7f3d0',
    renderSvg: (bg = '#a7f3d0') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 24 96 C 24 76, 35 69, 50 69 C 65 69, 76 76, 76 96 Z" fill="#047857" />
        <path d="M 44 69 L 50 77 L 56 69 Z" fill="#ffffff" />
        <circle cx="50" cy="43" r="20" fill="#fef08a" />
        <path d="M 31 38 C 31 22, 69 22, 69 36 C 65 27, 54 25, 42 27 C 36 29, 33 33, 31 38 Z" fill="#1e293b" />
        <rect x="36" y="38" width="11" height="9" rx="2.5" fill="none" stroke="#1e3a8a" stroke-width="2.2" />
        <rect x="53" y="38" width="11" height="9" rx="2.5" fill="none" stroke="#1e3a8a" stroke-width="2.2" />
        <path d="M 47 42 L 53 42" stroke="#1e3a8a" stroke-width="2.2" />
        <circle cx="41.5" cy="42.5" r="1.8" fill="#1e293b" />
        <circle cx="58.5" cy="42.5" r="1.8" fill="#1e293b" />
        <path d="M 46 51 Q 50 54 54 51" stroke="#854d0e" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },

  // 9. Magenta Double Buns Girl
  {
    id: 'ava-magenta-double-buns',
    name: 'Quvnoq qizaloq',
    category: 'girls',
    defaultBg: '#fce7f3',
    renderSvg: (bg = '#fce7f3') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 25 96 C 25 76, 35 70, 50 70 C 65 70, 75 76, 75 96 Z" fill="#db2777" />
        <circle cx="28" cy="26" r="9" fill="#831843" />
        <circle cx="72" cy="26" r="9" fill="#831843" />
        <circle cx="50" cy="44" r="20" fill="#fde047" />
        <path d="M 31 38 C 31 24, 69 24, 69 38 C 65 29, 58 27, 50 27 C 42 27, 35 29, 31 38 Z" fill="#831843" />
        <circle cx="39" cy="48" r="3.5" fill="#f43f5e" opacity="0.6" />
        <circle cx="61" cy="48" r="3.5" fill="#f43f5e" opacity="0.6" />
        <circle cx="43" cy="42" r="2.5" fill="#0f172a" />
        <circle cx="57" cy="42" r="2.5" fill="#0f172a" />
        <path d="M 45 49 Q 50 55 55 49" stroke="#9f1239" stroke-width="2.2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },

  // 10. Cyber Electric Coder
  {
    id: 'ava-blue-cyber',
    name: 'Kiber dasturchi',
    category: 'creative',
    defaultBg: '#bfdbfe',
    renderSvg: (bg = '#bfdbfe') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 23 96 C 23 75, 34 68, 50 68 C 66 68, 77 75, 77 96 Z" fill="#1e1b4b" />
        <circle cx="50" cy="43" r="20" fill="#fed7aa" />
        <path d="M 28 36 L 35 22 L 44 26 L 50 18 L 57 26 L 66 22 L 72 36 Z" fill="#0284c7" />
        <path d="M 33 39 L 67 39 L 64 47 L 36 47 Z" fill="#0f172a" />
        <path d="M 35 43 L 65 43" stroke="#38bdf8" stroke-width="2" />
        <path d="M 46 52 Q 50 55 54 52" stroke="#9a3412" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },

  // 11. Amber Executive Leader
  {
    id: 'ava-amber-leader',
    name: 'Boshqaruvchi / Rahbar',
    category: 'classic',
    defaultBg: '#fde68a',
    renderSvg: (bg = '#fde68a') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 24 96 C 24 75, 34 68, 50 68 C 66 68, 76 75, 76 96 Z" fill="#1e293b" />
        <path d="M 43 68 L 50 82 L 57 68 Z" fill="#ffffff" />
        <polygon points="48,72 52,72 51,88 49,88" fill="#dc2626" />
        <circle cx="50" cy="42" r="20" fill="#facc15" />
        <path d="M 31 36 C 31 20, 69 20, 69 36 C 64 25, 50 22, 40 25 C 34 27, 32 31, 31 36 Z" fill="#0f172a" />
        <circle cx="43" cy="42" r="2.5" fill="#0f172a" />
        <circle cx="57" cy="42" r="2.5" fill="#0f172a" />
        <path d="M 45 50 Q 50 54 55 50" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },

  // 12. Support / Cashier Operator
  {
    id: 'ava-teal-support',
    name: 'Kassir / Operator',
    category: 'classic',
    defaultBg: '#ccfbf1',
    renderSvg: (bg = '#ccfbf1') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 24 96 C 24 76, 35 70, 50 70 C 65 70, 76 76, 76 96 Z" fill="#0284c7" />
        <circle cx="50" cy="43" r="20" fill="#fde047" />
        <path d="M 30 40 C 30 22, 70 22, 70 40 C 64 30, 54 26, 45 29 C 36 32, 32 36, 30 40 Z" fill="#475569" />
        <path d="M 28 45 C 28 26, 72 26, 72 45" stroke="#0f172a" stroke-width="3.5" fill="none" stroke-linecap="round" />
        <circle cx="28" cy="46" r="4" fill="#0f172a" />
        <path d="M 28 46 Q 34 58 44 56" stroke="#0f172a" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <circle cx="44" cy="56" r="3" fill="#0284c7" />
        <circle cx="43" cy="42" r="2.4" fill="#0f172a" />
        <circle cx="57" cy="42" r="2.4" fill="#0f172a" />
        <path d="M 46 49 Q 50 54 54 49" stroke="#854d0e" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },

  // 13. French Beret Artist
  {
    id: 'ava-coral-beret',
    name: 'Fransuzcha beretkacha',
    category: 'creative',
    defaultBg: '#fed7aa',
    renderSvg: (bg = '#fed7aa') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 24 96 C 24 76, 35 70, 50 70 C 65 70, 76 76, 76 96 Z" fill="#f43f5e" />
        <circle cx="50" cy="44" r="20" fill="#fef08a" />
        <circle cx="43" cy="43" r="2.5" fill="#1e293b" />
        <circle cx="57" cy="43" r="2.5" fill="#1e293b" />
        <path d="M 46 51 Q 50 55 54 51" stroke="#9f1239" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 26 34 C 28 16, 74 18, 76 34 C 70 38, 30 38, 26 34 Z" fill="#b91c1c" transform="rotate(-6 50 30)" />
        <circle cx="50" cy="18" r="2.5" fill="#7f1d1d" />
      </svg>
    `)}`
  },

  // 14. Wireless Earbuds Techie
  {
    id: 'ava-violet-airpods',
    name: 'AirPods li mutaxassis',
    category: 'boys',
    defaultBg: '#f3e8ff',
    renderSvg: (bg = '#f3e8ff') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 23 96 C 23 76, 34 69, 50 69 C 66 69, 77 76, 77 96 Z" fill="#ca8a04" />
        <circle cx="50" cy="43" r="20" fill="#fed7aa" />
        <path d="M 31 36 C 31 20, 69 20, 69 36 C 65 26, 52 23, 44 25 C 36 27, 33 31, 31 36 Z" fill="#18181b" />
        <ellipse cx="30" cy="46" rx="2.5" ry="4" fill="#ffffff" />
        <rect x="29" y="47" width="2" height="6" rx="1" fill="#ffffff" />
        <ellipse cx="70" cy="46" rx="2.5" ry="4" fill="#ffffff" />
        <rect x="69" y="47" width="2" height="6" rx="1" fill="#ffffff" />
        <circle cx="43" cy="42" r="2.4" fill="#0f172a" />
        <circle cx="57" cy="42" r="2.4" fill="#0f172a" />
        <path d="M 46 50 Q 50 54 54 50" stroke="#9a3412" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },

  // 15. Spring Meadow Flower Hairpin
  {
    id: 'ava-green-flower',
    name: 'Gulli sochli qiz',
    category: 'girls',
    defaultBg: '#dcfce7',
    renderSvg: (bg = '#dcfce7') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 24 96 C 24 76, 35 70, 50 70 C 65 70, 76 76, 76 96 Z" fill="#15803d" />
        <path d="M 27 45 C 27 65, 36 72, 36 72 L 64 72 C 64 72, 73 65, 73 45 Z" fill="#064e3b" />
        <circle cx="50" cy="44" r="20" fill="#fef08a" />
        <path d="M 30 40 C 30 22, 70 22, 70 40 C 62 28, 52 26, 44 29 C 36 32, 32 36, 30 40 Z" fill="#047857" />
        <circle cx="67" cy="33" r="5" fill="#f43f5e" />
        <circle cx="67" cy="33" r="2" fill="#fef08a" />
        <circle cx="39" cy="48" r="3" fill="#f59e0b" opacity="0.6" />
        <circle cx="61" cy="48" r="3.5" fill="#f59e0b" opacity="0.6" />
        <circle cx="43" cy="43" r="2.5" fill="#022c22" />
        <circle cx="57" cy="43" r="2.5" fill="#022c22" />
        <path d="M 46 50 Q 50 55 54 50" stroke="#854d0e" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },

  // 16. Violet Gamer / Designer
  {
    id: 'ava-indigo-developer',
    name: 'Grafik dizayner',
    category: 'creative',
    defaultBg: '#e0e7ff',
    renderSvg: (bg = '#e0e7ff') => `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="${bg}" />
        <path d="M 23 96 C 23 75, 34 68, 50 68 C 66 68, 77 75, 77 96 Z" fill="#4338ca" />
        <circle cx="50" cy="43" r="20" fill="#fed7aa" />
        <path d="M 29 36 C 29 18, 71 18, 71 36 C 62 25, 52 23, 44 26 C 36 29, 32 32, 29 36 Z" fill="#1e1b4b" />
        <rect x="35" y="38" width="12" height="10" rx="3" fill="none" stroke="#7c3aed" stroke-width="2.5" />
        <rect x="53" y="38" width="12" height="10" rx="3" fill="none" stroke="#7c3aed" stroke-width="2.5" />
        <path d="M 47 43 L 53 43" stroke="#7c3aed" stroke-width="2.5" />
        <circle cx="41" cy="43" r="2" fill="#1e1b4b" />
        <circle cx="59" cy="43" r="2" fill="#1e1b4b" />
        <path d="M 46 51 Q 50 55 54 51" stroke="#9a3412" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `)}`
  },
];

export const getDefaultAvatar = (presetId = 'ava-green-cap', bgColor?: string): string => {
  const preset = AVATAR_PRESETS.find(p => p.id === presetId) || AVATAR_PRESETS[0];
  return preset.renderSvg(bgColor || preset.defaultBg);
};

export const getAvatarByInitial = (name?: string): string => {
  if (!name) return AVATAR_PRESETS[0].renderSvg();
  const charCode = name.charCodeAt(0) || 0;
  const index = charCode % AVATAR_PRESETS.length;
  return AVATAR_PRESETS[index].renderSvg();
};
