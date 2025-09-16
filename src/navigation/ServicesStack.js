import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BookServiceScreen from "../screens/Customer/BookServiceScreen";
import InteriorService from "../screens/Customer/InteriorService";
import ServiceInnerPage from "../screens/Customer/ServiceInnerPage";
// SchedulePage is independent in RootNavigator
// Coupons is independent in RootNavigator
import AddressListScreen from "../screens/Customer/AddressList";
import Reviews from "../screens/Customer/Reviews";
// CartPage and ConfirmAddressPage are independent in RootNavigator
import CustomHeader from "../components/CustomHeader";
// NotificationScreen is independent in RootNavigator

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
        name="Reviews"
        component={Reviews}
        options={{ title: "Reviews" }}
      />
    </Stack.Navigator>
  );
}
