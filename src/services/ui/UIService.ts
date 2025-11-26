export interface UIService {
  showAlert(config: AlertConfig): Promise<boolean>;
  openURL(url: string): Promise<void>;
  openAppSettings(): Promise<void>;
  showActionSheet(config: ActionSheetConfig): Promise<string | undefined>;
  shareContent(config: ShareConfig): Promise<void>;
}

export interface AlertConfig {
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    style?: "default" | "cancel" | "destructive";
    onPress?: () => void;
  }>;
}

export interface ActionSheetConfig {
  title?: string;
  message?: string;
  options: string[];
  cancelButtonIndex?: number;
  destructiveButtonIndex?: number;
}

export interface ShareConfig {
  message: string;
  title?: string;
  url?: string;
}
