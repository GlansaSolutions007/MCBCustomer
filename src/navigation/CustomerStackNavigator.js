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
import ServiceInnerPage from "../screens/Customer/ServiceInnerPage";
import SchedulePage from "../screens/Customer/SchedulePage";
import CouponsList from "../screens/Customer/Coupons";
import BookingsInnerPage from "../screens/Customer/BookingsInnerPage";
import LiveTracking from "../screens/Customer/WhereCustomer";
import PrivacyPolicyScreen from "../screens/Common/PrivacyPolicyScreen";
import RefundPolicyScreen from "../screens/Common/RefundPolicyScreen";
import TermsConditionsScreen from "../screens/Common/TermsConditionsScreen";
import AddressListScreen from "../screens/Customer/AddressList";
import Reviews from "../screens/Customer/Reviews";
import MapTest from "../screens/Customer/MapTest";
import NotificationSettingsScreen from "../screens/Customer/NotificationSettingsScreen";

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
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{ title: "Notifications Settings" }}
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
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ title: "Privacy Policy" }}
        />
        <Stack.Screen
          name="RefundPolicy"
          component={RefundPolicyScreen}
          options={{ title: "Refund Policy" }}
        />
        <Stack.Screen
          name="TermsConditions"
          component={TermsConditionsScreen}
          options={{ title: "Terms & Conditions" }}
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
      </Stack.Navigator>
      
    </CartProvider>
  );
}
