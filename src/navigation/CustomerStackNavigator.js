import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomerTabNavigator from "./CustomerTabNavigator";
import CarModels from "../screens/Customer/CarModels";
import { MyCarsList } from "../screens/Customer/MyCarsList";
import MyCars from "../screens/Customer/MyCars";
import { MyCarDetails } from "../screens/Customer/MyCarDetails";
import RegisterScreen from "../screens/Common/RegisterScreen";
import InteriorService from "../screens/Customer/InteriorService";
import { ProfileRegister } from "../screens/Customer/ProfileRegister";
import NotificationScreen from "../screens/Customer/NotificationScreen";
import { CartProvider } from "../contexts/CartContext";
import CartPage from "../screens/Customer/CartPage";
import ConfirmAddressPage from "../screens/Customer/ConfirmAddressPage";

const Stack = createNativeStackNavigator();

export default function CustomerStackNavigator() {
  return (
    <CartProvider>
      <Stack.Navigator>
        <Stack.Screen
          name="CustomerTabNavigator"
          component={CustomerTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CarModels"
          component={CarModels}
          options={({ route }) => ({
            title: `${route.params.brand} Models`,
          })}
        />
        <Stack.Screen
          name="SelectCarBrand"
          component={MyCars}
          options={{ title: "Select Your Car" }}
        />
        <Stack.Screen
          name="MyCarDetails"
          component={MyCarDetails}
          options={{ title: "My Car Details" }}
        />
        <Stack.Screen
          name="InteriorService"
          component={InteriorService}
          options={{ headerShown: false }} />

        <Stack.Screen
          name="ProfileRegister"
          component={ProfileRegister}
          options={{ title: "My Profile" }}
        />
        <Stack.Screen
          name="NotificationScreen"
          component={NotificationScreen}
          options={{ title: "Notifications" }}
        />
        <Stack.Screen
          name="Cart"
          component={CartPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConfirmAddressPage"
          component={ConfirmAddressPage}
          options={{ title: "Address" }}
        />

      </Stack.Navigator>
    </CartProvider>
  );
}
