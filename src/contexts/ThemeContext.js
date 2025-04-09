// src/contexts/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '../../styles/theme';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const deviceTheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', or 'system'
  const [theme, setTheme] = useState({
    ...COLORS,
    mode: 'light',
  });

  // Update theme when themeMode or device theme changes
  useEffect(() => {
    let activeTheme = 'light';
    
    if (themeMode === 'system') {
      activeTheme = deviceTheme || 'light';
    } else {
      activeTheme = themeMode;
    }
    
    if (activeTheme === 'dark') {
      setTheme({
        ...COLORS,
        background: '#121212',
        white: '#202124',
        black: '#FFFFFF',
        gray: '#BDBDBD',
        lightGray: '#424242',
        mode: 'dark',
      });
    } else {
      setTheme({
        ...COLORS,
        mode: 'light',
      });
    }
  }, [themeMode, deviceTheme]);

  const toggleTheme = () => {
    setThemeMode(prevMode => {
      if (prevMode === 'light') return 'dark';
      if (prevMode === 'dark') return 'system';
      return 'light';
    });
  };

  const value = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isDarkMode: theme.mode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}