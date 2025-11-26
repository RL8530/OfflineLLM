import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useColorScheme, ColorSchemeName, StyleSheet } from "react-native";
import { SettingsService } from "../../services/SettingsService";
import { AppSettings } from "../feature-settings/models/AppSettings";

export type ThemeType = "dark" | "light" | "auto";
export type ActualTheme = "dark" | "light";

export interface ThemeContextType {
  // Theme settings
  theme: ThemeType;
  actualTheme: ActualTheme;
  setTheme: (theme: ThemeType) => void;

  // Theme data for styling
  colors: typeof darkColors | typeof lightColors;
  styles: (styleSheet: any) => any;

  // Utility functions
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Enhanced color palettes with specific colors for chat components
export const darkColors = {
  // Core colors
  primary: "#1a1a2e",
  secondary: "#2a2a4e",
  tertiary: "#333",
  accent: "#4cc9f0",

  // Text colors
  text: "#ffffff",
  textSecondary: "#888888",
  textTertiary: "#cccccc",

  // Background colors
  background: "#1a1a2e",
  card: "#2a2a4e",
  border: "#333",

  // Status colors
  danger: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",

  // Chat specific colors
  userBubble: "#4cc9f0",
  aiBubble: "#2a2a4e",
  inputBackground: "#2a2a4e",
  inputText: "#ffffff",
  inputBorder: "#333",
  modalOverlay: "rgba(0, 0, 0, 0.7)",
  modalBackground: "#2a2a4e",
  modalBorder: "#333",
  typingIndicator: "#333",
};

export const lightColors = {
  // Core colors
  primary: "#ffffff",
  secondary: "#f8f9fa",
  tertiary: "#e9ecef",
  accent: "#007AFF",

  // Text colors
  text: "#000000",
  textSecondary: "#666666",
  textTertiary: "#8e8e93",

  // Background colors
  background: "#ffffff",
  card: "#f8f9fa",
  border: "#e5e5ea",

  // Status colors
  danger: "#ff3b30",
  success: "#34c759",
  warning: "#ff9500",

  // Chat specific colors
  userBubble: "#007AFF",
  aiBubble: "#f2f2f7",
  inputBackground: "#f8f9fa",
  inputText: "#000000",
  inputBorder: "#e5e5ea",
  modalOverlay: "rgba(0, 0, 0, 0.4)",
  modalBackground: "#ffffff",
  modalBorder: "#e5e5ea",
  typingIndicator: "#e5e5ea",
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>("dark");
  const [isLoading, setIsLoading] = useState(true);

  // Determine the actual theme to use (resolves 'auto' to system theme)
  const getActualTheme = useCallback((): ActualTheme => {
    if (theme === "auto") {
      return systemColorScheme || "dark";
    }
    return theme;
  }, [theme, systemColorScheme]);

  const actualTheme = getActualTheme();
  const isDark = actualTheme === "dark";
  const colors = isDark ? darkColors : lightColors;

  // Load theme settings on app start
  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const savedSettings = await SettingsService.getSettings();
      setThemeState(savedSettings.theme);
    } catch (error) {
      console.error("Failed to load theme settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      // Save to persistent storage
      const currentSettings = await SettingsService.getSettings();
      const updatedSettings: AppSettings = {
        ...currentSettings,
        theme: newTheme,
      };
      await SettingsService.saveSettings(updatedSettings);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  // Helper function to create theme-aware styles
  const createStyles = (styleSheet: any) => {
    return StyleSheet.create(
      Object.keys(styleSheet).reduce((acc, key) => {
        const style = styleSheet[key];
        if (typeof style === "object" && style !== null) {
          acc[key] = style;
        }
        return acc;
      }, {} as any)
    );
  };

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    colors,
    styles: createStyles,
    isDark,
    toggleTheme,
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
