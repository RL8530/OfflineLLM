// src/modules/feature-settings/components/SettingItem.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../../core/useAppTheme";

export interface SettingItemProps {
  title: string;
  subtitle?: string;
  rightElement: React.ReactNode;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  rightElement,
}) => {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.settingSubtitle, { color: colors.textSecondary }]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement}
    </View>
  );
};

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
  },
});
