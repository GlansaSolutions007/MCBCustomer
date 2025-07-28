import React, { useContext, useEffect, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, Pressable, Image, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback,
  Keyboard, Alert, ActivityIndicator,
  TouchableWithoutFeedback as RNModalDismiss,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "./CustomText";
import globalStyles from "../styles/globalStyles";
import { Linking } from 'react-native';
import { LocationContext } from "../contexts/LocationContext";
import { useNavigation } from "@react-navigation/native";
import * as Location from 'expo-location';
import CustomAlert from "./CustomAlert";

const CITY_LIST = [
  'Hyderabad, Telangana',
  'Bangalore, Karnataka',
  'Mumbai, Maharashtra',
  'Chennai, Tamil Nadu',
  'Delhi, NCR',
  'Bhubaneshwar, Odisha',
  'Kolkata, West Bengal',
  'Pune, Maharashtra',
  'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan',
  'Lucknow, Uttar Pradesh',
  'Surat, Gujarat',
  'Visakhapatnam, Andhra Pradesh',
  'Nagpur, Maharashtra',
  'Indore, Madhya Pradesh',
  'Bhopal, Madhya Pradesh',
  'Patna, Bihar',
  'Thiruvananthapuram, Kerala',
  'Coimbatore, Tamil Nadu',
  'Chandigarh, Punjab/Haryana',
  'Vijayawada, Andhra Pradesh',
  'Raipur, Chhattisgarh',
  'Guwahati, Assam',
  'Ranchi, Jharkhand',
  'Dehradun, Uttarakhand',
  'Noida, Uttar Pradesh'
];

export default function CustomHeader({ navigation }) {
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const { locationText, locationStatus, setLocationText, setLocationStatus } = useContext(LocationContext);
  const [isLocating, setIsLocating] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
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

  return (
    <>
      <View style={[styles.headerContainer, globalStyles.bgprimary, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topRow}>
          <View>
            <CustomText style={[globalStyles.textWhite, globalStyles.mt1]}>Hello User</CustomText>
            <Pressable onPress={handlePressLocation}>
              <CustomText style={[globalStyles.f12Bold, globalStyles.mt1, globalStyles.textWhite]}>
                {locationText} <Ionicons name="chevron-down" size={14} />
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
                <CustomText style={[globalStyles.f16Bold, globalStyles.primary, { marginBottom: 10 }]}>
                  Select Your City
                </CustomText>
                <TouchableOpacity
                  onPress={handleCurrentLocation}
                  style={{ paddingVertical: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#333" style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="navigate" size={18} color="#007AFF" style={{ marginRight: 8 }} />
                  )}
                  <CustomText style={[globalStyles.primary, globalStyles.f14Bold]}>
                    Use My Current Location
                  </CustomText>
                </TouchableOpacity>
                <FlatList
                  data={CITY_LIST}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator
                  style={{ maxHeight: 250 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleManualLocation(item)} style={{ paddingVertical: 10 }}>
                      <CustomText>{item}</CustomText>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: 10 }}>
                  <CustomText style={[globalStyles.primary, globalStyles.f12Bold]}>Cancel</CustomText>
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
