import { SettingsService } from "../../../services/SettingsService";
import { UIService } from "../../../services/ui/UIService";
import { BaseViewModel } from "../../core/BaseViewModel";
import {
  darkColors,
  lightColors,
  ThemeContextType,
} from "../../core/useAppTheme";
import {
  SettingsViewModel,
  SettingsState,
  initialSettingsState,
} from "../SettingsViewModel";

// Mock dependencies
jest.mock("../../../services/SettingsService", () => ({
  SettingsService: {
    getSettings: jest.fn(),
    saveSettings: jest.fn(),
  },
}));

jest.mock("../../core/BaseViewModel");

// Mock dark and light colors for testing
const mockDarkColors = darkColors;
const mockLightColors = lightColors;

// Mock styles function
const mockStyles = (styleSheet: any) => styleSheet;

// Mock UIService
const mockUIService: UIService = {
  showAlert: jest.fn(),
  openURL: jest.fn(),
  openAppSettings: jest.fn(),
  showActionSheet: jest.fn(),
  shareContent: jest.fn(),
};

const mockTheme: ThemeContextType = {
  theme: "dark",
  actualTheme: "dark",
  setTheme: jest.fn(),
  colors: mockDarkColors,
  styles: mockStyles,
  isDark: true,
  toggleTheme: jest.fn(),
};

