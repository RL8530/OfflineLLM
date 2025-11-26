import * as FileSystem from "expo-file-system";

import { ExpoFileSystemService } from "./ExpoFileSystemService";

const ModelStorageConfig = {
  // Base directory where all LLM models will be stored.
  modelsDirectory: `${ExpoFileSystemService.documentUri()}llm-models/`,
  downloadedModelsKey: "downloaded_models",
  getDownloadedModelsFilePath: function () {
    return `${this.modelsDirectory}${this.downloadedModelsKey}.json`;
  },
};

export class ModelsFileSystemService {
  static async ensureModelsDirectory(): Promise<void> {
    try {
      await ExpoFileSystemService.ensureDirectory(
        ModelStorageConfig.modelsDirectory
      );
    } catch (error) {
      console.error("Error ensuring models directory:", error);
      throw error; // Re-throw to propagate the error
    }
  }

  static getModelsDirectory(): string {
    return ModelStorageConfig.modelsDirectory;
  }

  static async getDownloadedModels(): Promise<string[]> {
    try {
      await this.ensureModelsDirectory();
      const filePath = ModelStorageConfig.getDownloadedModelsFilePath();
      if (await ExpoFileSystemService.fileExists(filePath)) {
        const stored = await ExpoFileSystemService.readFile(filePath);
        return JSON.parse(stored);
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error getting downloaded models:", error);
      return []; // Return an empty array on error to prevent further issues
    }
  }

  static async isModelDownloaded(filename: string): Promise<boolean> {
    try {
      const downloadedModels = await this.getDownloadedModels();
      return downloadedModels.includes(filename);
    } catch (error) {
      console.error(
        `Error checking if model '${filename}' is downloaded:`,
        error
      );
      return false;
    }
  }

  static async getModelPath(filename: string): Promise<string> {
    return `${ModelStorageConfig.modelsDirectory}${filename}`;
  }

  static async deleteModel(filename: string): Promise<void> {
    try {
      const filePath = await this.getModelPath(filename);

      const file = new FileSystem.File(filePath);
      // Assuming file.info() returns an object with an 'exists' property
      if (file.info().exists) {
        file.delete();
        console.log(`Successfully deleted file: ${filePath}`);
      } else {
        console.warn(`Attempted to delete non-existent file: ${filePath}`);
      }

      // Remove from the stored downloaded models list
      const downloadedModels = await this.getDownloadedModels();
      const updatedModels = downloadedModels.filter((f) => f !== filename);
      await this.saveDownloadedModels(updatedModels);

      console.log("Deleted model and updated list:", filename);
    } catch (error) {
      console.error(`Error deleting model '${filename}':`, error);
      throw error; // Re-throw to signal failure
    }
  }

  static async markModelAsDownloaded(filename: string): Promise<void> {
    try {
      const downloadedModels = await this.getDownloadedModels();
      if (!downloadedModels.includes(filename)) {
        downloadedModels.push(filename);
        await this.saveDownloadedModels(downloadedModels);
        console.log("Marked model as downloaded:", filename);
      } else {
        console.log("Model already marked as downloaded:", filename);
      }
    } catch (error) {
      console.error(`Error marking model '${filename}' as downloaded:`, error);
      throw error;
    }
  }

  private static async saveDownloadedModels(models: string[]): Promise<void> {
    try {
      const filePath = ModelStorageConfig.getDownloadedModelsFilePath();
      ExpoFileSystemService.writeFile(filePath, JSON.stringify(models));
      console.log("Downloaded models list saved successfully.");
    } catch (error) {
      console.error("Error saving downloaded models list:", error);
      throw error;
    }
  }

  static async getModelFileInfo(
    filename: string
  ): Promise<FileSystem.FileInfo> {
    try {
      const filePath = await this.getModelPath(filename);
      // Assuming new FileSystem.File(path).info() returns a Promise<FileInfo>
      return await new FileSystem.File(filePath).info();
    } catch (error) {
      console.error(`Error getting file info for model '${filename}':`, error);
      throw error;
    }
  }

  /**
   * Calculates the total size of all currently downloaded models.
   * @returns A promise that resolves to the total size in bytes.
   */
  static async getTotalDownloadedSize(): Promise<number> {
    try {
      const downloadedModels = await this.getDownloadedModels();
      let totalSize = 0;

      for (const filename of downloadedModels) {
        try {
          const fileInfo = await this.getModelFileInfo(filename);
          // Ensure file exists and has a size property before adding
          if (fileInfo.exists && typeof fileInfo.size === "number") {
            totalSize += fileInfo.size;
          }
        } catch (fileInfoError) {
          console.warn(
            `Could not get file info for '${filename}', skipping size calculation.`,
            fileInfoError
          );
          // Continue to the next file even if one file's info fails
        }
      }

      return totalSize;
    } catch (error) {
      console.error("Error calculating total downloaded size:", error);
      return 0;
    }
  }

  /**
   * Clears all downloaded models by deleting the entire models directory
   * and then recreating an empty one.
   * @returns A promise that resolves when all models are cleared.
   */
  static async clearAllModels(): Promise<void> {
    try {
      const dir = new FileSystem.Directory(ModelStorageConfig.modelsDirectory);
      if (dir.exists) {
        dir.delete(); // Delete the directory and its contents
        console.log(
          "Models directory deleted:",
          ModelStorageConfig.modelsDirectory
        );
      }
      await this.ensureModelsDirectory(); // Recreate empty directory
      console.log("All models cleared and directory re-initialized.");
    } catch (error) {
      console.error("Error clearing all models:", error);
      throw error;
    }
  }
}
