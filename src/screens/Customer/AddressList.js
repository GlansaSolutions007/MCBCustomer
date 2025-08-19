import { React, useContext, useState, useEffect } from "react";
import {
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { color } from "../../styles/theme";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { LocationContext } from "../../contexts/LocationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../../../apiConfig";

export default function AddressListScreen() {
  const { locationText, locationStatus, setLocationText, setLocationStatus } =
    useContext(LocationContext);
  const [addressList, setAddressList] = useState([]);
  const [primaryAddress, setPrimaryAddress] = useState(null);

  const fetchAddresses = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      console.log(parsedData.custID, "user data in cart page");
      // console.log(userData, "user data in cart page");
      const custID = parsedData?.custID;
      console.log(custID, "customer id in cart page");
      // alert(parsedData?.custID || "No customer ID found");
      // if (!custID) return;

      const response = await axios.get(
        `${API_URL}CustomerAddresses/custid?custid=${parsedData?.custID}`
      );
      const allAddresses = response.data;

      console.log(allAddresses, "customer addresses");

      setAddressList(allAddresses);

      const primary = allAddresses.find((addr) => addr.IsPrimary);
      if (primary) {
        setPrimaryAddress(primary);
        // 👇 update LocationContext so header shows it
        setLocationText(`${primary.AddressLine1}, ${primary.CityName}`);
        setLocationStatus("saved");
      }
    } catch (error) {
      console.error("Failed to fetch addresses", error);
    }
  };

  useEffect(() => {
    fetchAddresses(); // Initial fetch on mount
  }, []);

  const makePrimaryAddress = async (addressId) => {
    try {
      await axios.post(
        `${API_URL}CustomerAddresses/primary-address?AddressId=${addressId}`
      );
      const updated = addressList.find((a) => a.AddressID === addressId);
      if (updated) {
        setPrimaryAddress(updated);
        setLocationText(`${updated.AddressLine1}, ${updated.CityName}`);
        setLocationStatus("saved");
      }
      fetchAddresses();
    } catch (err) {
      console.error("Failed to set primary address:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {addressList.length === 0 ? (
          <CustomText style={globalStyles.paragraph}>
            No addresses found. Please add an address.
          </CustomText>
        ) : (
          addressList.map((address) => (
            <View key={address.AddressID} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="home" size={16} color="#333" />
                <CustomText style={[globalStyles.f12Bold, styles.cardTitle]}>
                  Address{" "}
                  {addressList.length > 1
                    ? addressList.indexOf(address) + 1
                    : ""}{" "}
                </CustomText>
              </View>

              <CustomText
                style={[globalStyles.f12SemiBold, styles.addressLine]}
              >
                {address.AddressLine1}, {address.CityName},{address.StateName},{" "}
                {address.CountryName} - {address.Pincode}
              </CustomText>
              <View style={styles.ActionButtons}>
                <TouchableOpacity
                  //   onPress={() => makePrimaryAddress(address.AddressID)}
                  style={[
                    styles.deleteButton,
                    primaryAddress?.AddressID === address.AddressID && {
                      backgroundColor: color.secondary,
                    },
                  ]}
                >
                  <CustomText
                    style={[globalStyles.f12Regular, styles.buttonText]}
                  >
                    {primaryAddress?.AddressID === address.AddressID
                      ? "Primary Address"
                      : "Make Primary"}
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => makePrimaryAddress(address.AddressID)}
                  style={[
                    styles.primaryButton,
                    primaryAddress?.AddressID === address.AddressID && {
                      backgroundColor: color.secondary,
                    },
                  ]}
                >
                  <CustomText
                    style={[globalStyles.f12Regular, styles.buttonText]}
                  >
                    {primaryAddress?.AddressID === address.AddressID
                      ? "Primary Address"
                      : "Make Primary"}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    backgroundColor: color.backgroundLight,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 3 },
    // shadowOpacity: 0.1,
    // shadowRadius: 6,
    // elevation: 4, // Android shadow
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
    color: "#333",
  },
  addressLine: {
    // fontSize: 14,
    fontWeight: "500",
    color: "#444",
    marginBottom: 10,
  },
  addressDetails: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: color.textLight,
    paddingVertical: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: color.alertError,
    paddingVertical: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  ActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
