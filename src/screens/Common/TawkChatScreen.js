import React, { useRef, useState, useCallback, useEffect } from "react";
import { ActivityIndicator, BackHandler, Platform, SafeAreaView, View } from "react-native";
import { WebView } from "react-native-webview";

// Tawk.to direct chat URL built from the provided embed snippet
// propertyId: 68c906671b7703192745cc79
// widgetId: 1j58k21cp
const TAWK_DIRECT_CHAT_URL = "https://tawk.to/chat/68c906671b7703192745cc79/1j58k21cp";

export default function TawkChatScreen() {
  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const onNavChange = useCallback((navState) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const handler = () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handler);
    return () => sub.remove();
  }, [canGoBack]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <WebView
        ref={webviewRef}
        source={{ uri: TAWK_DIRECT_CHAT_URL }}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        )}
        onNavigationStateChange={onNavChange}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
      />
    </SafeAreaView>
  );
}


