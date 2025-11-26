import { Alert, Linking, Platform, ActionSheetIOS, Share } from "react-native";
import {
  UIService,
  AlertConfig,
  ActionSheetConfig,
  ShareConfig,
} from "./UIService";

export class ReactNativeUIService implements UIService {
  async showAlert(config: AlertConfig): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        config.title,
        config.message,
        config.buttons?.map((button) => ({
          ...button,
          onPress: () => {
            button.onPress?.();
            resolve(true);
          },
        })) || [{ text: "OK", onPress: () => resolve(true) }],
        { cancelable: false }
      );
    });
  }

  async openURL(url: string): Promise<void> {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      throw new Error(`Cannot open URL: ${url}`);
    }
  }

  async openAppSettings(): Promise<void> {
    if (Platform.OS === "ios") {
      await this.openURL("app-settings:");
    } else {
      await Linking.openSettings();
    }
  }

  async showActionSheet(
    config: ActionSheetConfig
  ): Promise<string | undefined> {
    if (Platform.OS !== "ios") {
      // Fallback for Android - use Alert
      const options = [...config.options, "Cancel"];
      const result = await this.showAlert({
        title: config.title || "",
        message: config.message || "",
        buttons: options.map((option, index) => ({
          text: option,
          style: index === options.length - 1 ? "cancel" : "default",
        })),
      });
      return result ? options[0] : undefined;
    }

    return new Promise((resolve) => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: config.title,
          message: config.message,
          options: [...config.options, "Cancel"],
          cancelButtonIndex: config.cancelButtonIndex ?? config.options.length,
          destructiveButtonIndex: config.destructiveButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === config.options.length) {
            resolve(undefined); // Cancel
          } else {
            resolve(config.options[buttonIndex]);
          }
        }
      );
    });
  }

  async shareContent(config: ShareConfig): Promise<void> {
    try {
      await Share.share({
        message: config.message,
        title: config.title,
        url: config.url,
      });
    } catch (error: any) {
      throw new Error(`Failed to share content: ${error.message}`);
    }
  }
}
