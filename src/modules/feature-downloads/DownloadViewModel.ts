import { AVAILABLE_MODELS } from "../../data/models";
import { HuggingFaceService } from "../../services/HuggingFaceService";
import { downloadManager } from "../../services/ModelsDownloadManager";
import { ModelsFileSystemService } from "../../services/ModelsFileSystemService";
import { UIService } from "../../services/ui/UIService";
import { DownloadProgress, LLMModel } from "../../types/Model";
import { BaseViewModel } from "../core/BaseViewModel";

export interface DownloadState {
  downloadProgress: Record<string, DownloadProgress>;
  downloadedModels: string[];
  selectedModels: Set<string>;
  availableModels: LLMModel[];
  loadingModels: boolean;
  refreshing: boolean;
  showRefreshPopup: boolean;
}

export const initialDownloadState: DownloadState = {
  downloadProgress: {},
  downloadedModels: [],
  selectedModels: new Set(),
  availableModels: AVAILABLE_MODELS,
  loadingModels: true,
  refreshing: false,
  showRefreshPopup: false,
};

export class DownloadViewModel extends BaseViewModel {
  state: DownloadState = initialDownloadState;
  uiService: UIService;

  constructor(uiService: UIService) {
    super();
    this.uiService = uiService;
  }

  onMount = async (): Promise<void> => {
    await Promise.all([this.loadModels(), this.loadDownloadedModels()]);
  };

  // Internal state update method
  private updateState(updates: Partial<DownloadState>): void {
    this.state = { ...this.state, ...updates };
    this.rerender();
  }

  // Core methods
  private loadModels = async (isRefresh = false): Promise<void> => {
    try {
      if (!isRefresh) {
        this.updateState({ loadingModels: true });
      }

      const freshModels = await HuggingFaceService.searchMobileModels({
        maxSize: 2_000_000_000,
        minDownloads: 5000,
        limit: 8,
      });

      if (freshModels.length > 0) {
        this.updateState({ availableModels: freshModels });
      } else {
        this.updateState({ availableModels: AVAILABLE_MODELS });
      }
    } catch (error) {
      console.error(
        "Failed to load models from Hugging Face, using fallback:",
        error
      );
      this.updateState({ availableModels: AVAILABLE_MODELS });
    } finally {
      this.updateState({
        loadingModels: false,
        refreshing: false,
        showRefreshPopup: false,
      });
    }
  };

  private loadDownloadedModels = async (): Promise<void> => {
    const models = await ModelsFileSystemService.getDownloadedModels();
    this.updateState({ downloadedModels: models });
  };

  // Selection methods
  toggleSelect = (modelId: string): void => {
    const next = new Set(this.state.selectedModels);
    if (next.has(modelId)) next.delete(modelId);
    else next.add(modelId);
    this.updateState({ selectedModels: next });
  };

  selectAll = (): void => {
    const allIds = this.state.availableModels
      .filter((m) => !this.state.downloadedModels.includes(m.id))
      .map((m) => m.id);
    this.updateState({ selectedModels: new Set(allIds) });
  };

  clearSelection = (): void => {
    this.updateState({ selectedModels: new Set() });
  };

  // Refresh methods
  onRefresh = async (): Promise<void> => {
    this.updateState({ refreshing: true, showRefreshPopup: true });
    try {
      await this.loadModels(true);
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  // Download methods
  startSelectedDownloads = async (): Promise<void> => {
    if (this.state.selectedModels.size === 0) return;

    const cleanProgress: Record<string, DownloadProgress> = {};
    for (const id of this.state.selectedModels) {
      const model = this.state.availableModels.find((m) => m.id === id);
      if (model) {
        cleanProgress[id] = {
          id,
          progress: 0,
          downloadedBytes: 0,
          totalBytes: model.size,
          status: "downloading",
        };
      }
    }

    this.updateState({
      downloadProgress: { ...this.state.downloadProgress, ...cleanProgress },
    });

    const promises = Array.from(this.state.selectedModels).map((id) => {
      const model = this.state.availableModels.find((m) => m.id === id)!;
      return new Promise<void>((resolve) => {
        downloadManager.downloadModel(
          model,
          (prog) => {
            this.updateState({
              downloadProgress: {
                ...this.state.downloadProgress,
                [prog.id]: prog,
              },
            });
          },
          () => {
            this.updateState({
              downloadedModels: [...this.state.downloadedModels, model.id],
              downloadProgress: {
                ...this.state.downloadProgress,
                [model.id]: {
                  ...this.state.downloadProgress[model.id],
                  status: "completed",
                  progress: 1.0,
                  downloadedBytes: model.size,
                },
              },
            });
            resolve();
          },
          (err) => {
            console.error(err);
            this.updateState({
              downloadProgress: {
                ...this.state.downloadProgress,
                [model.id]: {
                  ...this.state.downloadProgress[model.id],
                  status: "error",
                },
              },
            });
            this.uiService.showAlert({
              title: "Download error",
              message: `${model.name}: ${err.message}`,
            });
            resolve();
          }
        );
      });
    });

    await Promise.allSettled(promises);
    this.clearSelection();
  };

  startSingleDownload = async (modelId: string): Promise<void> => {
    this.updateState({ selectedModels: new Set([modelId]) });
    setTimeout(() => {
      this.startSelectedDownloads();
    }, 100);
  };

  // UI helpers
  formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    } else {
      const gb = bytes / (1024 * 1024 * 1024);
      return `${gb.toFixed(1)} GB`;
    }
  };

  getButtonText = (model: LLMModel): string => {
    // First check if model is already downloaded
    if (this.state.downloadedModels.includes(model.id)) {
      return "Downloaded";
    }

    const prog = this.state.downloadProgress[model.id];

    // If no progress record exists, return "Download"
    if (!prog) {
      return "Download";
    }

    // Handle different progress states
    switch (prog.status) {
      case "downloading":
        return `${Math.round(prog.progress * 100)}%`;
      case "completed":
        return "Downloaded";
      case "error":
        return "Retry";
      default:
        return "Download";
    }
  };

  isDownloading = (model: LLMModel): boolean =>
    this.state.downloadProgress[model.id]?.status === "downloading";

  isDownloaded = (model: LLMModel): boolean =>
    this.state.downloadedModels.includes(model.id);

  getProgress = (modelId: string): DownloadProgress | undefined =>
    this.state.downloadProgress[modelId];
}
