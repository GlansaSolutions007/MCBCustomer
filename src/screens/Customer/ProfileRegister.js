import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ImageBackground,
  Text,
  ActivityIndicator,
} from "react-native";
import CustomText from "../../components/CustomText";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import * as ImagePicker from "expo-image-picker";
import DefaultProfileImage from "../../../assets/images/profile-user.png";
import axios from "axios";
import CustomAlert from "../../components/CustomAlert";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { API_BASE_URL } from "@env";
import {
  API_URL,
  API_IMAGE_URL,
  GOOGLE_MAPS_APIKEY,
  RAZORPAY_KEY,
} from "../../../apiConfig";

export const ProfileRegister = () => {
  //
  // Alert.alert("Debug", `API URL: ${API_URL}`);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [altPhoneNumber, setAltPhoneNumber] = useState("");
  const [image, setImage] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertStatus, setAlertStatus] = useState("info"); // 'success' | 'error'
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  const [errors, setErrors] = useState({
    firstName: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const userData = await AsyncStorage.getItem("userData");
        const parsedData = JSON.parse(userData);
        const custID = parsedData?.custID;
        // alert(`Customer ID: ${custID}`);
        const response = await axios.get(`${API_URL}Customer/Id?Id=${custID}`);
        const data = response.data[0];
        setFirstName(data.FullName || "");
        setPhoneNumber(data.PhoneNumber || "");
        setAltPhoneNumber(data.AlternateNumber || "");
         setEmail(data.Email && data.Email !== "null" ? data.Email : "");
        setImage(
          data.ProfileImage ? `${API_IMAGE_URL}${data.ProfileImage}` : null
        );
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  const handleUpdateProfile = async () => {
    if (!firstName || !phoneNumber) {
      setErrors({
        firstName: !firstName ? "Name is required" : "",
        phoneNumber: !phoneNumber ? "Phone is required" : "",
        email: "",
      });
      return;
    }

    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;
      const formData = new FormData();

      formData.append("CustID", custID || "");
      formData.append("FullName", firstName || "");
      formData.append("Email", email || "");
      formData.append("PhoneNumber", phoneNumber || "");
      formData.append("AlternateNumber", altPhoneNumber || "");

      if (
        image &&
        (image.startsWith("file://") || image.startsWith("content://"))
      ) {
        formData.append("ProfileImageFile", {
          uri: image,
          name: "profile.jpg",
          type: "image/jpeg",
        });
      }

      const response = await axios.post(
        `${API_URL}Customer/update-customer`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAlertStatus("success");
      setAlertMessage("Profile updated successfully!");
      setIsEditable(false);
    } catch (error) {
      console.error("Profile update error:", error);
      setAlertStatus("error");
      setAlertMessage("Failed to update profile.");
    } finally {
      setAlertVisible(true);
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access photos is required!");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType,

      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={color.primary} />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileImageContainer}>
            <ImageBackground
              source={image ? { uri: image } : DefaultProfileImage}
              style={styles.profileImage}
              imageStyle={{ borderRadius: 60 }}
            >
              {isEditable && (
                <TouchableOpacity
                  style={styles.cameraIcon}
                  onPress={isEditable ? pickImage : null}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </ImageBackground>
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>Full Name</CustomText>
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#999"
              style={styles.textInput}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setErrors((prev) => ({ ...prev, firstName: "" }));
              }}
              editable={isEditable}
            />
            {errors.firstName ? (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>Email</CustomText>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              style={styles.textInput}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              editable={isEditable}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : ''}
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>Phone Number</CustomText>
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor="#999"
              style={styles.textInput}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                setErrors((prev) => ({ ...prev, phoneNumber: "" }));
              }}
              editable={!isEditable}
            />
            {errors.phoneNumber ? (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>
              Additional Phone Number (optional)
            </CustomText>
            <TextInput
              placeholder="Additional Phone Number (optional)"
              placeholderTextColor="#999"
              style={styles.textInput}
              keyboardType="phone-pad"
              value={altPhoneNumber}
              onChangeText={setAltPhoneNumber}
              editable={isEditable}
            />
          </View>

          <View>
            {!isEditable ? (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => setIsEditable(true)}
              >
                <CustomText style={styles.submitText}>Edit</CustomText>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleUpdateProfile}
                >
                  <CustomText style={styles.submitText}>Save</CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: "#ccc", marginTop: 10 },
                  ]}
                  onPress={() => setIsEditable(false)}
                >
                  <CustomText style={[styles.submitText, { color: "#333" }]}>
                    Cancel
                  </CustomText>
                </TouchableOpacity>
              </>
            )}
          </View>

          <CustomAlert
            visible={alertVisible}
            status={alertStatus}
            title={alertStatus === "success" ? "Success" : "Error"}
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#f9f9f9",
  },
  inputGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
  },
  errorText: {
    color: "red",
    marginTop: 4,
    fontSize: 12,
  },
  label: {
    marginBottom: 6,
    color: "#333",
    ...globalStyles.f12Bold,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#000",
  },
  submitButton: {
    backgroundColor: color.secondary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "white",
    ...globalStyles.f12Bold,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: color.secondary,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
  },

  profileImage: {
    width: 120,
    height: 120,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },

  removeIcon: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 2,
  },

  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: color.secondary,
    borderRadius: 20,
    padding: 6,
  },

  imageWrapper: {
    marginTop: 10,
    width: 80,
    height: 80,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  removeIcon: {
    position: "absolute",
    top: -10,
    right: -10,
    borderRadius: 12,
  },
});
