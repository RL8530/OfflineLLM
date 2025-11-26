import { ChatStorageService } from "../../services/ChatStorageService";
import { ChatSession } from "../../types/Chat";
import { ModelsFileSystemService } from "../../services/ModelsFileSystemService";
import { AVAILABLE_MODELS } from "../../data/models";
import { BaseViewModel } from "../core/BaseViewModel";
import { UIService } from "../../services/ui/UIService";

export interface HomeState {
  sessionsCount: number;
  downloadedModelsCount: number;
  recentSession: ChatSession | null;
  availableModels: number;
  isLoading: boolean;
}

export const initialHomeState: HomeState = {
  sessionsCount: 0,
  downloadedModelsCount: 0,
  recentSession: null,
  availableModels: AVAILABLE_MODELS.length,
  isLoading: true,
};

export class HomeViewModel extends BaseViewModel {
  state: HomeState = initialHomeState;
  uiService: UIService;

  constructor(uiService: UIService) {
    super();
    this.uiService = uiService;
  }

  onNavigate = async () => {
    await this.loadStats();
  };

  // Internal state update method
  private updateState(updates: Partial<HomeState>): void {
    this.state = { ...this.state, ...updates };
    this.rerender();
  }

  // Core logic
  loadStats = async (): Promise<void> => {
    try {
      this.updateState({ isLoading: true });

      const [sessions, downloadedModels] = await Promise.all([
        ChatStorageService.getSessions(),
        ModelsFileSystemService.getDownloadedModels(),
      ]);

      this.updateState({
        sessionsCount: sessions.length,
        downloadedModelsCount: downloadedModels.length,
        recentSession:
          sessions.length > 0 ? sessions[sessions.length - 1] : null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      this.updateState({ isLoading: false });
    }
  };

  // Computed values
  getRecentPreview = (): string => {
    const { recentSession } = this.state;

    if (!recentSession || recentSession.messages.length === 0) {
      return "No recent conversations";
    }

    const lastMessage =
      recentSession.messages[recentSession.messages.length - 1];
    return lastMessage.text.length > 50
      ? lastMessage.text.substring(0, 50) + "..."
      : lastMessage.text;
  };

  // Actions
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
}
