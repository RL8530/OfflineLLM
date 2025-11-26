// src/modules/feature-settings/services/__tests__/SettingsService.test.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SettingsService } from "../SettingsService";
import { AppSettings } from "../../modules/feature-settings/models";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage");

describe("SettingsService", () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("getSettings", () => {
    it("should return default settings when no settings are stored", async () => {
      // Arrange
      mockAsyncStorage.getItem.mockResolvedValue(null);

      // Act
      const result = await SettingsService.getSettings();

      // Assert
      expect(result).toEqual({
        autoClearChat: false,
        saveChatHistory: true,
        theme: "dark",
      });
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        "@llm_chat_settings"
      );
    });

    it("should return stored settings when they exist", async () => {
      // Arrange
      const storedSettings: AppSettings = {
        autoClearChat: true,
        saveChatHistory: false,
        theme: "light",
      };
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(storedSettings)
      );

      // Act
      const result = await SettingsService.getSettings();

      // Assert
      expect(result).toEqual(storedSettings);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        "@llm_chat_settings"
      );
    });

    it("should merge stored settings with defaults when partial settings exist", async () => {
      // Arrange
      const partialStoredSettings = { theme: "light" }; // Missing other properties
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(partialStoredSettings)
      );

      // Act
      const result = await SettingsService.getSettings();

      // Assert
      expect(result).toEqual({
        autoClearChat: false, // From defaults
        saveChatHistory: true, // From defaults
        theme: "light", // From stored
      });
    });

    it("should return default settings when AsyncStorage fails", async () => {
      // Arrange
      mockAsyncStorage.getItem.mockRejectedValue(new Error("Storage error"));

      // Act
      const result = await SettingsService.getSettings();

      // Assert
      expect(result).toEqual({
        autoClearChat: false,
        saveChatHistory: true,
        theme: "dark",
      });
    });

    it("should return default settings when stored data is invalid JSON", async () => {
      // Arrange
      mockAsyncStorage.getItem.mockResolvedValue("invalid-json");

      // Act
      const result = await SettingsService.getSettings();

      // Assert
      expect(result).toEqual({
        autoClearChat: false,
        saveChatHistory: true,
        theme: "dark",
      });
    });
  });

  describe("saveSettings", () => {
    it("should save settings to AsyncStorage", async () => {
      // Arrange
      const settingsToSave: AppSettings = {
        autoClearChat: true,
        saveChatHistory: false,
        theme: "auto",
      };
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      // Act
      await SettingsService.saveSettings(settingsToSave);

      // Assert
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "@llm_chat_settings",
        JSON.stringify(settingsToSave)
      );
    });

    it("should handle errors when saving fails", async () => {
      // Arrange
      const settingsToSave: AppSettings = {
        autoClearChat: true,
        saveChatHistory: false,
        theme: "auto",
      };
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockAsyncStorage.setItem.mockRejectedValue(new Error("Save failed"));

      // Act & Assert - Should not throw
      await expect(
        SettingsService.saveSettings(settingsToSave)
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error saving settings:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});
