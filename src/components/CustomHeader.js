import React, { useContext, useEffect, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, Pressable, Image, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback,
  Keyboard, Alert, ActivityIndicator,
  TouchableWithoutFeedback as RNModalDismiss,
  StatusBar,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "./CustomText";
import globalStyles from "../styles/globalStyles";
import { Linking } from 'react-native';
import { LocationContext } from "../contexts/LocationContext";
import { useNavigation } from "@react-navigation/native";
import * as Location from 'expo-location';
import CustomAlert from "./CustomAlert";
import { color } from "../styles/theme";
import { API_URL } from "../../apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function CustomHeader({ navigation }) {
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const { locationText, locationStatus, setLocationText, setLocationStatus } = useContext(LocationContext);
  const [isLocating, setIsLocating] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [addressList, setAddressList] = useState([]);
  const [primaryAddress, setPrimaryAddress] = useState(null);
  const [alertData, setAlertData] = useState({
    title: "",
    message: "",
    status: "info",
  });
  const showAlert = ({ title, message, status = "info" }) => {
    setAlertData({ title, message, status });
    setAlertVisible(true);
  };

  const navigationTo = useNavigation();

  const handleManualLocation = (selectedCity) => {
    setLocationText(selectedCity);
    setLocationStatus('manual');
    setShowModal(false);
  };

  const handlePressLocation = () => {
    if (locationStatus === 'denied') {
      showAlert({
        title: "Location Permission Denied",
        message: "Open settings and enable location access.",
        status: "error",
      });
      return;
    } else {
      setShowModal(true);
    }
  };

  const handleCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        showAlert({
          title: "Permission Denied",
          message: "Location permission is required to detect your current city.",
          status: "error",
        });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geo && geo.length > 0) {
        const { city, region } = geo[0];
        const cityName = `${city}, ${region}`;
        setLocationText(cityName);
        setLocationStatus("auto");
        setShowModal(false);
      } else {
        showAlert({
          title: "Location Error",
          message: "Unable to determine your location.",
          status: "error",
        });
      }
    } catch (error) {
      console.error(error);
      showAlert({
        title: "Error",
        message: "Something went wrong while detecting location.",
        status: "error",
      });
    } finally {
      setIsLocating(false);
    }
  };

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
  const unsubscribe = navigationTo.addListener('focus', () => {
    fetchAddresses(); // Re-fetch when screen is focused
  });

  return unsubscribe;
}, [navigationTo]);

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
      setShowModal(false);
      fetchAddresses();
    } catch (err) {
      console.error("Failed to set primary address:", err);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />
      <View style={[styles.headerContainer, globalStyles.bgprimary, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topRow}>
          <View>
            <CustomText style={[globalStyles.textWhite, globalStyles.mt1]}>Hello User</CustomText>
            <Pressable onPress={handlePressLocation}>
              <CustomText style={[globalStyles.f12Bold, globalStyles.mt1, globalStyles.textWhite]}>
                {locationText || "Select Location"} <Ionicons name="chevron-down" size={14} />
              </CustomText>
            </Pressable>
          </View>

          <Pressable onPress={() => navigationTo.navigate('NotificationScreen')}>
            <Ionicons name="notifications-outline" size={24} style={globalStyles.textWhite} />
          </Pressable>
        </View>
      </View>

      {/* Modal: Select Location */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <CustomText
                  style={[
                    globalStyles.f16Bold,
                    globalStyles.primary,
                    { marginBottom: 15 },
                  ]}
                >
                  Choose Location
                </CustomText>

                {/* ✅ Use Current Location */}
                <TouchableOpacity
                  onPress={handleCurrentLocation}
                  style={{
                    paddingVertical: 12,
                    marginBottom: 15,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {isLocating ? (
                    <ActivityIndicator
                      size="small"
                      color="#333"
                      style={{ marginRight: 8 }}
                    />
                  ) : (
                    <Ionicons
                      name="navigate"
                      size={18}
                      color={color.primary}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <CustomText style={[globalStyles.primary, globalStyles.f14Bold]}>
                    Use My Current Location
                  </CustomText>
                </TouchableOpacity>

                {/* ✅ Add New Address */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                  onPress={() => {
                    setShowModal(false);
                    navigationTo.navigate("ConfirmAddressPage");
                  }}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      backgroundColor: color.yellow,
                      borderRadius: 6,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <AntDesign name="plus" size={22} color="white" />
                  </View>
                  <CustomText
                    style={[globalStyles.f14Bold, globalStyles.textBlack]}
                  >
                    Add New Address
                  </CustomText>
                </TouchableOpacity>

                {/* ✅ Address List */}
                <FlatList
                  data={[...addressList].sort((a, b) => b.IsPrimary - a.IsPrimary)}
                  keyExtractor={(item) => item.AddressID.toString()}
                  showsVerticalScrollIndicator
                  style={{ maxHeight: 250 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => makePrimaryAddress(item.AddressID)}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        marginBottom: 14,
                      }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color={color.primary}
                        style={{ marginRight: 10, marginTop: 4 }}
                      />
                      <View style={{ flex: 1 }}>
                        <CustomText
                          style={[
                            globalStyles.f14Bold,
                            item.IsPrimary
                              ? { color: color.secondary }
                              : globalStyles.textBlack,
                          ]}
                        >
                          {item.AddressLine1}
                        </CustomText>
                        <CustomText
                          style={[
                            globalStyles.f12Regular,
                            { color: color.muted },
                          ]}
                        >
                          {item.AddressLine2}, {item.CityName},{" "}
                          {item.StateName}, {item.Pincode}
                        </CustomText>
                      </View>
                    </TouchableOpacity>
                  )}
                />

                {/* Cancel */}
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={{ marginTop: 20, alignSelf: "center" }}
                >
                  <CustomText style={[globalStyles.primary, globalStyles.f12Bold]}>
                    Cancel
                  </CustomText>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        status={alertData.status}
        onClose={() => setAlertVisible(false)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  headerContainer: {
    fontFamily: "Manrope-Medium",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 0,
    backgroundColor: "#fff",
    // borderBottomColor: "#eee",
    // borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
});
