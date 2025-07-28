import React, { use, useEffect, useState } from "react";
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
import { registerForPushNotificationsAsync } from "../../utils/notifications";
import AntDesign from '@expo/vector-icons/AntDesign';
import Logo from '../../../assets/Logo/my car buddy-02 yellow-01.png'
import BgImage from '../../../assets/images/loginbg2.png'

export default function LoginScreen() {
  const { login } = useAuth();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [status, setStatus] = useState("info");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("Login Info");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();


  const handleSendOtp = async () => {
    if (!email) {
      setTitle("Missing Email");
      setMessage("Please enter your email.");
      setStatus("error");
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://api.mycarsbuddy.com/api/Auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email }),
      });

      if (response.ok) {
        setOtpSent(true);
        setTitle("OTP Sent");
        setMessage("Please check your email for the OTP.");
        setStatus("success");
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      setTitle("Send OTP Failed");
      setMessage("Something went wrong." || error.message);
      setStatus("error");
    } finally {
      setShowAlert(true);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setTitle("Missing OTP");
      setMessage("Please enter the OTP.");
      setStatus("error");
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      const DeviceId = Device.osInternalBuildId || Device.osBuildId || "unknown-device-id";

      // const deviceToken = await registerForPushNotificationsAsync();
      const DeviceToken = 'dummy_token';

      const response = await fetch("https://api.mycarsbuddy.com/api/Auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, otp }),
      });

      const result = await response.json();
      console.log("Device Id:", DeviceId);
      console.log("Device Token:", DeviceToken);

      if (response.ok && result?.success) {
        // Store token if needed: result.token
        login({ email: result.email, token: result.token, DeviceToken, DeviceId, });

        // Navigate to home (replace so user can't go back to login)
        navigation.replace("CustomerTabs");

      } else {
        throw new Error(result?.message || "Invalid OTP.");
      }
    } catch (error) {
      setTitle("OTP Verification Failed");
      setMessage(error.message || "Unable to verify OTP.");
      setStatus("error");
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <ImageBackground
      source={BgImage}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {!keyboardVisible && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.replace("CustomerTabs")}
        >
          <View style={styles.skipContent}>
            <CustomText style={styles.skipText}>Skip</CustomText>
            <AntDesign name="doubleright" size={16} color="white" />
          </View>
        </TouchableOpacity>
      )}
      <View />
      <View style={[globalStyles.container]}>
        {!keyboardVisible && (
          <View>
            <Image
              source={Logo}
              style={styles.logo}
            />
          </View>
        )}

        <TextInput
          placeholder="Enter your email"
          placeholderTextColor={color.textInputDark}
          value={email}
          onChangeText={setEmail}
          style={styles.textInput}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {otpSent && (
          <TextInput
            placeholder="Enter OTP"
            placeholderTextColor={color.textInputDark}
            value={otp}
            onChangeText={setOtp}
            style={styles.textInput}
            keyboardType="number-pad"
            maxLength={6}
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={otpSent ? handleVerifyOtp : handleSendOtp}
          disabled={loading}
        >
          <CustomText style={styles.buttonText}>
            {loading ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
          </CustomText>
        </TouchableOpacity>
        {!keyboardVisible && (
          <>
            <View style={[globalStyles.flexrow, globalStyles.alineItemscenter, globalStyles.justifysb, globalStyles.mt1]}>
              <View style={[globalStyles.flexrow, globalStyles.alineItemscenter]}>
                <CustomText style={globalStyles.textWhite}>Create new account? </CustomText>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <CustomText style={globalStyles.textWhite}>Sign Up</CustomText>
                </TouchableOpacity>
              </View>
              <TouchableOpacity>
                <CustomText style={globalStyles.textWhite}>
                  Forgot Password?
                </CustomText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.googleButton}>
              <Ionicons name="logo-google" size={20} color="#000" />
              <CustomText style={styles.googleText}>
                Sign in with Google
              </CustomText>
            </TouchableOpacity>
          </>
        )}
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
    width: 200,
    height: 100,
    marginBottom: 100,
    alignSelf:'center'
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
    borderColor: color.white,
    paddingVertical: 10,
    color: color.white,
    // fontFamily: fonts.regular,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: color.white,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: color.textDark,
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
});
