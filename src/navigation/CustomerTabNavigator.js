import React, { useRef, useEffect } from "react";
import { Image, Pressable, Animated } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/Customer/HomeScreen";
import ProfileScreen from "../screens/Common/ProfileScreen";
import BookServiceScreen from "../screens/Customer/BookServiceScreen";
import ServiceList from "../screens/Customer/ServiceList";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomHeader from "../components/CustomHeader";
import { MyCarsList } from "../screens/Customer/MyCarsList";
import { color } from "../styles/theme";
import logo from "../../assets/Logo/logo2.png";

const Tab = createBottomTabNavigator();

function AnimatedIcon({ name, focused, color }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.25 : 1,
        useNativeDriver: true,
        friction: 5,
        tension: 150,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.6, 
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} size={26} color={color} />
    </Animated.View>
  );
}

function AnimatedLogo({ focused }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

   useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.15 : 1,
        useNativeDriver: true,
        friction: 5,
        tension: 150,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Image
        source={logo}
        style={{
          width: 55,
          height: 26,
          tintColor: focused ? color.primary : "#8e8e93",
          marginBottom: -12,
        }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

export default function CustomerTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <CustomHeader />,
        tabBarShowLabel: true,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: "#8e8e93",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0.5,
          height: 75 + insets.bottom,
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
              color: "rgba(0, 0, 0, 0.01)",
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
            return <AnimatedLogo focused={focused} />;
          }

          let iconName;
          switch (route.name) {
            case "My Cars":
              iconName = "car-sport-outline";
              break;
            case "Services":
              iconName = "list";
              break;
            case "My Bookings":
              iconName = "calendar-outline";
              break;
            case "Profile":
              iconName = "person-circle-outline";
              break;
            default:
              iconName = "ellipse-outline";
          }

          return <AnimatedIcon name={iconName} color={color} focused={focused} />;
        },
        tabBarLabel: route.name === "My Car Buddy" ? () => null : undefined,
      })}
    >
      <Tab.Screen name="My Car Buddy" component={HomeScreen} />
      <Tab.Screen name="My Cars" component={MyCarsList} options={{ unmountOnBlur: true }} />
      <Tab.Screen name="Services" component={BookServiceScreen} />
      <Tab.Screen name="My Bookings" component={ServiceList} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
