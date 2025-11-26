import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppSettings } from "../modules/feature-settings/models/AppSettings.js";

const SETTINGS_KEY = "@llm_chat_settings";

// Define default settings that match the AppSettings interface
const DEFAULT_SETTINGS: AppSettings = {
  autoClearChat: false,
  saveChatHistory: true,
  theme: "dark",
};

export class SettingsService {
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }

  static async getSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsJson) {
        const savedSettings = JSON.parse(settingsJson);
        // Ensure all required properties exist by merging with defaults
        return { ...DEFAULT_SETTINGS, ...savedSettings };
      }
      // Return default settings if none saved
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Error getting settings:", error);
      return DEFAULT_SETTINGS;
    }
  }
}
