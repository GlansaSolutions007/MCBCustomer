import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BookServiceScreen from "../screens/Customer/BookServiceScreen";
import InteriorService from "../screens/Customer/InteriorService";
import ServiceInnerPage from "../screens/Customer/ServiceInnerPage";
import SchedulePage from "../screens/Customer/SchedulePage";
import CouponsList from "../screens/Customer/Coupons";
import AddressListScreen from "../screens/Customer/AddressList";
import Reviews from "../screens/Customer/Reviews";
import CartPage from "../screens/Customer/CartPage";
import ConfirmAddressPage from "../screens/Customer/ConfirmAddressPage";
import CustomHeader from "../components/CustomHeader";

const Stack = createNativeStackNavigator();

export default function ServicesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BookServiceScreen"
        component={BookServiceScreen}
        options={{ 
          headerShown: true,
          header: () => <CustomHeader />
        }}
      />
      <Stack.Screen
        name="InteriorService"
        component={InteriorService}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ServiceInnerPage"
        component={ServiceInnerPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Schedule"
        component={SchedulePage}
        options={{ title: "Schedule" }}
      />
      <Stack.Screen
        name="Coupons"
        component={CouponsList}
        options={{ title: "Coupon List" }}
      />
      <Stack.Screen
        name="Reviews"
        component={Reviews}
        options={{ title: "Reviews" }}
      />
      <Stack.Screen
        name="CartPage"
        component={CartPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConfirmAddressPage"
        component={ConfirmAddressPage}
        options={{ title: "Address" }}
      />
    </Stack.Navigator>
  );
}
