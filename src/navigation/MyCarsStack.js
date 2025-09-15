import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MyCarsList } from "../screens/Customer/MyCarsList";
import MyCars from "../screens/Customer/MyCars";
import CarModels from "../screens/Customer/CarModels";
import { MyCarDetails } from "../screens/Customer/MyCarDetails";
import CustomHeader from "../components/CustomHeader";

const Stack = createNativeStackNavigator();

export default function MyCarsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MyCarsList"
        component={MyCarsList}
        options={{ 
          headerShown: true,
          header: () => <CustomHeader />
        }}
      />
      <Stack.Screen
        name="SelectCarBrand"
        component={MyCars}
        options={{ title: "Select Your Car" }}
      />
      <Stack.Screen
        name="CarModels"
        component={CarModels}
        options={({ route }) => ({
          title: `${route.params.brand} Models`,
        })}
      />
      <Stack.Screen
        name="MyCarDetails"
        component={MyCarDetails}
        options={{
          title: "My Car Details",
        }}
      />
    </Stack.Navigator>
  );
}
