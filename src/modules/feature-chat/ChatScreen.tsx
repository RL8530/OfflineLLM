import { useNavigation, useTheme } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import MessageBubble from "./components/MessageBubble";
import MessageInput from "./components/MessageInput";
import ModelSelector from "./components/ModelSelector";
import SessionList from "./components/SessionList";
import { AVAILABLE_MODELS } from "../../data/models";
import { useViewModel } from "../core/useViewModel";
import { ChatViewModel } from "./ChatViewModel";
import { useAppTheme } from "../core/useAppTheme";

export interface ChatScreenProps {
  viewModel: ChatViewModel;
}

export default function ChatScreen({ viewModel }: ChatScreenProps) {
  useViewModel(viewModel);

  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", async () => {
      await viewModel.onNavigate();
    });

    return () => {
      unsubscribeFocus();
    };
  });

  const theme = useAppTheme();
  const colors = theme.colors;

  // ScrollView ref managed by component
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = (): void => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  if (viewModel.state.showSessions) {
    return (
      <SessionList
        sessions={viewModel.state.sessions}
        currentSessionId={viewModel.state.currentSession?.id || null}
        onSelectSession={viewModel.selectSession}
        onDeleteSession={viewModel.deleteSession}
        onNewSession={viewModel.createNewSession}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.menuButton}
          onPress={viewModel.openSessions}
        >
          <Text style={[styles.menuButtonText, { color: colors.text }]}>☰</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {viewModel.state.currentSession?.title || "Chat"}
          </Text>
          <TouchableOpacity onPress={viewModel.openModelSelector}>
            <Text style={[styles.modelText, { color: colors.accent }]}>
              {viewModel.getActiveModelName()}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: colors.tertiary }]}
          onPress={viewModel.exportChat}
        >
          <Text style={[styles.exportButtonText, { color: colors.text }]}>
            Export
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToBottom}
      >
        {viewModel.state.currentSession?.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {viewModel.state.isLoading && (
          <View style={[styles.messageContainer, styles.aiContainer]}>
            <View
              style={[
                styles.bubble,
                styles.aiBubble,
                styles.typingIndicator,
                { backgroundColor: colors.typingIndicator },
              ]}
            >
              <Text
                style={[styles.typingText, { color: colors.textSecondary }]}
              >
                AI is thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <MessageInput
        onSendMessage={viewModel.handleSendMessage}
        disabled={
          viewModel.state.isLoading || !viewModel.state.currentSession?.modelId
        }
      />

      {/* Model Selector Modal */}
      <ModelSelector
        models={AVAILABLE_MODELS}
        downloadedModels={viewModel.state.downloadedModels}
        selectedModel={viewModel.state.currentSession?.modelId || null}
        onSelectModel={viewModel.handleSelectModel}
        visible={viewModel.state.showModelSelector}
        onClose={viewModel.closeModelSelector}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 8,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  modelText: {
    fontSize: 12,
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: "80%",
  },
  aiContainer: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  typingIndicator: {
    // Background color comes from theme
  },
  typingText: {
    fontStyle: "italic",
  },
});
