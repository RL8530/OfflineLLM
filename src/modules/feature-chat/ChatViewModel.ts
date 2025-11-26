import { ChatStorageService } from "../../services/ChatStorageService";
import { ModelsFileSystemService } from "../../services/ModelsFileSystemService";
import { AIService } from "../../services/AIService";
import { AVAILABLE_MODELS } from "../../data/models";
import { ChatSession, ChatMessage } from "../../types/Chat";
import { BaseViewModel } from "../core/BaseViewModel";
import { UIService } from "../../services/ui/UIService";

export interface ChatState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  downloadedModels: string[];
  showSessions: boolean;
  showModelSelector: boolean;
  streamingState: {
    currentResponse: string;
    currentAiMessageId: string | null;
    isStreaming: boolean;
  };
}

export const initialChatState: ChatState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  downloadedModels: [],
  showSessions: false,
  showModelSelector: false,
  streamingState: {
    currentResponse: "",
    currentAiMessageId: null,
    isStreaming: false,
  },
};

export class ChatViewModel extends BaseViewModel {
  state: ChatState = initialChatState;
  uiService: UIService;

  constructor(uiService: UIService) {
    super();
    this.uiService = uiService;
  }

  onNavigate = async () => {
    try {
      await Promise.all([
        this.loadSessions().catch((err) => {
          console.error("Failed to load chat sessions:", err);
          // Optionally: show toast or set error state
        }),
        this.loadDownloadedModels().catch((err) => {
          console.error("Failed to load downloaded models:", err);
        }),
      ]);
    } catch (err) {
      // This shouldn't happen due to inner catches, but safe fallback
      console.error("Unexpected error in onNavigate:", err);
    }
  };

  // Internal state update method
  private updateState(updates: Partial<ChatState>): void {
    this.state = { ...this.state, ...updates };
    this.rerender();
  }

  // Data loading functions
  private loadDownloadedModels = async (): Promise<void> => {
    const models = await ModelsFileSystemService.getDownloadedModels();
    this.updateState({ downloadedModels: models });
  };

  private loadSessions = async (): Promise<void> => {
    const savedSessions = await ChatStorageService.getSessions();
    this.updateState({ sessions: savedSessions });

    const currentSessionId = await ChatStorageService.getCurrentSessionId();
    if (currentSessionId) {
      const session = savedSessions.find((s) => s.id === currentSessionId);
      if (session) {
        this.updateState({ currentSession: session });
      }
    }

    if (savedSessions.length === 0) {
      this.createNewSession();
    }
  };

