import { ChatStorageService } from "../../../services/ChatStorageService";
import { ModelsFileSystemService } from "../../../services/ModelsFileSystemService";
import { UIService } from "../../../services/ui/UIService";
import { ChatMessage, ChatSession } from "../../../types/Chat";
import { BaseViewModel } from "../../core/BaseViewModel";
import { HomeState, HomeViewModel, initialHomeState } from "../HomeViewModel";

// Mock the dependencies
jest.mock("../../../services/ChatStorageService", () => ({
  ChatStorageService: {
    getSessions: jest.fn(),
  },
}));

jest.mock("../../../services/ModelsFileSystemService", () => ({
  ModelsFileSystemService: {
    getDownloadedModels: jest.fn(),
  },
}));

// Mock UIService
const mockUIService: UIService = {
  showAlert: jest.fn(),
  openURL: jest.fn(),
  openAppSettings: jest.fn(),
  showActionSheet: jest.fn(),
  shareContent: jest.fn(),
};

// Mock Expo FileSystem if needed
jest.mock("expo-file-system", () => ({
  documentDirectory: "file:///mock/documents/",
  getInfoAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

describe("HomeViewModel", () => {
  let viewModel: HomeViewModel;
  let mockRerender: jest.Mock;

  // Mock data with correct types
  const mockMessages: ChatMessage[] = [
    {
      id: "1",
      text: "Hello, this is a test message that is quite long and should be truncated",
      sender: "user",
      timestamp: new Date("2024-01-01T10:00:00Z"),
      modelId: "model-1",
    },
    {
      id: "2",
      text: "Hi there!",
      sender: "ai",
      timestamp: new Date("2024-01-01T10:01:00Z"),
      modelId: "model-1",
    },
  ];

  const mockSessions: ChatSession[] = [
    {
      id: "1",
      title: "Session 1",
      messages: mockMessages,
      modelId: "model-1",
      createdAt: new Date("2024-01-01T10:00:00Z"),
      updatedAt: new Date("2024-01-01T10:01:00Z"),
    },
    {
      id: "2",
      title: "Session 2",
      messages: [
        {
          id: "3",
          text: "Short message",
          sender: "user",
          timestamp: new Date("2024-01-01T11:00:00Z"),
          modelId: "model-2",
        },
      ],
      modelId: "model-2",
      createdAt: new Date("2024-01-01T11:00:00Z"),
      updatedAt: new Date("2024-01-01T11:00:00Z"),
    },
  ];

  const mockDownloadedModels = [
    { id: "model1", name: "Model 1", path: "/path/to/model1" },
    { id: "model2", name: "Model 2", path: "/path/to/model2" },
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    (ChatStorageService.getSessions as jest.Mock).mockResolvedValue(
      mockSessions
    );
    (
      ModelsFileSystemService.getDownloadedModels as jest.Mock
    ).mockResolvedValue(mockDownloadedModels);

    // Create instance and mock rerender
    viewModel = new HomeViewModel(mockUIService);
    mockRerender = jest.fn();
    viewModel.rerender = mockRerender;
  });

  describe("Initial State", () => {
    it("should initialize with correct default state", () => {
      expect(viewModel.state).toEqual(initialHomeState);
      expect(viewModel.state.recentSession).toBeNull();
      expect(viewModel.state.sessionsCount).toBe(0);
      expect(viewModel.state.downloadedModelsCount).toBe(0);
      expect(viewModel.state.isLoading).toBe(true);
    });
  });

  describe("onNavigate", () => {
    it("should call loadStats when onNavigate is called", async () => {
      const loadStatsSpy = jest.spyOn(viewModel, "loadStats");

      await viewModel.onNavigate();

      expect(loadStatsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("loadStats", () => {
    it("should load stats successfully and update state with correct recent session", async () => {
      await viewModel.loadStats();

      expect(ChatStorageService.getSessions).toHaveBeenCalledTimes(1);
      expect(ModelsFileSystemService.getDownloadedModels).toHaveBeenCalledTimes(
        1
      );

      // Should use the last session as recentSession (mockSessions[1])
      expect(viewModel.state).toEqual({
        ...initialHomeState,
        sessionsCount: mockSessions.length,
        downloadedModelsCount: mockDownloadedModels.length,
        recentSession: mockSessions[1], // Last session in array
        isLoading: false,
      });

      expect(mockRerender).toHaveBeenCalledTimes(2);
    });

    it("should handle empty sessions array correctly", async () => {
      (ChatStorageService.getSessions as jest.Mock).mockResolvedValue([]);
      (
        ModelsFileSystemService.getDownloadedModels as jest.Mock
      ).mockResolvedValue([]);

      await viewModel.loadStats();

      expect(viewModel.state).toEqual({
        ...initialHomeState,
        sessionsCount: 0,
        downloadedModelsCount: 0,
        recentSession: null,
        isLoading: false,
      });
    });

    it("should handle single session correctly", async () => {
      const singleSession = [mockSessions[0]];
      (ChatStorageService.getSessions as jest.Mock).mockResolvedValue(
        singleSession
      );

      await viewModel.loadStats();

      expect(viewModel.state.recentSession).toEqual(singleSession[0]);
      expect(viewModel.state.sessionsCount).toBe(1);
    });

    it("should handle errors gracefully and maintain state consistency", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      (ChatStorageService.getSessions as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      // Store initial state before error
      const initialState = { ...viewModel.state };

      await viewModel.loadStats();

      expect(viewModel.state.isLoading).toBe(false);
      expect(viewModel.state.sessionsCount).toBe(initialState.sessionsCount);
      expect(viewModel.state.downloadedModelsCount).toBe(
        initialState.downloadedModelsCount
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load stats:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should set isLoading to true when starting and false when finished", async () => {
      const isLoadingStates: boolean[] = [];
      // Intercept updateState calls to track isLoading changes
      const originalUpdateState = viewModel["updateState"].bind(viewModel);

      const updateStateSpy = jest.spyOn(
        viewModel as any,
        "updateState"
      ) as jest.MockedFunction<(updates: Partial<HomeState>) => void>;

      updateStateSpy.mockImplementation((updates: Partial<HomeState>) => {
        if ("isLoading" in updates) {
          isLoadingStates.push(updates.isLoading!);
        }
        originalUpdateState(updates);
      });

      await viewModel.loadStats();

      expect(isLoadingStates).toEqual([true, false]);
    });
  });

  describe("getRecentPreview", () => {
    it("should truncate long message text correctly", () => {
      const longMessage =
        "Hello, this is a test message that is quite long and should be truncated";
      viewModel["updateState"]({
        recentSession: {
          ...mockSessions[0],
          messages: [
            {
              id: "1",
              text: longMessage,
              sender: "user" as const,
              timestamp: new Date(),
              modelId: "model-1",
            },
          ],
        },
      });

      const preview = viewModel.getRecentPreview();

      // Debug what we're actually getting
      console.log("Original length:", longMessage.length);
      console.log("Preview length:", preview.length);
      console.log("Preview:", preview);

      // The message should be truncated since it's longer than 50 characters
      expect(longMessage.length).toBeGreaterThan(50);
      expect(preview.length).toBeLessThanOrEqual(53); // 50 + "..."
      expect(preview).toMatch(/\.\.\.$/); // Should end with ellipsis
      expect(preview).not.toBe(longMessage); // Should not be the full message
    });

    it("should return full text for short messages", () => {
      viewModel["updateState"]({
        recentSession: mockSessions[1], // Session with short message
      });

      const preview = viewModel.getRecentPreview();

      expect(preview).toBe("Short message");
    });

    it("should return default message when no recent session exists", () => {
      viewModel["updateState"]({
        recentSession: null,
      });

      const preview = viewModel.getRecentPreview();

      expect(preview).toBe("No recent conversations");
    });

    it("should return default message when recent session has no messages", () => {
      const emptySession: ChatSession = {
        id: "3",
        title: "Empty Session",
        messages: [],
        modelId: "model-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      viewModel["updateState"]({
        recentSession: emptySession,
      });

      const preview = viewModel.getRecentPreview();

      expect(preview).toBe("No recent conversations");
    });

    it("should handle messages from different senders correctly", () => {
      const sessionWithAIMessage: ChatSession = {
        id: "4",
        title: "AI Session",
        messages: [
          {
            id: "5",
            text: "This is an AI response that should be shown in preview",
            sender: "ai",
            timestamp: new Date(),
            modelId: "model-1",
          },
        ],
        modelId: "model-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      viewModel["updateState"]({
        recentSession: sessionWithAIMessage,
      });

      const preview = viewModel.getRecentPreview();

      expect(preview).toBe(
        "This is an AI response that should be shown in pre..."
      );
    });
  });

  describe("updateState", () => {
    it("should merge partial state updates correctly", () => {
      const updates: Partial<HomeState> = {
        sessionsCount: 5,
        isLoading: false,
      };

      viewModel["updateState"](updates);

      expect(viewModel.state).toEqual({
        ...initialHomeState,
        ...updates,
      });
      expect(mockRerender).toHaveBeenCalledTimes(1);
    });

    it("should preserve unchanged state properties", () => {
      // First update
      viewModel["updateState"]({ sessionsCount: 10 });

      // Second update should not affect sessionsCount
      viewModel["updateState"]({ downloadedModelsCount: 3 });

      expect(viewModel.state.sessionsCount).toBe(10);
      expect(viewModel.state.downloadedModelsCount).toBe(3);
      expect(viewModel.state.isLoading).toBe(initialHomeState.isLoading);
    });

    it("should handle null updates correctly", () => {
      viewModel["updateState"]({ recentSession: null });

      expect(viewModel.state.recentSession).toBeNull();
      expect(mockRerender).toHaveBeenCalledTimes(1);
    });
  });

  describe("Action Methods", () => {
    it("should call openGitHub without throwing errors", () => {
      expect(() => {
        viewModel.openGitHub();
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent loadStats calls without race conditions", async () => {
      // Simulate slow API calls
      (ChatStorageService.getSessions as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockSessions), 100))
      );

      const promises = [
        viewModel.loadStats(),
        viewModel.loadStats(),
        viewModel.loadStats(),
      ];

      await Promise.all(promises);

      // Should complete without errors and have consistent state
      expect(viewModel.state.isLoading).toBe(false);
      expect(viewModel.state.sessionsCount).toBe(mockSessions.length);
    });

    it("should maintain state consistency after multiple operations", async () => {
      // Perform sequence of operations
      await viewModel.loadStats();
      const preview1 = viewModel.getRecentPreview();

      viewModel["updateState"]({ isLoading: true });
      const preview2 = viewModel.getRecentPreview();

      viewModel["updateState"]({ sessionsCount: 999 });
      const preview3 = viewModel.getRecentPreview();

      expect(typeof preview1).toBe("string");
      expect(typeof preview2).toBe("string");
      expect(typeof preview3).toBe("string");
      expect(viewModel.state.isLoading).toBe(true);
      expect(viewModel.state.sessionsCount).toBe(999);
    });

    it("should handle sessions with system messages correctly", () => {
      const sessionWithSystemMessage: ChatSession = {
        id: "5",
        title: "System Session",
        messages: [
          {
            id: "6",
            text: "System message that should not typically appear in preview",
            sender: "system",
            timestamp: new Date(),
            modelId: "model-1",
          },
        ],
        modelId: "model-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      viewModel["updateState"]({
        recentSession: sessionWithSystemMessage,
      });

      const preview = viewModel.getRecentPreview();

      // System messages should still be shown in preview
      expect(preview).toBe(
        "System message that should not typically appear in..."
      );
    });
  });
});
