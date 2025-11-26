import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";

// Import our screens
import HomeScreen from "./src/modules/feature-home/HomeScreen";
import DownloadScreen from "./src/modules/feature-downloads/DownloadScreen";

// Import theme context
import { ThemeProvider, useAppTheme } from "./src/modules/core/useAppTheme";
import { SettingsViewModel } from "./src/modules/feature-settings/SettingsViewModel";
import { HomeViewModel } from "./src/modules/feature-home/HomeViewModel";
import ChatScreen from "./src/modules/feature-chat/ChatScreen";
import { ChatViewModel } from "./src/modules/feature-chat/ChatViewModel";
import { DownloadViewModel } from "./src/modules/feature-downloads/DownloadViewModel";
import SettingsScreen from "./src/modules/feature-settings/SettingsScreen";
import { ReactNativeUIService } from "./src/services/ui/ReactNativeUIService";

const Tab = createBottomTabNavigator();

// Simple icon component for tabs
const TabIcon = ({
  emoji,
  color,
  size,
}: {
  emoji: string;
  color: string;
  size: number;
}) => <Text style={{ color, fontSize: size - 2 }}>{emoji}</Text>;

// Create ThemedAppNavigator that uses the theme
const ThemedAppNavigator = () => {
  const theme = useAppTheme();
  const colors = theme.colors;
  const isDark = theme.isDark;
  const uiService = new ReactNativeUIService();

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Tab.Screen
          name="Home"
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon emoji="🏠" color={color} size={size} />
            ),
          }}
        >
          {(props) => {
            return (
              <HomeScreen {...props} viewModel={new HomeViewModel(uiService)} />
            );
          }}
        </Tab.Screen>
        <Tab.Screen
          name="Downloads"
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon emoji="📥" color={color} size={size} />
            ),
          }}
        >
          {(props) => {
            return (
              <DownloadScreen
                {...props}
                viewModel={new DownloadViewModel(uiService)}
              />
            );
          }}
        </Tab.Screen>
        <Tab.Screen
          name="Chat"
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon emoji="💬" color={color} size={size} />
            ),
          }}
        >
          {(props) => {
            return (
              <ChatScreen {...props} viewModel={new ChatViewModel(uiService)} />
            );
          }}
        </Tab.Screen>
        <Tab.Screen
          name="Settings"
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon emoji="⚙️" color={color} size={size} />
            ),
          }}
        >
          {(props) => {
            return (
              <SettingsScreen
                {...props}
                viewModel={new SettingsViewModel(theme, uiService)}
              />
            );
          }}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  console.log("app launch");

  return (
    <ThemeProvider>
      <ThemedAppNavigator />
    </ThemeProvider>
  );
}
