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
  StatusBar,
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
import { API_URL } from "@env";
import AntDesign from '@expo/vector-icons/AntDesign';
// import { Ionicons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';

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
  const [showTransmissionPicker, setShowTransmissionPicker] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertStatus, setAlertStatus] = useState("info");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [engineType, setEngineType] = useState("");
  const [kilometersDriven, setKilometersDriven] = useState("");
  const [isPrimaryCar, setIsPrimaryCar] = useState(false);

  const [vehicleNumberError, setVehicleNumberError] = useState(false);
  const [transmissionError, setTransmissionError] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [model, setModel] = useState(null);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

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
      if (res.data.status) {
        // success
        setAlertTitle("Success");
        setAlertMessage("Your Car Added Successfully");
        setAlertStatus("success");
      } else {
        // validation / duplicate error
        setAlertTitle("Validation Error");
        setAlertMessage(res.data.message || "Something went wrong.");
        setAlertStatus("error");
      }
      setAlertVisible(true);
    } catch (error) {
      console.error("Error submitting car:", error);
      setAlertTitle("Error");
      setAlertMessage("Failed to add car. Please try again.");
      setAlertStatus("error");
      setAlertVisible(true);
    }
  };

  const navigation = useNavigation();

  const goCarList = () => {
    setAlertVisible(false);
    navigation.navigate("My Cars", { screen: "MyCarsList" });
  };

  const deleteCar = async () => {
    // alert(route.params.vehicleId);
    try {
      const deleteCarData = await axios.delete(
        `${API_URL}CustomerVehicles/CustomerVehicleID?custvehicleid=${route.params.vehicleId}`
      );
      if (deleteCarData.status === 200) {
        console.log("Car deleted successfully");
        navigation.navigate("My Cars", { screen: "MyCarsList" });
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
      <StatusBar
        backgroundColor={Platform.OS === "android" ? "#fff" : undefined}
        barStyle="dark-content"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          bounces={true}
          alwaysBounceVertical={false}
          nestedScrollEnabled={true}
          onScrollBeginDrag={Keyboard.dismiss}
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
                style={[
                  globalStyles.p4,
                  {
                    backgroundColor: "#f8f9fa",
                    flex: 1,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }
                ]}
              >
                {/* Banner Section */}
                <View style={styles.bannerContainer}>
                  <Image source={bannerImage} style={styles.bannerImage} />
                  <View style={styles.bannerTextContainer}>
                    <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite, globalStyles.mb1]}>
                      Your car,{"\n"}our priority
                    </CustomText>
                    <CustomText style={[globalStyles.f12Regular, globalStyles.textWhite]}>
                      Filling these details ensures better{"\n"}service accuracy & reminders
                    </CustomText>
                  </View>
                </View>

                {/* Car Summary Card */}
                <View style={styles.summaryCard}>
                  <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.mb3]}>
                    <Ionicons name="car-sport" size={24} color={color.secondary} />
                    <CustomText style={[globalStyles.f16Bold, globalStyles.textBlack, globalStyles.ml2]}>{model?.name || "Your Car"}</CustomText>
                  </View>

                  <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, { flexWrap: "wrap" }]}>
                    {!!vehicleNumber && (
                      <View style={[styles.chip, styles.primaryChip]}>
                        <Ionicons name="pricetag" size={14} color={color.white} />
                        <CustomText style={[globalStyles.f10Bold, globalStyles.textWhite, globalStyles.ml1]}>
                          {vehicleNumber}
                        </CustomText>
                      </View>
                    )}
                    {!!yearOfPurchase && (
                      <View style={styles.chip}>
                        <Ionicons name="calendar" size={14} color={color.primary} />
                        <CustomText style={[globalStyles.f10Bold, globalStyles.primary, globalStyles.ml1]}>
                          {yearOfPurchase}
                        </CustomText>
                      </View>
                    )}
                    {!!fuelType && (
                      <View style={styles.chip}>
                        <Ionicons name="flame" size={14} color={color.primary} />
                        <CustomText style={[globalStyles.f10Bold, globalStyles.primary, globalStyles.ml1]}>
                          {fuelType}
                        </CustomText>
                      </View>
                    )}
                    {!!transmission && (
                      <View style={styles.chip}>
                        <Ionicons name="git-compare" size={14} color={color.primary} />
                        <CustomText style={[globalStyles.f10Bold, globalStyles.primary, globalStyles.ml1]}>
                          {transmission}
                        </CustomText>
                      </View>
                    )}
                  </View>
                </View>

                {!isViewOnly ? (
                  <>
                    {/* Vehicle Information Section */}
                    <View style={styles.sectionContainer}>
                      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.mb3]}>

                        <Ionicons name="information-circle" size={16} color={color.primary} style={globalStyles.mr1} />
                        <CustomText style={[globalStyles.f14Bold, globalStyles.textBlack]}>
                          Vehicle Information
                        </CustomText>
                      </View>

                      <View style={styles.formCard}>
                        {/* Registration Number */}
                        <View style={styles.inputGroup}>
                          <CustomText style={[globalStyles.f14Bold, globalStyles.textBlack, globalStyles.mb1]}>
                            Registration Number
                            <CustomText style={[globalStyles.f14Bold, { color: "#ef4444" }]}> *</CustomText>
                          </CustomText>
                          <TextInput
                            placeholder="e.g. TS08AB1234"
                            placeholderTextColor="#999"
                            value={vehicleNumber}
                            onChangeText={handleVehicleNumberChange}
                            style={[
                              styles.input,
                              vehicleNumberError && styles.inputError,
                            ]}
                            autoCapitalize="characters"
                          />
                          {vehicleNumberError && (
                            <CustomText style={[globalStyles.f12Regular, { color: "#ef4444" }, globalStyles.mt1]}>
                              {typeof vehicleNumberError === 'string' ? vehicleNumberError : 'Registration number is required'}
                            </CustomText>
                          )}
                        </View>

                        {/* Year and Transmission Row */}
                        <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.mb3]}>
                          <View style={styles.halfWidth}>
                            <CustomText style={[globalStyles.f14Bold, globalStyles.textBlack, globalStyles.mb1]}>
                              Year of Purchase
                            </CustomText>
                            <TouchableOpacity
                              onPress={() => setShowYearPicker(true)}
                              style={styles.input}
                            >
                              <CustomText style={[globalStyles.f14Regular, !yearOfPurchase && { color: "#999" }]}>
                                {yearOfPurchase || "Select Year"}
                              </CustomText>
                              <Ionicons name="chevron-down" size={16} color="#999" style={{ position: 'absolute', right: 12, top: 12 }} />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.halfWidth}>
                            <CustomText style={[globalStyles.f14Bold, globalStyles.textBlack, globalStyles.mb1]}>
                              Transmission Type
                              <CustomText style={[globalStyles.f14Bold, { color: "#ef4444" }]}> *</CustomText>
                            </CustomText>
                            <TouchableOpacity
                              onPress={() => setShowTransmissionPicker(true)}
                              style={[
                                styles.input,
                                transmissionError && styles.inputError
                              ]}
                            >
                              <CustomText style={[globalStyles.f14Regular, !transmission && { color: "#999" }]}>
                                {transmission || "Select Type"}
                              </CustomText>
                              <Ionicons name="chevron-down" size={16} color="#999" style={{ position: 'absolute', right: 12, top: 12 }} />
                            </TouchableOpacity>
                            {transmissionError && (
                              <CustomText style={[globalStyles.f12Regular, { color: "#ef4444" }, globalStyles.mt1]}>
                                Transmission type is required
                              </CustomText>
                            )}
                          </View>
                        </View>

                        {/* Engine Type */}
                        <View style={styles.inputGroup}>
                          <View style={globalStyles.mb1}>
                            <CustomText style={[globalStyles.f14Bold, globalStyles.textBlack, globalStyles.mb1]}>
                              Engine Type / Size
                            </CustomText>
                            <CustomText style={[globalStyles.f10Regular, { color: "#666" }]}>
                              Helpful for technicians
                            </CustomText>
                          </View>
                          <TextInput
                            placeholder="e.g. 1.2L i-VTEC"
                            placeholderTextColor="#999"
                            value={engineType}
                            onChangeText={setEngineType}
                            style={styles.input}
                          />
                        </View>

                        {/* Kilometers Driven */}
                        <View style={styles.inputGroup}>
                          <View style={globalStyles.mb1}>
                            <CustomText style={[globalStyles.f14Bold, globalStyles.textBlack, globalStyles.mb1]}>
                              Kilometers Driven
                            </CustomText>
                            <CustomText style={[globalStyles.f10Regular, { color: "#666" }]}>
                              Helpful for technicians
                            </CustomText>
                          </View>
                          <TextInput
                            placeholder="e.g. 50000"
                            placeholderTextColor="#999"
                            value={kilometersDriven}
                            onChangeText={setKilometersDriven}
                            style={styles.input}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      {/* Tips Box */}
                      <View style={[globalStyles.flexrow, globalStyles.alineItemsstart, styles.tipBox]}>
                        <Ionicons name="bulb" size={18} color={color.primary} />
                        <CustomText style={[globalStyles.f12Regular, color.primary, globalStyles.ml2, { flex: 1, lineHeight: 18 }]}>
                          Providing accurate car details helps us match the right technician and ensures better service quality.
                        </CustomText>
                      </View>
                    </View>

                    {/* Year Picker Modal */}
                    <Modal
                      visible={showYearPicker}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setShowYearPicker(false)}
                      statusBarTranslucent={true}
                    >
                      <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => setShowYearPicker(false)}>
                          <View style={styles.modalBackdrop} />
                        </TouchableWithoutFeedback>
                        <View style={styles.yearPickerModal}>
                              <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.alineItemscenter, globalStyles.p3]}>
                                <CustomText style={[globalStyles.f16Bold, globalStyles.textBlack]}>Select Year</CustomText>
                                <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                                  <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                              </View>
                              <FlatList
                                data={years}
                                keyExtractor={(item) => item}
                                initialNumToRender={10}
                                maxToRenderPerBatch={10}
                                windowSize={10}
                                removeClippedSubviews={true}
                                getItemLayout={(data, index) => ({
                                  length: 60,
                                  offset: 60 * index,
                                  index,
                                })}
                                renderItem={({ item }) => (
                                  <TouchableOpacity
                                    onPress={() => {
                                      setYearOfPurchase(item);
                                      setShowYearPicker(false);
                                    }}
                                    style={[
                                      globalStyles.flexrow,
                                      globalStyles.justifysb,
                                      globalStyles.alineItemscenter,
                                      globalStyles.p3,
                                      { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
                                      yearOfPurchase === item && { backgroundColor: "#f0f9ff" }
                                    ]}
                                  >
                                    <CustomText style={[
                                      globalStyles.f16Regular,
                                      { color: "#333" },
                                      yearOfPurchase === item && [globalStyles.f16Bold, { color: color.primary }]
                                    ]}>
                                      {item}
                                    </CustomText>
                                    {yearOfPurchase === item && (
                                      <Ionicons name="checkmark" size={20} color={color.primary} />
                                    )}
                                  </TouchableOpacity>
                                )}
                              />
                            </View>
                        </View>
                    </Modal>

                    {/* Transmission Picker Modal */}
                    <Modal
                      visible={showTransmissionPicker}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setShowTransmissionPicker(false)}
                      statusBarTranslucent={true}
                    >
                      <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => setShowTransmissionPicker(false)}>
                          <View style={styles.modalBackdrop} />
                        </TouchableWithoutFeedback>
                        <View style={styles.transmissionPickerModal}>
                              <View style={[globalStyles.flexrow, globalStyles.justifysb, globalStyles.alineItemscenter, globalStyles.p3]}>
                                <CustomText style={[globalStyles.f16Bold, globalStyles.textBlack]}>Select Transmission</CustomText>
                                <TouchableOpacity onPress={() => setShowTransmissionPicker(false)}>
                                  <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                              </View>
                              <FlatList
                                data={transmissionOptions}
                                keyExtractor={(item) => item.value}
                                initialNumToRender={5}
                                maxToRenderPerBatch={5}
                                windowSize={5}
                                removeClippedSubviews={true}
                                getItemLayout={(data, index) => ({
                                  length: 60,
                                  offset: 60 * index,
                                  index,
                                })}
                                renderItem={({ item }) => (
                                  <TouchableOpacity
                                    onPress={() => {
                                      setTransmission(item.value);
                                      setTransmissionError("");
                                      setShowTransmissionPicker(false);
                                    }}
                                    style={[
                                      globalStyles.flexrow,
                                      globalStyles.justifysb,
                                      globalStyles.alineItemscenter,
                                      globalStyles.p3,
                                      { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
                                      transmission === item.value && { backgroundColor: "#f0f9ff" }
                                    ]}
                                  >
                                    <CustomText style={[
                                      globalStyles.f16Regular,
                                      { color: "#333" },
                                      transmission === item.value && [globalStyles.f16Bold, { color: color.primary }]
                                    ]}>
                                      {item.label}
                                    </CustomText>
                                    {transmission === item.value && (
                                      <Ionicons name="checkmark" size={20} color={color.primary} />
                                    )}
                                  </TouchableOpacity>
                                )}
                              />
                            </View>
                        </View>
                    </Modal>
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
                  <>
                    {/* Privacy Policy Section */}
                    <View style={styles.privacySection}>
                      <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, styles.privacyContainer]}>
                        <TouchableOpacity
                          style={[globalStyles.flexrow, globalStyles.alineItemscenter, { flex: 1 }]}
                          onPress={() => setPrivacyAccepted((prev) => !prev)}
                          activeOpacity={0.7}
                        >
                          <Checkbox
                            value={privacyAccepted}
                            onValueChange={setPrivacyAccepted}
                            color={privacyAccepted ? color.primary : undefined}
                          />
                          <CustomText style={[globalStyles.f14Regular, globalStyles.textBlack, globalStyles.ml2]}>
                            I accept the Privacy Policy
                          </CustomText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setPrivacyModalVisible(true)}
                          style={globalStyles.p1}
                        >
                          <Ionicons name="information-circle-outline" size={18} color={color.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Submit Button Section */}
                    <View style={styles.submitSection}>
                      <TouchableOpacity
                        style={[
                          globalStyles.flexrow,
                          globalStyles.alineItemscenter,
                          globalStyles.justifycenter,
                          styles.submitButton,
                          !privacyAccepted && styles.disabledButton,
                        ]}
                        onPress={handleSubmit}
                        disabled={!privacyAccepted}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={color.white}
                          style={globalStyles.mr2}
                        />
                        <CustomText style={[globalStyles.f16Bold, globalStyles.textWhite]}>
                          Save Car Details
                        </CustomText>
                      </TouchableOpacity>
                      {/* <CustomText style={[globalStyles.f12Regular, { color: "#666", textAlign: "center" }, globalStyles.mt2]}>
                        You can edit these details anytime from My Cars
                      </CustomText> */}
                    </View>
                  </>
                )}

              </View>
              <CustomAlert
                visible={alertVisible}
                onClose={() => setAlertVisible(false)}
                title={alertTitle}
                message={alertMessage}
                status={alertStatus}
                showButton={false} // hide default button
              >
                {alertStatus === "success" ? (
                  <TouchableOpacity onPress={goCarList} style={styles.submitButton}>
                    <CustomText style={{ ...globalStyles.f12Bold, color: color.white }}>
                      Go To Cars List
                    </CustomText>
                  </TouchableOpacity>
                ) : null}
              </CustomAlert>
              <Modal
                visible={privacyModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setPrivacyModalVisible(false)}
                statusBarTranslucent={true}
              >
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback onPress={() => setPrivacyModalVisible(false)}>
                    <View style={styles.modalBackdrop} />
                  </TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <CustomText style={styles.modalTitle}>Privacy Policy</CustomText>
                      <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                        <Text style={{ fontSize: 20 }}>✖</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={{ marginTop: 10 }}>
                      <CustomText style={styles.modalText}>
                        {/* Replace this with your actual Privacy Policy */}
                        At My Car Buddy, we respect your privacy and are committed to
                        protecting your personal data.{"\n"}{"\n"}
                        • Name, phone number, email, and vehicle details.{"\n"}
                        • Location and booking history for providing accurate services.{"\n"}{"\n"}
                        <CustomText style={styles.subHeading}>How We Use Your Data {"\n"}</CustomText>
                        • To confirm bookings and deliver services.{"\n"}
                        • To send updates, reminders, and offers.{"\n"}
                        • To improve your app experience.{"\n"}{"\n"}
                        <CustomText style={styles.subHeading}>Your Choices{"\n"}</CustomText>
                        • Request deletion of your data anytime by contacting support.{"\n"}
                        • Opt out of promotional messages whenever you like.{"\n"}{"\n"}
                        <CustomText style={styles.subHeading}>Contact Us{"\n"}</CustomText>
                        <CustomText>📧 info@mycarbuddy.in</CustomText>
                      </CustomText>
                    </ScrollView>
                  </View>
                </View>
              </Modal>

            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f9ff",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0f2fe",
  },
  primaryChip: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    minHeight: 48,
    justifyContent: "center",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  halfWidth: {
    flex: 1,
    marginRight: 8,
  },
  tipBox: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    marginBottom: 16,
  },
  yearPickerModal: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 16,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  transmissionPickerModal: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 16,
    maxHeight: 300,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  privacySection: {
    marginBottom: 20,
  },
  privacyContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  submitSection: {
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: color.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: color.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
    elevation: 0,
  },
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
    overflow: "hidden",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%", // so it’s scrollable
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    ...globalStyles.f16Bold,
    color: color.secondary,
  },
  modalText: {
    ...globalStyles.f12Regular,
    color: "#555",
    lineHeight: 20,
  },
  subHeading: {
    ...globalStyles.f12Bold,
    marginTop: 10,
    marginBottom: 5,
    color: "#222",
  },
});
