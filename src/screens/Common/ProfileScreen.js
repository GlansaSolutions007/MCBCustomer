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
import { API_URL, API_IMAGE_URL } from "@env";
import NoInternetScreen from "./NoInternetScreen";
import testNotificationUtils from "../../utils/notificationTestUtils";

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

  // FCM testing functions
  const testFCMTokenGeneration = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;
      const tokens = await testNotificationUtils.testFCMTokenGeneration();
      if (tokens) {
        alert(`FCM Test Results:\nExpo Token: ${tokens.expoPushToken ? '✅ Generated' : '❌ Null'}\nFCM Token: ${tokens.fcmToken ? '✅ Generated' : '❌ Null'}`);
      } else {
        alert('❌ FCM token generation failed');
      }
    } catch (e) {
      console.log('FCM token test error:', e);
      alert(`FCM test failed: ${e?.message || 'Unknown error'}`);
    }
  };

  const testTokenSaving = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;
      const result = await testNotificationUtils.testTokenSaving(custID);
      if (result) {
        alert('✅ Tokens saved to Firebase successfully!');
      } else {
        alert('❌ Token saving failed');
      }
    } catch (e) {
      console.log('Token saving test error:', e);
      alert(`Token saving test failed: ${e?.message || 'Unknown error'}`);
    }
  };

  const testFirebaseNotification = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;
      const result = await testNotificationUtils.testFirebaseNotification(custID);
      if (result) {
        alert('✅ Firebase notification test successful!');
      } else {
        alert('❌ Firebase notification test failed');
      }
    } catch (e) {
      console.log('Firebase notification test error:', e);
      alert(`Firebase notification test failed: ${e?.message || 'Unknown error'}`);
    }
  };

  const runAllFCMTests = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;
      const results = await testNotificationUtils.runAllTests(custID);
      alert(`🧪 FCM Test Results:\nPermissions: ${results.permissions ? '✅' : '❌'}\nToken Generation: ${results.tokenGeneration ? '✅' : '❌'}\nToken Saving: ${results.tokenSaving ? '✅' : '❌'}\nFirebase Notification: ${results.firebaseNotification ? '✅' : '❌'}`);
    } catch (e) {
      console.log('All FCM tests error:', e);
      alert(`All FCM tests failed: ${e?.message || 'Unknown error'}`);
    }
  };

  const SkeletonLoader = () => (
    <View >
      {/* Profile Image Placeholder */}
      <View style={styles.profileImageContainer}>
        <View style={[styles.profileImage, { backgroundColor: '#e0e0e0', borderRadius: 60 }]} />
      </View>
      {/* Name Placeholder */}
      <View style={styles.heading}>
        <View style={{ backgroundColor: '#e0e0e0', height: 24, width: '50%', borderRadius: 4 }} />
      </View>
      {/* Profile Info Section Placeholder */}
      <View style={styles.signleCard}>
        <View style={{ backgroundColor: '#e0e0e0', height: 16, width: '30%', borderRadius: 4, marginBottom: 8 }} />
        <View style={styles.profileCard}>
          {[1, 2, 3].map((_, index) => (
            <View key={`profile-${index}`} style={styles.profileDetails}>
              <View style={styles.eachTouchable}>
                <View style={styles.row}>
                  <View style={{ backgroundColor: '#e0e0e0', width: 22, height: 22, borderRadius: 4 }} />
                  <View style={{ backgroundColor: '#e0e0e0', height: 18, width: '60%', borderRadius: 4, marginLeft: 10 }} />
                </View>
                <View style={{ backgroundColor: '#e0e0e0', width: 20, height: 20, borderRadius: 4 }} />
              </View>
              {index < 2 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>
      {/* General Section Placeholder */}
      <View style={styles.signleCard}>
        <View style={{ backgroundColor: '#e0e0e0', height: 16, width: '30%', borderRadius: 4, marginBottom: 8 }} />
        <View style={styles.profileCard}>
          {[1, 2].map((_, index) => (
            <View key={`general-${index}`} style={styles.profileDetails}>
              <View style={styles.eachTouchable}>
                <View style={styles.row}>
                  <View style={{ backgroundColor: '#e0e0e0', width: 22, height: 22, borderRadius: 4 }} />
                  <View style={{ backgroundColor: '#e0e0e0', height: 18, width: '60%', borderRadius: 4, marginLeft: 10 }} />
                </View>
                <View style={{ backgroundColor: '#e0e0e0', width: 20, height: 20, borderRadius: 4 }} />
              </View>
              {index < 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>
      {/* App Info Section Placeholder */}
      <View style={styles.signleCard}>
        <View style={{ backgroundColor: '#e0e0e0', height: 16, width: '30%', borderRadius: 4, marginBottom: 8 }} />
        <View style={styles.profileCard}>
          {[1, 2, 3].map((_, index) => (
            <View key={`app-info-${index}`} style={styles.profileDetails}>
              <View style={styles.eachTouchable}>
                <View style={styles.row}>
                  <View style={{ backgroundColor: '#e0e0e0', width: 22, height: 22, borderRadius: 4 }} />
                  <View style={{ backgroundColor: '#e0e0e0', height: 18, width: '60%', borderRadius: 4, marginLeft: 10 }} />
                </View>
                <View style={{ backgroundColor: '#e0e0e0', width: 20, height: 20, borderRadius: 4 }} />
              </View>
              {index < 2 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>
      {/* Logout Button Placeholder */}
      <View style={styles.cardContainer}>
        <View style={[styles.card, { backgroundColor: '#e0e0e0' }]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar backgroundColor={color.primary} barStyle="light-content" />
      {loading ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonLoader />
        </ScrollView>
      ) : (
        <>
          <View style={styles.profileImageContainer}>
            <ImageBackground
              source={image ? { uri: image } : DefaultProfileImage}
              style={styles.profileImage}
              imageStyle={{ borderRadius: 60 }}
            ></ImageBackground>
          </View>
          <View style={styles.heading}>
            <CustomText style={[globalStyles.f20Bold, globalStyles.textWhite]}>
              {name || "Hey Buddy"}
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
                {/* <View style={styles.profileDetails}>
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
            </View> */}
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
                  <TouchableOpacity
                    style={styles.eachTouchable}
                    onPress={() => navigation.navigate("InvoiceList")}
                  >
                    <View style={styles.row}>
                      <Ionicons name="wallet" size={22} color={color.primary} />
                      <CustomText
                        style={[styles.touchableText, globalStyles.f16Medium]}
                      >
                        Invoice List
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

            {/* FCM Testing Section */}
            {/* <View style={styles.signleCard}>
          <CustomText style={[globalStyles.f12Bold, globalStyles.mb2]}>
            FCM Testing
          </CustomText>
          <View style={styles.profileCard}>
            <View style={styles.profileDetails}>
              <TouchableOpacity
                style={styles.eachTouchable}
                onPress={testFCMTokenGeneration}
              >
                <View style={styles.row}>
                  <Ionicons name="key" size={22} color={color.primary} />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Test FCM Token Generation
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
                onPress={testTokenSaving}
              >
                <View style={styles.row}>
                  <Ionicons name="cloud-upload" size={22} color={color.primary} />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Test Token Saving
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
                onPress={testFirebaseNotification}
              >
                <View style={styles.row}>
                  <Ionicons name="notifications" size={22} color={color.primary} />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Test Firebase Notification
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
                onPress={runAllFCMTests}
              >
                <View style={styles.row}>
                  <Ionicons name="flask" size={22} color={color.primary} />
                  <CustomText
                    style={[styles.touchableText, globalStyles.f16Medium]}
                  >
                    Run All FCM Tests
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
        </View> */}

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
        </>
      )
      }
    </SafeAreaView >
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
