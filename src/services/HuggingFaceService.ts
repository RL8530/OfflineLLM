import { LLMModel } from "../types/Model";

interface HuggingFaceFile {
  rfilename: string;
  size?: number;
}

interface HuggingFaceModelDetails {
  siblings?: HuggingFaceFile[];
  config?: any;
}

interface HuggingFaceModel {
  id: string;
  downloads: number;
  tags: string[];
  modelId: string;
  author: string;
}

interface GGUFile {
  filename: string;
  size: number;
  quantization: string;
  estimated?: boolean;
}

export class HuggingFaceService {
  private static readonly API_BASE = "https://huggingface.co/api";
  private static readonly MAX_SIZE = 2_500_000_000; // 2.5GB
  private static readonly PREFERRED_QUANTIZATIONS = [
    "Q4_K_M",
    "Q5_K_M",
    "Q4_0",
    "Q5_0",
  ];

  // Size estimation multipliers (bytes per parameter)
  private static readonly SIZE_MULTIPLIERS: { [key: string]: number } = {
    Q2_K: 0.28,
    Q3_K_M: 0.38,
    Q3_K_S: 0.36,
    Q4_0: 0.5,
    Q4_K_M: 0.52,
    Q4_K_S: 0.5,
    Q5_0: 0.62,
    Q5_K_M: 0.64,
    Q5_K_S: 0.62,
    Q6_K: 0.75,
    Q8_0: 1.0,
    F16: 2.0,
    F32: 4.0,
  };

  static async searchMobileModels(
    options: {
      maxSize?: number;
      minDownloads?: number;
      architectures?: string[];
      limit?: number;
    } = {}
  ): Promise<LLMModel[]> {
    const {
      maxSize = this.MAX_SIZE,
      minDownloads = 1000,
      architectures = ["llama", "mistral", "phi", "qwen", "gemma", "tinyllama"],
      limit = 20,
    } = options;

    try {
      const models = await this.fetchGGUFModels();
      const filtered = this.filterModels(models, {
        maxSize,
        minDownloads,
        architectures,
        limit,
      });

      return await this.transformToLLMModels(filtered, maxSize);
    } catch (error) {
      console.error("Error searching Hugging Face models:", error);
      return this.getFallbackModels();
    }
  }

