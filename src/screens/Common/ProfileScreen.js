import { React, useState, useEffect, useCallback } from "react";
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import globalStyles from "../../styles/globalStyles";
import { useAuth } from "../../contexts/AuthContext";
import { color } from "../../styles/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, API_IMAGE_URL, GOOGLE_MAPS_APIKEY, RAZORPAY_KEY } from "@env";

export default function ProfileScreen() {
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { logout } = useAuth();

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;
      const response = await axios.get(`${API_URL}Customer/Id?Id=${custID}`);
      const data = response.data[0];
      // console.log('data', data);
      setName(data.FullName);
      setImage(
        data.ProfileImage ? `${API_IMAGE_URL}${data.ProfileImage}` : null
      );
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomerData();
    }, [])
  );

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
      <StatusBar backgroundColor={color.primary} barStyle="light-content" />

      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        <ImageBackground
          source={image ? { uri: image } : DefaultProfileImage}
          style={styles.profileImage}
          imageStyle={{ borderRadius: 60 }}
        ></ImageBackground>
      </View>
      <View style={styles.heading}>
        <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite]}>
          {name}
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
                    Profile Details
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
                onPress={() =>
                  navigation.navigate("CustomerTabNavigator", {
                    screen: "My Cars",
                  })
                }
              >
                <View style={styles.row}>
                  <Ionicons name="car" size={22} color={color.primary} />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    My Cars
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
                onPress={() => navigation.navigate("NotificationSettings")}
              >
                <View style={styles.row}>
                  <Ionicons
                    name="notifications"
                    size={22}
                    color={color.primary}
                  />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Notifications Settings
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
              <TouchableOpacity
                style={styles.eachTouchable}
                onPress={() =>
                  navigation.navigate("CustomerTabNavigator", {
                    screen: "My Bookings",
                  })
                }
              >
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
                    Invoice list{" "}
                    <CustomText
                      style={[globalStyles.f10Medium, { color: "red" }]}
                    >
                      (Coming Soon)
                    </CustomText>
                  </CustomText>
                </View>
                {/* <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={color.primary}
                /> */}
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
              {/* <View style={styles.divider} /> */}
            </View>
            {/* <View style={styles.profileDetails}>
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
            </View> */}
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: color.alertError }]}
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
    backgroundColor: color.primary,
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
    padding: 3,
    borderRadius: 70,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    color: "#333",
  },
});
