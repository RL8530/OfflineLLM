import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChatMessage } from "../../../types/Chat";
import { useAppTheme } from "../../core/useAppTheme";

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { colors } = useAppTheme();
  const isUser = message.sender === "user";

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.userBubble }]
            : [styles.aiBubble, { backgroundColor: colors.aiBubble }],
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser
              ? [styles.userText, { color: colors.primary }]
              : [styles.aiText, { color: colors.text }],
          ]}
        >
          {message.text}
        </Text>
      </View>
      <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
        {message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    maxWidth: "80%",
  },
  userContainer: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
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
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    // Color comes from theme
  },
  aiText: {
    // Color comes from theme
  },
  timestamp: {
    fontSize: 11,
    marginHorizontal: 4,
  },
});

export default memo(MessageBubble);
