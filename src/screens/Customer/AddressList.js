import { React, useContext, useState, useEffect } from "react";
import {
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
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
import CustomAlert from "../../components/CustomAlert";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddressListScreen() {
  const { locationText, locationStatus, setLocationText, setLocationStatus } =
    useContext(LocationContext);
  const [addressList, setAddressList] = useState([]);
  const [primaryAddress, setPrimaryAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  // For delete confirmation
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const insets = useSafeAreaInsets();

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;

      const response = await axios.get(
        `${API_URL}CustomerAddresses/custid?custid=${custID}`
      );
      const allAddresses = response.data;

      setAddressList(allAddresses);

      const primary = allAddresses.find((addr) => addr.IsPrimary);
      if (primary) {
        setPrimaryAddress(primary);
        setLocationText(`${primary.AddressLine1}, ${primary.CityName}`);
        setLocationStatus("saved");
      }
    } catch (error) {
      console.error("Failed to fetch addresses", error);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const makePrimaryAddress = async (addressId) => {
    try {
      await axios.post(
        `${API_URL}CustomerAddresses/primary-address?AddressId=${addressId}`
      );
      fetchAddresses();
    } catch (err) {
      console.error("Failed to set primary address:", err);
    }
  };

  const deleteAddress = async () => {
    if (!selectedAddressId) return;
    try {
      await axios.delete(
        `${API_URL}CustomerAddresses/addressid?addressid=${selectedAddressId}`
      );
      setShowDeleteAlert(false);
      setSelectedAddressId(null);
      fetchAddresses();
    } catch (err) {
      console.error("Failed to delete address:", err);
    }
  };

  const SkeletonLoader = () => (
    <View style={styles.card}>
      {/* Header Placeholder */}
      <View style={styles.cardHeader}>
        <View style={{ backgroundColor: '#f1f1f1ff', width: 18, height: 18, borderRadius: 4 }} />
        <View style={{ backgroundColor: '#f1f1f1ff', height: 16, width: '60%', borderRadius: 4, marginLeft: 8 }} />
      </View>
      {/* Address Line Placeholder */}
      <View style={{ backgroundColor: '#f1f1f1ff', height: 16, width: '90%', borderRadius: 4, marginVertical: 8 }} />
      {/* Action Buttons Placeholder */}
      <View style={styles.ActionButtons}>
        <View style={[styles.notprimaryButton, { flex: 1, backgroundColor: '#f1f1f1ff' }]} />
        <View style={[styles.deleteButton, { backgroundColor: '#f1f1f1ff' }]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 16 }]}>
        {loading ? (
          <View>
            <SkeletonLoader />
            <SkeletonLoader />
          </View>
        ) : addressList.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <CustomText style={globalStyles.paragraph}>
              No addresses found. Please add an address.
            </CustomText>
          </View>
        ) : (
          addressList.map((address) => (
            <View key={address.AddressID} style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <Ionicons name="home" size={18} color="#333" />
                <CustomText style={[globalStyles.f12Bold, styles.cardTitle]}>
                  {address.AddressLine1}
                </CustomText>
              </View>
              {/* Address Line */}
              <CustomText style={[globalStyles.f12SemiBold, styles.addressLine]}>
                {address.AddressLine1}, {address.AddressLine2} {address.CityName},{' '}
                {address.StateName} - {address.Pincode}
              </CustomText>
              {/* Action Buttons Row */}
              <View style={styles.ActionButtons}>
                {primaryAddress?.AddressID === address.AddressID ? (
                  <View style={[styles.primaryButton, { flex: 1 }]}>
                    <CustomText
                      style={[globalStyles.f12Regular, styles.buttonText]}
                    >
                      Primary Address
                    </CustomText>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => makePrimaryAddress(address.AddressID)}
                    style={[styles.notprimaryButton, { flex: 1 }]}
                  >
                    <CustomText
                      style={[globalStyles.f12Regular, styles.nobuttonText]}
                    >
                      Make Primary
                    </CustomText>
                  </TouchableOpacity>
                )}
                {primaryAddress?.AddressID !== address.AddressID && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedAddressId(address.AddressID);
                      setShowDeleteAlert(true);
                    }}
                    style={[styles.deleteButton]}
                  >
                    <Ionicons name="trash-outline" size={20} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      {/* Delete Confirmation Alert */}
      <CustomAlert
        visible={showDeleteAlert}
        status="error"
        title="Delete Address"
        message="Are you sure you want to delete this address?"
        showButton={false}
        onClose={() => setShowDeleteAlert(false)}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
          }}
        >
          <TouchableOpacity
            style={[styles.cancelButton]}
            onPress={() => setShowDeleteAlert(false)}
          >
            <CustomText style={styles.cancelText}>Cancel</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmDeleteButton]}
            onPress={deleteAddress}
          >
            <CustomText style={styles.confirmText}>Yes, Delete</CustomText>
          </TouchableOpacity>
        </View>
      </CustomAlert>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    ...globalStyles.f14Bold,
    marginLeft: 6,
    color: "#333",
  },
  addressLine: {
    ...globalStyles.f10Bold,
    color: "#444",
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: color.secondary,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  notprimaryButton: {
    backgroundColor: color.textLight,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: color.alertError,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
  },
  nobuttonText: {
    color: "#fff",
  },
  ActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center'
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#ddd",
    alignItems: "center",
  },
  confirmDeleteButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: color.alertError,
    alignItems: "center",
  },
  cancelText: {
    color: "#333",
    fontWeight: "600",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "600",
  },

});

