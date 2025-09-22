import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL, RC_CHECK_URL, RC_CHECK_TOKEN } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../../utils/token";
import CustomAlert from "../../components/CustomAlert";

const RcVerification = () => {
  const navigation = useNavigation();
  const [rcNumber, setRcNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [error, setError] = useState("");
  const [carModels, setCarModels] = useState([]);
  const [carFuelType, setCarFuelType] = useState("");

  // const validateRcNumber = (rc) => {
  //   // Basic validation for Indian RC number format
  //   const rcPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
  //   return rcPattern.test(rc.toUpperCase());
  // };

  const mockData = {
    valid: true,
    status: "ACTIVE",
    registered: "04-11-2024",
    owner: "ERUMALLA PRADEEP",
    masked: null,
    ownerNumber: "1",
    father: null,
    currentAddress:
      "H NO:2-104,KATTALINGAMPETA,MALLIAL,VEMULAWADA,RAJANNA,CHANDURTHY,505307",
    permanentAddress:
      "H NO:2-104,KATTALINGAMPETA,MALLIAL,VEMULAWADA,RAJANNA,CHANDURTHY,505307",
    mobile: null,
    category: "LMV",
    categoryDescription: "Motor Car(LMV)",
    chassisNumber: "MBHZCDESKRH169194",
    engineNumber: "Z12EP1069172",
    makerDescription: "MARUTI SUZUKI INDIA LTD",
    makerModel: "MARUTI SWIFT VXI 1.2L ISS 5MT",
    makerVariant: null,
    bodyType: "30",
    fuelType: "PETROL",
    colorType: "LUSTER BLUE",
    normsType: "Not Available",
    fitnessUpto: "03-11-2039",
    financed: true,
    lender: "ICICI BANK LTD",
    insuranceProvider: "LIBERTY GENERAL INSURANCE LIMITED",
    insurancePolicyNumber: "201150010124850229800000",
    insuranceUpto: "25-10-2027",
    manufactured: "08/2024",
    rto: "RTA RAJANNA, TELANGANA",
    cubicCapacity: "1197.00",
    grossWeight: "1355",
    wheelBase: "2450",
    unladenWeight: "760",
    cylinders: "3",
    seatingCapacity: "5",
    sleepingCapacity: "0",
    standingCapacity: "0",
    pollutionCertificateNumber: null,
    pollutionCertificateUpto: null,
    permitNumber: null,
    permitIssued: "NA",
    permitFrom: "NA",
    permitUpto: "NA",
    permitType: null,
    taxUpto: "LTT",
    taxPaidUpto: "LTT",
    nationalPermitNumber: null,
    nationalPermitIssued: null,
    nationalPermitFrom: null,
    nationalPermitUpto: null,
    blacklistStatus: null,
    nocDetails: null,
    challanDetails: null,
    nationalPermitIssuedBy: null,
    commercial: false,
    exShowroomPrice: null,
    nonUseStatus: null,
    nonUseFrom: null,
    nonUseTo: null,
    blacklistDetails: null,
  };

  // setCarFuelType(mockData.fuelType);
  // setCarModels(mockData.makerModel);
  
  // console.log("Mock Data:", mockData.makerModel); // PETROL
  

  const fetchFuelTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}FuelTypes/GetFuelTypes`);
      const json = response.data;

      if (json.status && Array.isArray(json.data)) {
        const activeFuelTypes = json.data.filter((f) => f.IsActive);
        const fuelList = activeFuelTypes.map((f) => ({
          id: f.FuelTypeID,
          name: f.FuelTypeName,
        }));
        
        console.log("Fuel List:", fuelList);
        setFuelTypes(activeFuelTypes);
        console.log("Fuel Types:", activeFuelTypes);
      } else {
        console.warn("Failed to load fuel types.");
      }
    } catch (error) {
      console.error("Error fetching fuel types:", error);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  useEffect(() => {
    fetchFuelTypes();
  }, []);

  const handleVerifyRc = async () => {
    if (!rcNumber.trim()) {
      setError("Please enter RC number");
      return;
    }

    // if (!validateRcNumber(rcNumber)) {
    //   setError("Please enter a valid RC number (e.g., TS15FH4090)");
    //   return;
    // }

    setError("");
    setLoading(true);
    setVerificationResult(null);

    try {
      const response = await axios.post(
        RC_CHECK_URL,
        {
          reg: rcNumber.toUpperCase(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: RC_CHECK_TOKEN,
          },
        }
      );

      console.log("RC Verification Response:", response.data);
      if (response.data && response.data.valid) {
        setVerificationResult({
          status: "success",
          data: response.data,
        });
      } else {
        setVerificationResult({
          status: "failed",
          message: "Invalid RC number",
        });
      }
    } catch (error) {
      console.error("RC Verification Error:", error);
      setError("Failed to verify RC number. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = async () => {
    if (verificationResult && verificationResult.status === "success") {
      navigation.navigate("MyCarDetails", {
        rcData: verificationResult.data,
        rcNumber: rcNumber.toUpperCase(),
      });
    }

    let hasError = false;

    // if (!rcNumber.trim()) {
    //   setVehicleNumberError("Registration number is required");
    //   hasError = true;
    // } else if (!validateVehicleNumber(vehicleNumber)) {
    //   setVehicleNumberError("Use A–Z and 0–9 only, 6–12 chars, include letters and numbers");
    //   hasError = true;
    // }

    // if (!transmission.trim()) {
    //   setTransmissionError(true);
    //   hasError = true;
    // }

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
        vehicleNumber: rcNumber,
        yearOfPurchase: data.registered || "",
        // engineType: engineType,
        // kilometersDriven: kilometersDriven,
        // transmissionType: transmission,
        createdBy: custID,
        // brandID: brandId,
        // modelID: modelId,
        // fuelTypeID: fuelId,
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

  const renderVerificationResult = () => {
    if (!verificationResult) return null;

    const { status, data, message } = verificationResult;

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Ionicons
            name={status === "success" ? "checkmark-circle" : "close-circle"}
            size={24}
            color={status === "success" ? color.alertSuccess : color.alertError}
          />
          <CustomText
            style={[
              globalStyles.f14Bold,
              {
                color:
                  status === "success" ? color.alertSuccess : color.alertError,
              },
            ]}
          >
            {status === "success"
              ? "RC Verified Successfully"
              : "Verification Failed"}
          </CustomText>
        </View>

        {status === "success" && data ? (
          <View style={styles.vehicleDetails}>
            <CustomText
              style={[
                globalStyles.f12Bold,
                globalStyles.textBlack,
                styles.sectionTitle,
              ]}
            >
              Vehicle Details
            </CustomText>

            <View style={styles.detailRow}>
              <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>
                Registration Number:
              </CustomText>
              <CustomText
                style={[globalStyles.f12Bold, globalStyles.textBlack]}
              >
                {data.reg_no || rcNumber}
              </CustomText>
            </View>
            {data.registered && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Year of Registration:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.registered}
                </CustomText>
              </View>
            )}

            {data.owner && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Owner Name:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.owner}
                </CustomText>
              </View>
            )}

            {/* {data.engineNumber && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Vehicle Class:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.engineNumber}
                </CustomText>
              </View>
            )}

            {data.manufacturer && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Manufacturer:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.manufacturer}
                </CustomText>
              </View>
            )} */}

            {data.makerModel && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Model:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.makerModel}
                </CustomText>
              </View>
            )}

            {data.fuelType && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Fuel Type:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.fuelType}
                </CustomText>
              </View>
            )}

            {data.engine_no && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Engine Number:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.engine_no}
                </CustomText>
              </View>
            )}

            {data.chassis_no && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Chassis Number:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.chassis_no}
                </CustomText>
              </View>
            )}

            {data.registration_date && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Registration Date:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.registration_date}
                </CustomText>
              </View>
            )}

            {data.fitness_upto && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Fitness Valid Until:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.fitness_upto}
                </CustomText>
              </View>
            )}

            {data.insurance_upto && (
              <View style={styles.detailRow}>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textGray]}
                >
                  Insurance Valid Until:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {data.insurance_upto}
                </CustomText>
              </View>
            )}

            <TouchableOpacity
              style={[styles.addCarButton, { backgroundColor: color.primary }]}
              onPress={handleAddCar}
            >
              <CustomText
                style={[globalStyles.f14Bold, { color: color.white }]}
              >
                Add This Car
              </CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>
              {message ||
                "Unable to verify RC number. Please check the number and try again."}
            </CustomText>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={Platform.OS === "android" ? color.white : undefined}
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={color.textDark} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <CustomText style={[globalStyles.f16Bold, globalStyles.textBlack]}>
            RC Verification
          </CustomText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color={color.primary} />
          <View style={styles.instructionText}>
            <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>
              Verify Your Vehicle
            </CustomText>
            <CustomText style={[globalStyles.f10Bold, globalStyles.textGray]}>
              Enter your vehicle's registration number to automatically fetch
              vehicle details
            </CustomText>
          </View>
        </View>

        {/* RC Number Input */}
        <View style={styles.inputContainer}>
          <CustomText
            style={[globalStyles.f12Bold, globalStyles.textBlack, styles.label]}
          >
            Registration Number
          </CustomText>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            // value={rcNumber}
            onChangeText={(text) => {
              setRcNumber(text.toUpperCase());
              setError("");
              setVerificationResult(null);
            }}
            placeholder="Enter RC number (e.g., TS15FH4090)"
            placeholderTextColor={color.textLight}
            autoCapitalize="characters"
            maxLength={10}
          />
          {error ? (
            <CustomText
              style={[globalStyles.f10Bold, { color: color.alertError }]}
            >
              {error}
            </CustomText>
          ) : null}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            { backgroundColor: loading ? color.neutral[300] : color.primary },
          ]}
          onPress={handleVerifyRc}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={color.white} size="small" />
          ) : (
            <>
              <Ionicons name="search" size={20} color={color.white} />
              <CustomText
                style={[
                  globalStyles.f14Bold,
                  { color: color.white, marginLeft: 8 },
                ]}
              >
                Verify RC Number
              </CustomText>
            </>
          )}
        </TouchableOpacity>

        {/* Verification Result */}
        {renderVerificationResult()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: color.white,
    borderBottomWidth: 1,
    borderBottomColor: color.neutral[100],
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionCard: {
    flexDirection: "row",
    backgroundColor: color.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  instructionText: {
    flex: 1,
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: color.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: color.white,
    color: color.textDark,
  },
  inputError: {
    borderColor: color.alertError,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: color.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    marginBottom: 15,
    color: color.primary,
  },
  vehicleDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.neutral[100],
  },
  errorContainer: {
    padding: 15,
    backgroundColor: color.backgroundLight,
    borderRadius: 8,
    marginTop: 10,
  },
  addCarButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
});

export default RcVerification;
