import { initLlama } from "llama.rn";
import * as FileSystem from "expo-file-system";
import { ChatMessage } from "../types/Chat";
import { ModelsFileSystemService } from "./ModelsFileSystemService";

interface LlamaContext {
  context: any;
  modelPath: string;
}

export class AIService {
  private static llama: LlamaContext | null = null;
  private static messages: ChatMessage[] = [];
  private static messageCount: number = 0;

  // Configuration constants
  private static readonly MAX_HISTORY_MESSAGES = 6; // Keep last 3 exchanges (user+ai)
  private static readonly RESET_INTERVAL = 0; // Reset context every 10 messages
  private static readonly MAX_TOKENS = 256;
  private static readonly STOP_WORDS = [
    "</s>",
    "<|eot_id|>",
    "<|end_of_text|>",
    "<|im_end|>",
    "```",
    "<|EOT|>",
    "<|end_of_turn|>",
    "<|endoftext|>",
  ];

  /** Public setter used by ChatScreen */
  static setSessionMessages(msgs: ChatMessage[]) {
    this.messages = msgs;
    this.messageCount = msgs.filter((m) => m.sender !== "system").length;
  }

  /** Load model (re-use if same path) */
  private static async ensureModel(modelFilename: string): Promise<boolean> {
    const modelsDirectory = ModelsFileSystemService.getModelsDirectory();
    const modelPath = `${modelsDirectory}${modelFilename}`;
    const plainPath = modelPath.replace("file://", "");
    try {
      const info = new FileSystem.File(plainPath).info();
      if (!info.exists) return false;

      if (this.llama?.modelPath === modelPath) return true; // already loaded

      // If we have an existing context, clean it up
      if (this.llama?.context) {
        await this.cleanupContext();
      }

      this.llama = {
        context: await initLlama({
          model: modelPath,
          use_mlock: true,
          n_ctx: 2048,
          n_gpu_layers: 99, // Metal/OpenCL – falls back to CPU if unavailable
        }),
        modelPath,
      };

      // Reset message state when loading new model
      this.resetConversation();
      return true;
    } catch (error) {
      console.error("Error loading model:", error);
      return false;
    }
  }

  /** Generate response – streaming */
  static async generateResponse(
    userText: string,
    modelId: string,
    onToken: (token: string) => void
  ): Promise<string> {
    try {
      const ok = await this.ensureModel(modelId);
      if (!ok || !this.llama) throw new Error("Model not available");

      // Check if we need to reset context
      if (this.messageCount >= this.RESET_INTERVAL) {
        console.log("Resetting context due to message count threshold");
        await this.resetContext();
      }

      // Trim history before adding new message
      this.trimHistory();

      // Add user message
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        text: userText,
        sender: "user",
        timestamp: new Date(),
        modelId: modelId,
      };
      this.messages.push(userMsg);
      this.messageCount++;

      // Ensure system prompt exists
      this.ensureSystemPrompt();

      // Prepare messages for completion
      const completionMessages = this.prepareMessagesForCompletion();

      console.log("Sending messages to model:", completionMessages.length);

      let fullResponse = "";
      const result = await this.llama.context.completion(
        {
          messages: completionMessages,
          n_predict: this.MAX_TOKENS,
          temperature: 0.2, // Lower for more consistency
          top_k: 20, // More restrictive
          top_p: 0.5, // More restrictive
          stop: this.STOP_WORDS,
          repetition_penalty: 1.2, // Increased to prevent repetition
          stream: true,
        },
        (data: any) => {
          const token = data["content"] ?? "";
          fullResponse += token;
          onToken(token);
        }
      );

      const assistantText = (result.text ?? fullResponse).trim();

      // Only add if we got a meaningful response
      if (assistantText && assistantText.length > 0) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: assistantText,
          sender: "ai",
          timestamp: new Date(),
          modelId: modelId,
        };
        this.messages.push(assistantMsg);
        this.messageCount++;
      }

      // Trim again after response to maintain size
      this.trimHistory();

      return assistantText;
    } catch (error) {
      console.error("Error generating response:", error);
      // Reset context on error to recover
      await this.resetContext();
      throw error;
    }
  }

  /** Keep only recent messages */
  private static trimHistory() {
    if (this.messages.length <= this.MAX_HISTORY_MESSAGES) {
      return;
    }

    // Keep system message and recent exchanges
    const systemMsg = this.messages.find((m) => m.sender === "system");
    const recentMsgs = this.messages
      .filter((m) => m.sender !== "system")
      .slice(-this.MAX_HISTORY_MESSAGES);

    this.messages = systemMsg ? [systemMsg, ...recentMsgs] : recentMsgs;

    console.log(`Trimmed history to ${this.messages.length} messages`);
  }

  /** Ensure system prompt exists */
  private static ensureSystemPrompt() {
    const hasSystemPrompt = this.messages.some((m) => m.sender === "system");
    if (!hasSystemPrompt) {
      this.messages.unshift({
        id: "system",
        text: "You are a helpful, concise assistant. Keep responses brief and to the point.",
        sender: "system",
        timestamp: new Date(),
        modelId: "system",
      });
    }
  }

  /** Prepare messages in correct format for completion */
  private static prepareMessagesForCompletion() {
    return this.messages
      .filter((m) => m.text.trim().length > 0) // Remove empty messages
      .map((m) => ({
        role:
          m.sender === "user"
            ? "user"
            : m.sender === "system"
            ? "system"
            : "assistant",
        content: m.text,
      }));
  }

  /** Reset the model context completely */
  static async resetContext() {
    console.log("Resetting AI context...");

    // Clear messages but keep track that we're resetting
    this.messages = [];
    this.messageCount = 0;

    // Reset the llama context if available
    if (this.llama?.context) {
      try {
        // Try to use reset method if available, otherwise we'll rely on fresh completion
        if (typeof this.llama.context.reset === "function") {
          await this.llama.context.reset();
        }
      } catch (error) {
        console.warn(
          "Could not reset context, will rely on fresh completion:",
          error
        );
      }
    }

    // Re-add system prompt
    this.ensureSystemPrompt();
  }

  /** Cleanup existing context */
  private static async cleanupContext() {
    if (this.llama?.context) {
      try {
        // If there's a cleanup/destroy method, call it
        if (typeof this.llama.context.cleanup === "function") {
          await this.llama.context.cleanup();
        } else if (typeof this.llama.context.destroy === "function") {
          await this.llama.context.destroy();
        }
      } catch (error) {
        console.warn("Error cleaning up context:", error);
      }
    }
    this.llama = null;
  }

  /** Clear context for a fresh session */
  static clear() {
    this.messages = [];
    this.messageCount = 0;
    this.ensureSystemPrompt();
  }

  /** Reset conversation but keep system prompt */
  static resetConversation() {
    const systemMsg = this.messages.find((m) => m.sender === "system");
    this.messages = systemMsg ? [systemMsg] : [];
    this.messageCount = 0;
    this.ensureSystemPrompt();
  }

  /** Get current message count for debugging */
  static getMessageCount(): number {
    return this.messageCount;
  }

  /** Get current messages for debugging */
  static getMessages(): ChatMessage[] {
    return [...this.messages];
  }
}