  // Session management
  createNewSession = (): void => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [
        {
          id: "1",
          text: "Hello! I'm your AI assistant. How can I help you today?",
          sender: "ai",
          timestamp: new Date(),
        },
      ],
      modelId: "phi-2",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.updateState({ currentSession: newSession, showSessions: false });
    this.saveSession(newSession);
  };

  private saveSession = async (session: ChatSession): Promise<void> => {
    await ChatStorageService.saveSession(session);
    await ChatStorageService.saveCurrentSessionId(session.id);
    const updatedSessions = await ChatStorageService.getSessions();
    this.updateState({ sessions: updatedSessions });
  };

  selectSession = (session: ChatSession): void => {
    this.updateState({ currentSession: session, showSessions: false });
    ChatStorageService.saveCurrentSessionId(session.id).catch((err) => {
      console.error("Failed to persist current session ID:", err);
    });
  };

  deleteSession = async (sessionId: string): Promise<void> => {
    this.uiService.showAlert({
      title: "Delete Chat",
      message:
        "Are you sure you want to delete this chat? This action cannot be undone.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await ChatStorageService.deleteSession(sessionId);
            const updatedSessions = await ChatStorageService.getSessions();
            this.updateState({ sessions: updatedSessions });

            if (this.state.currentSession?.id === sessionId) {
              if (updatedSessions.length > 0) {
                this.updateState({ currentSession: updatedSessions[0] });
              } else {
                this.createNewSession();
              }
            }
          },
        },
      ],
    });
  };

  // Message handling
  handleSendMessage = async (text: string): Promise<void> => {
    if (!this.state.currentSession) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [
      ...this.state.currentSession.messages,
      userMessage,
    ];
    const updatedSession = {
      ...this.state.currentSession,
      messages: updatedMessages,
      updatedAt: new Date(),
      title:
        this.state.currentSession.title === "New Chat" &&
        this.state.currentSession.messages.length === 1
          ? text.length > 30
            ? text.substring(0, 27) + "..."
            : text
          : this.state.currentSession.title,
    };

    this.updateState({ currentSession: updatedSession });
    await this.saveSession(updatedSession);

    // Start streaming
    this.updateState({
      isLoading: true,
      streamingState: {
        currentResponse: "",
        currentAiMessageId: (Date.now() + 1).toString(),
        isStreaming: true,
      },
    });

    try {
      // Create AI message with empty text initially
      const initialAiMessage: ChatMessage = {
        id: this.state.streamingState.currentAiMessageId!,
        text: "",
        sender: "ai",
        timestamp: new Date(),
        modelId: this.state.currentSession.modelId,
      };

      // Add empty AI message to session
      const messagesWithAi = [...updatedMessages, initialAiMessage];
      const sessionWithAiMessage = {
        ...updatedSession,
        messages: messagesWithAi,
      };

      this.updateState({ currentSession: sessionWithAiMessage });

      // Generate AI response with streaming
      await AIService.generateResponse(
        text,
        this.state.currentSession.modelId,
        (token) => {
          console.log(token);

          // Update streaming state reactively
          this.updateState({
            streamingState: {
              ...this.state.streamingState,
              currentResponse: token,
            },
          });

          // Update the AI message with the new content
          const updatedAiMessages = messagesWithAi.map((msg) =>
            msg.id === this.state.streamingState.currentAiMessageId
              ? {
                  ...msg,
                  text: token,
                  timestamp: new Date(),
                }
              : msg
          );

          const updatedSessionWithToken = {
            ...sessionWithAiMessage,
            messages: updatedAiMessages,
            updatedAt: new Date(),
          };

          this.updateState({ currentSession: updatedSessionWithToken });
        }
      );

      // Final save with complete response
      const finalSession = {
        ...updatedSession,
        messages: messagesWithAi.map((msg) =>
          msg.id === this.state.streamingState.currentAiMessageId
            ? { ...msg, text: this.state.streamingState.currentResponse }
            : msg
        ),
        updatedAt: new Date(),
      };

      this.updateState({ currentSession: finalSession });
      await this.saveSession(finalSession);
    } catch (error) {
      console.error("Error generating response:", error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: this.state.streamingState.currentAiMessageId!,
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ai",
        timestamp: new Date(),
        modelId: this.state.currentSession.modelId,
      };

      const errorSession = {
        ...updatedSession,
        messages: [...updatedMessages, errorMessage],
        updatedAt: new Date(),
      };

      this.updateState({ currentSession: errorSession });
      await this.saveSession(errorSession);
    } finally {
      // Clear streaming state
      this.updateState({
        isLoading: false,
        streamingState: {
          currentResponse: "",
          currentAiMessageId: null,
          isStreaming: false,
        },
      });
    }
  };

  // cancel streaming
  cancelStreaming = (): void => {
    if (this.state.streamingState.isStreaming) {
      this.updateState({
        isLoading: false,
        streamingState: {
          currentResponse: "",
          currentAiMessageId: null,
          isStreaming: false,
        },
      });
    }
  };

  // Model management
  handleSelectModel = async (modelId: string): Promise<void> => {
    if (!this.state.currentSession) return;

    const updatedSession = {
      ...this.state.currentSession,
      modelId,
      updatedAt: new Date(),
    };

    this.updateState({ currentSession: updatedSession });
    await this.saveSession(updatedSession);
  };

  getActiveModelName = (): string => {
    if (!this.state.currentSession?.modelId) return "No Model Selected";

    const model = AVAILABLE_MODELS.find(
      (m) => m.id === this.state.currentSession!.modelId
    );
    return model ? model.name : this.state.currentSession.modelId;
  };

  // Export functionality
  exportChat = async (): Promise<void> => {
    if (!this.state.currentSession) return;

    const chatText = this.state.currentSession.messages
      .map((msg) => `${msg.sender === "user" ? "You" : "AI"}: ${msg.text}`)
      .join("\n\n");

    try {
      await this.uiService.shareContent({
        message: `AI Chat Conversation\n\n${chatText}`,
        title: "Chat Export",
      });
    } catch (error) {
      console.error("Error sharing chat:", error);

      this.uiService
        .showAlert({
          title: "Error",
          message: "Could not export chat. Please try again.",
        })
        .catch((err) => {
          console.error("Failed to show export error message:", err);
          // Optionally: this.uiService.showToast("Export failed");
        });
    }
  };

  // UI state management
  openSessions = (): void => this.updateState({ showSessions: true });
  closeSessions = (): void => this.updateState({ showSessions: false });
  openModelSelector = (): void => this.updateState({ showModelSelector: true });
  closeModelSelector = (): void =>
    this.updateState({ showModelSelector: false });

  // Getter for refs (needed by component)
  getScrollViewRef = (): any => null; // This will be set by the component
}
