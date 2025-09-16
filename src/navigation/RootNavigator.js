import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NetInfo from "@react-native-community/netinfo";

import LoginScreen from "../screens/Common/LoginScreen";
import RegisterScreen from "../screens/Common/RegisterScreen";
import CustomerTabNavigator from "./CustomerTabNavigator";
import WelcomeScreen from "../screens/Common/WelcomeScreen";
import { useAuth } from "../contexts/AuthContext";
import NoInternetScreen from "../screens/Common/NoInternetScreen";
import PreLoader from "@src/components/PreLoader";
import { CartProvider } from "../contexts/CartContext";
import NotificationScreen from "../screens/Customer/NotificationScreen";
import CartPage from "../screens/Customer/CartPage";
import SchedulePage from "../screens/Customer/SchedulePage";
import ConfirmAddressPage from "../screens/Customer/ConfirmAddressPage";
import CouponsList from "../screens/Customer/Coupons";
// import PreLoader from "../components/PreLoader"; 
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const [isConnected, setIsConnected] = useState(true);
  const [showSplash, setShowSplash] = useState(true);


  const getNotifications = async () => {
    try{
      const notifications = await axios.get(`${API_URL}Bookings/notifications?userId=${user.custID}&&userRole="customer"`);
      console.log(notifications, "notifications");
    
    }catch(error){
      console.log(error, "error");
    }
  }
  // Internet check
  useEffect(() => {

    if(user){
      getNotifications();
    }
    // Check initial connection state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    // Listen for connection changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, [user]);

  // Play preloader once at app launch
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000); // same duration as PreLoader
    return () => clearTimeout(timer);
  }, []);

  if (!isConnected) {
    return (
      <NoInternetScreen
        onRetry={() => NetInfo.fetch().then((s) => setIsConnected(s.isConnected))}
      />
    );
  }

  // Show splash animation at startup
  if (showSplash) {
    return <PreLoader onAnimationFinish={() => setShowSplash(false)} />;
  }

  // While checking auth state
  if (loading) {
    return <PreLoader />; // 👈 use the same loader instead of ActivityIndicator
  }

  return (
    <NavigationContainer>
      <CartProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user && user.token && user.custID ? (
            <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
          ) : (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
            </>
          )}
          {/* Independent routes accessible from anywhere */}
          <Stack.Screen
            name="NotificationScreen"
            component={NotificationScreen}
            options={{ headerShown: true, title: "Notifications" }}
          />
          <Stack.Screen name="Cart" component={CartPage} />
          <Stack.Screen
            name="Schedule"
            component={SchedulePage}
            options={{ headerShown: true, title: "Schedule" }}
          />
          <Stack.Screen
            name="ConfirmAddressPage"
            component={ConfirmAddressPage}
            options={{ headerShown: true, title: "Address" }}
          />
          <Stack.Screen
            name="Coupons"
            component={CouponsList}
            options={{ headerShown: true, title: "Coupon List" }}
          />
        </Stack.Navigator>
      </CartProvider>
    </NavigationContainer>
  );
}
