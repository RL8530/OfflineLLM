import React, { useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useViewModel } from "../core/useViewModel";
import { HomeViewModel } from "./HomeViewModel";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../core/useAppTheme";

export interface HomeScreenProps {
  viewModel: HomeViewModel;
}

export default function HomeScreen({ viewModel }: HomeScreenProps) {
  useViewModel(viewModel);

  console.log("home screen - render");

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.accent }]}>
          🤖 LLM Chat Demo
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Offline AI Assistant
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>
          Quick Stats
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {viewModel.state.sessionsCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Chats
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {viewModel.state.downloadedModelsCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Models
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {viewModel.state.availableModels}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Available
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      {viewModel.state.recentSession && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Chat
          </Text>
          <View style={[styles.recentCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.recentTitle, { color: colors.text }]}>
              {viewModel.state.recentSession.title}
            </Text>
            <Text
              style={[styles.recentPreview, { color: colors.textTertiary }]}
            >
              {viewModel.getRecentPreview()}
            </Text>
            <Text style={[styles.recentDate, { color: colors.textSecondary }]}>
              {viewModel.state.recentSession.updatedAt.toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}

      {/* Features */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Features
        </Text>
        <View style={styles.featuresList}>
          <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
            <Text style={styles.featureEmoji}>📥</Text>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Download Models
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Get AI models for offline use
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
            <Text style={styles.featureEmoji}>💬</Text>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Multiple Chats
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Organize conversations with different AI models
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
            <Text style={styles.featureEmoji}>⚡</Text>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Fast & Local
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: colors.textSecondary },
                ]}
              >
                No internet required after download
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Demo Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          About This Demo
        </Text>
        <View style={[styles.demoInfo, { backgroundColor: colors.card }]}>
          <Text style={[styles.demoText, { color: colors.text }]}>
            This is a React Native demo app showing:
          </Text>
          <Text style={[styles.demoBullet, { color: colors.textTertiary }]}>
            • Cross-platform mobile development
          </Text>
          <Text style={[styles.demoBullet, { color: colors.textTertiary }]}>
            • File system operations
          </Text>
          <Text style={[styles.demoBullet, { color: colors.textTertiary }]}>
            • Async storage and state management
          </Text>
          <Text style={[styles.demoBullet, { color: colors.textTertiary }]}>
            • Modern UI/UX patterns
          </Text>
          <Text style={[styles.demoBullet, { color: colors.textTertiary }]}>
            • TypeScript implementation
          </Text>

          <TouchableOpacity
            style={[styles.githubButton, { backgroundColor: colors.tertiary }]}
            onPress={viewModel.openGitHub}
          >
            <Text style={[styles.githubButtonText, { color: colors.text }]}>
              View Source Code
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 36,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
  },
  statsContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  recentCard: {
    padding: 16,
    borderRadius: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  recentPreview: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  recentDate: {
    fontSize: 12,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  demoInfo: {
    padding: 16,
    borderRadius: 12,
  },
  demoText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  demoBullet: {
    fontSize: 14,
    marginBottom: 6,
    marginLeft: 8,
    lineHeight: 20,
  },
  githubButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  githubButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
