import { LLMModel } from "../types/Model";

/** Mobile-optimized GGUF models (Q4_K_M / Q5_K_M) */
export const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: "phi-2-q4",
    name: "Phi-2 (2.7B) – Q4_K_M",
    size: 1_580_000_000, // ~1.58 GB
    description:
      "Microsoft Phi-2 – tiny but surprisingly capable. Great for English tasks.",
    downloadUrl:
      "https://huggingface.co/TheBloke/Phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf",
    filename: "phi-2.Q4_K_M.gguf",
    // optional: you can add a `params` field if you want to expose context size, etc.
    contextSize: 2048,
  },
  {
    id: "tinyllama-1.1b-q4",
    name: "TinyLlama 1.1B – Q4_K_M",
    size: 637_000_000, // ~637 MB
    description:
      "Ultra-compact Llama-style model. Perfect for low-RAM devices.",
    downloadUrl:
      "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v0.3-GGUF/resolve/main/tinyllama-1.1b-chat-v0.3.Q4_K_M.gguf",
    filename: "tinyllama-1.1b-chat-v0.3.Q4_K_M.gguf",
    contextSize: 2048,
  },
  {
    id: "gemma-2b-it-q4",
    name: "Gemma 2B Instruct – Q4_K_M",
    size: 1_380_000_000, // ~1.38 GB
    description:
      "Google Gemma 2B – strong instruction-following, multilingual.",
    downloadUrl:
      "https://huggingface.co/TheBloke/gemma-2b-it-GGUF/resolve/main/gemma-2b-it.Q4_K_M.gguf",
    filename: "gemma-2b-it.Q4_K_M.gguf",
    contextSize: 8192,
  },
  {
    id: "openchat-3.5-q4",
    name: "OpenChat 3.5 (3B) – Q4_K_M",
    size: 1_950_000_000, // ~1.95 GB
    description:
      "Top-tier open-source chat model, rivals GPT-3.5 on many benchmarks.",
    downloadUrl:
      "https://huggingface.co/TheBloke/OpenChat_3.5-GGUF/resolve/main/openchat_3.5.Q4_K_M.gguf",
    filename: "openchat_3.5.Q4_K_M.gguf",
    contextSize: 4096,
  },
];