describe("SettingsViewModel", () => {
  let viewModel: SettingsViewModel;
  let mockRerender: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    (SettingsService.getSettings as jest.Mock).mockResolvedValue({
      autoClearChat: false,
      saveChatHistory: true,
      theme: "dark",
    });

    (SettingsService.saveSettings as jest.Mock).mockResolvedValue(undefined);

    (mockUIService.showAlert as jest.Mock).mockResolvedValue(undefined);
    (mockUIService.openURL as jest.Mock).mockResolvedValue(undefined);
    (mockUIService.openAppSettings as jest.Mock).mockResolvedValue(undefined);

    viewModel = new SettingsViewModel(mockTheme, mockUIService);
    mockRerender = jest.fn();
    viewModel.rerender = mockRerender;
  });

  describe("Initialization", () => {
    it("should initialize with correct state from theme context", () => {
      expect(viewModel.state).toEqual({
        ...initialSettingsState,
        colors: mockTheme.colors,
        currentTheme: mockTheme.theme,
        settings: {
          ...initialSettingsState.settings,
          theme: mockTheme.theme,
        },
      });
    });

    it("should handle light theme initialization", () => {
      const lightTheme: ThemeContextType = {
        ...mockTheme,
        theme: "light",
        actualTheme: "light",
        colors: mockLightColors,
        isDark: false,
      };

      const lightViewModel = new SettingsViewModel(lightTheme, mockUIService);

      expect(lightViewModel.state.currentTheme).toBe("light");
      expect(lightViewModel.state.settings.theme).toBe("light");
      expect(lightViewModel.state.colors).toBe(mockLightColors);
    });

    it("should handle auto theme initialization", () => {
      const autoTheme: ThemeContextType = {
        ...mockTheme,
        theme: "auto",
        actualTheme: "dark", // auto resolves to dark
        colors: mockDarkColors,
        isDark: true,
      };

      const autoViewModel = new SettingsViewModel(autoTheme, mockUIService);

      expect(autoViewModel.state.currentTheme).toBe("auto");
      expect(autoViewModel.state.settings.theme).toBe("auto");
      expect(autoViewModel.state.colors).toBe(mockDarkColors);
    });
  });

  describe("onMount", () => {
    it("should call initializeSettings when onMount is called", async () => {
      const initializeSettingsSpy = jest.spyOn(
        viewModel as any,
        "initializeSettings"
      );

      await viewModel.onMount();

      expect(initializeSettingsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("initializeSettings", () => {
    it("should load settings successfully and update state", async () => {
      const mockSavedSettings = {
        autoClearChat: true,
        saveChatHistory: false,
        theme: "light",
      };
      (SettingsService.getSettings as jest.Mock).mockResolvedValue(
        mockSavedSettings
      );

      await (viewModel as any).initializeSettings();

      expect(SettingsService.getSettings).toHaveBeenCalledTimes(1);
      expect(viewModel.state.settings).toEqual(mockSavedSettings);
      expect(viewModel.state.isLoading).toBe(false);
      expect(mockRerender).toHaveBeenCalled();
    });

    it("should handle errors when loading settings fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      (SettingsService.getSettings as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await (viewModel as any).initializeSettings();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load settings:",
        expect.any(Error)
      );
      expect(mockUIService.showAlert).toHaveBeenCalledWith({
        title: "Error",
        message: "Failed to load settings",
      });
      expect(viewModel.state.isLoading).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it("should set isLoading states correctly during initialization", async () => {
      let isLoadingStates: boolean[] = [];

      const originalUpdateState = (viewModel as any).updateState.bind(
        viewModel
      );

      const updateStateSpy = jest.spyOn(
        viewModel as any,
        "updateState"
      ) as jest.MockedFunction<(updates: Partial<SettingsState>) => void>;

      updateStateSpy.mockImplementation((updates: Partial<SettingsState>) => {
        if ("isLoading" in updates) {
          isLoadingStates.push(updates.isLoading!);
        }
        originalUpdateState(updates);
      });

      await (viewModel as any).initializeSettings();

      expect(isLoadingStates).toEqual([true, false]);
    });
  });

  describe("updateSetting", () => {
    it("should update non-theme setting successfully", async () => {
      const newValue = true;

      await viewModel.updateSetting("autoClearChat", newValue);

      expect(viewModel.state.settings.autoClearChat).toBe(newValue);
      expect(SettingsService.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ autoClearChat: newValue })
      );
      expect(mockRerender).toHaveBeenCalled();
    });

    it("should update theme and call setTheme when changing theme", async () => {
      const newTheme = "light";

      await viewModel.updateSetting("theme", newTheme);

      expect(viewModel.state.settings.theme).toBe(newTheme);
      expect(viewModel.state.currentTheme).toBe(newTheme);
      expect(mockTheme.setTheme).toHaveBeenCalledWith(newTheme);
      expect(SettingsService.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ theme: newTheme })
      );
    });

    it("should update theme to auto and maintain actualTheme", async () => {
      const newTheme = "auto";

      await viewModel.updateSetting("theme", newTheme);

      expect(viewModel.state.settings.theme).toBe(newTheme);
      expect(viewModel.state.currentTheme).toBe(newTheme);
      expect(mockTheme.setTheme).toHaveBeenCalledWith(newTheme);
    });

    it("should revert changes when save fails", async () => {
      const originalSettings = { ...viewModel.state.settings };
      const error = new Error("Save failed");
      (SettingsService.saveSettings as jest.Mock).mockRejectedValue(error);
      (SettingsService.getSettings as jest.Mock).mockResolvedValue(
        originalSettings
      );

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await viewModel.updateSetting("autoClearChat", true);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to save settings:",
        error
      );
      expect(SettingsService.getSettings).toHaveBeenCalledTimes(1);
      expect(viewModel.state.settings).toEqual(originalSettings);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("handleThemeSelect", () => {
    it("should call updateSetting with selected theme", () => {
      const updateSettingSpy = jest.spyOn(viewModel, "updateSetting");
      const newTheme = "light";

      viewModel.handleThemeSelect(newTheme);

      expect(updateSettingSpy).toHaveBeenCalledWith("theme", newTheme);
    });

    it("should handle auto theme selection", () => {
      const updateSettingSpy = jest.spyOn(viewModel, "updateSetting");
      const newTheme = "auto";

      viewModel.handleThemeSelect(newTheme);

      expect(updateSettingSpy).toHaveBeenCalledWith("theme", newTheme);
    });
  });

  describe("getThemeDisplayName", () => {
    it("should return formatted name for dark theme", () => {
      (viewModel as any).updateState({ currentTheme: "dark" });

      const result = viewModel.getThemeDisplayName();

      expect(result).toBe("Dark");
    });

    it("should return formatted name for light theme", () => {
      (viewModel as any).updateState({ currentTheme: "light" });

      const result = viewModel.getThemeDisplayName();

      expect(result).toBe("Light");
    });

    it("should return auto with detected dark theme", () => {
      (viewModel as any).updateState({
        currentTheme: "auto",
        colors: { text: "#ffffff" } as any,
      });

      const result = viewModel.getThemeDisplayName();

      expect(result).toBe("Auto (Dark)");
    });

    it("should return auto with light when text color is dark", () => {
      (viewModel as any).updateState({
        currentTheme: "auto",
        colors: { text: "#000000" } as any,
      });

      const result = viewModel.getThemeDisplayName();

      expect(result).toBe("Auto (Light)");
    });

    it("should handle edge case colors for auto theme detection", () => {
      (viewModel as any).updateState({
        currentTheme: "auto",
        colors: { text: "#333333" } as any, // Dark color
      });

      const result = viewModel.getThemeDisplayName();

      expect(result).toBe("Auto (Light)"); // Dark text means light theme
    });
  });

  describe("handleResetApp", () => {
    it("should show confirmation alert with correct buttons", () => {
      viewModel.handleResetApp();

      expect(mockUIService.showAlert).toHaveBeenCalledWith({
        title: "Reset App Data",
        message:
          "This will clear all chat history and reset settings. This action cannot be undone.",
        buttons: expect.arrayContaining([
          expect.objectContaining({ text: "Cancel", style: "cancel" }),
          expect.objectContaining({ text: "Reset", style: "destructive" }),
        ]),
      });
    });

    it("should call resetToDefaults when reset is confirmed", async () => {
      let onPressHandler: (() => void) | undefined;

      (mockUIService.showAlert as jest.Mock).mockImplementation((config) => {
        // Safely access the reset button
        const resetButton = config.buttons?.find(
          (button: any) => button.text === "Reset"
        );
        if (resetButton) {
          onPressHandler = resetButton.onPress;
        }
        return Promise.resolve();
      });

      const resetToDefaultsSpy = jest
        .spyOn(viewModel, "resetToDefaults")
        .mockResolvedValue(undefined);

      viewModel.handleResetApp();

      // Wait for any async operations
      await new Promise(process.nextTick);

      // Simulate user pressing "Reset"
      if (onPressHandler) {
        await onPressHandler();
      }

      expect(resetToDefaultsSpy).toHaveBeenCalledTimes(1);
    });

    it("should show success alert after reset", async () => {
      let onPressHandler: (() => void) | undefined;

      (mockUIService.showAlert as jest.Mock).mockImplementation((config) => {
        const resetButton = config.buttons?.find(
          (button: any) => button.text === "Reset"
        );
        if (resetButton) {
          onPressHandler = resetButton.onPress;
        }
        return Promise.resolve();
      });

      jest.spyOn(viewModel, "resetToDefaults").mockResolvedValue(undefined);

      viewModel.handleResetApp();
      await new Promise(process.nextTick);

      if (onPressHandler) {
        await onPressHandler();
      }

      // Should show success alert
      expect(mockUIService.showAlert).toHaveBeenCalledWith({
        title: "Success",
        message: "App data has been reset.",
      });
    });

    it("should show error alert when reset fails", async () => {
      let onPressHandler: (() => void) | undefined;

      (mockUIService.showAlert as jest.Mock).mockImplementation((config) => {
        const resetButton = config.buttons?.find(
          (button: any) => button.text === "Reset"
        );
        if (resetButton) {
          onPressHandler = resetButton.onPress;
        }
        return Promise.resolve();
      });

      const error = new Error("Reset failed");
      jest.spyOn(viewModel, "resetToDefaults").mockRejectedValue(error);

      viewModel.handleResetApp();
      await new Promise(process.nextTick);

      if (onPressHandler) {
        await onPressHandler();
      }

      expect(mockUIService.showAlert).toHaveBeenCalledWith({
        title: "Error",
        message: "Failed to reset app data.",
      });
    });

    it("should not call resetToDefaults when cancel is pressed", async () => {
      let cancelPressed = false;

      (mockUIService.showAlert as jest.Mock).mockImplementation((config) => {
        // Simulate cancel button press (no onPress call)
        cancelPressed = true;
        return Promise.resolve();
      });

      const resetToDefaultsSpy = jest.spyOn(viewModel, "resetToDefaults");

      viewModel.handleResetApp();
      await new Promise(process.nextTick);

      expect(cancelPressed).toBe(true);
      expect(resetToDefaultsSpy).not.toHaveBeenCalled();
    });
  });

  describe("resetToDefaults", () => {
    it("should reset all settings to defaults", async () => {
      // Set some non-default values first
      (viewModel as any).updateState({
        settings: {
          autoClearChat: true,
          saveChatHistory: false,
          theme: "light",
        },
      });

      await viewModel.resetToDefaults();

      expect(viewModel.state.settings).toEqual({
        autoClearChat: false,
        saveChatHistory: true,
        theme: "dark",
      });
      expect(SettingsService.saveSettings).toHaveBeenCalledWith({
        autoClearChat: false,
        saveChatHistory: true,
        theme: "dark",
      });
      expect(mockTheme.setTheme).toHaveBeenCalledWith("dark");
    });

    it("should handle errors during reset", async () => {
      const error = new Error("Save failed");
      (SettingsService.saveSettings as jest.Mock).mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(viewModel.resetToDefaults()).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("handleExportData", () => {
    it("should show export data information alert", () => {
      viewModel.handleExportData();

      expect(mockUIService.showAlert).toHaveBeenCalledWith({
        title: "Export Data",
        message: "This feature would export all your chat data for backup.",
        buttons: [{ text: "OK" }],
      });
    });
  });

  describe("openGitHub", () => {
    it("should open GitHub URL successfully", async () => {
      await viewModel.openGitHub();

      expect(mockUIService.openURL).toHaveBeenCalledWith("https://github.com");
    });

    it("should show error when opening GitHub fails", async () => {
      const error = new Error("Cannot open URL");
      (mockUIService.openURL as jest.Mock).mockRejectedValue(error);

      await viewModel.openGitHub();

      expect(mockUIService.showAlert).toHaveBeenCalledWith({
        title: "Error",
        message: "Could not open GitHub.",
      });
    });
  });

  describe("openAppSettings", () => {
    it("should open app settings", async () => {
      await viewModel.openAppSettings();

      expect(mockUIService.openAppSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateState", () => {
    it("should update state and call rerender", () => {
      const updates: Partial<SettingsState> = {
        isLoading: false,
        currentTheme: "light",
      };

      (viewModel as any).updateState(updates);

      expect(viewModel.state.isLoading).toBe(false);
      expect(viewModel.state.currentTheme).toBe("light");
      expect(mockRerender).toHaveBeenCalledTimes(1);
    });

    it("should merge partial state updates correctly", () => {
      const firstUpdate = { isLoading: true };
      const secondUpdate = { currentTheme: "auto" as const };

      (viewModel as any).updateState(firstUpdate);
      (viewModel as any).updateState(secondUpdate);

      expect(viewModel.state.isLoading).toBe(true);
      expect(viewModel.state.currentTheme).toBe("auto");
      expect(mockRerender).toHaveBeenCalledTimes(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle theme changes that affect color detection", async () => {
      // Test that theme changes properly update the display name logic
      await viewModel.updateSetting("theme", "light");

      const displayName = viewModel.getThemeDisplayName();
      expect(displayName).toBe("Light");

      await viewModel.updateSetting("theme", "auto");

      const autoDisplayName = viewModel.getThemeDisplayName();
      expect(autoDisplayName).toMatch(/Auto/); // Should contain "Auto"
    });

    it("should maintain consistency after multiple rapid updates", async () => {
      const promises = [
        viewModel.updateSetting("autoClearChat", true),
        viewModel.updateSetting("saveChatHistory", false),
        viewModel.updateSetting("theme", "light"),
      ];

      await Promise.all(promises);

      expect(viewModel.state.settings.autoClearChat).toBe(true);
      expect(viewModel.state.settings.saveChatHistory).toBe(false);
      expect(viewModel.state.settings.theme).toBe("light");
    });

    it("should handle initialization with different theme contexts", () => {
      const themes: ThemeContextType[] = [
        {
          ...mockTheme,
          theme: "dark",
          actualTheme: "dark",
          colors: mockDarkColors,
          isDark: true,
        },
        {
          ...mockTheme,
          theme: "light",
          actualTheme: "light",
          colors: mockLightColors,
          isDark: false,
        },
        {
          ...mockTheme,
          theme: "auto",
          actualTheme: "dark",
          colors: mockDarkColors,
          isDark: true,
        },
        {
          ...mockTheme,
          theme: "auto",
          actualTheme: "light",
          colors: mockLightColors,
          isDark: false,
        },
      ];

      themes.forEach((theme) => {
        const testViewModel = new SettingsViewModel(theme, mockUIService);
        expect(testViewModel.state.currentTheme).toBe(theme.theme);
        expect(testViewModel.state.settings.theme).toBe(theme.theme);
        expect(testViewModel.state.colors).toBe(theme.colors);
      });
    });
  });
});
