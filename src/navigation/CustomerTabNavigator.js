import React, { useRef, useEffect, useState } from "react";
import { Image, Pressable, Animated, View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeStack from "./HomeStack";
import ProfileStack from "./ProfileStack";
import ServicesStack from "./ServicesStack";
import BookingsStack from "./BookingsStack";
import MyCarsStack from "./MyCarsStack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomHeader from "../components/CustomHeader";
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

function getIconName(routeName) {
  switch (routeName) {
    case "Home":
      return "home-outline";
    case "My Cars":
      return "car-sport-outline";
    case "Services":
      return "list";
    case "My Bookings":
      return "calendar-outline";
    case "Profile":
      return "person-circle-outline";
    default:
      return "ellipse-outline";
  }
}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(0)).current;
  const [tabLayouts, setTabLayouts] = useState([]);

  const updateIndicator = (index) => {
    const layout = tabLayouts[index];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(indicatorX, {
        toValue: layout.x,
        useNativeDriver: false,
        friction: 7,
        tension: 120,
      }),
      Animated.spring(indicatorW, {
        toValue: layout.width,
        useNativeDriver: false,
        friction: 7,
        tension: 120,
      }),
    ]).start();
  };

  useEffect(() => {
    updateIndicator(state.index);
  }, [state.index, tabLayouts]);

  return (
    <View
      style={{
        paddingBottom: insets.bottom || 8,
        paddingTop: 8,
        backgroundColor: "white",
      }}
    >
      <View
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        style={{
          marginHorizontal: 16,
          backgroundColor: "#fff",
          borderRadius: 24,
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 4,
          borderWidth: 0.5,
          borderColor: "#f0f0f0",
          position: "relative",
          marginVertical: 8,
        }}
      >
        {tabLayouts.length === state.routes.length && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 4,
              bottom: 4,
              left: indicatorX,
              borderRadius: 20,
              backgroundColor: color.primary,
              width: indicatorW,
            }}
          />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const icon = getIconName(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const activeContentColor = isFocused ? "#fff" : "#8e8e93";

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                setTabLayouts((prev) => {
                  const next = [...prev];
                  next[index] = { x, width };
                  return next;
                });
              }}
              style={{
                flex: 1,
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                paddingHorizontal: 10,
              }}
            >
              <Ionicons
                name={icon}
                size={22}
                color={activeContentColor}
              />
              {isFocused && (
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    color: activeContentColor,
                    fontSize: 11,
                    fontWeight: "600",
                    marginTop: 4,
                  }}
                >
                  {route.name}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function CustomerTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Home', { screen: 'HomeScreen' });
          },
        })}
      />
      <Tab.Screen name="My Cars" component={MyCarsStack} options={{ unmountOnBlur: true }} listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('My Cars', { screen: 'MyCarsList' });
          },
        })} />
      <Tab.Screen 
        name="Services" 
        component={ServicesStack}
      />
      <Tab.Screen name="My Bookings" component={BookingsStack} options={{ headerShown: false }} listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('My Bookings', { screen: 'MyBookingsList' });
          },
        })} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ headerShown: false }} listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Profile', { screen: 'ProfileScreen' });
          },
        })} />
    </Tab.Navigator>
  );
}
