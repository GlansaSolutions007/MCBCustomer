import "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { View } from "react-native";
import React, { useCallback } from "react";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import RootNavigator, { navigationRef } from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/contexts/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, TextInput } from "react-native";
import { LocationProvider } from "./src/contexts/LocationContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CouponProvider } from "./src/contexts/CouponContext";
import { useNotificationSystem } from "./src/hooks/useNotificationSystem";
import { enableScreens } from "react-native-screens";

enableScreens(false);

if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

// import { Text } from "react-native";
// if (Text.defaultProps == null) Text.defaultProps = {};
// Text.defaultProps.allowFontScaling = false;
// SplashScreen.preventAutoHideAsync();

export default function App() {
  // Initialize notification system
  useNotificationSystem();

  // Ensure notifications show while app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, // replaces shouldShowAlert
      shouldShowList: true, // ensures it appears in Notification Center
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received (customer):", notification);
        // Handle foreground notifications
        const data = notification.request.content.data;
        if (data?.type) {
          console.log("Notification type:", data.type);
          // You can add specific handling for different notification types here
        }
      }
    );
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification response (customer):", response);
        // Handle notification tap → navigate via our linking or direct nav
        const data = response.notification.request.content.data || {};

        // Prefer explicit deep link path in payload
        if (data?.deepLink) {
          try {
            const url = String(data.deepLink);
            if (url) {
              // Let NavigationContainer linking handle it
              navigationRef?.current?.navigate(url);
              return;
            }
          } catch {}
        }

        // Fallback: route by type or target
        if (navigationRef?.current?.isReady()) {
          if (data?.target === "ServiceList") {
            navigationRef.current.navigate("CustomerTabs", {
              screen: "Services",
              params: { screen: "BookServiceScreen" },
            });
            return;
          }
          if (data?.target === "ProfileScreen") {
            navigationRef.current.navigate("CustomerTabs", {
              screen: "Profile",
              params: { screen: "ProfileScreen" },
            });
            return;
          }
        }
      }
    );
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);
  const [fontsLoaded] = Font.useFonts({
    "Manrope-Medium": require("./assets/fonts/Manrope-Medium.ttf"),
    "Manrope-Bold": require("./assets/fonts/Manrope-Bold.ttf"),
    "Manrope-Regular": require("./assets/fonts/Manrope-Regular.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <AuthProvider>
            <LocationProvider>
              <CouponProvider>
                <RootNavigator />
              </CouponProvider>
            </LocationProvider>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
