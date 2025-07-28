import React from "react";
import { Image, Pressable } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/Customer/HomeScreen";
import ProfileScreen from "../screens/Common/ProfileScreen";
import BookServiceScreen from "../screens/Customer/BookServiceScreen";
import ServiceList from "../screens/Customer/ServiceList";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomHeader from "../components/CustomHeader";
import { MyCarsList } from "../screens/Customer/MyCarsList";
import globalStyles from "../styles/globalStyles";
import { color } from "../styles/theme";
import logo from '../../assets/Logo/logo.png'

const Tab = createBottomTabNavigator();

export default function CustomerTabNavigator({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => (
          <CustomHeader/>
        ),       
        tabBarShowLabel: true,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: "#8e8e93",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0.5,
          height: 75 + insets.bottom,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
        },
        tabBarItemStyle: {
          borderRadius: 20,
        },
        tabBarPressColor: "rgba(0, 0, 0, 0.01)",
        tabBarPressOpacity: 0.8,
        tabBarButton: (props) => (
          <Pressable
            android_ripple={{
              color: "rgba(0, 0, 0, 0.01)", // subtle ripple
              borderless: false,
            }}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.9 : 1,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
            {...props}
          />
        ),
        tabBarIcon: ({ color, focused }) => {
          if (route.name === "My Car Buddy") {
            return (
              <Image
                source={logo}
                style={{
                  width: 55,
                  height: 26,
                  tintColor: focused ? '#136d6e' : "#8e8e93",
                  marginBottom: -15,
                }}
                resizeMode="contain"
              />
            );
          }

          let iconName;
          switch (route.name) {
            case "My Cars":
              iconName = "car-sport-outline";
              break;
            case "Book Service":
              iconName = "calendar-outline";
              break;
            case "My Services":
              iconName = "construct-outline";
              break;
            case "Profile":
              iconName = "person-circle-outline";
              break;
            default:
              iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={26} color={color} />;
        },
        tabBarLabel: route.name === "My Car Buddy" ? () => null : undefined,
      })}
    >
      <Tab.Screen
        name="My Car Buddy"
        component={HomeScreen}
      />
      <Tab.Screen
        name="My Cars"
        component={MyCarsList}
       
      />
      <Tab.Screen name="Book Service" component={BookServiceScreen} />
      <Tab.Screen name="My Services" component={ServiceList} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
