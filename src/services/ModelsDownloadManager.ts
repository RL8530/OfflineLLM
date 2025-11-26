import { LLMModel, DownloadProgress } from "../types/Model";
import { ModelsFileSystemService as ModelsFileSystemService } from "./ModelsFileSystemService";
import { ExpoFileSystemService } from "./ExpoFileSystemService";

class ModelsDownloadManager {
  private downloads: Map<string, any> = new Map();
  private progressCallbacks: Map<string, (progress: DownloadProgress) => void> =
    new Map();

  downloadModel = async (
    model: LLMModel,
    onProgress: (progress: DownloadProgress) => void,
    onComplete: () => void,
    onError: (err: Error) => void
  ) => {
    await ModelsFileSystemService.ensureModelsDirectory();

    console.log("download model", model);
    const dest = `${ModelsFileSystemService.getModelsDirectory()}/${model.id}`;

    // 2. start download with progress
    const downloadResumable = ExpoFileSystemService.createDownloadResumable(
      model.downloadUrl,
      dest,
      {},
      (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        onProgress({
          id: model.id,
          progress,
          downloadedBytes: downloadProgress.totalBytesWritten,
          totalBytes: downloadProgress.totalBytesExpectedToWrite,
          status: "downloading",
        });
      }
    );

    try {
      const result = await downloadResumable.downloadAsync();
      if (result && result.uri) {
        onProgress({
          id: model.id,
          progress: 1,
          downloadedBytes: model.size,
          totalBytes: model.size,
          status: "completed",
        });
        await ModelsFileSystemService.markModelAsDownloaded(model.id);
        onComplete();
      }
    } catch (e: any) {
      onProgress({
        id: model.id,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: model.size,
        status: "error",
      });
      onError(e);
    }
  };

  pauseDownload(modelId: string): void {
    console.log("Pausing download for:", modelId);
    // In real implementation, this would pause the DownloadResumable
  }

  resumeDownload(modelId: string): void {
    console.log("Resuming download for:", modelId);
    // In real implementation, this would resume the DownloadResumable
  }

  cancelDownload(modelId: string): void {
    console.log("Cancelling download for:", modelId);
    const progressCallback = this.progressCallbacks.get(modelId);
    if (progressCallback) {
      progressCallback({
        id: modelId,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        status: "error",
      });
    }
    this.downloads.delete(modelId);
    this.progressCallbacks.delete(modelId);
  }

  // Helper method to check if a download is in progress
  isDownloading(modelId: string): boolean {
    return this.downloads.has(modelId);
  }
}

export const downloadManager = new ModelsDownloadManager();
