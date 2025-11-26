import React, { memo, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import { useAppTheme } from "../../core/useAppTheme";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const { colors } = useAppTheme();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const SendButtonText = ({ color, size }: { color: string; size: number }) => (
    <Text style={{ color, fontSize: size, fontWeight: "bold" }}>↑</Text>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.inputBackground,
          borderTopColor: colors.inputBorder,
        },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            color: colors.inputText,
            borderColor: colors.inputBorder,
          },
        ]}
        value={message}
        onChangeText={setMessage}
        placeholder="Type your message..."
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={500}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: colors.accent },
          (!message.trim() || disabled) && [
            styles.sendButtonDisabled,
            { backgroundColor: colors.tertiary },
          ],
        ]}
        onPress={handleSend}
        disabled={!message.trim() || disabled}
      >
        <SendButtonText color={colors.primary} size={18} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    // Background color comes from theme
  },
});

export default memo(MessageInput);
