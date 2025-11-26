import { HuggingFaceService } from "../../../services/HuggingFaceService";
import { downloadManager } from "../../../services/ModelsDownloadManager";
import { ModelsFileSystemService } from "../../../services/ModelsFileSystemService";
import { UIService } from "../../../services/ui/UIService";
import { DownloadProgress, LLMModel } from "../../../types/Model";
import {
  DownloadViewModel,
  DownloadState,
  initialDownloadState,
} from "../DownloadViewModel";

// Mock dependencies
jest.mock("../../../services/HuggingFaceService", () => ({
  HuggingFaceService: {
    searchMobileModels: jest.fn(),
  },
}));

jest.mock("../../../services/ModelsDownloadManager", () => ({
  downloadManager: {
    downloadModel: jest.fn(),
  },
}));

jest.mock("../../../services/ModelsFileSystemService", () => ({
  ModelsFileSystemService: {
    getDownloadedModels: jest.fn(),
  },
}));

jest.mock("../../../data/models", () => ({
  AVAILABLE_MODELS: [
    {
      id: "phi-2",
      name: "Phi-2",
      size: 2800000000,
      description: "Small model",
      downloadUrl: "https://huggingface.co/microsoft/phi-2",
      filename: "phi-2.q4_0.bin",
      contextSize: 2048,
      downloads: 50000,
      author: "Microsoft",
      tags: ["text-generation", "small"],
      quantization: "Q4_0",
    },
    {
      id: "llama-2",
      name: "Llama 2",
      size: 7000000000,
      description: "Medium model",
      downloadUrl: "https://huggingface.co/meta-llama/Llama-2-7b",
      filename: "llama-2-7b.q4_0.bin",
      contextSize: 4096,
      downloads: 100000,
      author: "Meta",
      tags: ["text-generation", "medium"],
      quantization: "Q4_0",
    },
    {
      id: "mistral",
      name: "Mistral",
      size: 4000000000,
      description: "Efficient model",
      downloadUrl: "https://huggingface.co/mistralai/Mistral-7B",
      filename: "mistral-7b.q4_0.bin",
      contextSize: 8192,
      downloads: 75000,
      author: "Mistral AI",
      tags: ["text-generation", "efficient"],
      quantization: "Q4_0",
    },
  ],
}));

jest.mock("../../core/BaseViewModel");

