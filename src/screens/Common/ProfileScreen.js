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
import CustomAlert from "../../components/CustomAlert";
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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import testNotificationUtils from "../../utils/notificationTestUtils";

export default function ProfileScreen() {
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
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

  const handleLogout = () => {
    setShowLogoutAlert(true);
  };

  const confirmLogout = async () => {
    setShowLogoutAlert(false);
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
      // const tokens = await testNotificationUtils.testFCMTokenGeneration();
      // if (tokens) {
      //   alert(`FCM Test Results:\nExpo Token: ${tokens.expoPushToken ? '✅ Generated' : '❌ Null'}\nFCM Token: ${tokens.fcmToken ? '✅ Generated' : '❌ Null'}`);
      // } else {
      //   alert('❌ FCM token generation failed');
      // }
      alert("Notifications are disabled");
    } catch (e) {
      console.log("FCM token test error:", e);
      alert(`FCM test failed: ${e?.message || "Unknown error"}`);
    }
  };

  const testTokenSaving = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;
      // const result = await testNotificationUtils.testTokenSaving(custID);
      // if (result) {
      //   alert('✅ Tokens saved to Firebase successfully!');
      // } else {
      //   alert('❌ Token saving failed');
      // }
      alert("Notifications are disabled");
    } catch (e) {
      console.log("Token saving test error:", e);
      alert(`Token saving test failed: ${e?.message || "Unknown error"}`);
    }
  };

  const testFirebaseNotification = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;
      // const result = await testNotificationUtils.testFirebaseNotification(custID);
      // if (result) {
      //   alert('✅ Firebase notification test successful!');
      // } else {
      //   alert('❌ Firebase notification test failed');
      // }
      alert("Notifications are disabled");
    } catch (e) {
      console.log("Firebase notification test error:", e);
      alert(
        `Firebase notification test failed: ${e?.message || "Unknown error"}`
      );
    }
  };

  const runAllFCMTests = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;
      // const results = await testNotificationUtils.runAllTests(custID);
      // alert(`🧪 FCM Test Results:\nPermissions: ${results.permissions ? '✅' : '❌'}\nToken Generation: ${results.tokenGeneration ? '✅' : '❌'}\nToken Saving: ${results.tokenSaving ? '✅' : '❌'}\nFirebase Notification: ${results.firebaseNotification ? '✅' : '❌'}`);
      alert("Notifications are disabled");
    } catch (e) {
      console.log("All FCM tests error:", e);
      alert(`All FCM tests failed: ${e?.message || "Unknown error"}`);
    }
  };

  const SkeletonLoader = () => (
    <View>
      {/* Header Section Skeleton */}
      <View style={styles.headerSection}>
        <View style={styles.profileImageContainer}>
          <View style={[styles.profileImage, { backgroundColor: "#e0e0e0" }]} />
        </View>
        <View style={styles.userInfo}>
          <View
            style={{
              backgroundColor: "#e0e0e0",
              height: 24,
              width: 120,
              borderRadius: 4,
              marginBottom: 8,
            }}
          />
          <View
            style={{
              backgroundColor: "#e0e0e0",
              height: 16,
              width: 100,
              borderRadius: 4,
            }}
          />
        </View>
      </View>

      {/* Quick Actions Skeleton */}
      <View style={styles.quickActionsContainer}>
        {[1, 2, 3].map((_, index) => (
          <View key={`quick-${index}`} style={styles.quickActionCard}>
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#e0e0e0" }]}
            />
            <View
              style={{
                backgroundColor: "#e0e0e0",
                height: 12,
                width: 40,
                borderRadius: 4,
                marginTop: 8,
              }}
            />
          </View>
        ))}
      </View>

      {/* Profile Management Section Skeleton */}
      <View style={styles.sectionContainer}>
        <View
          style={{
            backgroundColor: "#e0e0e0",
            height: 16,
            width: 120,
            borderRadius: 4,
            marginBottom: 12,
            marginLeft: 4,
          }}
        />
        <View style={styles.menuCard}>
          {[1, 2].map((_, index) => (
            <View key={`profile-${index}`}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: "#e0e0e0" },
                    ]}
                  />
                  <View
                    style={{
                      backgroundColor: "#e0e0e0",
                      height: 16,
                      width: 100,
                      borderRadius: 4,
                    }}
                  />
                </View>
                <View
                  style={{
                    backgroundColor: "#e0e0e0",
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                  }}
                />
              </View>
              {index < 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </View>
      </View>

      {/* Services Section Skeleton */}
      <View style={styles.sectionContainer}>
        <View
          style={{
            backgroundColor: "#e0e0e0",
            height: 16,
            width: 140,
            borderRadius: 4,
            marginBottom: 12,
            marginLeft: 4,
          }}
        />
        <View style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: "#e0e0e0" },
                ]}
              />
              <View
                style={{
                  backgroundColor: "#e0e0e0",
                  height: 16,
                  width: 80,
                  borderRadius: 4,
                }}
              />
            </View>
            <View
              style={{
                backgroundColor: "#e0e0e0",
                width: 20,
                height: 20,
                borderRadius: 4,
              }}
            />
          </View>
        </View>
      </View>

      {/* App Info Section Skeleton */}
      <View style={styles.sectionContainer}>
        <View
          style={{
            backgroundColor: "#e0e0e0",
            height: 16,
            width: 120,
            borderRadius: 4,
            marginBottom: 12,
            marginLeft: 4,
          }}
        />
        <View style={styles.menuCard}>
          {[1, 2, 3].map((_, index) => (
            <View key={`app-info-${index}`}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: "#e0e0e0" },
                    ]}
                  />
                  <View
                    style={{
                      backgroundColor: "#e0e0e0",
                      height: 16,
                      width: 120,
                      borderRadius: 4,
                    }}
                  />
                </View>
                <View
                  style={{
                    backgroundColor: "#e0e0e0",
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                  }}
                />
              </View>
              {index < 2 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </View>
      </View>

      {/* Logout Button Skeleton */}
      <View style={styles.logoutContainer}>
        <View style={[styles.logoutButton, { backgroundColor: "#e0e0e0" }]} />
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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.profileImageContainer}>
              {image ? (
                <ImageBackground
                  source={{ uri: image }}
                  style={styles.profileImage}
                  imageStyle={{ borderRadius: 50 }}
                />
              ) : (
                <Ionicons name="person-circle" size={120} color="white" />
              )}
              {/* <View style={styles.editIconContainer}>
                <Ionicons name="ribbon" size={16} color="white" />
              </View> */}
            </View>
            <View style={styles.userInfo}>
              <CustomText
                style={[globalStyles.f24Bold, globalStyles.textWhite]}
              >
                {name || "Hey, Buddy"}
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f14Regular,
                  { color: "rgba(255, 255, 255, 0.8)" },
                ]}
              >
                Manage your account
              </CustomText>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() =>
                  navigation.navigate("My Cars", { screen: "MyCarsList" })
                }
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="car" size={24} color={color.primary} />
                </View>
                <CustomText
                  style={[
                    globalStyles.f12SemiBold,
                    globalStyles.textac,
                    { color: "#333" },
                  ]}
                >
                  My Cars
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate("My Bookings")}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="calendar" size={24} color={color.primary} />
                </View>
                <CustomText
                  style={[
                    globalStyles.f12SemiBold,
                    globalStyles.textac,
                    { color: "#333" },
                  ]}
                >
                  Bookings
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate("SupportChat")}
              >
                <View style={styles.quickActionIcon}>
                  <MaterialIcons
                    name="support-agent"
                    size={24}
                    color={color.primary}
                  />
                </View>
                <CustomText
                  style={[
                    globalStyles.f12SemiBold,
                    globalStyles.textac,
                    { color: "#333" },
                  ]}
                >
                  Support
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate("OCRScreen")}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons
                    name="scan"
                    size={24}
                    color={color.primary}
                  />
                </View>
                <CustomText
                  style={[
                    globalStyles.f12SemiBold,
                    globalStyles.textac,
                    { color: "#333" },
                  ]}
                >
                  RC Scanner
                </CustomText>
              </TouchableOpacity>
            </View>

            {/* Profile Management Section */}
            <View style={styles.sectionContainer}>
              <CustomText
                style={[
                  globalStyles.f16SemiBold,
                  { color: "#333" },
                  globalStyles.mb3,
                  globalStyles.ml1,
                ]}
              >
                Profile Management
              </CustomText>
              <View style={styles.menuCard}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate("ProfileRegister")}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name="person" size={20} color={color.primary} />
                    </View>
                    <CustomText
                      style={[
                        globalStyles.f16Medium,
                        { color: "#333", flex: 1 },
                      ]}
                    >
                      Profile Details
                    </CustomText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() =>
                    navigation.navigate("Profile", { screen: "AddressList" })
                  }
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name="location"
                        size={20}
                        color={color.primary}
                      />
                    </View>
                    <CustomText
                      style={[
                        globalStyles.f16Medium,
                        { color: "#333", flex: 1 },
                      ]}
                    >
                      Addresses
                    </CustomText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Services Section */}
            <View style={styles.sectionContainer}>
              <CustomText
                style={[
                  globalStyles.f16SemiBold,
                  { color: "#333" },
                  globalStyles.mb3,
                  globalStyles.ml1,
                ]}
              >
                Services & Payments
              </CustomText>
              <View style={styles.menuCard}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() =>
                    navigation.navigate("Profile", { screen: "InvoiceList" })
                  }
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name="receipt"
                        size={20}
                        color={color.primary}
                      />
                    </View>
                    <CustomText
                      style={[
                        globalStyles.f16Medium,
                        { color: "#333", flex: 1 },
                      ]}
                    >
                      Invoice List
                    </CustomText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate("OCRScreen")}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name="scan"
                        size={20}
                        color={color.primary}
                      />
                    </View>
                    <CustomText
                      style={[
                        globalStyles.f16Medium,
                        { color: "#333", flex: 1 },
                      ]}
                    >
                      RC Scanner
                    </CustomText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
                </TouchableOpacity>
              </View>
            </View>

            {/* App Information Section */}
            <View style={styles.sectionContainer}>
              <CustomText
                style={[
                  globalStyles.f16SemiBold,
                  { color: "#333" },
                  globalStyles.mb3,
                  globalStyles.ml1,
                ]}
              >
                App Information
              </CustomText>
              <View style={styles.menuCard}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate("PrivacyPolicy")}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name="shield-checkmark"
                        size={20}
                        color={color.primary}
                      />
                    </View>
                    <CustomText
                      style={[
                        globalStyles.f16Medium,
                        { color: "#333", flex: 1 },
                      ]}
                    >
                      Privacy Policy
                    </CustomText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate("TermsConditions")}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name="document-text"
                        size={20}
                        color={color.primary}
                      />
                    </View>
                    <CustomText
                      style={[
                        globalStyles.f16Medium,
                        { color: "#333", flex: 1 },
                      ]}
                    >
                      Terms & Conditions
                    </CustomText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate("RefundPolicy")}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name="refresh"
                        size={20}
                        color={color.primary}
                      />
                    </View>
                    <CustomText
                      style={[
                        globalStyles.f16Medium,
                        { color: "#333", flex: 1 },
                      ]}
                    >
                      Refund Policy
                    </CustomText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Logout Button */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color="white" />
                <CustomText
                  style={[
                    globalStyles.f16SemiBold,
                    globalStyles.textWhite,
                    globalStyles.ml2,
                  ]}
                >
                  Logout
                </CustomText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}

      {/* Logout Confirmation Alert */}
      <CustomAlert
        visible={showLogoutAlert}
        status="error"
        title="Logout Confirmation"
        message="Are you sure you want to logout? You'll need to sign in again to access your account."
        onClose={() => setShowLogoutAlert(false)}
        showButton={false}
      >
        <View style={styles.alertButtonContainer}>

          <TouchableOpacity
            style={[styles.alertButton, styles.confirmButton]}
            onPress={confirmLogout}
          >
            <CustomText style={styles.confirmButtonText}>Yes, Logout</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.alertButton, styles.cancelButton]}
            onPress={() => setShowLogoutAlert(false)}
          >
            <CustomText style={styles.cancelButtonText}>Cancel</CustomText>
          </TouchableOpacity>
        </View>
      </CustomAlert>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.primary,
  },
  scrollContainer: {
    paddingBottom: 40,
    backgroundColor: "#F8F9FA",
  },

  // Header Section
  headerSection: {
    backgroundColor: color.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  profileImageContainer: {
    position: "relative",
    marginVertical: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: color.secondary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  userInfo: {
    alignItems: "center",
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionCard: {
    alignItems: "center",
    flex: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  // Sections
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  menuCard: {
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 72,
  },

  // Logout
  logoutContainer: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.alertError,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Legacy styles for skeleton loader
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

  // Alert Button Styles
  alertButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    gap: 12,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  confirmButton: {
    backgroundColor: color.alertError,
  },
  cancelButtonText: {
    ...globalStyles.f12Bold,
    color: "#666",
  },
  confirmButtonText: {
    ...globalStyles.f12Bold,
    color: "#FFFFFF",
  },
});
