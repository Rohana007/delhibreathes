import { createContext, useContext, useState, useEffect } from 'react';

// Theme Context
const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  // Always return a valid object to prevent errors
  return context || { 
    theme: 'light', 
    setTheme: () => {}, 
    toggleTheme: () => {} 
  };
};

export function ThemeProvider({ children }) {
  // Always use light theme
  const [theme] = useState('light');
  
  // Ensure dark class is never applied
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: () => {}, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
