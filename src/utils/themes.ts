export type ThemeId =
  | 'ajinomoto-classic'
  | 'midnight-factory'
  | 'executive-royal'
  | 'emerald-kaizen'
  | 'obsidian-gold'
  | 'nordic-cyber';

export interface ThemeDefinition {
  id: ThemeId;
  mode: 'light' | 'dark';
  name: {
    id: string;
    en: string;
  };
  category: {
    id: string;
    en: string;
  };
  tagline: {
    id: string;
    en: string;
  };
  swatches: {
    canvas: string;
    surface: string;
    sidebar: string;
    accent: string;
    accentSecondary: string;
    border: string;
    text: string;
  };
  chartAccent: string;
  chartAccentLight: string;
}

export const ENTERPRISE_THEMES: ThemeDefinition[] = [
  {
    id: 'ajinomoto-classic',
    mode: 'light',
    name: {
      id: 'Ajinomoto Corporate',
      en: 'Ajinomoto Corporate',
    },
    category: {
      id: 'Terang • Standar Korporat',
      en: 'Light • Corporate Standard',
    },
    tagline: {
      id: 'Presisi korporat resmi dengan aksen merah khas Ajinomoto & kanvas bersih.',
      en: 'Official corporate precision with signature Ajinomoto crimson & crisp alabaster canvas.',
    },
    swatches: {
      canvas: '#f1f5f9',
      surface: '#ffffff',
      sidebar: '#ffffff',
      accent: '#dc2626',
      accentSecondary: '#b91c1c',
      border: '#e2e8f0',
      text: '#0f172a',
    },
    chartAccent: '#dc2626',
    chartAccentLight: '#fecaca',
  },
  {
    id: 'executive-royal',
    mode: 'light',
    name: {
      id: 'Executive Sapphire',
      en: 'Executive Sapphire',
    },
    category: {
      id: 'Terang • Ruang Direksi',
      en: 'Light • Boardroom Analytics',
    },
    tagline: {
      id: 'Nuansa biru safir institusional dengan kontras tinggi untuk analitik manajemen.',
      en: 'Institutional royal sapphire with crisp platinum contrast for executive analytics.',
    },
    swatches: {
      canvas: '#eef2f8',
      surface: '#ffffff',
      sidebar: '#f8fafd',
      accent: '#1d4ed8',
      accentSecondary: '#1e40af',
      border: '#dbe4f0',
      text: '#0f172a',
    },
    chartAccent: '#2563eb',
    chartAccentLight: '#bfdbfe',
  },
  {
    id: 'emerald-kaizen',
    mode: 'light',
    name: {
      id: 'Kaizen Emerald',
      en: 'Kaizen Emerald',
    },
    category: {
      id: 'Terang • Lean & ASV',
      en: 'Light • Lean & Sustainability',
    },
    tagline: {
      id: 'Terinspirasi filosofi Ajinomoto ASV & Lean Manufacturing yang tenang di mata.',
      en: 'Inspired by Ajinomoto ASV & Lean Manufacturing with serene mineral tones.',
    },
    swatches: {
      canvas: '#eff5f2',
      surface: '#ffffff',
      sidebar: '#f6faf8',
      accent: '#047857',
      accentSecondary: '#065f46',
      border: '#d5e5dd',
      text: '#0f1f1a',
    },
    chartAccent: '#059669',
    chartAccentLight: '#a7f3d0',
  },
  {
    id: 'midnight-factory',
    mode: 'dark',
    name: {
      id: 'Midnight Operations',
      en: 'Midnight Operations',
    },
    category: {
      id: 'Gelap • Kontrol Shift Malam',
      en: 'Dark • Night Shift Console',
    },
    tagline: {
      id: 'Mode gelap kontrol pabrik 24/7 dengan aksen merah sinyal berkejelasan tinggi.',
      en: '24/7 factory floor dark command deck with high-clarity crimson telemetry.',
    },
    swatches: {
      canvas: '#070b14',
      surface: '#0c1220',
      sidebar: '#090e1a',
      accent: '#e11d48',
      accentSecondary: '#be123c',
      border: '#1e293b',
      text: '#f8fafc',
    },
    chartAccent: '#ef4444',
    chartAccentLight: '#991b1b',
  },
  {
    id: 'obsidian-gold',
    mode: 'dark',
    name: {
      id: 'Obsidian Executive',
      en: 'Obsidian Executive',
    },
    category: {
      id: 'Gelap • C-Suite Premium',
      en: 'Dark • Executive Suite',
    },
    tagline: {
      id: 'Permukaan karbon gelap murni berpadu aksen emas hangat untuk presentasi direksi.',
      en: 'Pure carbon slate surfaces paired with refined executive gold accents.',
    },
    swatches: {
      canvas: '#09090b',
      surface: '#131317',
      sidebar: '#0e0e12',
      accent: '#d97706',
      accentSecondary: '#b45309',
      border: '#27272a',
      text: '#fafafa',
    },
    chartAccent: '#f59e0b',
    chartAccentLight: '#92400e',
  },
  {
    id: 'nordic-cyber',
    mode: 'dark',
    name: {
      id: 'Nordic Indigo',
      en: 'Nordic Indigo',
    },
    category: {
      id: 'Gelap • Enterprise Modern',
      en: 'Dark • Modern Enterprise',
    },
    tagline: {
      id: 'Palet slate arktik modern dengan aksen indigo presisi dan minim kelelahan mata.',
      en: 'Modern arctic slate canvas with precision indigo accents for extended sessions.',
    },
    swatches: {
      canvas: '#0a101f',
      surface: '#11192e',
      sidebar: '#0d1426',
      accent: '#4f46e5',
      accentSecondary: '#4338ca',
      border: '#1e2c4a',
      text: '#f1f5f9',
    },
    chartAccent: '#6366f1',
    chartAccentLight: '#3730a3',
  },
];

export const DEFAULT_LIGHT_THEME: ThemeId = 'ajinomoto-classic';
export const DEFAULT_DARK_THEME: ThemeId = 'midnight-factory';

export function getThemeDefinition(themeId: string | null | undefined): ThemeDefinition {
  const found = ENTERPRISE_THEMES.find((t) => t.id === themeId);
  return found || ENTERPRISE_THEMES[0];
}

export function isValidThemeId(value: string | null | undefined): value is ThemeId {
  return ENTERPRISE_THEMES.some((t) => t.id === value);
}
