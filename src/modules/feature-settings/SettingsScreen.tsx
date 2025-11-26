import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useViewModel } from "../core/useViewModel";
import { SettingsViewModel } from "./SettingsViewModel";
import { SettingItem } from "./components/SettingItem";
import { ThemeOption } from "./components/ThemeOption";

export interface SettingsScreenProps {
  viewModel: SettingsViewModel;
}

export default function SettingsScreen({ viewModel }: SettingsScreenProps) {
  useViewModel(viewModel);

  const colors = viewModel.state.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Chat Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Chat Settings
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingItem
            title="Save Chat History"
            subtitle="Automatically save your conversations"
            rightElement={
              <Switch
                value={viewModel.state.settings.saveChatHistory}
                onValueChange={(value) =>
                  viewModel.updateSetting("saveChatHistory", value)
                }
                trackColor={{ false: colors.tertiary, true: colors.accent }}
                thumbColor={
                  viewModel.state.settings.saveChatHistory
                    ? "#ffffff"
                    : "#f4f3f4"
                }
              />
            }
          />

          <SettingItem
            title="Auto Clear Chat"
            subtitle="Clear chat when starting new conversation"
            rightElement={
              <Switch
                value={viewModel.state.settings.autoClearChat}
                onValueChange={(value) =>
                  viewModel.updateSetting("autoClearChat", value)
                }
                trackColor={{ false: colors.tertiary, true: colors.accent }}
                thumbColor={
                  viewModel.state.settings.autoClearChat ? "#ffffff" : "#f4f3f4"
                }
              />
            }
          />
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Appearance
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.themeSection}>
            <Text style={[styles.themeSectionTitle, { color: colors.text }]}>
              Theme
            </Text>
            <Text
              style={[
                styles.themeSectionSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              Choose app appearance • Current: {viewModel.getThemeDisplayName()}
            </Text>

            <View style={styles.themeOptionsContainer}>
              {viewModel.state.themeOptions.map((option) => (
                <ThemeOption
                  key={option.value}
                  theme={option.value}
                  displayName={option.displayName}
                  isSelected={viewModel.state.settings.theme === option.value}
                  onSelect={viewModel.handleThemeSelect}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Data Management */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tertiary }]}
            onPress={viewModel.handleExportData}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Export Chat Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.dangerButton,
              { borderColor: colors.danger },
            ]}
            onPress={viewModel.handleResetApp}
          >
            <Text
              style={[
                styles.actionButtonText,
                styles.dangerButtonText,
                { color: colors.danger },
              ]}
            >
              Reset All Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Information */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Version
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {viewModel.state.appInfo.version} (Build{" "}
              {viewModel.state.appInfo.buildNumber})
            </Text>
          </View>

          <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Last Updated
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {viewModel.state.appInfo.lastUpdated.toLocaleDateString()}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tertiary }]}
            onPress={viewModel.openGitHub}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              View Source Code
            </Text>
          </TouchableOpacity>

          <View style={[styles.credits, { backgroundColor: colors.tertiary }]}>
            <Text style={[styles.creditsText, { color: colors.text }]}>
              Built with React Native, Expo, and TypeScript
            </Text>
            <Text
              style={[styles.creditsSubtext, { color: colors.textSecondary }]}
            >
              Demo app for mobile development portfolio
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
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
  themeSection: {
    marginTop: 8,
  },
  themeSectionTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  themeSectionSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  themeOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  themeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  themeOptionSelected: {
    borderColor: "#4cc9f0",
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  themeOptionTextSelected: {
    fontWeight: "bold",
  },
  autoThemeHint: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 8,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 4,
  },
  dangerButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dangerButtonText: {
    // Color comes from theme
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
  },
  credits: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  creditsText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  creditsSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
});
