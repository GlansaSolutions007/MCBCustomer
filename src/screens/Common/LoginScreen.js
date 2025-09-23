import React, { use, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Animated,
  AppState,
  StatusBar,
} from "react-native";
import fonts from "../../styles/fonts";
import { Ionicons } from "@expo/vector-icons";
import globalStyles from "../../styles/globalStyles";
import CustomAlert from "../../components/CustomAlert";
import { demoUsers } from "../../constants/demoUsers";
import { useAuth } from "../../contexts/AuthContext";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import * as Device from "expo-device";
import {
  registerForPushNotificationsAsync,
} from "../../utils/notificationService";
import { saveCustomerPushToken } from "../../utils/notifications";
import { testFirebaseConnection } from "../../utils/firebaseConnectionTest";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AntDesign from "@expo/vector-icons/AntDesign";
import Logo from "../../../assets/Logo/logo2.png";
import BgImage from "../../../assets/images/loginbg5.png";
// import { API_BASE_URL } from "@env";
import { API_URL, API_IMAGE_URL, GOOGLE_MAPS_APIKEY, RAZORPAY_KEY } from "@env";

export default function LoginScreen() {
  // Alert.alert("Debug", `API URL: ${API_URL}`);
  const { login } = useAuth();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [status, setStatus] = useState("info");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("Login Info");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const [mobileFieldFrozen, setMobileFieldFrozen] = useState(false);
  const [otpFromSMS, setOtpFromSMS] = useState("");

  const navigation = useNavigation();

  // Animation refs
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const inputScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const otpInputSlide = useRef(new Animated.Value(50)).current;
  const otpInputOpacity = useRef(new Animated.Value(0)).current;
  const inputFocusScale = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // OTP input refs
  const otpRefs = useRef([]);

  // Helper functions for OTP handling
  const handleOtpChange = (value, index) => {
    // Clean the input - remove any non-numeric characters
    const cleanValue = value.replace(/[^0-9]/g, "");

    // Handle auto-fill scenarios where multiple digits are pasted
    if (cleanValue.length > 1) {
      const digits = cleanValue.split("").slice(0, 6); // Take first 6 digits
      const newOtp = [...otp];

      // Clear all fields first
      for (let i = 0; i < 6; i++) {
        newOtp[i] = "";
      }

      // Fill the OTP array with the pasted digits starting from the current index
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });

      setOtp(newOtp);

      // Focus the last filled input
      const lastFilledIndex = Math.min(index + digits.length - 1, 5);
      if (otpRefs.current[lastFilledIndex]) {
        otpRefs.current[lastFilledIndex].focus();
      }

      // Check if all 6 digits are entered
      if (newOtp.every((digit) => digit !== "")) {
        setMobileFieldFrozen(true);
      }

      return;
    }

    // Handle single digit input
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (cleanValue && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Check if all 6 digits are entered
    if (newOtp.every((digit) => digit !== "") && index === 5) {
      setMobileFieldFrozen(true);
    }
  };

  const handleOtpKeyPress = (key, index) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste events specifically
  const handleOtpPaste = (event, index) => {
    const pastedText = event.nativeEvent.text || "";
    const cleanText = pastedText.replace(/[^0-9]/g, "");

    if (cleanText.length > 0) {
      handleOtpChange(cleanText, index);
    }
  };

  const clearOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setMobileFieldFrozen(false);
    otpRefs.current[0]?.focus();
  };

  const handleEditMobileNumber = () => {
    // Reset all OTP-related states
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setMobileFieldFrozen(false);
    setResendDisabled(true);
    setTimer(0);
    setLoginId(""); // Clear the mobile number

    // Animate OTP input out
    Animated.parallel([
      Animated.timing(otpInputSlide, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(otpInputOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getOtpString = () => {
    return otp.join("");
  };

  // Function to extract OTP from SMS text
  const extractOTPFromSMS = (smsText) => {
    // Common OTP patterns
    const otpPatterns = [
      /(\d{6})/, // 6 digit OTP
      /OTP[:\s]*(\d{6})/i, // OTP: 123456
      /code[:\s]*(\d{6})/i, // code: 123456
      /verification[:\s]*(\d{6})/i, // verification: 123456
      /(\d{4,6})/, // 4-6 digit number
    ];

    for (const pattern of otpPatterns) {
      const match = smsText.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    return null;
  };

  // Function to handle OTP auto-fill
  const handleOTPAutoFill = (otpCode) => {
    if (otpCode && otpCode.length >= 4) {
      const otpArray = otpCode.split("").slice(0, 6); // Take first 6 digits
      const paddedOtp = [...otpArray, ...Array(6 - otpArray.length).fill("")];
      setOtp(paddedOtp);

      // Auto-focus the last filled input
      const lastFilledIndex = otpArray.length - 1;
      if (otpRefs.current[lastFilledIndex]) {
        otpRefs.current[lastFilledIndex].focus();
      }

      // If 6 digits are filled, freeze the mobile field
      if (otpArray.length === 6) {
        setMobileFieldFrozen(true);
      }
    }
  };

  // alert(API_BASE_URL);
  const startResendTimer = () => {
    setTimer(30); // 30 seconds cooldown
    setResendDisabled(true);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!loginId || !/^[6-9]\d{9}$/.test(loginId)) {
      setTitle("Invalid Input");
      setMessage("Please enter a valid 10-digit phone number.");
      setStatus("error");
      setShowAlert(true);
      return;
    }

    setLoading(true);

    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const response = await fetch(`${API_URL}Auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: loginId }),
      });

      if (response.ok) {
        setOtpSent(true);
        clearOtp(); // Clear OTP fields when sending new OTP
        setTitle("OTP Sent");
        setMessage("Your OTP is on its way, check your phone!");
        setStatus("success");
        startResendTimer();

        // Animate OTP input appearance
        Animated.parallel([
          Animated.timing(otpInputSlide, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(otpInputOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Auto-focus the first OTP input after animation completes
          setTimeout(() => {
            if (otpRefs.current[0]) {
              otpRefs.current[0].focus();
            }
          }, 100); // Small delay to ensure the input is fully rendered
        });
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      console.log("error:", error.message);

      setTitle("Send OTP Failed");
      setMessage(error.message.message || "Unable to send OTP.");
      setStatus("error");
    } finally {
      setShowAlert(true);
      setLoading(false);
    }
  };


  const OtpVerify = async () => {
    const otpString = getOtpString();
    if (!otpString || otpString.length !== 6) {
      setTitle("Missing OTP");
      setMessage("Please enter the complete 6-digit OTP.");
      setStatus("error");
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      const DeviceId =
        Device.osInternalBuildId || Device.osBuildId || "unknown-device-id";
      const tokens = await registerForPushNotificationsAsync();
      const DeviceToken =
        tokens.fcmToken || tokens.expoPushToken || "unknown-token";

      // ✅ Use axios instead of fetch
      const response = await axios.post(`${API_URL}Auth/verify-otp`, {
        loginId,
        otp: otpString,
        deviceToken: DeviceToken,
        deviceId: DeviceId,
      });

      const result = response.data; // ✅ Axios gives parsed JSON here
      console.log("result:HJHASA", result);

      if (result?.success) {
        

        // Save FCM and Expo tokens to Firebase and backend API
        try {
          if (result?.custID !== 0 && tokens) {
            console.log('🔔 Registering push tokens for customer (demo):', result.custID);
            console.log('📱 Tokens received:', tokens);

            // 1. Save tokens to Firebase database
            await saveCustomerPushToken(result.custID, tokens);

            // 2. Register with backend API
            await axios.post(`${API_URL}Push/register`, {
              userRole: "customer",
              userId: Number(result.custID),
              fcmToken: tokens.fcmToken || null,
              expoToken: tokens.expoPushToken || null,
              platform: Platform.OS,
            });
            await login({
              token: result.token,
              custID: result.custID,
              name: result.name || "",
              phone: loginId,
              email: result.email || "",
              DeviceToken,
              DeviceId,
            });
            // 3. Save tokens to AsyncStorage for backup
            await AsyncStorage.setItem("pushToken", DeviceToken);
            await AsyncStorage.setItem(
              "pushTokenType",
              tokens.fcmToken
                ? "fcm"
                : tokens.expoPushToken
                ? "expo"
                : "unknown"
            );

            console.log('✅ Push tokens registered successfully to Firebase and backend (demo)');
          }
        } catch (error) {
          // Silent error handling for push notifications
          console.warn('❌ Push notification setup failed (demo):', error.message);
        }

        navigation.replace("CustomerTabs");
      } else {
        throw new Error(result?.message || "Invalid OTP.");
      }
    } catch (error) {
      setTitle("OTP Verification Failed");
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to verify OTP."
      );
      setStatus("error");
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardVisible(true);

        // Animate content up when keyboard appears with subtle bounce
        Animated.sequence([
          Animated.timing(contentTranslateY, {
            toValue: -90, // Move content up by 90px initially
            duration: Platform.OS === "ios" ? 200 : 150,
            useNativeDriver: true,
          }),
          Animated.timing(contentTranslateY, {
            toValue: -80, // Settle at 80px with bounce effect
            duration: Platform.OS === "ios" ? 100 : 80,
            useNativeDriver: true,
          }),
        ]).start();

        Animated.timing(keyboardHeight, {
          toValue: event.endCoordinates.height,
          duration: Platform.OS === "ios" ? 250 : 200,
          useNativeDriver: false,
        }).start();
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);

        // Animate content back to original position with smooth transition
        Animated.parallel([
          Animated.timing(contentTranslateY, {
            toValue: 0,
            duration: Platform.OS === "ios" ? 300 : 250,
            useNativeDriver: true,
          }),
          Animated.timing(keyboardHeight, {
            toValue: 0,
            duration: Platform.OS === "ios" ? 300 : 250,
            useNativeDriver: false,
          }),
        ]).start();
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Show logo immediately on mount
  useEffect(() => {
    setShowLogo(true);
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // OTP Auto-fill effect
  useEffect(() => {
    if (otpFromSMS) {
      handleOTPAutoFill(otpFromSMS);
      setOtpFromSMS(""); // Clear after processing
    }
  }, [otpFromSMS]);

  // Handle app state changes for OTP detection
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active" && otpSent) {
        // When app becomes active and OTP is sent, check for OTP
        // This is a simplified approach - in a real app, you'd use SMS reading APIs
        // For now, we rely on platform auto-fill capabilities
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [otpSent]);

  return (
    <ImageBackground
      source={BgImage}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar
        backgroundColor={Platform.OS === "android" ? "#fff" : undefined}
        barStyle="dark-content"
      />
      {/* {!keyboardVisible && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.replace("CustomerTabs")}
        >
          <View style={styles.skipContent}>
            <CustomText style={styles.skipText}>Skip</CustomText>
            <AntDesign name="doubleright" size={16} color="white" />
          </View>
        </TouchableOpacity>
      )} */}
      <View />
      <Animated.View
        style={[
          globalStyles.container,
          {
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        {/* Logo with animation - always show initially */}
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <Image source={Logo} style={styles.logo} />
        </Animated.View>

        {/* Phone Number Input with +91 prefix */}
        <Animated.View style={{ transform: [{ scale: inputFocusScale }] }}>
          <View style={styles.phoneInputContainer}>
            <View style={styles.prefixContainer}>
              <CustomText style={styles.prefixText}>+91</CustomText>
            </View>
            <TextInput
              placeholder="Enter Your Phone Number"
              placeholderTextColor={color.textInputDark}
              value={loginId}
              onChangeText={setLoginId}
              style={[
                styles.textInputWithPrefix,
                (otpSent || mobileFieldFrozen) && styles.disabledInput,
              ]}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!otpSent && !mobileFieldFrozen}
              maxLength={10}
              onFocus={() => {
                Animated.timing(inputFocusScale, {
                  toValue: 1.02,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
              }}
              onBlur={() => {
                Animated.timing(inputFocusScale, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
              }}
            />
            {/* Edit Mobile Number Button - appears when OTP is sent */}
            {otpSent && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditMobileNumber}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={color.primary}
                />
                <CustomText style={styles.editButtonText}>Edit</CustomText>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* OTP Input with animation - 6 digit boxes */}
        {otpSent && (
          <Animated.View
            style={{
              transform: [{ translateY: otpInputSlide }],
              opacity: otpInputOpacity,
            }}
          >
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (otpRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                    mobileFieldFrozen && styles.otpInputFrozen,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleOtpKeyPress(nativeEvent.key, index)
                  }
                  onPaste={(event) => handleOtpPaste(event, index)}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? 6 : 1} // Allow 6 digits in first field for pasting
                  textAlign="center"
                  selectTextOnFocus
                  textContentType={index === 0 ? "oneTimeCode" : "none"}
                  autoComplete={index === 0 ? "sms-otp" : "off"}
                />
              ))}
            </View>
            <CustomText style={styles.otpLabel}>Enter 6-digit OTP</CustomText>
          </Animated.View>
        )}

        {/* Button with animation */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.button}
            onPress={otpSent ? OtpVerify : handleSendOtp}
            disabled={loading}
          >
            <CustomText style={styles.buttonText}>
              {loading ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
            </CustomText>
          </TouchableOpacity>
        </Animated.View>

        {/* Resend Button */}
        {otpSent && (
          <Animated.View
            style={{
              transform: [{ translateY: otpInputSlide }],
              opacity: otpInputOpacity,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                clearOtp();
                handleSendOtp();
              }}
              disabled={resendDisabled}
              style={[
                styles.resendButton,
                { backgroundColor: resendDisabled ? "#aaa" : color.white },
              ]}
            >
              <CustomText style={styles.resendButtonText}>
                {resendDisabled ? `Resend OTP in ${timer}s` : "Resend OTP"}
              </CustomText>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Footer content - only show when keyboard is not visible */}
        {!keyboardVisible && (
          <>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.alineItemscenter,
                globalStyles.justifysb,
                globalStyles.mt1,
              ]}
            >
              <View
                style={[globalStyles.flexrow, globalStyles.alineItemscenter]}
              >
                {/* <CustomText style={globalStyles.textWhite}>Create new account? </CustomText> */}
                {/* <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <CustomText style={globalStyles.textWhite}>Sign Up</CustomText>
                </TouchableOpacity> */}
              </View>
              {/* <TouchableOpacity>
                <CustomText style={globalStyles.textWhite}>
                  Forgot Password?
                </CustomText>
              </TouchableOpacity> */}
            </View>

            {/* <TouchableOpacity style={styles.googleButton}>
              <Ionicons name="logo-google" size={20} color="#000" />
              <CustomText style={styles.googleText}>
                Sign in with Google
              </CustomText>
            </TouchableOpacity> */}
          </>
        )}
      </Animated.View>

      {/* Powered By Footer - always visible at bottom */}
      <View style={styles.poweredByContainer}>
        <CustomText style={[styles.poweredByText, globalStyles.f10Bold]}>
          Powered By Glansa Solutions PVT LTD
        </CustomText>
      </View>

      {/* Components */}
      <CustomAlert
        visible={showAlert}
        status={status}
        title={title}
        message={message}
        onClose={() => setShowAlert(false)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    // backgroundColor: globalStyles.primary.color,
    flex: 1,
    width: "100%",
    height: "100%",
  },

  logo: {
    width: 250,
    height: 100,
    marginBottom: 100,
    alignSelf: "center",
  },
  skipButton: {
    position: "absolute",
    top: 50, // adjust for safe area
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)", // optional subtle bg
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  skipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButton: {
    marginTop: 40,
    flexDirection: "row",
    backgroundColor: color.white,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: 240,
    gap: 10,
  },
  googleText: {
    // fontFamily: fonts.medium,
    fontSize: 14,
    color: "#000",
  },
  title: {
    // fontFamily: fonts.bold,
    fontSize: 22,
    color: color.white,
  },
  titleBlack: {
    // fontFamily: fonts.bold,
    fontSize: 22,
    color: color.black,
  },
  textInput: {
    borderBottomWidth: 1,
    borderColor: color.black,
    paddingVertical: 10,
    color: color.black,
    // fontFamily: fonts.regular,
    fontSize: 16,
    marginBottom: 20,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: color.black,
    marginBottom: 20,
  },
  prefixContainer: {
    paddingVertical: 10,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: color.black,
    marginRight: 8,
  },
  prefixText: {
    color: color.black,
    fontSize: 16,
    fontWeight: "600",
  },
  textInputWithPrefix: {
    flex: 1,
    paddingVertical: 10,
    color: color.black,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: "rgba(242, 242, 242, 0.3)",
    color: "rgb(53, 53, 53)",
    opacity: 0.6,
  },
  button: {
    backgroundColor: color.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    shadowColor: color.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: color.white,
    // fontFamily: fonts.medium,
    fontSize: 16,
  },

  // Home Screen Styles
  header: {
    backgroundColor: color.primary || "#017F77",
    padding: 20,
  },
  greeting: {
    color: color.white,
    fontSize: 16,
    // fontFamily: fonts.medium,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  location: {
    color: color.white,
    fontSize: 14,
    marginRight: 5,
    // fontFamily: fonts.regular,
  },
  banner: {
    backgroundColor: color.primary || "#017F77",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
  },
  carImage: {
    width: "100%",
    height: 130,
  },
  bannerTitle: {
    fontSize: 22,
    color: color.white,
    // fontFamily: fonts.semiBold,
    marginTop: 10,
  },

  bannerSubtitle: {
    fontSize: 14,
    color: color.white,
    // fontFamily: fonts.regular,
    marginTop: 5,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    // fontFamily: fonts.medium,
    marginVertical: 20,
    marginLeft: 20,
    color: color.textDark,
  },
  services: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: color.lightGreen || "#E0F7F4",
    borderRadius: 10,
    width: "42%",
    overflow: "hidden",
    alignItems: "center",
  },
  cardImage: {
    width: "100%",
    height: 100,
  },
  cardText: {
    fontSize: 14,
    // fontFamily: fonts.medium,
    padding: 10,
    color: color.textDark,
    textAlign: "center",
  },
  ctaContainer: {
    flexDirection: "row",
    borderRadius: 10,
    margin: 20,
    padding: 15,
    alignItems: "center",
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 24,
    width: "60%",
    // fontFamily: fonts.medium,
    color: color.textDark,
    marginBottom: 5,
    lineHeight: 25,
  },
  ctaSubTitle: {
    fontSize: 12,
    // fontFamily: fonts.regular,
    color: color.textLight || "#555",
  },
  ctaImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 10,
  },
  ctaButton: {
    backgroundColor: color.black,
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  ctaButtonText: {
    color: color.white,
    fontSize: 14,
  },
  resendButton: {
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resendButtonText: {
    fontSize: 14,
    color: color.black,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: color.black,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: color.black,
    backgroundColor: color.white,
  },
  otpInputFilled: {
    borderColor: color.primary,
    backgroundColor: "#f0f9ff",
  },
  otpInputFrozen: {
    borderColor: color.primary,
    backgroundColor: "#e0f7f4",
  },
  otpLabel: {
    textAlign: "center",
    fontSize: 14,
    color: color.black,
    marginBottom: 20,
    fontWeight: "500",
  },
  poweredByContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  poweredByText: {
    fontSize: 12,
    color: color.primary,
    textAlign: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: "rgba(1, 127, 119, 0.1)",
    borderWidth: 1,
    borderColor: color.primary,
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    color: color.primary,
    fontWeight: "500",
  },
});