  private static async fetchGGUFModels(): Promise<HuggingFaceModel[]> {
    const response = await fetch(
      `${this.API_BASE}/models?search=gguf&filter=gguf&sort=downloads&direction=-1&limit=100`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  private static filterModels(
    models: HuggingFaceModel[],
    options: {
      maxSize: number;
      minDownloads: number;
      architectures: string[];
      limit: number;
    }
  ): HuggingFaceModel[] {
    return models
      .filter((model: HuggingFaceModel) => {
        const hasEnoughDownloads = model.downloads >= options.minDownloads;
        const hasArchitecture = options.architectures.some((arch) =>
          model.tags.some((tag: string) => tag.toLowerCase().includes(arch))
        );
        const isGGUF = model.tags.includes("gguf");

        return hasEnoughDownloads && hasArchitecture && isGGUF;
      })
      .slice(0, options.limit);
  }

  private static async transformToLLMModels(
    models: HuggingFaceModel[],
    maxSize: number
  ): Promise<LLMModel[]> {
    const llmModels: LLMModel[] = [];

    for (const model of models) {
      try {
        const modelInfo = await this.getModelDetails(model.modelId);
        const ggufFiles = await this.extractGGUFFiles(
          modelInfo,
          model.modelId,
          model.tags
        );

        const bestFile = this.selectBestQuantization(ggufFiles);
        if (!bestFile) continue;

        const size = bestFile.size;
        if (size > maxSize) continue;

        llmModels.push({
          id: model.modelId.replace(/[^a-zA-Z0-9]/g, "-"),
          name: `${this.getModelDisplayName(model.modelId)} – ${
            bestFile.quantization
          }`,
          size: size,
          description: `${this.getArchitecture(
            model.tags
          )} model with ${model.downloads.toLocaleString()} downloads${
            bestFile.estimated ? " (estimated size)" : ""
          }`,
          downloadUrl: `https://huggingface.co/${model.modelId}/resolve/main/${bestFile.filename}`,
          filename: bestFile.filename,
          contextSize: this.estimateContextSize(model.tags),
        });
      } catch (error) {
        console.warn(`Failed to process model ${model.modelId}:`, error);
      }
    }

    return llmModels;
  }

  private static async getModelDetails(
    modelId: string
  ): Promise<HuggingFaceModelDetails> {
    const response = await fetch(`${this.API_BASE}/models/${modelId}`);
    if (!response.ok)
      throw new Error(`Failed to fetch model details for ${modelId}`);
    return await response.json();
  }

  private static async extractGGUFFiles(
    modelInfo: HuggingFaceModelDetails,
    modelId: string,
    tags: string[]
  ): Promise<GGUFile[]> {
    if (!modelInfo.siblings) return [];

    const ggufFiles: GGUFile[] = [];

    for (const file of modelInfo.siblings) {
      if (file.rfilename.endsWith(".gguf")) {
        const quantization = this.extractQuantization(file.rfilename);
        if (!quantization) continue;

        let size = file.size;
        let estimated = false;

        // If size is not provided, estimate it
        if (!size || size === 0) {
          const params = this.extractModelParams(modelId, tags);
          size = this.estimateModelSize(params, quantization);
          estimated = true;
        }

        ggufFiles.push({
          filename: file.rfilename,
          size,
          quantization,
          estimated,
        });
      }
    }

    return ggufFiles;
  }

  private static extractQuantization(filename: string): string {
    const quantMatch = filename.match(
      /\.(Q[0-9]_[KM][_A-Z]*|q[0-9]_[km][_a-z]*)\.gguf$/i
    );
    return quantMatch ? quantMatch[1].toUpperCase() : "";
  }

  private static selectBestQuantization(files: GGUFile[]): GGUFile | null {
    for (const preferredQuant of this.PREFERRED_QUANTIZATIONS) {
      const file = files.find((f) => f.quantization === preferredQuant);
      if (file) return file;
    }
    return files[0] || null;
  }

  private static extractModelParams(modelId: string, tags: string[]): number {
    // Try to extract from model ID first
    const paramMatch = modelId.match(/(\d+\.?\d*)[bB]/);
    if (paramMatch) {
      return parseFloat(paramMatch[1]) * 1_000_000_000;
    }

    // Try from tags
    for (const tag of tags) {
      const tagMatch = tag.match(/(\d+\.?\d*)[bB]/);
      if (tagMatch) {
        return parseFloat(tagMatch[1]) * 1_000_000_000;
      }
    }

    // Estimate based on model patterns
    const lowerModelId = modelId.toLowerCase();
    if (lowerModelId.includes("tinyllama") || lowerModelId.includes("1.1b"))
      return 1.1e9;
    if (lowerModelId.includes("phi-2") || lowerModelId.includes("2.7b"))
      return 2.7e9;
    if (lowerModelId.includes("gemma-2b")) return 2e9;
    if (lowerModelId.includes("qwen-1.8b")) return 1.8e9;
    if (lowerModelId.includes("3b")) return 3e9;
    if (lowerModelId.includes("7b")) return 7e9;
    if (lowerModelId.includes("13b")) return 13e9;

    return 2e9; // Default to 2B parameters
  }

  private static estimateModelSize(
    params: number,
    quantization: string
  ): number {
    const multiplier = this.SIZE_MULTIPLIERS[quantization] || 0.52; // Default to Q4_K_M
    return Math.floor((params * multiplier * 1024 * 1024 * 1024) / 8); // Convert to bytes
  }

  private static getModelDisplayName(modelId: string): string {
    // Extract a clean display name
    const parts = modelId.split("/");
    const name = parts[parts.length - 1];
    return name.replace(/[-_]/g, " ").replace(/(\d+[bB])/, "$1");
  }

  private static getArchitecture(tags: string[]): string {
    const arch = tags.find((tag) =>
      ["llama", "mistral", "phi", "qwen", "gemma", "tinyllama"].includes(
        tag.toLowerCase()
      )
    );
    return arch ? arch.charAt(0).toUpperCase() + arch.slice(1) : "Unknown";
  }

  private static estimateContextSize(tags: string[]): number {
    if (tags.some((t) => t.toLowerCase().includes("qwen"))) return 32768;
    if (tags.some((t) => t.toLowerCase().includes("mistral"))) return 8192;
    return 4096;
  }

  private static getFallbackModels(): LLMModel[] {
    return [
      {
        id: "phi-2-q4",
        name: "Phi-2 (2.7B) – Q4_K_M",
        size: 1_580_000_000,
        description:
          "Microsoft Phi-2 – tiny but surprisingly capable. Great for English tasks.",
        downloadUrl:
          "https://huggingface.co/TheBloke/Phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf",
        filename: "phi-2.Q4_K_M.gguf",
        contextSize: 2048,
      },
    ];
  }
}
