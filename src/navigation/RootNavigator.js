// src/navigation/RootNavigator.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/Common/LoginScreen";
import RegisterScreen from "../screens/Common/RegisterScreen";
import CustomerTabNavigator from "./CustomerTabNavigator";
import TechnicianTabNavigator from "./TechnicianTabNavigator";
import { useAuth } from "../contexts/AuthContext";
import CustomerStackNavigator from "./CustomerStackNavigator";
import CustomText from "../components/CustomText";
import WelcomeScreen from "../screens/Common/WelcomeScreen";
const Stack = createNativeStackNavigator();

export default function RootNavigator() {


  const renderScreens = () => {
    return (
      <>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="CustomerTabs"
          component={CustomerStackNavigator}
        />
      </>
    );

    return null;
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {renderScreens()}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
