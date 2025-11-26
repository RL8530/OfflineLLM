import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { ChatSession } from "../../../types/Chat";
import { useAppTheme } from "../../core/useAppTheme";

interface SessionListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewSession: () => void;
}

function SessionList({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSession,
}: SessionListProps) {
  const { colors } = useAppTheme();

  const formatDate = (date: Date): string => {
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const getPreviewText = (messages: any[]): string => {
    if (messages.length === 0) return "New chat";
    const lastMessage = messages[messages.length - 1];
    return lastMessage.text.length > 30
      ? lastMessage.text.substring(0, 30) + "..."
      : lastMessage.text;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Chat Sessions
        </Text>
        <TouchableOpacity
          style={[styles.newSessionButton, { backgroundColor: colors.accent }]}
          onPress={onNewSession}
        >
          <Text
            style={[styles.newSessionButtonText, { color: colors.primary }]}
          >
            + New Chat
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sessionsList}>
        {sessions.map((session) => (
          <TouchableOpacity
            key={session.id}
            style={[
              styles.sessionItem,
              { borderBottomColor: colors.border },
              currentSessionId === session.id && [
                styles.sessionItemActive,
                { backgroundColor: colors.card },
              ],
            ]}
            onPress={() => onSelectSession(session)}
          >
            <View style={styles.sessionContent}>
              <Text style={[styles.sessionTitle, { color: colors.text }]}>
                {session.title}
              </Text>
              <Text
                style={[styles.sessionPreview, { color: colors.textTertiary }]}
              >
                {getPreviewText(session.messages)}
              </Text>
              <Text
                style={[styles.sessionDate, { color: colors.textSecondary }]}
              >
                {formatDate(session.updatedAt)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDeleteSession(session.id)}
            >
              <Text style={[styles.deleteButtonText, { color: colors.danger }]}>
                ×
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {sessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              No chat sessions yet
            </Text>
            <Text
              style={[
                styles.emptyStateSubtext,
                { color: colors.textSecondary },
              ]}
            >
              Start a new conversation to see it here!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  newSessionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newSessionButtonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  sessionsList: {
    flex: 1,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  sessionItemActive: {
    // Background color comes from theme
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sessionPreview: {
    fontSize: 14,
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default SessionList;
