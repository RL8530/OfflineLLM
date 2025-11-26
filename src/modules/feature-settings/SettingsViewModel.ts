import { SettingsService } from "../../services/SettingsService";
import { ThemeContextType, ThemeType } from "../core/useAppTheme";
import { ThemeContract } from "../core/ThemeContract";
import { AppInfo } from "./models/AppInfo";
import { AppSettings } from "./models/AppSettings";
import { BaseViewModel } from "../core/BaseViewModel";
import { UIService } from "../../services/ui/UIService";

export interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  appInfo: AppInfo;
  themeOptions: Array<{ value: ThemeType; displayName: string }>;
  colors: ThemeContract["colors"];
  currentTheme: ThemeType;
}

export const initialSettingsState: SettingsState = {
  settings: {
    autoClearChat: false,
    saveChatHistory: true,
    theme: "dark" as ThemeType,
  },
  isLoading: true,
  appInfo: {
    version: "1.0.0",
    buildNumber: "1",
    lastUpdated: new Date("2025-11-01"),
  },
  themeOptions: [
    { value: "dark" as const, displayName: "Dark" },
    { value: "light" as const, displayName: "Light" },
    { value: "auto" as const, displayName: "Auto" },
  ],
  colors: {} as ThemeContract["colors"],
  currentTheme: "dark" as ThemeType,
};

export class SettingsViewModel extends BaseViewModel {
  state: SettingsState = initialSettingsState;
  private theme: ThemeContextType;
  private uiService: UIService;

  constructor(theme: ThemeContextType, uiService: UIService) {
    super();
    this.theme = theme;
    this.uiService = uiService;
    this.initializeState();
  }

  private initializeState(): void {
    this.state = {
      ...this.state,
      colors: this.theme.colors,
      currentTheme: this.theme.theme,
      settings: {
        ...this.state.settings,
        theme: this.theme.theme,
      },
    };
  }

  // Lifecycle methods
  onMount = async (): Promise<void> => {
    await this.initializeSettings();
  };

  // Internal state update method
  private updateState(updates: Partial<SettingsState>): void {
    this.state = { ...this.state, ...updates };
    this.rerender();
  }

  // Existing methods
  private async initializeSettings(): Promise<void> {
    try {
      this.updateState({ isLoading: true });
      const savedSettings = await SettingsService.getSettings();
      this.updateState({ settings: savedSettings });
    } catch (error) {
      console.error("Failed to load settings:", error);
      this.uiService.showAlert({
        title: "Error",
        message: "Failed to load settings",
      });
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> => {
    const newSettings = { ...this.state.settings, [key]: value };

    if (key === "theme") {
      this.theme.setTheme(value as ThemeType);
      this.updateState({
        currentTheme: value as ThemeType,
        settings: newSettings,
      });
    } else {
      this.updateState({ settings: newSettings });
    }

    try {
      await SettingsService.saveSettings(newSettings);
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Revert on error
      const savedSettings = await SettingsService.getSettings();
      this.updateState({ settings: savedSettings });
    }
  };

  handleThemeSelect = (newTheme: ThemeType): void => {
    this.updateSetting("theme", newTheme);
  };

  getThemeDisplayName = (): string => {
    if (this.state.currentTheme === "auto") {
      return `Auto (${
        this.state.colors.text === "#ffffff" ? "Dark" : "Light"
      })`;
    }
    return (
      this.state.currentTheme.charAt(0).toUpperCase() +
      this.state.currentTheme.slice(1)
    );
  };

  handleResetApp = (): void => {
    this.uiService.showAlert({
      title: "Reset App Data",
      message:
        "This will clear all chat history and reset settings. This action cannot be undone.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await this.resetToDefaults();
              this.uiService.showAlert({
                title: "Success",
                message: "App data has been reset.",
              });
            } catch (error) {
              this.uiService.showAlert({
                title: "Error",
                message: "Failed to reset app data.",
              });
            }
          },
        },
      ],
    });
  };

  resetToDefaults = async (): Promise<void> => {
    const defaultSettings: AppSettings = {
      autoClearChat: false,
      saveChatHistory: true,
      theme: "dark",
    };
    await this.updateSetting("theme", "dark");
    this.updateState({ settings: defaultSettings });
    await SettingsService.saveSettings(defaultSettings);
  };

  handleExportData = (): void => {
    this.uiService.showAlert({
      title: "Export Data",
      message: "This feature would export all your chat data for backup.",
      buttons: [{ text: "OK" }],
    });
  };

  openGitHub = async (): Promise<void> => {
    try {
      await this.uiService.openURL("https://github.com");
    } catch (error) {
      this.uiService.showAlert({
        title: "Error",
        message: "Could not open GitHub.",
      });
    }
  };

  openAppSettings = async (): Promise<void> => {
    await this.uiService.openAppSettings();
  };
}
