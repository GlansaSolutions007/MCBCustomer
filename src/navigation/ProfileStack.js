import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/Common/ProfileScreen";
import { ProfileRegister } from "../screens/Customer/ProfileRegister";
import NotificationScreen from "../screens/Customer/NotificationScreen";
import NotificationSettingsScreen from "../screens/Customer/NotificationSettingsScreen";
import PrivacyPolicyScreen from "../screens/Common/PrivacyPolicyScreen";
import RefundPolicyScreen from "../screens/Common/RefundPolicyScreen";
import TermsConditionsScreen from "../screens/Common/TermsConditionsScreen";
import CustomHeader from "../components/CustomHeader";
import AddressListScreen from "@src/screens/Customer/AddressList";
import InvoiceListScreen from "@src/screens/Customer/InvoiceListScreen";

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="ProfileScreen"
                component={ProfileScreen}
                options={{
                    headerShown: false,

                }}
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
                name="NotificationSettings"
                component={NotificationSettingsScreen}
                options={{ title: "Notifications Settings" }}
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
                name="InvoiceList"
                component={InvoiceListScreen}
                options={{ title: "Your Invoices" }}
            />
        </Stack.Navigator>
    );
}
