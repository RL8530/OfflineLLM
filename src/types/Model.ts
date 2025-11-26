export interface LLMModel {
  id: string;
  name: string;
  size: number;
  description: string;
  downloadUrl: string;
  filename: string;
  contextSize?: number;
  downloads?: number;
  author?: string;
  tags?: string[];
  quantization?: string;
}

export interface DownloadProgress {
  id: string;
  progress: number; // 0 to 1
  downloadedBytes: number;
  totalBytes: number;
  status: "downloading" | "completed" | "error" | "paused";
}
