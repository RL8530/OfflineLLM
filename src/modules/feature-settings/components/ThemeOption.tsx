import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../../core/useAppTheme";

export interface ThemeOptionProps {
  theme: string;
  displayName: string;
  isSelected: boolean;
  onSelect: (theme: "dark" | "light" | "auto") => void;
}

export const ThemeOption: React.FC<ThemeOptionProps> = ({
  theme,
  displayName,
  isSelected,
  onSelect,
}) => {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      style={[
        styles.themeOption,
        { backgroundColor: colors.tertiary },
        isSelected && [{ backgroundColor: colors.accent }],
      ]}
      onPress={() => onSelect(theme as "dark" | "light" | "auto")}
    >
      <Text
        style={[
          styles.themeOptionText,
          { color: colors.text },
          isSelected && [
            styles.themeOptionTextSelected,
            { color: colors.primary },
          ],
        ]}
      >
        {displayName}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  themeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  themeOptionTextSelected: {
    fontWeight: "bold",
  },
});
