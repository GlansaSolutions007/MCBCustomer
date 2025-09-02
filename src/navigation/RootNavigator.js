import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import LoginScreen from "../screens/Common/LoginScreen";
import RegisterScreen from "../screens/Common/RegisterScreen";
import CustomerStackNavigator from "./CustomerStackNavigator";
import WelcomeScreen from "../screens/Common/WelcomeScreen";
import { useAuth } from "../contexts/AuthContext";
import globalStyles from "../styles/globalStyles";
import NoInternetScreen from "../screens/Common/NoInternetScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (!isConnected) {
    return <NoInternetScreen onRetry={() => NetInfo.fetch().then((s) => setIsConnected(s.isConnected))} />;
  }

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#136d6e" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && user.token && user.custID ? (
          <Stack.Screen name="CustomerTabs" component={CustomerStackNavigator} />
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="CustomerTabs" component={CustomerStackNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
