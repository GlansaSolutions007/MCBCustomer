import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import CustomText from "../../components/CustomText";

export default function ServiceList() {
  const [selectedTab, setSelectedTab] = useState("New");
  const [bookings, setBookings] = useState([]);
  const navigation = useNavigation();
  const tabs = ["New", "Completed"];

  // Manual data
  const manualData = [
    {
      BookingID: 1,
      BookingTrackID: "MYCAR072025001",
      CustID: 4,
      TechID: 83,
      BookingStatus: "Confirmed",
      PackageIds: "1,2,3",
      PackagePrice: "100,200,300",
      TotalPrice: 500.00,
      BookingDate: "2025-07-28",
      TimeSlot: "10:00AM - 12:00PM",
      CustomerName: "NagRaj",
      PhoneNumber: "9177346081",
      IsOthers: false,
      OthersFullName: "",
      OthersPhoneNumber: "",
      StateName: "karnataka",
      CityName: "chintal",
      VehicleNumber: "TS27C8223",
      VehicleImage: "/VehicleModel/brand-9-model-240_z4v0ce3l.jpeg",
      BrandName: "Maruti Suzuki",
      ModelName: "Swift",
      FuelTypeName: "Petrol",
      Packages: [
        {
          PackageID: 1,
          PackageName: "Exterior Premium Wash",
          EstimatedDurationMinutes: 50,
          Category: {
            CategoryID: 4,
            CategoryName: "Exterior Cleaning",
            SubCategories: [
              {
                SubCategoryID: 12,
                SubCategoryName: "Exterior Car Wash",
                Includes: [
                  { IncludeID: 4, IncludeName: "inlcude five" },
                  { IncludeID: 3, IncludeName: "include three" },
                  { IncludeID: 2, IncludeName: "include two" }
                ]
              }
            ]
          }
        },
        {
          PackageID: 2,
          PackageName: "Exterior Basic Care",
          EstimatedDurationMinutes: 50,
          Category: {
            CategoryID: 4,
            CategoryName: "Exterior Cleaning",
            SubCategories: [
              {
                SubCategoryID: 13,
                SubCategoryName: "Foam Wash",
                Includes: [
                  { IncludeID: 4, IncludeName: "inlcude five" },
                  { IncludeID: 2, IncludeName: "include two" },
                  { IncludeID: 1, IncludeName: "Dashboard Cleaning" }
                ]
              }
            ]
          }
        },
        {
          PackageID: 3,
          PackageName: "Exterior Care SPL",
          EstimatedDurationMinutes: 50,
          Category: {
            CategoryID: 4,
            CategoryName: "Exterior Cleaning",
            SubCategories: [
              {
                SubCategoryID: 12,
                SubCategoryName: "Exterior Car Wash",
                Includes: [
                  { IncludeID: 4, IncludeName: "inlcude five" },
                  { IncludeID: 2, IncludeName: "include two" },
                  { IncludeID: 3, IncludeName: "include three" },
                  { IncludeID: 1, IncludeName: "Dashboard Cleaning" }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      BookingID: 8,
      BookingTrackID: "MYCAR072025001",
      CustID: 4,
      TechID: 0,
      BookingStatus: "Confirmed",
      PackageIds: "1,2,3",
      PackagePrice: "100,200,300",
      TotalPrice: 500.00,
      BookingDate: "2025-07-28",
      TimeSlot: "10:00AM - 12:00PM",
      CustomerName: "NagRaj",
      PhoneNumber: "9177346081",
      IsOthers: false,
      StateName: "karnataka",
      CityName: "chintal",
      VehicleNumber: "TS27C8223",
      VehicleImage: "/VehicleModel/brand-9-model-240_z4v0ce3l.jpeg",
      BrandName: "Maruti Suzuki",
      ModelName: "Swift",
      FuelTypeName: "Petrol",
      Packages: [
        {
          PackageID: 1,
          PackageName: "Exterior Premium Wash",
          EstimatedDurationMinutes: 50,
          Category: {
            CategoryID: 4,
            CategoryName: "Exterior Cleaning",
            SubCategories: [
              {
                SubCategoryID: 12,
                SubCategoryName: "Exterior Car Wash",
                Includes: [
                  { IncludeID: 4, IncludeName: "inlcude five" },
                  { IncludeID: 3, IncludeName: "include three" },
                  { IncludeID: 2, IncludeName: "include two" }
                ]
              }
            ]
          }
        },
        {
          PackageID: 2,
          PackageName: "Exterior Basic Care",
          EstimatedDurationMinutes: 50,
          Category: {
            CategoryID: 4,
            CategoryName: "Exterior Cleaning",
            SubCategories: [
              {
                SubCategoryID: 13,
                SubCategoryName: "Foam Wash",
                Includes: [
                  { IncludeID: 4, IncludeName: "inlcude five" },
                  { IncludeID: 2, IncludeName: "include two" },
                  { IncludeID: 1, IncludeName: "Dashboard Cleaning" }
                ]
              }
            ]
          }
        },
        {
          PackageID: 3,
          PackageName: "Exterior Care SPL",
          EstimatedDurationMinutes: 50,
          Category: {
            CategoryID: 4,
            CategoryName: "Exterior Cleaning",
            SubCategories: [
              {
                SubCategoryID: 12,
                SubCategoryName: "Exterior Car Wash",
                Includes: [
                  { IncludeID: 4, IncludeName: "inlcude five" },
                  { IncludeID: 2, IncludeName: "include two" },
                  { IncludeID: 3, IncludeName: "include three" },
                  { IncludeID: 1, IncludeName: "Dashboard Cleaning" }
                ]
              }
            ]
          }
        }
      ]
    }
  ];

  useEffect(() => {
    console.log("Setting bookings state to manual data");
    setBookings(manualData);
  }, []);

  const filteredBookings = (bookings || []).filter((b) => {
    const status = (b.BookingStatus || "").toLowerCase();
    console.log("Booking status:", status, "Selected tab:", selectedTab);
    return selectedTab === "New"
      ? status === "confirmed"
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

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* <CustomText style={{ color: "#333", ...globalStyles.f12Bold }}>
          Showing{" "}
          <CustomText style={{ fontWeight: "bold", color: "#007AFF" }}>
            {selectedTab}
          </CustomText>{" "}
          Services
        </CustomText> */}

        {bookings.length === 0 ? (
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
                        color: booking.TechID === 0 ? "#FF9500" : "#333",
                        fontWeight: booking.TechID === 0 ? "bold" : "normal",
                      },
                    ]}
                  >
                    Technician: {booking.TechID === 0 ? "Not Assigned Yet" : "Assigned"}
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