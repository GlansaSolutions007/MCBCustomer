import { React, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ImageBackground,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "../../components/CustomText";
import DefaultProfileImage from "../../../assets/images/profile-user.png";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import globalStyles from "../../styles/globalStyles";
import { useAuth } from "../../contexts/AuthContext";
import { color } from "../../styles/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  API_URL,
  API_IMAGE_URL,
  GOOGLE_MAPS_APIKEY,
  RAZORPAY_KEY,
} from "../../../apiConfig";

export default function ProfileScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const navigation = useNavigation();
  const { logout } = useAuth();

  const handleRegister = () => {
    navigation.navigate("ProfileRegister");
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        <ImageBackground
          source={image ? { uri: image } : DefaultProfileImage}
          style={styles.profileImage}
          imageStyle={{ borderRadius: 60 }}
        >
          {/* <TouchableOpacity style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity> */}
        </ImageBackground>
      </View>
      <View style={styles.heading}>
        <CustomText style={[globalStyles.f20Bold, globalStyles.textBlack]}>
          Vishal Kattera
        </CustomText>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}

        {/* Profile Information */}
        <View style={styles.signleCard}>
          <CustomText style={[globalStyles.f12Bold, globalStyles.mb2]}>
            Profile Info
          </CustomText>
          <View style={styles.profileCard}>
            <View style={styles.profileDetails}>
              <TouchableOpacity
                style={styles.eachTouchable}
                onPress={() => navigation.navigate("ProfileRegister")}
              >
                <View style={styles.row}>
                  <Ionicons name="settings" size={22} color={color.primary} />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Profile Setting
                  </CustomText>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={color.primary}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
            </View>
            <View style={styles.profileDetails}>
              <TouchableOpacity
                style={styles.eachTouchable}
                onPress={() => navigation.navigate("MyCarsList")}
              >
                <View style={styles.row}>
                  <Ionicons name="car" size={22} color={color.primary} />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Your Cars
                  </CustomText>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={color.primary}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
            </View>
            <View style={styles.profileDetails}>
              <TouchableOpacity
                style={styles.eachTouchable}
                onPress={() => navigation.navigate("AddressList")}
              >
                <View style={styles.row}>
                  <Ionicons name="location" size={22} color={color.primary} />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Addresses
                  </CustomText>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={color.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* General Information */}
        <View style={styles.signleCard}>
          <CustomText style={[globalStyles.f12Bold, globalStyles.mb2]}>
            General
          </CustomText>
          <View style={styles.profileCard}>
            <View style={styles.profileDetails}>
              <TouchableOpacity style={styles.eachTouchable}>
                <View style={styles.row}>
                  <Ionicons name="calendar" size={22} color={color.primary} />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Bookings List
                  </CustomText>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={color.primary}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
            </View>
            <View style={styles.profileDetails}>
              <TouchableOpacity style={styles.eachTouchable}>
                <View style={styles.row}>
                  <Ionicons name="wallet" size={22} color={color.primary} />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Invoice list
                  </CustomText>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={color.primary}
                />
              </TouchableOpacity>
              {/* <View style={styles.divider} /> */}
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.signleCard}>
          <CustomText style={[globalStyles.f12Bold, globalStyles.mb2]}>
            App Info
          </CustomText>
          <View style={styles.profileCard}>
            <View style={styles.profileDetails}>
              <TouchableOpacity
                style={styles.eachTouchable}
                onPress={() => navigation.navigate("PrivacyPolicy")}
              >
                <View style={styles.row}>
                  <Ionicons
                    name="alert-circle"
                    size={22}
                    color={color.primary}
                  />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Privacy Policy
                  </CustomText>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={color.primary}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
            </View>
            <View style={styles.profileDetails}>
              <TouchableOpacity
                style={styles.eachTouchable}
                onPress={() => navigation.navigate("TermsConditions")}
              >
                <View style={styles.row}>
                  <Ionicons
                    name="alert-circle"
                    size={22}
                    color={color.primary}
                  />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Terms & Conditions
                  </CustomText>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={color.primary}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
            </View>
            <View style={styles.profileDetails}>
              <TouchableOpacity
                style={styles.eachTouchable}
                onPress={() => navigation.navigate("RefundPolicy")}
              >
                <View style={styles.row}>
                  <Ionicons
                    name="alert-circle"
                    size={22}
                    color={color.primary}
                  />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Refund Policy
                  </CustomText>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={color.primary}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
            </View>
            <View style={styles.profileDetails}>
              <TouchableOpacity style={styles.eachTouchable}>
                <View style={styles.row}>
                  <Ionicons
                    name="logo-android"
                    size={22}
                    color={color.primary}
                  />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    About App
                  </CustomText>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={color.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: "#FF3333" }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
            <CustomText style={[styles.cardText, { color: "white" }]}>
              Logout
            </CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    backgroundColor: color.backgroundLight,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40, // extra space at bottom
    backgroundColor: "#f9f9f9",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  heading: {
    marginBottom: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    gap: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    padding: 16,
    borderRadius: 12,
  },
  cardText: {
    ...globalStyles.f12Bold,
    marginLeft: 12,
  },
  profileImageContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
    // borderBottomLeftRadius:20,
    // borderBottomRightRadius:20,
  },
  profileImage: {
    width: 120,
    height: 120,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: color.secondary,
    borderRadius: 20,
    padding: 6,
  },
  signleCard: {
    marginBottom: 20,
  },
  profileCard: {
    padding: 8,
    borderColor: "#dadadaff",
    borderWidth: 1,
    borderRadius: 12,
  },
  divider: {
    borderBottomColor: "#ededed",
    borderBottomWidth: 1,
    marginVertical: 3,
  },
  eachTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  touchableText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
});
