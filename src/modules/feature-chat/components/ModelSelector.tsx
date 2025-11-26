import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { LLMModel } from "../../../types/Model";
import { useAppTheme } from "../../core/useAppTheme";

interface ModelSelectorProps {
  models: LLMModel[];
  downloadedModels: string[];
  selectedModel: string | null;
  onSelectModel: (modelId: string) => void;
  visible: boolean;
  onClose: () => void;
}

function ModelSelector({
  models,
  downloadedModels,
  selectedModel,
  onSelectModel,
  visible,
  onClose,
}: ModelSelectorProps) {
  const { colors } = useAppTheme();

  const isModelDownloaded = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    return model ? downloadedModels.includes(model.id) : false;
  };

  const getModelName = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    return model ? model.name : modelId;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[styles.container, { backgroundColor: colors.modalBackground }]}
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.modalBorder,
              backgroundColor: colors.modalBackground,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Select AI Model
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: colors.accent }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modelsList}>
          {models.map((model) => {
            const isDownloaded = isModelDownloaded(model.id);
            const isSelected = selectedModel === model.id;

            return (
              <TouchableOpacity
                key={model.id}
                style={[
                  styles.modelItem,
                  { backgroundColor: colors.card },
                  isSelected && [
                    styles.modelItemSelected,
                    { borderColor: colors.accent },
                  ],
                  !isDownloaded && styles.modelItemDisabled,
                ]}
                onPress={() => {
                  if (isDownloaded) {
                    onSelectModel(model.id);
                    onClose();
                  }
                }}
                disabled={!isDownloaded}
              >
                <View style={styles.modelInfo}>
                  <Text style={[styles.modelName, { color: colors.text }]}>
                    {model.name} {isSelected && "✓"}
                  </Text>
                  <Text
                    style={[
                      styles.modelDescription,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {model.description}
                  </Text>
                  <View style={styles.modelStatus}>
                    <Text
                      style={[
                        styles.statusText,
                        isDownloaded
                          ? [styles.statusDownloaded, { color: colors.success }]
                          : [
                              styles.statusNotDownloaded,
                              { color: colors.danger },
                            ],
                      ]}
                    >
                      {isDownloaded ? "Downloaded" : "Not Downloaded"}
                    </Text>
                    <Text
                      style={[
                        styles.modelSize,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {Math.round(model.size / (1024 * 1024))} MB
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
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
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modelsList: {
    flex: 1,
    padding: 16,
  },
  modelItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modelItemSelected: {
    borderWidth: 2,
  },
  modelItemDisabled: {
    opacity: 0.5,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modelDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  modelStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  statusDownloaded: {
    // Color comes from theme
  },
  statusNotDownloaded: {
    // Color comes from theme
  },
  modelSize: {
    fontSize: 12,
  },
});

export default ModelSelector;
