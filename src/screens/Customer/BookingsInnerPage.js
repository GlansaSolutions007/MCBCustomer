import React from "react";
import { View, ScrollView, StyleSheet, Text, Image } from "react-native";
import { useRoute } from "@react-navigation/native";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import CustomText from "../../components/CustomText";

export default function BookingsInnerPage() {
  const route = useRoute();
  const { booking } = route.params;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F5F5" }} contentContainerStyle={{ padding: 16 }}>
      <CustomText style={[styles.sectionTitle, globalStyles.f14Bold]}>Booking Details</CustomText>
      <View style={styles.card}>
        {/* <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Booking ID:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Regular]}>{booking.BookingID}</CustomText>
        </View> */}
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Tracking ID:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Regular]}>{booking.BookingTrackID}</CustomText>
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Customer Name:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Regular]}>{booking.CustomerName}</CustomText>
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Phone Number:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Regular]}>{booking.PhoneNumber}</CustomText>
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Location:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Regular]}>
            {booking.CityName}, {booking.StateName}
          </CustomText>
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Date:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Regular]}>{booking.BookingDate}</CustomText>
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Time Slot:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Regular]}>{booking.TimeSlot}</CustomText>
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Technician:</CustomText>
          <CustomText
            style={[
              styles.value,
              globalStyles.f12Regular,
              {
                color: booking.TechID === 0 ? color.primary : "#333",
                fontWeight: booking.TechID === 0 ? "bold" : "normal",
              },
            ]}
          >
            {booking.TechID === 0 ? "Not Assigned Yet" : `Assigned (ID: ${booking.TechID})`}
          </CustomText>
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Status:</CustomText>
          <CustomText
            style={[
              styles.value,
              globalStyles.f12Regular,
              { color: color.primary || "#007AFF", fontWeight: "bold" },
            ]}
          >
            {booking.BookingStatus}
          </CustomText>
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Total Price:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Bold]}>
            ₹ {booking.TotalPrice.toFixed(2)}
          </CustomText>
        </View>
      </View>

      <CustomText style={[styles.sectionTitle, globalStyles.f14Bold, { marginTop: 20 }]}>
        Vehicle Details
      </CustomText>
      <View style={styles.card}>
        <View style={styles.section}>
          <Image
            source={{ uri: `https://api.mycarsbuddy.com/Images${booking.VehicleImage}` }}
            style={styles.vehicleImage}
            onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
          />
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Vehicle:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Regular]}>
            {booking.BrandName} {booking.ModelName}
          </CustomText>
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Vehicle Number:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Regular]}>{booking.VehicleNumber}</CustomText>
        </View>
        <View style={styles.section}>
          <CustomText style={[styles.label, globalStyles.f12Bold]}>Fuel Type:</CustomText>
          <CustomText style={[styles.value, globalStyles.f12Regular]}>{booking.FuelTypeName}</CustomText>
        </View>
      </View>

      <CustomText style={[styles.sectionTitle, globalStyles.f14Bold, { marginTop: 20 }]}>
        Packages
      </CustomText>
      {(booking.Packages || []).map((pkg) => (
        <View key={pkg.PackageID} style={[styles.card, { marginBottom: 10 }]}>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>Package:</CustomText>
            <CustomText style={[styles.value, globalStyles.f12Regular]}>{pkg.PackageName}</CustomText>
          </View>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>Duration:</CustomText>
            <CustomText style={[styles.value, globalStyles.f12Regular]}>
              {pkg.EstimatedDurationMinutes} minutes
            </CustomText>
          </View>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>Category:</CustomText>
            <CustomText style={[styles.value, globalStyles.f12Regular]}>
              {pkg.Category.CategoryName}
            </CustomText>
          </View>
          {(pkg.Category.SubCategories || []).map((subCat) => (
            <View key={subCat.SubCategoryID} style={styles.subSection}>
              <CustomText style={[styles.subLabel, globalStyles.f10Bold]}>
                {subCat.SubCategoryName}
              </CustomText>
              {(subCat.Includes || []).map((include) => (
                <CustomText
                  key={include.IncludeID}
                  style={[styles.includeText, globalStyles.f10Regular]}
                >
                  • {include.IncludeName}
                </CustomText>
              ))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
    width: "100%",
    elevation: 3,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  subSection: {
    marginLeft: 10,
    marginTop: 8,
  },
  sectionTitle: {
    color: "#222",
    marginBottom: 10,
  },
  label: {
    color: "#666",
    flex: 1,
  },
  value: {
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  subLabel: {
    color: "#444",
    marginBottom: 4,
  },
  includeText: {
    color: "#444",
    marginLeft: 10,
    marginBottom: 2,
  },
  vehicleImage: {
    width: 100,
    height: 70,
    resizeMode: "contain",
    borderRadius: 8,
    backgroundColor: "#eee",
    alignSelf: "center",
    marginBottom: 10,
  },
});