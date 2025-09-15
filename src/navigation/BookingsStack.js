import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ServiceList from "../screens/Customer/ServiceList";
import BookingsInnerPage from "../screens/Customer/BookingsInnerPage";
import LiveTracking from "../screens/Customer/WhereCustomer";
import Reviews from "../screens/Customer/Reviews";
import InvoiceListScreen from "../screens/Customer/InvoiceListScreen";
import CustomHeader from "../components/CustomHeader";

const Stack = createNativeStackNavigator();

export default function BookingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ServiceList"
        component={ServiceList}
        options={{ 
          headerShown: true,
          header: () => <CustomHeader />
        }}
      />
      <Stack.Screen
        name="BookingsInnerPage"
        component={BookingsInnerPage}
        options={{ title: "Booking Details" }}
      />
      <Stack.Screen
        name="WhereCustomer"
        component={LiveTracking}
        options={{ title: "Where Technician" }}
      />
      <Stack.Screen
        name="Reviews"
        component={Reviews}
        options={{ title: "Reviews" }}
      />
      
    </Stack.Navigator>
  );
}
