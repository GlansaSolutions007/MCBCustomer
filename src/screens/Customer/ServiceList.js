import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import CustomText from "../../components/CustomText";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import { API_URL } from "../../../apiConfig";
import useGlobalRefresh from "../../hooks/useGlobalRefresh";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function ServiceList() {
  const [selectedTab, setSelectedTab] = useState("New");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const tabs = ["New", "Completed"];
  const { refreshing, onRefresh } = useGlobalRefresh();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = userData ? JSON.parse(userData) : null;
      const custID = parsedData?.custID || 2; // Fallback to 2 for testing
      console.log("Customer ID:", custID);

      const response = await axios.get(
        `https://api.mycarsbuddy.com/api/Bookings/${custID}`
      );
      // console.log("Raw response:", response);
      // console.log("Response data:", response.data);
      // console.log("Is response.data an array?", Array.isArray(response.data));

      let bookingsData = response.data;

      // Handle potential non-array response
      if (!Array.isArray(bookingsData)) {
        console.warn("Response is not an array, attempting to extract array");
        if (
          bookingsData &&
          typeof bookingsData === "object" &&
          Array.isArray(bookingsData.bookings)
        ) {
          bookingsData = bookingsData.bookings;
          // console.log("Extracted bookings array:", bookingsData);
        } else if (typeof bookingsData === "string") {
          try {
            bookingsData = JSON.parse(bookingsData);
            // console.log("Parsed string to array:", bookingsData);
          } catch (parseError) {
            console.error("Failed to parse data as JSON:", parseError.message);
            bookingsData = [];
          }
        } else {
          console.error("Final bookings data is not an array:", bookingsData);
          bookingsData = [];
        }
      }

      setBookings((prev) => {
        console.log("Setting bookings state to:", bookingsData);
        return [...bookingsData];
      });
    } catch (error) {
      console.error("Failed to fetch bookings:", error.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload bookings every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused, fetching bookings...");
      fetchBookings();
    }, [fetchBookings])
  );

  // useEffect(() => {
  //   fetchBookings();
  // }, [fetchBookings]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    console.log("Manual refresh triggered");
    onRefresh();
    fetchBookings();
  }, [onRefresh, fetchBookings]);

  const filteredBookings = (bookings || []).filter((b) => {
    const status = (b.BookingStatus || "").toLowerCase();
    console.log("Booking status:", status, "Selected tab:", selectedTab);
    return selectedTab === "New"
      ? status !== "completed"
      : status === "completed";
  });

  const SkeletonLoader = () => (
    <View style={styles.bookingCard}>
      <View>
        <View style={styles.bookingR1}>
          <View style={{ backgroundColor: '#f1f1f1ff', height: 20, width: '40%', borderRadius: 4 }} />
          <View style={{ backgroundColor: '#f1f1f1ff', height: 20, width: '30%', borderRadius: 4 }} />
        </View>
        <View style={[styles.divider, { backgroundColor: '#f1f1f1ff' }]} />
        <View style={styles.bookingR1}>
          <View style={styles.bookingCarImage}>
            <View style={{ backgroundColor: '#f1f1f1ff', width: '60%', height: 60, borderRadius: 8 }} />
            <View style={{ backgroundColor: '#f1f1f1ff', height: 20, width: '80%', borderRadius: 4, marginTop: 5 }} />
            <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '60%', borderRadius: 4, marginTop: 5 }} />
          </View>
          <View style={styles.bookingDetails}>
            <View style={styles.bookingDate}>
              <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '70%', borderRadius: 4 }} />
              <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '50%', borderRadius: 4, marginTop: 5 }} />
            </View>
            <View style={styles.bookingDate}>
              <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '70%', borderRadius: 4 }} />
              <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '50%', borderRadius: 4, marginTop: 5 }} />
            </View>
            <View style={styles.bookingDate}>
              <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '70%', borderRadius: 4 }} />
              <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '50%', borderRadius: 4, marginTop: 5 }} />
            </View>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: '#f1f1f1ff' }]} />
        <View style={styles.bookingServices}>
          <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '60%', borderRadius: 4 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
            <View style={{ backgroundColor: '#f1f1f1ff', height: 16, width: 16, borderRadius: 4, marginRight: 6 }} />
            <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '80%', borderRadius: 4 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
            <View style={{ backgroundColor: '#f1f1f1ff', height: 16, width: 16, borderRadius: 4, marginRight: 6 }} />
            <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '80%', borderRadius: 4 }} />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const isActive = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                console.log("Tab switched to:", tab);
                setSelectedTab(tab);
              }}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <CustomText
                style={[
                  styles.tabButtonText,
                  isActive && styles.tabButtonTextActive,
                ]}
              >
                {tab}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View>
            <SkeletonLoader />
            <SkeletonLoader />
            {/* <SkeletonLoader /> */}
          </View>
        ) : bookings.length === 0 ? (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <CustomText style={{ color: "#999", ...globalStyles.f12Regular }}>
              No bookings available.
            </CustomText>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <CustomText style={{ color: "#999", ...globalStyles.f12Regular }}>
              No {selectedTab.toLowerCase()} services yet.
            </CustomText>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <Pressable
              key={booking.BookingID}
              style={styles.bookingCard}
              onPress={() =>
                navigation.navigate("BookingsInnerPage", { booking })
              }
            >
              <View>
                <View style={styles.bookingR1}>
                  <CustomText style={styles.bookingID}>
                    BID: {booking.BookingTrackID}
                  </CustomText>
                  <CustomText
                    style={[
                      styles.techStatus,
                      {
                        color:
                          booking.TechID === null ? color.text : color.primary,
                      },
                    ]}
                  >
                    Tech {booking.TechID === null ? "Not Assigned" : "Assigned"}
                  </CustomText>
                </View>
                <View style={styles.divider} />
                <View style={styles.bookingR1}>
                  <View style={styles.bookingCarImage}>
                    <Image
                      source={{
                        uri: `https://api.mycarsbuddy.com/Images${booking.VehicleImage}`,
                      }}
                      style={{
                        width: "60%",
                        height: 60,
                        borderRadius: 8,
                        backgroundColor: "#eee",
                      }}
                      onError={(e) =>
                        console.log("Image load error:", e.nativeEvent.error)
                      }
                    />
                    <CustomText style={styles.title}>
                      {booking.BrandName} {booking.ModelName} (
                      {booking.FuelTypeName === "Petrol"
                        ? "P"
                        : booking.FuelTypeName === "Diesel"
                          ? "D"
                          : "E"}
                      )
                    </CustomText>
                    <CustomText style={styles.subText}>
                      {booking.VehicleNumber}
                    </CustomText>
                  </View>
                  <View style={styles.bookingDetails}>
                    <View style={styles.bookingDate}>
                      <CustomText
                        style={[globalStyles.f10Regular, color.primary]}
                      >
                        Booked On:
                      </CustomText>
                      <CustomText style={[globalStyles.f12Bold]}>
                        {booking.BookingDate}
                      </CustomText>
                    </View>
                    <View style={styles.bookingDate}>
                      <CustomText style={[globalStyles.f10Regular]}>
                        Booked Slot:
                      </CustomText>
                      <CustomText style={[globalStyles.f12Bold]}>
                        {booking.TimeSlot}
                      </CustomText>
                    </View>
                    <View style={styles.bookingDate}>
                      <CustomText style={[globalStyles.f10Regular]}>
                        Service Amount:
                      </CustomText>
                      <CustomText style={[globalStyles.f12Bold]}>
                        ₹ {booking.TotalPrice.toFixed(2)}
                      </CustomText>
                    </View>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.bookingServices}>
                  <CustomText style={[globalStyles.f10Regular, color.primary]}>
                    Services Booked:
                  </CustomText>
                  {(booking.Packages || []).map((pkg) => (
                    <View
                      key={pkg.PackageID}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginVertical: 4,
                      }}
                    >
                      <FontAwesome5 name="tools"
                        size={16}
                        color={color.primary}
                        style={{ marginRight: 6 }} />
                      <CustomText
                        style={[globalStyles.f12Bold, { color: "#333" }]}
                      >
                        {pkg.PackageName}
                      </CustomText>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F5F7FA", // light modern background
    borderRadius: 12,
    padding: 4,
    marginVertical: 10,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "transparent",
    transition: "all 0.3s", // works in web, for RN add Animated if needed
  },
  tabButtonActive: {
    backgroundColor: color.yellow,
  },
  tabButtonText: {
    color: "#555",
    ...globalStyles.f12Bold,
  },
  tabButtonTextActive: {
    color: "#fff",
    ...globalStyles.f12Bold,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
    width: "100%",
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleImage: {
    width: 70,
    height: 50,
    resizeMode: "contain",
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  title: {
    ...globalStyles.f12Bold,
    color: "#222",
  },
  subText: {
    ...globalStyles.f10Bold,
    color: "#666",
    marginTop: 2,
  },
  packageList: {
    marginTop: 12,
  },
  packageItem: {
    marginBottom: 4,
  },
  packageName: {
    ...globalStyles.f10Regular,
    color: "#444",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  totalText: {
    ...globalStyles.f12Bold,
    color: "#000",
  },
  statusText: {
    color: color.primary || "#007AFF",
    ...globalStyles.f10Bold,
  },
  bookingCard: {
    backgroundColor: color.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Android shadow
  },
  bookingR1: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  bookingID: {
    ...globalStyles.f10Bold,
    backgroundColor: color.secondary,
    padding: 5,
    borderRadius: 10,
    color: color.white,
  },
  bookingCarImage: {
    width: "50%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    // gap: 2,
  },
  techStatus: {
    ...globalStyles.f10Bold,
    // color: "#666",
  },
  divider: {
    borderBottomColor: "#ededed",
    borderBottomWidth: 1,
    marginVertical: 3,
  },
  bookingDetails: {
    display: "flex",
    flexDirection: "column",
    // justifyContent: "space-between",
    alignContent: "flex-start",
    flex: 1,
    gap: 6,
    padding: 5,
  },
  bookingDate: {
    // ...globalStyles.f10Bold,
    // color: "#666",
    display: "flex",
    flexDirection: "column",
  },
});
