export interface Theme {
  id: string;
  name: string;
  boardBg: string;
  boardBorder: string;
  boardLineColor: string;
  lineColor: string; // Keep for backward compatibility or as a fallback
  lineWidth: number;
  pointColor: string;
  pointHoverColor: string;
  nodeInnerColor: string;
  titleColor: string;
  headingColor: string;
  textColor: string;
  whitePiece: {
    bg: string;
    border: string;
    shadow: string;
    content?: string;
    color?: string;
  };
  blackPiece: {
    bg: string;
    border: string;
    shadow: string;
    content?: string;
    color?: string;
  };
  appBackground: string;
  headerBg: string;
  cardBg: string;
  accentColor: string;
  mutedColor: string;
  isDark: boolean;
  gameModes: {
    ai: { color: string; bg: string };
    local: { color: string; bg: string };
    online: { color: string; bg: string };
  };
  scoreboardGradient?: string;
  chatGradient?: string;
  bgImage?: string;
  bgImageOpacity?: number;
  boardImage?: string;
  whitePlayerName?: string;
  blackPlayerName?: string;
}

export const THEMES: Theme[] = [
  {
    id: 'classic',
    name: 'Classic Pro',
    boardBg: '#d4a574',
    boardBorder: '#5a9aa8',
    boardLineColor: '#3d2914',
    lineColor: '#ffffff',
    lineWidth: 3,
    pointColor: '#ffffff',
    pointHoverColor: '#5a3d1a',
    nodeInnerColor: '#ffffff',
    titleColor: '#ffffff',
    headingColor: '#ffffff',
    textColor: '#ffffff',
    whitePiece: {
      bg: 'radial-gradient(ellipse at 30% 20%, #ffffff 0%, #f5f5f5 40%, #e8e8e8 70%, #d9d9d9 100%)',
      border: '#c5c5c5',
      shadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.8)',
    },
    blackPiece: {
      bg: 'radial-gradient(ellipse at 30% 20%, #4a4a4a 0%, #3a3a3a 40%, #2a2a2a 70%, #1a1a1a 100%)',
      border: '#0a0a0a',
      shadow: '0 4px 8px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(100,100,100,0.3)',
    },
    appBackground: '#312e2b',
    headerBg: '#262421',
    cardBg: '#262421',
    accentColor: '#5a9aa8',
    mutedColor: '#4a8a98',
    isDark: true,
    gameModes: {
      ai: { color: '#5a9aa8', bg: 'rgba(90, 154, 168, 0.1)' },
      local: { color: '#629924', bg: 'rgba(98, 153, 36, 0.1)' },
      online: { color: '#ffa333', bg: 'rgba(255, 163, 51, 0.1)' },
    }
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    boardBg: '#f8fafc',
    boardBorder: '#e2e8f0',
    boardLineColor: '#3b82f6',
    lineColor: '#3b82f6',
    lineWidth: 4,
    pointColor: '#e2e8f0',
    pointHoverColor: '#cbd5e1',
    nodeInnerColor: 'rgba(59, 130, 246, 0.25)',
    titleColor: '#000000',
    headingColor: '#000000',
    textColor: '#000000',
    whitePiece: {
      bg: 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)',
      border: '#1e40af',
      shadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
      content: '✦',
      color: '#000000',
    },
    blackPiece: {
      bg: 'linear-gradient(to bottom right, #1e293b, #020617)',
      border: '#0f172a',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
      content: '◆',
      color: '#3b82f6',
    },
    appBackground: '#ffffff',
    headerBg: '#f8fafc',
    cardBg: '#ffffff',
    accentColor: '#3b82f6',
    mutedColor: '#2563eb',
    isDark: false,
    gameModes: {
      ai: { color: '#3b82f6', bg: '#eff6ff' },
      local: { color: '#8b5cf6', bg: '#f5f3ff' },
      online: { color: '#f59e0b', bg: '#fffbeb' },
    }
  },
  {
    id: 'ancient',
    name: 'Ancient Warriors',
    boardBg: '#e6d5b8',
    boardBorder: '#5d4037',
    boardLineColor: '#5d4037',
    lineColor: '#5d4037',
    lineWidth: 3,
    pointColor: '#d4c2a5',
    pointHoverColor: '#c5b094',
    nodeInnerColor: 'rgba(93, 64, 55, 0.25)',
    titleColor: '#ffffff',
    headingColor: '#ffffff',
    textColor: '#ffffff',
    whitePiece: {
      bg: 'linear-gradient(to bottom right, #fbbf24, #d97706)',
      border: '#92400e',
      shadow: '0 4px 10px rgba(146, 64, 14, 0.3)',
      content: '⚔️',
      color: '#78350f',
    },
    blackPiece: {
      bg: 'linear-gradient(to bottom right, #4e342e, #1a1a1a)',
      border: '#2d1b16',
      shadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
      content: '🛡️',
      color: '#e6d5b8',
    },
    appBackground: '#2d1b16',
    headerBg: '#1a0f0d',
    cardBg: '#3d2b26',
    accentColor: '#d97706',
    mutedColor: '#92400e',
    isDark: true,
    gameModes: {
      ai: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
      local: { color: '#a1887f', bg: 'rgba(161, 136, 127, 0.1)' },
      online: { color: '#fcd34d', bg: 'rgba(252, 211, 77, 0.1)' },
    }
  },
  {
    id: 'marble',
    name: 'Elysian Marble',
    boardBg: '#f8fafc',
    boardBorder: '#cbd5e1',
    boardLineColor: '#475569',
    lineColor: '#475569',
    lineWidth: 2,
    pointColor: '#e2e8f0',
    pointHoverColor: '#cbd5e1',
    nodeInnerColor: 'rgba(71, 85, 105, 0.25)',
    titleColor: '#475569',
    headingColor: '#475569',
    textColor: '#475569',
    whitePiece: {
      bg: 'linear-gradient(to bottom right, #ecfdf5, #10b981)',
      border: '#059669',
      shadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
      content: '✿',
      color: '#064e3b',
    },
    blackPiece: {
      bg: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
      border: '#334155',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
      content: '✺',
      color: '#10b981',
    },
    appBackground: '#0f172a',
    headerBg: '#1e293b',
    cardBg: '#1e293b',
    accentColor: '#10b981',
    mutedColor: '#059669',
    isDark: true,
    gameModes: {
      ai: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      local: { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
      online: { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
    }
  },
  {
    id: 'dark',
    name: 'Cyber Neon',
    boardBg: '#000000',
    boardBorder: '#09090b',
    boardLineColor: '#22c55e',
    lineColor: '#22c55e',
    lineWidth: 2,
    pointColor: '#1e293b',
    pointHoverColor: '#334155',
    nodeInnerColor: 'rgba(34, 197, 94, 0.25)',
    titleColor: '#22c55e',
    headingColor: '#22c55e',
    textColor: '#22c55e',
    whitePiece: {
      bg: 'linear-gradient(135deg, #22c55e, #166534)',
      border: '#4ade80',
      shadow: '0 0 25px rgba(34, 197, 94, 0.9), inset 0 0 10px rgba(255,255,255,0.5)',
      content: '⚡',
      color: '#ffffff',
    },
    blackPiece: {
      bg: 'linear-gradient(135deg, #ef4444, #7f1d1d)',
      border: '#f87171',
      shadow: '0 0 25px rgba(239, 68, 68, 0.9), inset 0 0 10px rgba(255,255,255,0.5)',
      content: '🔥',
      color: '#ffffff',
    },
    appBackground: '#000000',
    headerBg: '#000000',
    cardBg: '#09090b',
    accentColor: '#22c55e',
    mutedColor: '#16a34a',
    isDark: true,
    gameModes: {
      ai: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
      local: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
      online: { color: '#22c55e', bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1), rgba(239, 68, 68, 0.1))' },
    },
    scoreboardGradient: 'linear-gradient(135deg, #22c55e, #3b82f6, #ef4444)',
    chatGradient: 'linear-gradient(135deg, #22c55e, #3b82f6, #ef4444)',
  },
  {
    id: 'peacock',
    name: 'Peacock Palace',
    boardBg: 'linear-gradient(135deg, rgba(0, 25, 20, 0.95), rgba(0, 10, 10, 0.98))',
    boardBorder: '#B8860B',
    boardLineColor: '#FFD700',
    lineColor: '#FFD700',
    lineWidth: 3,
    pointColor: '#DAA520',
    pointHoverColor: '#FFF7CC',
    nodeInnerColor: 'rgba(218, 165, 32, 0.3)',
    titleColor: '#FFD700',
    headingColor: '#FFD700',
    textColor: '#ccfbf1',
    whitePlayerName: 'Emerald Army',
    blackPlayerName: 'Sapphire Army',
    whitePiece: {
      bg: 'rgb(22, 194, 33)',
      border: 'rgba(150, 255, 150, 0.6)',
      shadow: '0 0 25px rgb(22, 194, 33), inset 0 0 15px rgba(255, 255, 255, 0.5)',
      content: '✨',
      color: '#FFFFFF',
    },
    blackPiece: {
      bg: 'rgba(4, 160, 239, 0.7)',
      border: 'rgba(150, 220, 255, 0.6)',
      shadow: '0 0 25px rgba(4, 160, 239, 0.9), inset 0 0 15px rgba(255, 255, 255, 0.5)',
      content: '💎',
      color: '#FFFFFF',
    },
    appBackground: 'linear-gradient(135deg, #012a23 0%, #001524 100%)',
    headerBg: 'rgba(0, 15, 20, 0.95)',
    cardBg: 'rgba(0, 15, 20, 0.95)',
    accentColor: '#ffd700',
    mutedColor: '#00ffcc',
    isDark: true,
    gameModes: {
      ai: { color: '#00ffcc', bg: 'rgba(0, 255, 204, 0.1)' },
      local: { color: '#ffd700', bg: 'rgba(255, 215, 0, 0.1)' },
      online: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    },
    bgImage: '/peacock-bg.jpg',
    bgImageOpacity: 0.45,
    boardImage: '/peacock-bg.jpg',
  }
];

export const getTheme = (id?: string) => {
  return THEMES.find(t => t.id === id) || THEMES[0];
};
