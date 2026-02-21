export interface Theme {
  name: string;
  label: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
}

export const themes: Theme[] = [
  {
    name: 'professional',
    label: 'Professional (Default)',
    colors: {
      primary: '207 26% 45%',      // Pantone 5415 C - Deep Slate Blue
      secondary: '30 8% 66%',       // Pantone Warm Gray 2 C
      accent: '180 2% 70%',         // Pantone 7543 C - Silver
      background: '0 0% 100%',
      foreground: '210 24% 16%',
    },
  },
  {
    name: 'ocean',
    label: 'Ocean Professional',
    colors: {
      primary: '195 85% 35%',       // Ocean Blue
      secondary: '185 40% 60%',     // Aqua
      accent: '170 45% 50%',        // Teal
      background: '0 0% 100%',
      foreground: '195 50% 15%',
    },
  },
  {
    name: 'forest',
    label: 'Forest Professional',
    colors: {
      primary: '155 45% 35%',       // Forest Green
      secondary: '140 30% 50%',     // Sage
      accent: '100 40% 55%',        // Lime
      background: '0 0% 100%',
      foreground: '155 40% 15%',
    },
  },
  {
    name: 'corporate',
    label: 'Corporate Classic',
    colors: {
      primary: '215 50% 23%',       // Navy Blue
      secondary: '0 0% 45%',        // Charcoal
      accent: '35 80% 50%',         // Gold
      background: '0 0% 100%',
      foreground: '215 30% 15%',
    },
  },
  {
    name: 'midnight',
    label: 'Midnight Elegance',
    colors: {
      primary: '250 50% 40%',       // Royal Purple
      secondary: '280 40% 50%',     // Violet
      accent: '340 60% 55%',        // Rose
      background: '0 0% 100%',
      foreground: '250 30% 15%',
    },
  },
];

export const getTheme = (themeName: string): Theme | undefined => {
  return themes.find(theme => theme.name === themeName);
};

export const applyTheme = (themeName: string) => {
  const theme = getTheme(themeName);
  if (!theme) return;

  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  
  // Save to localStorage
  localStorage.setItem('theme-preference', themeName);
};