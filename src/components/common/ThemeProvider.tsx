import React, { ReactNode } from 'react';
import { ThemeContext, useThemeProvider } from '../../hooks/useTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeContextValue = useThemeProvider();

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;