describe("DownloadViewModel", () => {
  let viewModel: DownloadViewModel;
  let mockUIService: UIService;
  let mockRerender: jest.Mock;

  // Mock data with complete LLMModel interface
  const mockHuggingFaceModels: LLMModel[] = [
    {
      id: "new-model-1",
      name: "New Model 1",
      size: 1500000000,
      description: "Latest model",
      downloadUrl: "https://huggingface.co/author/model1",
      filename: "model1.q4_0.bin",
      contextSize: 4096,
      downloads: 10000,
      author: "Author 1",
      tags: ["latest", "efficient"],
      quantization: "Q4_0",
    },
    {
      id: "new-model-2",
      name: "New Model 2",
      size: 2500000000,
      description: "Another model",
      downloadUrl: "https://huggingface.co/author/model2",
      filename: "model2.q4_0.bin",
      contextSize: 2048,
      downloads: 8000,
      author: "Author 2",
      tags: ["multilingual", "fast"],
      quantization: "Q4_0",
    },
  ];

  const mockDownloadedModels = ["phi-2"];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    (HuggingFaceService.searchMobileModels as jest.Mock).mockResolvedValue(
      mockHuggingFaceModels
    );
    (
      ModelsFileSystemService.getDownloadedModels as jest.Mock
    ).mockResolvedValue(mockDownloadedModels);
    (downloadManager.downloadModel as jest.Mock).mockImplementation(
      (model, onProgress, onComplete, onError) => {
        // Simulate successful download after small delay
        setTimeout(() => {
          onProgress({
            id: model.id,
            progress: 1.0,
            downloadedBytes: model.size,
            totalBytes: model.size,
            status: "downloading",
          });
          onComplete();
        }, 10);
      }
    );

    // Mock UIService
    mockUIService = {
      showAlert: jest.fn(),
      openURL: jest.fn(),
      openAppSettings: jest.fn(),
      showActionSheet: jest.fn(),
      shareContent: jest.fn(),
    };

    viewModel = new DownloadViewModel(mockUIService);
    mockRerender = jest.fn();
    viewModel.rerender = mockRerender;
  });

  describe("Initialization", () => {
    it("should initialize with correct default state", () => {
      expect(viewModel.state).toEqual(initialDownloadState);
    });

    it("should initialize with provided UIService", () => {
      expect(viewModel.uiService).toBe(mockUIService);
    });
  });

  describe("onMount", () => {
    it("should load models and downloaded models on mount", async () => {
      await viewModel.onMount();

      expect(HuggingFaceService.searchMobileModels).toHaveBeenCalledWith({
        maxSize: 2_000_000_000,
        minDownloads: 5000,
        limit: 8,
      });
      expect(ModelsFileSystemService.getDownloadedModels).toHaveBeenCalledTimes(
        1
      );
      expect(viewModel.state.availableModels).toEqual(mockHuggingFaceModels);
      expect(viewModel.state.downloadedModels).toEqual(mockDownloadedModels);
      expect(viewModel.state.loadingModels).toBe(false);
    });

    it("should handle Hugging Face API failure and use fallback models", async () => {
      (HuggingFaceService.searchMobileModels as jest.Mock).mockRejectedValue(
        new Error("API down")
      );

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await viewModel.onMount();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load models from Hugging Face, using fallback:",
        expect.any(Error)
      );
      expect(viewModel.state.availableModels).toEqual([
        {
          id: "phi-2",
          name: "Phi-2",
          size: 2800000000,
          description: "Small model",
          downloadUrl: "https://huggingface.co/microsoft/phi-2",
          filename: "phi-2.q4_0.bin",
          contextSize: 2048,
          downloads: 50000,
          author: "Microsoft",
          tags: ["text-generation", "small"],
          quantization: "Q4_0",
        },
        {
          id: "llama-2",
          name: "Llama 2",
          size: 7000000000,
          description: "Medium model",
          downloadUrl: "https://huggingface.co/meta-llama/Llama-2-7b",
          filename: "llama-2-7b.q4_0.bin",
          contextSize: 4096,
          downloads: 100000,
          author: "Meta",
          tags: ["text-generation", "medium"],
          quantization: "Q4_0",
        },
        {
          id: "mistral",
          name: "Mistral",
          size: 4000000000,
          description: "Efficient model",
          downloadUrl: "https://huggingface.co/mistralai/Mistral-7B",
          filename: "mistral-7b.q4_0.bin",
          contextSize: 8192,
          downloads: 75000,
          author: "Mistral AI",
          tags: ["text-generation", "efficient"],
          quantization: "Q4_0",
        },
      ]);
      expect(viewModel.state.loadingModels).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Selection Management", () => {
    describe("toggleSelect", () => {
      it("should add model to selection when not selected", () => {
        viewModel.toggleSelect("llama-2");

        expect(viewModel.state.selectedModels.has("llama-2")).toBe(true);
        expect(mockRerender).toHaveBeenCalledTimes(1);
      });

      it("should remove model from selection when already selected", () => {
        // First add the model
        viewModel.toggleSelect("llama-2");
        // Then remove it
        viewModel.toggleSelect("llama-2");

        expect(viewModel.state.selectedModels.has("llama-2")).toBe(false);
        expect(mockRerender).toHaveBeenCalledTimes(2);
      });
    });

    describe("selectAll", () => {
      it("should select all models that are not downloaded", () => {
        // ✅ Manually inject downloaded models into state
        viewModel["updateState"]({
          downloadedModels: ["phi-2"],
        });

        // Clear rerender count (if needed — though likely 0 so far)
        mockRerender.mockClear();

        viewModel.selectAll();

        // Now phi-2 is excluded
        expect(viewModel.state.selectedModels.has("llama-2")).toBe(true);
        expect(viewModel.state.selectedModels.has("mistral")).toBe(true);
        expect(viewModel.state.selectedModels.has("phi-2")).toBe(false); // ✅ now false
        expect(mockRerender).toHaveBeenCalledTimes(1);
      });
    });

    describe("clearSelection", () => {
      it("should clear all selected models", () => {
        // First select some models
        viewModel.toggleSelect("llama-2");
        viewModel.toggleSelect("mistral");

        viewModel.clearSelection();

        expect(viewModel.state.selectedModels.size).toBe(0);
        expect(mockRerender).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe("Refresh Functionality", () => {
    describe("onRefresh", () => {
      it("should refresh models and update state", async () => {
        await viewModel.onRefresh();

        expect(viewModel.state.refreshing).toBe(false);
        expect(viewModel.state.showRefreshPopup).toBe(false);
        expect(HuggingFaceService.searchMobileModels).toHaveBeenCalledWith({
          maxSize: 2_000_000_000,
          minDownloads: 5000,
          limit: 8,
        });
      });

      it("should handle refresh errors gracefully", async () => {
        (HuggingFaceService.searchMobileModels as jest.Mock).mockRejectedValue(
          new Error("Refresh failed")
        );

        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation();

        await viewModel.onRefresh();

        // ✅ Expect the message from loadModels, not onRefresh
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to load models from Hugging Face, using fallback:",
          expect.any(Error)
        );

        expect(viewModel.state.refreshing).toBe(false);
        expect(viewModel.state.showRefreshPopup).toBe(false);

        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe("Download Management", () => {
    describe("startSelectedDownloads", () => {
      it("should not start downloads when no models are selected", async () => {
        await viewModel.startSelectedDownloads();

        expect(downloadManager.downloadModel).not.toHaveBeenCalled();
      });

      it("should start downloads for selected models", async () => {
        // Select models
        viewModel.toggleSelect("llama-2");
        viewModel.toggleSelect("mistral");

        await viewModel.startSelectedDownloads();

        expect(downloadManager.downloadModel).toHaveBeenCalledTimes(2);
        expect(downloadManager.downloadModel).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "llama-2",
            downloadUrl: "https://huggingface.co/meta-llama/Llama-2-7b",
            filename: "llama-2-7b.q4_0.bin",
          }),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function)
        );
      });

      it("should initialize download progress for selected models", () => {
        // ✅ Override downloadModel to NOT auto-complete (just capture calls)
        const mockOnProgress = jest.fn();
        const mockOnComplete = jest.fn();
        const mockOnError = jest.fn();

        (downloadManager.downloadModel as jest.Mock).mockImplementation(
          (model, onProgress, onComplete, onError) => {
            // Store refs so test can trigger later if needed
            mockOnProgress.mockImplementation(onProgress);
            mockOnComplete.mockImplementation(onComplete);
            mockOnError.mockImplementation(onError);

            // ✅ Do NOT auto-call callbacks — leave progress at 0
            // Just simulate that download started
          }
        );

        // Select and start download
        viewModel.toggleSelect("llama-2");
        viewModel.startSelectedDownloads(); // ← synchronous; sets initial progress

        // ✅ Now inspect state *before* any progress updates
        const progress = viewModel.state.downloadProgress["llama-2"];

        expect(progress).toEqual({
          id: "llama-2",
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 7000000000,
          status: "downloading",
        });

        // Optional: verify downloadModel was called
        expect(downloadManager.downloadModel).toHaveBeenCalledWith(
          expect.objectContaining({ id: "llama-2" }),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function)
        );
      });

      it("should clear selection after downloads complete", async () => {
        viewModel.toggleSelect("llama-2");

        await viewModel.startSelectedDownloads();

        // Wait for downloads to complete
        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(viewModel.state.selectedModels.size).toBe(0);
      });

      it("should handle download errors with UI alert", async () => {
        const downloadError = new Error("Network error");
        (downloadManager.downloadModel as jest.Mock).mockImplementation(
          (model, onProgress, onComplete, onError) => {
            onError(downloadError);
          }
        );

        viewModel.toggleSelect("llama-2");

        await viewModel.startSelectedDownloads();

        expect(mockUIService.showAlert).toHaveBeenCalledWith({
          title: "Download error",
          message: "Llama 2: Network error",
        });
      });

      it("should update downloaded models list on completion", async () => {
        viewModel.toggleSelect("llama-2");

        await viewModel.startSelectedDownloads();

        // Wait for downloads to complete
        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(viewModel.state.downloadedModels).toContain("llama-2");
      });
    });

    describe("startSingleDownload", () => {
      it("should start download for single model", async () => {
        jest.useFakeTimers();

        const startSelectedDownloadsSpy = jest.spyOn(
          viewModel,
          "startSelectedDownloads"
        );

        viewModel.startSingleDownload("llama-2");

        // Fast-forward timers
        jest.advanceTimersByTime(100);

        expect(viewModel.state.selectedModels.has("llama-2")).toBe(true);
        expect(startSelectedDownloadsSpy).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
        startSelectedDownloadsSpy.mockRestore();
      });
    });
  });

  describe("UI Helper Methods", () => {
    describe("formatFileSize", () => {
      it("should format bytes as MB when less than 1GB", () => {
        expect(viewModel.formatFileSize(52428800)).toBe("50.0 MB"); // 50 MB
      });

      it("should format bytes as GB when 1GB or more", () => {
        expect(viewModel.formatFileSize(2147483648)).toBe("2.0 GB"); // 2 GB
      });

      it("should handle zero bytes", () => {
        expect(viewModel.formatFileSize(0)).toBe("0.0 MB");
      });
    });

    describe("getButtonText", () => {
      it('should return "Download" for models not started', () => {
        const model = viewModel.state.availableModels.find(
          (m) => m.id === "llama-2"
        )!;
        expect(viewModel.getButtonText(model)).toBe("Download");
      });

      it("should return percentage for downloading models", () => {
        const model = viewModel.state.availableModels.find(
          (m) => m.id === "llama-2"
        )!;

        // Manually set downloading state without triggering auto-completion
        viewModel["updateState"]({
          downloadProgress: {
            "llama-2": {
              id: "llama-2",
              progress: 0.5,
              downloadedBytes: 3500000000,
              totalBytes: 7000000000,
              status: "downloading",
            },
          },
        });

        expect(viewModel.getButtonText(model)).toBe("50%");
      });

      it('should return "Retry" for failed downloads', () => {
        const model = viewModel.state.availableModels.find(
          (m) => m.id === "llama-2"
        )!;

        // Manually set error state
        viewModel["updateState"]({
          downloadProgress: {
            "llama-2": {
              id: "llama-2",
              progress: 0.3,
              downloadedBytes: 2100000000,
              totalBytes: 7000000000,
              status: "error",
            },
          },
        });

        expect(viewModel.getButtonText(model)).toBe("Retry");
      });

      it('should return "Downloaded" for completed downloads', () => {
        const model = viewModel.state.availableModels.find(
          (m) => m.id === "llama-2"
        )!;

        // Mark as downloaded
        viewModel["updateState"]({
          downloadedModels: ["llama-2"],
        });

        expect(viewModel.getButtonText(model)).toBe("Downloaded");
      });
    });

    describe("isDownloaded", () => {
      it("should return true for downloaded models", () => {
        viewModel.state = {
          ...viewModel.state,
          availableModels: [
            {
              id: "phi-2",
              name: "Phi-2",
              size: 2800000000,
              description: "Small model",
              downloadUrl: "https://huggingface.co/microsoft/phi-2",
              filename: "phi-2.q4_0.bin",
              contextSize: 2048,
              downloads: 50000,
              author: "Microsoft",
              tags: ["text-generation", "small"],
              quantization: "Q4_0",
            },
          ],
          downloadedModels: ["phi-2"],
        };

        const model = viewModel.state.availableModels[0];
        expect(viewModel.isDownloaded(model)).toBe(true);
      });

      it("should return false for not downloaded models", () => {
        viewModel.state = {
          ...viewModel.state,
          availableModels: [
            {
              id: "phi-2",
              name: "Phi-2",
              size: 2800000000,
              description: "Small model",
              downloadUrl: "https://huggingface.co/microsoft/phi-2",
              filename: "phi-2.q4_0.bin",
              contextSize: 2048,
              downloads: 50000,
              author: "Microsoft",
              tags: ["text-generation", "small"],
              quantization: "Q4_0",
            },
          ],
          downloadedModels: [], // Not downloaded
        };

        const model = viewModel.state.availableModels[0];
        expect(viewModel.isDownloaded(model)).toBe(false);
      });
    });

    describe("isDownloading", () => {
      it("should return true for downloading models", () => {
        const model = viewModel.state.availableModels.find(
          (m) => m.id === "llama-2"
        )!;

        // Set downloading state
        viewModel["updateState"]({
          downloadProgress: {
            "llama-2": {
              id: "llama-2",
              progress: 0.5,
              downloadedBytes: 3500000000,
              totalBytes: 7000000000,
              status: "downloading",
            },
          },
        });

        expect(viewModel.isDownloading(model)).toBe(true);
      });

      it("should return false for non-downloading models", () => {
        const model = viewModel.state.availableModels.find(
          (m) => m.id === "llama-2"
        )!;
        expect(viewModel.isDownloading(model)).toBe(false);
      });

      it("should return false for models with completed downloads", () => {
        const model = viewModel.state.availableModels.find(
          (m) => m.id === "llama-2"
        )!;

        // Set completed state
        viewModel["updateState"]({
          downloadProgress: {
            "llama-2": {
              id: "llama-2",
              progress: 1.0,
              downloadedBytes: 7000000000,
              totalBytes: 7000000000,
              status: "completed",
            },
          },
        });

        expect(viewModel.isDownloading(model)).toBe(false);
      });

      it("should return false for models with failed downloads", () => {
        const model = viewModel.state.availableModels.find(
          (m) => m.id === "llama-2"
        )!;

        // Set error state
        viewModel["updateState"]({
          downloadProgress: {
            "llama-2": {
              id: "llama-2",
              progress: 0.3,
              downloadedBytes: 2100000000,
              totalBytes: 7000000000,
              status: "error",
            },
          },
        });

        expect(viewModel.isDownloading(model)).toBe(false);
      });
    });

    describe("getProgress", () => {
      it("should return progress for model", () => {
        const progressData = {
          id: "llama-2",
          progress: 0.5,
          downloadedBytes: 3500000000,
          totalBytes: 7000000000,
          status: "downloading" as const,
        };

        viewModel["updateState"]({
          downloadProgress: {
            "llama-2": progressData,
          },
        });

        const progress = viewModel.getProgress("llama-2");
        expect(progress).toEqual(progressData);
      });

      it("should return undefined for model without progress", () => {
        expect(viewModel.getProgress("non-existent")).toBeUndefined();
      });

      it("should return undefined for model with no progress data", () => {
        viewModel["updateState"]({
          downloadProgress: {},
        });

        expect(viewModel.getProgress("llama-2")).toBeUndefined();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty Hugging Face response", async () => {
      (HuggingFaceService.searchMobileModels as jest.Mock).mockResolvedValue(
        []
      );

      await viewModel.onMount();

      expect(viewModel.state.availableModels.length).toBeGreaterThan(0);
      expect(viewModel.state.availableModels[0]).toHaveProperty("downloadUrl");
      expect(viewModel.state.availableModels[0]).toHaveProperty("filename");
    });

    it("should handle models with all optional fields undefined", async () => {
      const minimalModels: LLMModel[] = [
        {
          id: "minimal-model",
          name: "Minimal Model",
          size: 1000000000,
          description: "Minimal model",
          downloadUrl: "https://example.com/model",
          filename: "model.bin",
        },
      ];
      (HuggingFaceService.searchMobileModels as jest.Mock).mockResolvedValue(
        minimalModels
      );

      await viewModel.onMount();

      expect(viewModel.state.availableModels[0]).toEqual(minimalModels[0]);
    });

    it("should maintain state consistency after multiple operations", async () => {
      await viewModel.onMount();

      // Perform multiple operations
      viewModel.toggleSelect("llama-2");
      viewModel.toggleSelect("mistral");
      viewModel.clearSelection();
      viewModel.selectAll();

      // Verify state consistency
      expect(viewModel.state.selectedModels.size).toBeGreaterThan(0);
      expect(viewModel.state.downloadProgress).toEqual({});
      expect(viewModel.state.loadingModels).toBe(false);
      expect(viewModel.state.refreshing).toBe(false);
    });

    it("should handle very large file sizes correctly", () => {
      expect(viewModel.formatFileSize(1099511627776)).toBe("1024.0 GB"); // 1 TB
      expect(viewModel.formatFileSize(1125899906842624)).toBe("1048576.0 GB"); // 1 PB
    });
  });
});
