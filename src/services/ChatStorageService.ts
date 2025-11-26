import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatSession } from "../types/Chat";
import { AppSettings } from "../modules/feature-settings/models/AppSettings";

const SESSIONS_KEY = "@llm_chat_sessions";
const CURRENT_SESSION_KEY = "@llm_chat_current_session";

export class ChatStorageService {
  // Session Management
  static async saveSession(session: ChatSession): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const existingIndex = sessions.findIndex((s) => s.id === session.id);

      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error saving session:", error);
    }
  }

  static async getSessions(): Promise<ChatSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(SESSIONS_KEY);
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        // Convert date strings back to Date objects
        return sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      }
      return [];
    } catch (error) {
      console.error("Error getting sessions:", error);
      return [];
    }
  }

  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const filteredSessions = sessions.filter((s) => s.id !== sessionId);
      await AsyncStorage.setItem(
        SESSIONS_KEY,
        JSON.stringify(filteredSessions)
      );
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  }

  static async getSession(sessionId: string): Promise<ChatSession | null> {
    const sessions = await this.getSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  }

  // Current Session
  static async saveCurrentSessionId(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    } catch (error) {
      console.error("Error saving current session:", error);
    }
  }

  static async getCurrentSessionId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CURRENT_SESSION_KEY);
    } catch (error) {
      console.error("Error getting current session:", error);
      return null;
    }
  }
}
