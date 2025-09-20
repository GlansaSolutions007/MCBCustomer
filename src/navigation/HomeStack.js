import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/Customer/HomeScreen";
import CarModels from "../screens/Customer/CarModels";
import { MyCarsList } from "../screens/Customer/MyCarsList";
import MyCars from "../screens/Customer/MyCars";
import { MyCarDetails } from "../screens/Customer/MyCarDetails";
import InteriorService from "../screens/Customer/InteriorService";
import ServiceInnerPage from "../screens/Customer/ServiceInnerPage";
import GlobalSearch from "../screens/Customer/GlobalSearch";
// Schedule and Coupons are independent in RootNavigator
import BookingsInnerPage from "../screens/Customer/BookingsInnerPage";
import LiveTracking from "../screens/Customer/WhereCustomer";
import AddressListScreen from "../screens/Customer/AddressList";
import Reviews from "../screens/Customer/Reviews";
import MapTest from "../screens/Customer/MapTest";
import InvoiceListScreen from "../screens/Customer/InvoiceListScreen";
import FirebaseTestScreen from "../screens/Common/FirebaseTestScreen";
import CustomHeader from "../components/CustomHeader";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ 
          headerShown: true,
          header: () => <CustomHeader />
        }}
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
        options={{
          title: "My Car Details",
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
        name="GlobalSearch"
        component={GlobalSearch}
        options={{
          title: "Search",
          animation: "slide_from_right",
          headerShown: false,
        }}
      />
      {null /* Schedule & Coupons moved to RootNavigator */}
      <Stack.Screen
        name="WhereCustomer"
        component={LiveTracking}
        options={{ title: "Where Technician" }}
      />
      <Stack.Screen
        name="BookingsInnerPage"
        component={BookingsInnerPage}
        options={{ title: "Booking Details" }}
      />
      <Stack.Screen
        name="AddressList"
        component={AddressListScreen}
        options={{ title: "My Address" }}
      />
      <Stack.Screen
        name="Reviews"
        component={Reviews}
        options={{ title: "Reviews" }}
      />
      <Stack.Screen
        name="MapTest"
        component={MapTest}
        options={{ title: "Map Test" }}
      />
      <Stack.Screen
        name="InvoiceList"
        component={InvoiceListScreen}
        options={{ title: "Your Invoices" }}
      />
      <Stack.Screen
        name="FirebaseTests"
        component={FirebaseTestScreen}
        options={{ title: "Firebase Tests" }}
      />
    </Stack.Navigator>
  );
}
