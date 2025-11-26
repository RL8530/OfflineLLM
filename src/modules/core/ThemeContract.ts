export interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  card: string;
  border: string;
  accent: string;
  tertiary: string;
  primary: string;
  danger: string;
}

export interface ThemeContract {
  colors: ThemeColors;
  setTheme: (theme: "dark" | "light" | "auto") => void;
  currentTheme: "dark" | "light" | "auto";
  isDark: boolean;
}
