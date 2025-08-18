import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import CustomText from "../../components/CustomText";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import { API_URL } from "../../../apiConfig";
import useGlobalRefresh from "../../hooks/useGlobalRefresh";

export default function ServiceList() {
  const [selectedTab, setSelectedTab] = useState("New");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const tabs = ["New", "Completed"];
  const { refreshing, onRefresh } = useGlobalRefresh()

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
      console.log("Raw response:", response);
      console.log("Response data:", response.data);
      console.log("Is response.data an array?", Array.isArray(response.data));

      let bookingsData = response.data;

      // Handle potential non-array response
      if (!Array.isArray(bookingsData)) {
        console.warn("Response is not an array, attempting to extract array");
        if (bookingsData && typeof bookingsData === "object" && Array.isArray(bookingsData.bookings)) {
          bookingsData = bookingsData.bookings;
          console.log("Extracted bookings array:", bookingsData);
        } else if (typeof bookingsData === "string") {
          try {
            bookingsData = JSON.parse(bookingsData);
            console.log("Parsed string to array:", bookingsData);
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

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = (bookings || []).filter((b) => {
    const status = (b.BookingStatus || "").toLowerCase();
    console.log("Booking status:", status, "Selected tab:", selectedTab);
    return selectedTab === "New"
      ? status != "completed"
      : status === "completed";
  });

  console.log("Current bookings state:", bookings);
  console.log("Filtered bookings:", filteredBookings);

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              console.log("Tab switched to:", tab);
              setSelectedTab(tab);
            }}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.tabButtonActive,
            ]}
          >
            <CustomText
              style={[
                styles.tabButtonText,
                selectedTab === tab && styles.tabButtonTextActive,
              ]}
            >
              {tab}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <CustomText style={{ color: "#333", ...globalStyles.f12Bold }}>
          Showing{" "}
          <CustomText style={{ fontWeight: "bold", color: "#007AFF" }}>
            {selectedTab}
          </CustomText>{" "}
          Services
        </CustomText>

        {loading ? (
          <CustomText style={{ textAlign: "center", marginTop: 20, ...globalStyles.f12Regular }}>
            Loading...
          </CustomText>
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
            <TouchableOpacity
              key={booking.BookingID}
              style={styles.card}
              onPress={() => navigation.navigate("BookingsInnerPage", { booking })}
            >
              <View style={styles.header}>
                <Image
                  source={{
                    uri: `https://api.mycarsbuddy.com/Images${booking.VehicleImage}`,
                  }}
                  style={styles.vehicleImage}
                  onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <CustomText style={styles.title}>
                    {booking.BrandName} {booking.ModelName}
                  </CustomText>
                  <CustomText style={styles.subText}>
                    {booking.VehicleNumber} | {booking.FuelTypeName}
                  </CustomText>
                  <CustomText style={styles.subText}>
                    Date: {booking.BookingDate}
                  </CustomText>
                  <CustomText style={styles.subText}>
                    Slot: {booking.TimeSlot}
                  </CustomText>
                  <CustomText
                    style={[
                      styles.subText,
                      {
                        color: booking.TechID === null ? "#FF9500" : "#333",
                      },
                    ]}
                  >
                    Technician: {booking.TechID === null ? "Not Assigned Yet" : "Assigned"}
                  </CustomText>
                </View>
              </View>

              <View style={styles.packageList}>
                {(booking.Packages || []).map((pkg) => (
                  <View key={pkg.PackageID} style={styles.packageItem}>
                    <CustomText style={styles.packageName}>
                      • {pkg.PackageName}
                    </CustomText>
                  </View>
                ))}
              </View>

              <View style={styles.footer}>
                <CustomText style={styles.totalText}>
                  ₹ {booking.TotalPrice.toFixed(2)}
                </CustomText>
                <CustomText style={styles.statusText}>
                  {booking.BookingStatus}
                </CustomText>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#ddd",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },
  tabButtonActive: {
    backgroundColor: color.primary || "#007AFF",
  },
  tabButtonText: {
    color: "#333",
    ...globalStyles.f10Bold,
  },
  tabButtonTextActive: {
    color: "#fff",
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
});