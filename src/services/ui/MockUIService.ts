import {
  UIService,
  AlertConfig,
  ActionSheetConfig,
  ShareConfig,
} from "./UIService";

export class MockUIService implements UIService {
  public alerts: AlertConfig[] = [];
  public openedURLs: string[] = [];
  public openedSettings = false;
  public sharedContent: ShareConfig[] = [];

  async showAlert(config: AlertConfig): Promise<boolean> {
    this.alerts.push(config);
    return true; // Always confirm for tests
  }

  async openURL(url: string): Promise<void> {
    this.openedURLs.push(url);
  }

  async openAppSettings(): Promise<void> {
    this.openedSettings = true;
  }

  async showActionSheet(
    config: ActionSheetConfig
  ): Promise<string | undefined> {
    return config.options[0]; // Always pick first option in tests
  }

  // Test helper methods
  getLastAlert(): AlertConfig | undefined {
    return this.alerts[this.alerts.length - 1];
  }

  clear(): void {
    this.alerts = [];
    this.openedURLs = [];
    this.openedSettings = false;
  }

  async shareContent(config: ShareConfig): Promise<void> {
    this.sharedContent.push(config);
  }

  // Test helper methods
  getLastSharedContent(): ShareConfig | undefined {
    return this.sharedContent[this.sharedContent.length - 1];
  }

  clearSharedContent(): void {
    this.sharedContent = [];
  }
}
