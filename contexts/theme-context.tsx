// src/contexts/ThemeContext.tsx
import React, { 
  createContext, 
  useState, 
  useContext, 
  useEffect, 
  ReactNode 
} from 'react';
import { useColorScheme } from 'react-native';

// Define theme mode types
type ThemeMode = 'light' | 'dark' | 'system';

// Define color interface based on your COLORS constant
interface ColorTheme {
  [key: string]: string;
  mode: 'light' | 'dark';
  background: string;
  white: string;
  black: string;
  gray: string;
  lightGray: string;
}

// Define context type
interface ThemeContextType {
  theme: ColorTheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

// Import COLORS with type safety
import { COLORS } from '../styles/theme';

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: {
    ...COLORS,
    mode: 'light',
    background: '#FFFFFF',
    white: '#FFFFFF',
    black: '#000000',
    gray: '#808080',
    lightGray: '#E0E0E0'
  },
  themeMode: 'system',
  setThemeMode: () => {},
  toggleTheme: () => {},
  isDarkMode: false
});

// Custom hook to use theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceTheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<ColorTheme>({
    ...COLORS,
    mode: 'light',
    background: '#FFFFFF',
    white: '#FFFFFF',
    black: '#000000',
    gray: '#808080',
    lightGray: '#E0E0E0'
  });

  // Update theme when themeMode or device theme changes
  useEffect(() => {
    let activeTheme: 'light' | 'dark' = 'light';
    
    if (themeMode === 'system') {
      activeTheme = deviceTheme === 'dark' ? 'dark' : 'light';
    } else {
      activeTheme = themeMode;
    }
    
    const newTheme: ColorTheme = {
      ...COLORS,
      mode: activeTheme,
      ...(activeTheme === 'dark' ? {
        background: '#121212',
        white: '#202124',
        black: '#FFFFFF',
        gray: '#BDBDBD',
        lightGray: '#424242'
      } : {
        background: '#FFFFFF',
        white: '#FFFFFF',
        black: '#000000',
        gray: '#808080',
        lightGray: '#E0E0E0'
      })
    };

    setTheme(newTheme);
  }, [themeMode, deviceTheme]);

  // Toggle theme method with circular progression
  const toggleTheme = () => {
    setThemeMode(prevMode => {
      switch (prevMode) {
        case 'light': return 'dark';
        case 'dark': return 'system';
        default: return 'light';
      }
    });
  };

  // Provide context value
  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isDarkMode: theme.mode === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}