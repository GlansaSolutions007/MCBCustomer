import React, { cloneElement, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ImageBackground,
  Modal,
  FlatList,
} from "react-native";
import bannerImage from "../../../assets/images/info.png";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
// import { Dropdown } from 'react-native-element-dropdown';
import CustomAlert from "../../components/CustomAlert";
import { useNavigation, useRoute } from "@react-navigation/native";
import CustomText from "../../components/CustomText";
import Checkbox from "expo-checkbox";
import CustomDropdown from "../../components/CustomDropdown";
// import { API_BASE_URL } from '@env';
import {
  API_URL,
  API_IMAGE_URL,
  GOOGLE_MAPS_APIKEY,
  RAZORPAY_KEY,
} from "@env";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../../utils/token";
import { SafeAreaView } from "react-native-safe-area-context";

export const MyCarDetails = () => {
  // const {API_BASE_URL} = Constants.expoConfig.extra;
  const [transmission, setTransmission] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [yearOfPurchase, setYearOfPurchase] = useState(null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [engineType, setEngineType] = useState("");
  const [kilometersDriven, setKilometersDriven] = useState("");
  const [isPrimaryCar, setIsPrimaryCar] = useState(false);

  const [vehicleNumberError, setVehicleNumberError] = useState(false);
  const [transmissionError, setTransmissionError] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [model, setModel] = useState(null);

  const transmissionOptions = [
    { label: "Automatic", value: "Automatic" },
    { label: "Manual", value: "Manual" },
  ];

  const route = useRoute();

  const getYearsList = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= 1980; i--) {
      years.push(i.toString());
    }
    return years;
  };

  const years = getYearsList();

  useEffect(() => {
    if (route.params) {
      setIsPrimaryCar(route.params.isPrimary || false);
      setModel(route.params.model || null);
      setVehicleNumber(route.params.vehicleNumber || "");
      setTransmission(route.params.transmission || "");
      setEngineType(route.params.engineType || "");
      setKilometersDriven(route.params.kilometersDriven || "");
      setYearOfPurchase(route.params.yearOfPurchase?.toString() || null);
      setIsViewOnly(!!route.params.vehicleId);
    }
  }, [route.params]);

  const { brandId, modelId, fuelId, fuelType } = route.params;

  const validateVehicleNumber = (number) => {
    const regex = /^[A-Z0-9]+$/; // Only capital letters and numbers
    return regex.test(number);
  };

  const handleVehicleNumberChange = (text) => {
    const upperText = text.toUpperCase(); // Convert to uppercase
    setVehicleNumber(upperText);
    if (!upperText.trim()) {
      setVehicleNumberError("Registration number is required");
    } else if (!validateVehicleNumber(upperText)) {
      setVehicleNumberError("Only capital letters and numbers are allowed");
    } else {
      setVehicleNumberError("");
    }
  };

  const handleSubmit = async () => {
    let hasError = false;

    if (!vehicleNumber.trim()) {
      setVehicleNumberError(true);
      hasError = true;
    }

    if (!transmission.trim()) {
      setTransmissionError(true);
      hasError = true;
    }

    if (hasError) return;

    try {
      const storedUserData = await AsyncStorage.getItem("userData");
      const userData = JSON.parse(storedUserData);
      const custID = userData?.custID;

      if (!custID) {
        console.warn("Customer ID not found.");
        return;
      }

      const payload = {
        custID: custID,
        vehicleNumber: vehicleNumber,
        yearOfPurchase: yearOfPurchase || "",
        engineType: engineType,
        kilometersDriven: kilometersDriven,
        transmissionType: transmission,
        createdBy: custID,
        brandID: brandId,
        modelID: modelId,
        fuelTypeID: fuelId,
      };

      const token = await getToken();

      const res = await axios.post(
        `${API_URL}CustomerVehicles/InsertCustomerVehicle`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Car added:", res.data);
      setAlertVisible(true);
    } catch (error) {
      console.error("Error submitting car:", error);
    }
  };

  const navigation = useNavigation();

  const goCarList = () => {
    setAlertVisible(false);
    navigation.navigate("CustomerTabNavigator", { screen: "My Cars" });
  };

  const deleteCar = async () => {
    // alert(route.params.vehicleId);
    try {
      const deleteCarData = await axios.delete(
        `${API_URL}CustomerVehicles/CustomerVehicleID?custvehicleid=${route.params.vehicleId}`
      );
      if (deleteCarData.status === 200) {
        console.log("Car deleted successfully");
        navigation.navigate("CustomerTabNavigator", { screen: "My Cars" });
      }
    } catch (error) {
      console.error("Error deleting car:", error.message);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["bottom"]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flex: 1 }}>
              {model?.image && (
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderBottomLeftRadius: 30,
                    borderBottomRightRadius: 30,
                  }}
                >
                  <View style={styles.modelImageContainer}>
                    <ImageBackground
                      source={{ uri: model.image }}
                      style={styles.modelImage}
                      resizeMode="contain"
                    />
                    <View style={styles.modelNameTag}>
                      <CustomText style={styles.modelNameText}>
                        {model.name}
                      </CustomText>
                    </View>
                  </View>
                </View>
              )}
              <View
                style={{
                  padding: 20,
                  backgroundColor: "#f1f0f5",
                  flex: 1,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}
              >
                <View style={styles.bannerContainer}>
                  <Image source={bannerImage} style={styles.bannerImage} />

                  <View style={styles.bannerTextContainer}>
                    <CustomText style={styles.bannerTitle}>
                      Your car,{"\n"}our priority
                    </CustomText>
                    <CustomText style={styles.bannerSubtitle}>
                      Filling these details ensures better{"\n"}service accuracy
                      & reminders
                    </CustomText>
                  </View>
                </View>

                {!isViewOnly ? (
                  <>
                    <CustomText style={styles.label}>
                      Registration Number
                      <CustomText style={styles.optional}> *</CustomText>
                    </CustomText>
                    <TextInput
                      placeholder="e.g. TS08AB1234"
                      placeholderTextColor="#888"
                      value={vehicleNumber}
                      onChangeText={handleVehicleNumberChange}
                      style={[
                        styles.input,
                        vehicleNumberError && styles.inputError,
                      ]}
                      editable={!isViewOnly}
                      autoCapitalize="characters"
                    />

                    <View style={styles.row}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <CustomText style={styles.label}>
                          Year of Purchase
                        </CustomText>
                        <TouchableOpacity
                          onPress={() => setShowYearPicker(true)}
                        >
                          <TextInput
                            value={yearOfPurchase}
                            placeholder="YYYY"
                            style={styles.input}
                            placeholderTextColor="#888"
                            editable={false}
                            pointerEvents="none"
                          />
                        </TouchableOpacity>

                        <Modal
                          visible={showYearPicker}
                          transparent
                          animationType="slide"
                          onRequestClose={() => setShowYearPicker(false)} // for Android back button
                        >
                          <TouchableWithoutFeedback
                            onPress={() => setShowYearPicker(false)}
                          >
                            <View
                              style={{
                                flex: 1,
                                backgroundColor: "rgba(0,0,0,0.5)",
                                justifyContent: "center",
                              }}
                            >
                              <TouchableWithoutFeedback onPress={() => { }}>
                                <View
                                  style={{
                                    backgroundColor: "white",
                                    margin: 20,
                                    borderRadius: 10,
                                    padding: 20,
                                    maxHeight: 300,
                                  }}
                                >
                                  <FlatList
                                    data={years}
                                    keyExtractor={(item) => item}
                                    renderItem={({ item }) => (
                                      <TouchableOpacity
                                        onPress={() => {
                                          setYearOfPurchase(item);
                                          setShowYearPicker(false);
                                        }}
                                        style={{
                                          padding: 15,
                                          borderBottomWidth: 1,
                                          borderBottomColor: "#ccc",
                                        }}
                                      >
                                        <CustomText
                                          style={globalStyles.textBlack}
                                        >
                                          {item}
                                        </CustomText>
                                      </TouchableOpacity>
                                    )}
                                  />
                                </View>
                              </TouchableWithoutFeedback>
                            </View>
                          </TouchableWithoutFeedback>
                        </Modal>
                      </View>
                      <View style={[{ flex: 1, marginLeft: 8 }]}>
                        <CustomText style={styles.label}>
                          Transmission Type
                          <CustomText style={styles.optional}> *</CustomText>
                        </CustomText>
                        <CustomDropdown
                          value={transmission}
                          onSelect={(value) => {
                            setTransmission(value);
                            setTransmissionError("");
                          }}
                          options={transmissionOptions}
                          error={!!transmissionError}
                          disabled={isViewOnly}
                        />
                      </View>
                    </View>
                    <View style={styles.labelWithHelperRow}>
                      <CustomText style={styles.label}>
                        Engine Type / Size
                      </CustomText>
                      <CustomText style={styles.helperTextInline}>
                        Useful for technicians
                      </CustomText>
                    </View>
                    <TextInput
                      placeholder="e.g. 1.2L i-VTEC"
                      style={styles.input}
                      placeholderTextColor="#888"
                      value={engineType}
                      onChangeText={setEngineType}
                      editable={!isViewOnly}
                    />
                    <View style={styles.labelWithHelperRow}>
                      <CustomText style={styles.label}>
                        Kilometers Driven
                      </CustomText>
                      <CustomText style={styles.helperTextInline}>
                        Useful for technicians
                      </CustomText>
                    </View>
                    <TextInput
                      placeholder="---"
                      style={styles.input}
                      placeholderTextColor="#888"
                      value={kilometersDriven}
                      onChangeText={setKilometersDriven}
                      editable={!isViewOnly}
                    />
                  </>
                ) : (
                  <>
                    <View
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                        shadowColor: "#000",
                        shadowOpacity: 0.1,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 6,
                        elevation: 3,
                      }}
                    >
                      {[
                        { label: "Vehicle Number", value: vehicleNumber },
                        { label: "Year of Purchase", value: yearOfPurchase },
                        { label: "Transmission Type", value: transmission },
                        { label: "Engine Type", value: engineType },
                        { label: "Kilometers Driven", value: kilometersDriven },
                      ].map((item, index) => (
                        <View
                          key={index}
                          style={{ marginBottom: index !== 4 ? 14 : 0 }}
                        >
                          <CustomText
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginBottom: 2,
                            }}
                          >
                            {item.label}
                          </CustomText>
                          <CustomText
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              color: "#222",
                            }}
                          >
                            {item.value || "---"}
                          </CustomText>
                        </View>
                      ))}
                    </View>
                    {isPrimaryCar ? null : (
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={deleteCar}
                      >
                        <CustomText style={styles.deleteText}>
                          Delete
                        </CustomText>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {!isViewOnly && (
                  <View style={styles.privacyContainer}>
                    <TouchableOpacity
                      style={styles.privacyRow}
                      onPress={() => setPrivacyAccepted((prev) => !prev)}
                      activeOpacity={0.7}
                    >
                      <Checkbox
                        value={privacyAccepted}
                        onValueChange={setPrivacyAccepted}
                      />
                      <CustomText style={styles.privacyText}>
                        I accept the Privacy Policy
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                )}
                {!isViewOnly && (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !privacyAccepted && styles.disabledButton,
                    ]}
                    onPress={handleSubmit}
                    disabled={!privacyAccepted}
                  >
                    <CustomText
                      style={{ ...globalStyles.f12Bold, color: color.white }}
                    >
                      Submit
                    </CustomText>
                  </TouchableOpacity>
                )}
              </View>
              <CustomAlert
                visible={alertVisible}
                onClose={goCarList}
                title="Success"
                message="Your Car Added Successfully"
                status="info"
                showButton={false} // hide default button
              >
                <TouchableOpacity
                  onPress={goCarList}
                  style={styles.submitButton}
                >
                  <CustomText
                    style={{ ...globalStyles.f12Bold, color: color.white }}
                  >
                    Go To Cars List
                  </CustomText>
                </TouchableOpacity>
              </CustomAlert>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  deleteBtn: {
    backgroundColor: color.alertError,
    padding: 18,
    width: "100%",
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    ...globalStyles.f12Bold,
  },
  modelImageContainer: {
    alignItems: "center",
    position: "relative",
    backgroundColor: "transparent",
    overflow: "hidden",
    marginTop: 40,
  },
  modelImage: {
    width: 180,
    height: 200,
    padding: 20,
  },
  modelNameTag: {
    position: "absolute",
    top: 10,
    backgroundColor: color.yellow,
    paddingHorizontal: 12,
    borderRadius: 10,
    paddingBottom: 4,
  },
  modelNameText: {
    color: "white",
    ...globalStyles.f20Bold,
    textAlign: "center",
  },
  modelText: {
    color: "white",
    ...globalStyles.f10Bold,
    textAlign: "center",
    paddingVertical: 4,
  },
  bannerContainer: {
    position: "relative",
    width: "100%",
    height: 140,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden", // ensures rounded corners affect children
  },

  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  bannerTextContainer: {
    position: "absolute",
    padding: 20,
  },

  bannerTitle: {
    ...globalStyles.textWhite,
    ...globalStyles.f16Bold,
    marginBottom: 4,
  },

  bannerSubtitle: {
    ...globalStyles.textWhite,
    ...globalStyles.f10Regular,
  },

  label: {
    ...globalStyles.f14Bold,
    marginBottom: 4,
    ...globalStyles.textBlack,
    // marginTop: 10,
  },
  optional: {
    ...globalStyles.f12Bold,
    color: "red",
  },
  input: {
    backgroundColor: "#fff",
    color: "#111111",
    borderRadius: 8,
    padding: 6,
    ...globalStyles.f16Bold,
    marginBottom: 10,
  },
  itemTextStyle: {
    ...globalStyles.f10Bold,
  },

  itemContainerStyle: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  labelWithHelperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  helperTextInline: {
    marginTop: 4,
    ...globalStyles.f10Regular,
    color: "#999",
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  privacyContainer: {
    alignItems: "flex-start",
    marginBottom: 5,
    marginTop: 5,
  },

  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  privacyText: {
    marginLeft: 6,
    ...globalStyles.f10Regular,
    color: "#999",
  },
  submitButton: {
    backgroundColor: color.secondary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#f16b6bff",
  },
});
