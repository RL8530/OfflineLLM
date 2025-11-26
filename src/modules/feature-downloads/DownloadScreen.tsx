import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import Checkbox from "expo-checkbox";
import * as Progress from "react-native-progress";
import { DownloadViewModel } from "./DownloadViewModel";
import { useViewModel } from "../core/useViewModel";
import { useAppTheme } from "../core/useAppTheme";

export interface DownloadScreenProps {
  viewModel: DownloadViewModel;
}

export default function DownloadScreen({ viewModel }: DownloadScreenProps) {
  useViewModel(viewModel);

  const theme = useAppTheme();
  const colors = theme.colors;

  // Show loading indicator on initial load
  if (
    viewModel.state.loadingModels &&
    viewModel.state.availableModels.length === 0
  ) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading models from Hugging Face...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Refresh Popup Modal */}
      <Modal
        visible={viewModel.state.showRefreshPopup}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.popupContainer, { backgroundColor: colors.card }]}
          >
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.popupText, { color: colors.text }]}>
              Updating Models...
            </Text>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.accent }]}>
          Available Models
        </Text>
        <TouchableOpacity
          onPress={viewModel.onRefresh}
          style={[styles.refreshButton, { backgroundColor: colors.tertiary }]}
          disabled={
            viewModel.state.refreshing || viewModel.state.showRefreshPopup
          }
        >
          <Text style={[styles.refreshText, { color: colors.text }]}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* Select-All row */}
      <View style={styles.selectAllRow}>
        <TouchableOpacity
          onPress={viewModel.selectAll}
          style={[styles.selectAllBtn, { backgroundColor: colors.tertiary }]}
          disabled={viewModel.state.showRefreshPopup}
        >
          <Text
            style={[
              styles.selectAllText,
              { color: colors.text },
              viewModel.state.showRefreshPopup && [
                styles.disabledText,
                { color: colors.textSecondary },
              ],
            ]}
          >
            Select All
          </Text>
        </TouchableOpacity>
        {viewModel.state.selectedModels.size > 0 && (
          <TouchableOpacity
            onPress={viewModel.startSelectedDownloads}
            style={[
              styles.downloadSelectedBtn,
              { backgroundColor: colors.accent },
            ]}
            disabled={viewModel.state.showRefreshPopup}
          >
            <Text
              style={[
                styles.downloadSelectedText,
                { color: colors.primary },
                viewModel.state.showRefreshPopup && [
                  styles.disabledText,
                  { color: colors.textSecondary },
                ],
              ]}
            >
              Download Selected ({viewModel.state.selectedModels.size})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        scrollEnabled={!viewModel.state.showRefreshPopup}
      >
        {viewModel.state.availableModels.map((model) => {
          const checked = viewModel.state.selectedModels.has(model.id);
          const downloaded = viewModel.isDownloaded(model);
          const prog = viewModel.getProgress(model.id);

          return (
            <View
              key={model.id}
              style={[
                styles.modelCard,
                { backgroundColor: colors.card },
                viewModel.state.showRefreshPopup && styles.disabledCard,
              ]}
            >
              <View style={styles.headerRow}>
                <Checkbox
                  value={checked}
                  onValueChange={() => viewModel.toggleSelect(model.id)}
                  disabled={
                    downloaded ||
                    viewModel.isDownloading(model) ||
                    viewModel.state.showRefreshPopup
                  }
                  color={checked ? colors.accent : undefined}
                />
                <View style={styles.info}>
                  <Text style={[styles.modelName, { color: colors.text }]}>
                    {model.name}
                  </Text>
                  <Text
                    style={[
                      styles.modelDescription,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {model.description}
                  </Text>
                  <Text
                    style={[styles.modelSize, { color: colors.textSecondary }]}
                  >
                    {viewModel.formatFileSize(model.size)}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              {prog && (
                <View style={styles.progressContainer}>
                  <Progress.Bar
                    progress={prog.progress}
                    width={null}
                    color={colors.accent}
                    unfilledColor={colors.tertiary}
                    borderWidth={0}
                    height={6}
                  />
                  <Text style={[styles.progressText, { color: colors.text }]}>
                    {viewModel.getButtonText(model)}
                  </Text>
                </View>
              )}

              {/* Individual download button */}
              {!prog && !downloaded && (
                <TouchableOpacity
                  style={[
                    styles.individualBtn,
                    { backgroundColor: colors.accent },
                    viewModel.state.showRefreshPopup && [
                      styles.disabledButton,
                      { backgroundColor: colors.tertiary },
                    ],
                  ]}
                  onPress={() => viewModel.startSingleDownload(model.id)}
                  disabled={viewModel.state.showRefreshPopup}
                >
                  <Text
                    style={[
                      styles.individualBtnText,
                      { color: colors.primary },
                      viewModel.state.showRefreshPopup && [
                        styles.disabledText,
                        { color: colors.textSecondary },
                      ],
                    ]}
                  >
                    Download
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },
  // Modal and Popup styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  popupText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  // Disabled state styles
  disabledCard: {
    opacity: 0.6,
  },
  disabledButton: {
    // Background color comes from theme
  },
  disabledText: {
    // Color comes from theme
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  refreshButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshText: {
    fontWeight: "600",
  },
  selectAllRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  selectAllBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  selectAllText: {
    fontWeight: "600",
  },
  downloadSelectedBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  downloadSelectedText: {
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  modelCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  modelName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modelDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  modelSize: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
  individualBtn: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  individualBtnText: {
    fontWeight: "600",
  },
});
