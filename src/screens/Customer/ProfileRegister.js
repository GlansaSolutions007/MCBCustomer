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
  StatusBar,
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
import { API_URL, API_IMAGE_URL } from "@env";

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
        <StatusBar
          backgroundColor={Platform.OS === "android" ? "#fff" : undefined}
          barStyle="dark-content"
        />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileImageContainer}>
            {image ? (
              <ImageBackground
                source={image ? { uri: image } : DefaultProfileImage}
                style={styles.profileImage}
                imageStyle={{ borderRadius: 60 }}
              >
                {isEditable && (
                  <TouchableOpacity
                    style={styles.cameraIcon}
                    onPress={pickImage}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </ImageBackground>
            ) : (
              <View style={styles.profileImage}>
                <Ionicons name="person-circle" size={120} color={color.primary} />
                {isEditable && (
                  <TouchableOpacity
                    style={styles.cameraIcon}
                    onPress={pickImage}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.headerText}>
            <CustomText style={[globalStyles.f20Bold, { color: "#111" }]}>
              {firstName || "Your Name"}
            </CustomText>
            <CustomText
              style={[globalStyles.f12Regular, { color: "#666", marginTop: 4 }]}
            >
              {isEditable ? "Editing enabled" : "View and manage your profile"}
            </CustomText>
          </View>

          {!isEditable && (
            <View style={styles.inlineEditWrap}>
              <TouchableOpacity
                style={styles.inlineEditBtn}
                onPress={() => setIsEditable(true)}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={color.secondary}
                />
                <CustomText
                  style={[
                    globalStyles.f12Bold,
                    { color: color.secondary, marginLeft: 6 },
                  ]}
                >
                  Edit
                </CustomText>
              </TouchableOpacity>
            </View>
          )}

          <CustomText
            style={[globalStyles.f12Bold, { color: "#555", marginBottom: 6 }]}
          >
            Full Name
          </CustomText>
          <View style={styles.card}>
            {isEditable ? (
              <View>
                <TextInput
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  style={[styles.textInput, styles.textInputEditable]}
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    setErrors((prev) => ({ ...prev, firstName: "" }));
                  }}
                  editable={true}
                />
                {errors.firstName ? (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.valueCard}>
                <View style={styles.valueIconCircle}>
                  <Ionicons name="person" size={18} color={color.primary} />
                </View>
                <View style={styles.valueTexts}>
                  <CustomText
                    style={[globalStyles.f16Medium, { color: "#111" }]}
                  >
                    {firstName || "Not set"}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f10Regular, { color: "#777" }]}
                  >
                    Your display name
                  </CustomText>
                </View>
              </View>
            )}
          </View>

          <CustomText
            style={[globalStyles.f12Bold, { color: "#555", marginBottom: 6 }]}
          >
            Email
          </CustomText>
          <View style={styles.card}>
            {isEditable ? (
              <View>
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  style={[styles.textInput, styles.textInputEditable]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  editable={true}
                />
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : (
                  ""
                )}
              </View>
            ) : (
              <View style={styles.valueCard}>
                <View style={styles.valueIconCircle}>
                  <Ionicons name="mail" size={18} color={color.primary} />
                </View>
                <View style={styles.valueTexts}>
                  <CustomText
                    style={[globalStyles.f16Medium, { color: "#111" }]}
                  >
                    {email || "Not set"}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f10Regular, { color: "#777" }]}
                  >
                    Primary email
                  </CustomText>
                </View>
              </View>
            )}
          </View>

          <CustomText
            style={[globalStyles.f12Bold, { color: "#555", marginBottom: 6 }]}
          >
            Phone Number
          </CustomText>
          <View style={styles.card}>
            {isEditable ? (
              <View>
                <TextInput
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  style={[styles.textInput, styles.textInputEditable]}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                  }}
                  editable={false}
                />
                {errors.phoneNumber ? (
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.valueCard}>
                <View style={styles.valueIconCircle}>
                  <Ionicons name="call" size={18} color={color.primary} />
                </View>
                <View style={styles.valueTexts}>
                  <CustomText
                    style={[globalStyles.f16Medium, { color: "#111" }]}
                  >
                    {phoneNumber || "Not set"}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f10Regular, { color: "#777" }]}
                  >
                    Registered number
                  </CustomText>
                </View>
              </View>
            )}
          </View>

          <CustomText
            style={[globalStyles.f12Bold, { color: "#555", marginBottom: 6 }]}
          >
            Alternate Number
          </CustomText>
          <View style={styles.card}>
            {isEditable ? (
              <TextInput
                placeholder="Enter alternate phone (optional)"
                placeholderTextColor="#999"
                style={[styles.textInput, styles.textInputEditable]}
                keyboardType="phone-pad"
                value={altPhoneNumber}
                onChangeText={setAltPhoneNumber}
                editable={true}
              />
            ) : (
              <View style={styles.valueCard}>
                <View style={styles.valueIconCircle}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={color.primary}
                  />
                </View>
                <View style={styles.valueTexts}>
                  <CustomText
                    style={[globalStyles.f16Medium, { color: "#111" }]}
                  >
                    {altPhoneNumber || "Not provided"}
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f10Regular, { color: "#777" }]}
                  >
                    Alternate contact
                  </CustomText>
                </View>
              </View>
            )}
          </View>

          {!isEditable ? (
            <View style={styles.buttonsRow}>
              {/* <TouchableOpacity style={styles.buttonPrimary} onPress={() => setIsEditable(true)}>
                <CustomText style={[globalStyles.f12Bold, { color: "#fff" }]}>Edit Profile</CustomText>
              </TouchableOpacity> */}
            </View>
          ) : (
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={handleUpdateProfile}
              >
                <CustomText style={[globalStyles.f12Bold, { color: "#fff" }]}>
                  Save
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={() => setIsEditable(false)}
              >
                <CustomText style={[globalStyles.f12Bold, { color: "#333" }]}>
                  Cancel
                </CustomText>
              </TouchableOpacity>
            </View>
          )}

          <CustomAlert
            visible={alertVisible}
            status={alertStatus}
            title={alertStatus === "success" ? "Success" : "Error"}
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
          />
        </ScrollView>
        {/* Floating edit toggle */}
        {/* <View pointerEvents="box-none" style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setIsEditable((prev) => !prev)}
            activeOpacity={0.85}
          >
            <Ionicons name={isEditable ? "eye-outline" : "create-outline"} size={22} color="#fff" />
          </TouchableOpacity>
        </View> */}
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
  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: color.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  headerText: {
    alignItems: "center",
    marginBottom: 12,
  },
  inlineEditWrap: {
    alignItems: "center",
    marginBottom: 10,
  },
  inlineEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF7FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
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
    ...globalStyles.f12Regular,
    color: "#000",
  },
  textInputEditable: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#fff",
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: color.secondary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: "#E9ECEF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  valueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  valueIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  valueTexts: {
    flex: 1,
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
    marginBottom: 10,
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
    right: 10,
    backgroundColor: color.black,
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
