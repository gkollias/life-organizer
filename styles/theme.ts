import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export const COLORS = {
    primary: '#4285F4',        // Blue
    primaryLight: '#D2E3FC',
    secondary: '#34A853',      // Green
    background: '#F8F9FA',     // Light gray background
    white: '#FFFFFF',
    black: '#202124',
    gray: '#5F6368',
    lightGray: '#E8EAED',
    error: '#EA4335',          // Red
    warning: '#FBBC04',        // Yellow
    success: '#34A853',        // Green
  };
  
  export const SIZES = {
    base: 8,
    radius: 8,
    padding: 16,
    // Font sizes
    h1: 30,
    h2: 24,
    h3: 18,
    h4: 16,
    body1: 16,
    body2: 14,
    body3: 12,
    body4: 10,
  };
  
export const FONTS = {
  h1: { fontSize: SIZES.h1, fontWeight: 'bold' } as TextStyle,
  h2: { fontSize: SIZES.h2, fontWeight: 'bold' } as TextStyle,
  h3: { fontSize: SIZES.h3, fontWeight: 'bold' } as TextStyle,
  h4: { fontSize: SIZES.h4, fontWeight: 'bold' } as TextStyle,
  body1: { fontSize: SIZES.body1 } as TextStyle,
  body2: { fontSize: SIZES.body2 } as TextStyle,
  body3: { fontSize: SIZES.body3 } as TextStyle,
  body4: { fontSize: SIZES.body4 } as TextStyle,
};