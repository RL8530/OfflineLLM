import * as FileSystem from "expo-file-system";
import {
  createDownloadResumable,
  DownloadOptions,
  DownloadProgressData,
  DownloadResumable,
} from "expo-file-system/legacy";

export class ExpoFileSystemService {
  static documentUri(): string {
    return FileSystem.Paths.document.uri;
  }

  static async ensureDirectory(path: string): Promise<void> {
    try {
      const dir = new FileSystem.Directory(path);
      // console.log("ensure directory", dir);
      if (!dir.exists) {
        dir.create();
      }
    } catch (error) {
      console.error(`Error ensuring directory '${path}':`, error);
      throw error;
    }
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const file = new FileSystem.File(filePath);
      const info = file.info();
      return info.exists;
    } catch (error) {
      console.error(`Error checking file existence '${filePath}':`, error);
      return false;
    }
  }

  static async readFile(filePath: string): Promise<string> {
    try {
      const file = new FileSystem.File(filePath);
      return await file.text();
    } catch (error) {
      console.error(`Error reading file '${filePath}':`, error);
      throw error;
    }
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const file = new FileSystem.File(filePath);
      await file.write(content);
    } catch (error) {
      console.error(`Error writing file '${filePath}':`, error);
      throw error;
    }
  }

  static async deleteFile(filePath: string): Promise<void> {
    try {
      const file = new FileSystem.File(filePath);
      if (file.info().exists) {
        file.delete();
      }
    } catch (error) {
      console.error(`Error deleting file '${filePath}':`, error);
      throw error;
    }
  }

  static async listFiles(directoryPath: string): Promise<string[]> {
    try {
      const dir = new FileSystem.Directory(directoryPath);
      return dir.list().map((file) => file.name);
    } catch (error) {
      console.error(`Error listing files in '${directoryPath}':`, error);
      throw error;
    }
  }

  static async getFileInfo(filePath: string): Promise<FileSystem.FileInfo> {
    try {
      const file = new FileSystem.File(filePath);
      return await file.info();
    } catch (error) {
      console.error(`Error getting file info for '${filePath}':`, error);
      throw error;
    }
  }

  static async deleteDirectory(directoryPath: string): Promise<void> {
    try {
      const dir = new FileSystem.Directory(directoryPath);
      if (dir.exists) {
        dir.delete();
      }
    } catch (error) {
      console.error(`Error deleting directory '${directoryPath}':`, error);
      throw error;
    }
  }

  static async getTotalSize(filePaths: string[]): Promise<number> {
    try {
      let totalSize = 0;
      for (const filePath of filePaths) {
        try {
          const info = await this.getFileInfo(filePath);
          if (info.exists && typeof info.size === "number") {
            totalSize += info.size;
          }
        } catch (fileError) {
          console.warn(
            `Could not get size for '${filePath}', skipping:`,
            fileError
          );
          // Continue with other files
        }
      }
      return totalSize;
    } catch (error) {
      console.error("Error calculating total size:", error);
      return 0;
    }
  }

  //expo-file-system/legacy
  static createDownloadResumable(
    url: string,
    fileUri: string,
    options?: DownloadOptions,
    callback?: (downloadProgress: DownloadProgressData) => void
  ): DownloadResumable {
    return createDownloadResumable(url, fileUri, options, callback);
  }
}
