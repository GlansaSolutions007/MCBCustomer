import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import CustomText from "../../components/CustomText";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import { API_URL, RAZORPAY_KEY } from "@env";
import RazorpayCheckout from "react-native-razorpay";
import { getToken } from "../../utils/token";
import useGlobalRefresh from "../../hooks/useGlobalRefresh";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
// import { monitorBookingsForNotifications } from "../../utils/notificationService";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};

export default function ServiceList() {
  const [selectedTab, setSelectedTab] = useState("New");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const tabs = ["New", "Completed", "Cancelled"];
  const { refreshing, onRefresh } = useGlobalRefresh();

  // Enable LayoutAnimation on Android for smooth transitions
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = userData ? JSON.parse(userData) : null;
      const custID = parsedData?.custID;
      console.log("Customer ID:", custID);

      const response = await axios.get(`${API_URL}Bookings/${custID}`);

      let bookingsData = response.data;

      if (!Array.isArray(bookingsData)) {
        console.warn("Response is not an array, attempting to extract array");
        if (
          bookingsData &&
          typeof bookingsData === "object" &&
          Array.isArray(bookingsData.bookings)
        ) {
          bookingsData = bookingsData.bookings;
        } else if (typeof bookingsData === "string") {
          try {
            bookingsData = JSON.parse(bookingsData);
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
        return [...bookingsData];
      });

      // Monitor bookings for notification changes
      // if (custID) {
      //   monitorBookingsForNotifications(bookingsData, custID);
      // }
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onRefresh();
    fetchBookings();
  }, [onRefresh, fetchBookings]);

  const filteredBookings = (bookings || []).filter((b) => {
    const status = (b.BookingStatus || "").toLowerCase();
    console.log("Booking status:", status, "Selected tab:", selectedTab);
    if (selectedTab === "New") {
      return status !== "completed" && status !== "cancelled";
    } else if (selectedTab === "Completed") {
      return status === "completed";
    } else if (selectedTab === "Cancelled") {
      return status === "cancelled";
    }
    return false;
  });

  const getPayableAmount = (booking) => {
    const total = Number(booking?.TotalPrice || 0);
    const gst = Number(booking?.GSTAmount || 0);
    const discount = Number(booking?.CouponAmount || 0);
    const computed = Math.max(total - discount + gst, 0);
    return computed || total || 0;
  };

  const openRazorpayForBooking = async (booking) => {
    try {
      const amount = getPayableAmount(booking);
      const token = await getToken();

      let orderId = null;
      try {
        // Try to create/get an order for existing booking (backend support expected)
        const res = await axios.post(
          `${API_URL}Bookings/create-order`,
          { bookingID: booking.BookingID, amount },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        orderId = res?.data?.orderID || res?.data?.razorpay?.orderID || null;
      } catch (e) {
        console.log("create-order not available, proceeding without order_id", e?.response?.data || e?.message);
      }

      const options = {
        description: "MyCarBuddy Service Payment",
        image: "https://mycarsbuddy.com/logo2.png",
        currency: "INR",
        key: RAZORPAY_KEY,
        amount: amount * 100,
        name: "MyCarBuddy | powered by Glansa Solutions",
        order_id: orderId || undefined,
        prefill: {},
        theme: { color: color.primary },
      };

      RazorpayCheckout.open(options)
        .then(async (data) => {
          try {
            const confirmPayload = {
              bookingID: booking.BookingID,
              amountPaid: amount,
              razorpayPaymentId: data?.razorpay_payment_id,
              razorpayOrderId: data?.razorpay_order_id,
              razorpaySignature: data?.razorpay_signature,
              paymentMode: "Razorpay",
            };
            await axios.post(`${API_URL}Bookings/confirm-Payment`, confirmPayload, {
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            // Refresh list
            fetchBookings();
          } catch (err) {
            console.error("Payment confirmation failed:", err?.response || err);
          }
        })
        .catch((err) => {
          console.log("Payment cancelled/failed:", err?.data || err?.message || err);
        });
    } catch (error) {
      console.error("Failed to initiate Razorpay:", error?.response || error);
    }
  };

  const counts = {
    New: (bookings || []).filter((b) => {
      const s = (b.BookingStatus || '').toLowerCase();
      return s !== 'completed' && s !== 'cancelled';
    }).length,
    Completed: (bookings || []).filter((b) => (b.BookingStatus || '').toLowerCase() === 'completed').length,
    Cancelled: (bookings || []).filter((b) => (b.BookingStatus || '').toLowerCase() === 'cancelled').length,
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'failed') return color.alertError;
    if (s === 'cancelled') return '#999';
    if (s === 'completed') return '#34C759';
    if (s === 'startjourney') return color.primary;
    if (s === 'pending') return color.yellow;
    return color.secondary;
  };

  const SkeletonLoader = () => (
    <View style={styles.bookingCard}>
      <View>
        <View style={styles.bookingR1}>
          <View
            style={{
              backgroundColor: "#f1f1f1ff",
              height: 20,
              width: "40%",
              borderRadius: 4,
            }}
          />
          <View
            style={{
              backgroundColor: "#f1f1f1ff",
              height: 20,
              width: "30%",
              borderRadius: 4,
            }}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: "#f1f1f1ff" }]} />
        <View style={styles.bookingR1}>
          <View style={styles.bookingCarImage}>
            <View
              style={{
                backgroundColor: "#f1f1f1ff",
                width: "60%",
                height: 60,
                borderRadius: 8,
              }}
            />
            <View
              style={{
                backgroundColor: "#f1f1f1ff",
                height: 20,
                width: "80%",
                borderRadius: 4,
                marginTop: 5,
              }}
            />
            <View
              style={{
                backgroundColor: "#f1f1f1ff",
                height: 15,
                width: "60%",
                borderRadius: 4,
                marginTop: 5,
              }}
            />
          </View>
          <View style={styles.bookingDetails}>
            <View style={styles.bookingDate}>
              <View
                style={{
                  backgroundColor: "#f1f1f1ff",
                  height: 15,
                  width: "70%",
                  borderRadius: 4,
                }}
              />
              <View
                style={{
                  backgroundColor: "#f1f1f1ff",
                  height: 15,
                  width: "50%",
                  borderRadius: 4,
                  marginTop: 5,
                }}
              />
            </View>
            <View style={styles.bookingDate}>
              <View
                style={{
                  backgroundColor: "#f1f1f1ff",
                  height: 15,
                  width: "70%",
                  borderRadius: 4,
                }}
              />
              <View
                style={{
                  backgroundColor: "#f1f1f1ff",
                  height: 15,
                  width: "50%",
                  borderRadius: 4,
                  marginTop: 5,
                }}
              />
            </View>
            <View style={styles.bookingDate}>
              <View
                style={{
                  backgroundColor: "#f1f1f1ff",
                  height: 15,
                  width: "70%",
                  borderRadius: 4,
                }}
              />
              <View
                style={{
                  backgroundColor: "#f1f1f1ff",
                  height: 15,
                  width: "50%",
                  borderRadius: 4,
                  marginTop: 5,
                }}
              />
            </View>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: "#f1f1f1ff" }]} />
        <View style={styles.bookingServices}>
          <View
            style={{
              backgroundColor: "#f1f1f1ff",
              height: 15,
              width: "60%",
              borderRadius: 4,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 4,
            }}
          >
            <View
              style={{
                backgroundColor: "#f1f1f1ff",
                height: 16,
                width: 16,
                borderRadius: 4,
                marginRight: 6,
              }}
            />
            <View
              style={{
                backgroundColor: "#f1f1f1ff",
                height: 15,
                width: "80%",
                borderRadius: 4,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 4,
            }}
          >
            <View
              style={{
                backgroundColor: "#f1f1f1ff",
                height: 16,
                width: 16,
                borderRadius: 4,
                marginRight: 6,
              }}
            />
            <View
              style={{
                backgroundColor: "#f1f1f1ff",
                height: 15,
                width: "80%",
                borderRadius: 4,
              }}
            />
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
          const isCancelled = tab === "Cancelled";
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                console.log("Tab switched to:", tab);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSelectedTab(tab);
              }}
              style={[
                styles.tabButton,
                isActive && {
                  backgroundColor: isCancelled
                    ? color.alertError
                    : color.yellow,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CustomText
                  style={[
                    styles.tabButtonText,
                    isActive && styles.tabButtonTextActive,
                  ]}
                >
                  {tab}
                </CustomText>
                <View style={[styles.countBadge, isActive ? styles.countBadgeActive : styles.countBadgeInactive]}>
                  <CustomText style={[globalStyles.f10Bold, { color: isActive ? '#000' : '#666' }]}>
                    {counts[tab] || 0}
                  </CustomText>
                </View>
              </View>
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
          <Pressable
            onPress={() =>
              navigation.navigate("CustomerTabNavigator", {
                screen: "Services",
              })
            }
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 8,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={40}
              color={color.primary}
              style={{ marginBottom: 8 }}
            />
            <CustomText
              style={[
                globalStyles.f16Bold,
                { color: color.primary, textAlign: "center" },
              ]}
            >
              No bookings for today
            </CustomText>
            <CustomText
              style={[
                globalStyles.f16Bold,
                { color: color.primary, textAlign: "center" },
              ]}
            >
              Explore our services!
            </CustomText>
            <View style={{ alignItems: "center", marginTop: 8 }}>
              <CustomText
                style={[
                  globalStyles.f12Regular,
                  { color: "#666", textAlign: "center" },
                ]}
              >
                Book your service now and enjoy a hassle-free experience!
              </CustomText>
            </View>
          </Pressable>
        ) : filteredBookings.length === 0 ? (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <CustomText style={{ color: "#999", ...globalStyles.f12Regular }}>
              No {selectedTab.toLowerCase()} services yet.
            </CustomText>
          </View>
        ) : (
          filteredBookings.map((booking, index) => (
            <Pressable
              key={booking.BookingID}
              style={[
                styles.bookingCard,
                (booking.BookingStatus || '').toLowerCase() === 'startjourney' && booking.TechID !== null ? styles.journeyCard : null,
              ]}
              disabled={booking.BookingStatus?.toLowerCase() === "failed"}
              onPress={() =>
                navigation.navigate("BookingsInnerPage", { booking })
              }
            >
              <View>
                <View style={styles.bookingR1}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CustomText
                      style={[
                        styles.bookingID,
                        { backgroundColor: getStatusColor(booking.BookingStatus) },
                      ]}
                    >
                      BID: {booking.BookingTrackID}
                    </CustomText>
                    <View style={[styles.statusChip, { backgroundColor: getStatusColor(booking.BookingStatus) + '26' }]}> 
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.BookingStatus) }]} />
                      <CustomText style={[globalStyles.f10Bold, { color: getStatusColor(booking.BookingStatus) }]}>
                        {
                          (() => {
                            const s = (booking.BookingStatus || '').toLowerCase();
                            if (s === 'startjourney') return 'Started Journey';
                            const isPaid = Array.isArray(booking.Payments) && booking.Payments.length > 0;
                            if (s === 'pending' && isPaid) return 'Technician not assigned';
                            return booking.BookingStatus;
                          })()
                        }
                      </CustomText>
                    </View>
                  </View>

                  {booking.BookingStatus?.toLowerCase() !== "cancelled" && (
                    <View style={styles.techBadge}>
                      {booking.TechID === null ? (
                        (() => {
                          const isPending = (booking.BookingStatus || "").toLowerCase() === "pending";
                          const isPaid = Array.isArray(booking.Payments) && booking.Payments.length > 0;
                          if (isPending && isPaid) {
                            return (
                              <CustomText
                                style={[styles.techStatus, { color: color.primary }]}
                              >
                                
                              </CustomText>
                            );
                          }
                          return null;
                        })()
                      ) : (
                        <Ionicons
                          name="person"
                          size={20}
                          color={color.primary}
                          style={{ marginRight: 6 }}
                        />
                      )}
                    </View>
                  )}
                </View>
                { (booking.BookingStatus || '').toLowerCase() === 'startjourney' && booking.TechID !== null && (
                  <View style={styles.onTheWayRow}>
                    <Ionicons name="navigate" color={color.primary} size={16} style={{ marginRight: 6 }} />
                    <CustomText style={[globalStyles.f12Medium, { color: color.primary }]}>Technician is on the way</CustomText>
                  </View>
                )}
                <View style={styles.divider} />
                <View style={styles.bookingR1}>
                  <View style={styles.bookingCarImage}>
                    <Image
                      source={{
                        uri: `https://api.mycarsbuddy.com/Images${booking.VehicleImage}`,
                      }}
                      style={styles.bookingImage}
                      onError={(e) =>
                        console.log("Image load error:", e.nativeEvent.error)
                      }
                    />
                    <CustomText style={styles.title}>
                      {booking.ModelName} (
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
                        style={[
                          globalStyles.f10Regular,
                          { color: color.primary },
                        ]}
                      >
                        Booking Date:
                      </CustomText>
                      <CustomText style={[globalStyles.f12Bold]}>
                        {formatDate(booking.BookingDate)}
                      </CustomText>
                    </View>
                    <View style={styles.bookingDate}>
                      <CustomText
                        style={[
                          globalStyles.f10Regular,
                          { color: color.primary },
                        ]}
                      >
                        Booked Slot:
                      </CustomText>
                      <CustomText style={[globalStyles.f12Bold]}>
                        {booking.TimeSlot}
                      </CustomText>
                    </View>
                    <View style={styles.bookingDate}>
                      <CustomText
                        style={[
                          globalStyles.f10Regular,
                          { color: color.primary },
                        ]}
                      >
                        Service Amount:
                      </CustomText>
                      {/* <CustomText style={[globalStyles.f12Bold]}>
                        ₹ {booking.Payments[0].AmountPaid || "Payment Failed"}
                      </CustomText> */}
                      <CustomText style={[globalStyles.f12Bold]}>
                        {booking.Payments && booking.Payments.length > 0
                          ? `₹ ${booking.Payments[0].AmountPaid}`
                          : "Payment Failed"}
                      </CustomText>
                    </View>
                    <View style={styles.bookingDate}>
                      <CustomText
                        style={[
                          globalStyles.f10Regular,
                          { color: color.primary },
                        ]}
                      >
                        Payment Type:
                      </CustomText>
                      <CustomText style={[globalStyles.f12Bold]}>
                        {booking.PaymentMethod === "COS" ? "Pay On Completion" : "Online Payment"}
                      </CustomText>
                    </View>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.bookingServices}>
                  <CustomText
                    style={[
                      globalStyles.f10Regular,
                      globalStyles.mb2,
                      { color: color.primary },
                    ]}
                  >
                    Services Booked:
                  </CustomText>

                  {(booking.Packages || []).map((pkg, index) => (
                    <View
                      key={pkg.PackageID}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent:
                          index === booking.Packages.length - 1
                            ? "space-between" // ✅ last package row → push status to right
                            : "flex-start", // other rows → normal alignment
                        marginVertical: 4,
                      }}
                    >
                      {/* Left: icon + package name */}
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <FontAwesome5
                          name="tools"
                          size={16}
                          color={color.primary}
                          style={{ marginRight: 6 }}
                        />
                        <CustomText style={[globalStyles.f12Bold, { color: "#333", maxWidth: 180 }]} numberOfLines={1} ellipsizeMode="marquee">
                          {pkg.PackageName}
                        </CustomText>
                      </View>

                      {/* Right: status only for last package */}
                      
                    </View>
                  ))}
                </View>
                {booking.BookingStatus?.toLowerCase() === 'pending' && (!booking.Payments || booking.Payments.length === 0) && (
                  <View style={styles.resumeCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={styles.resumeIconWrap}>
                        <Ionicons name="warning" size={16} color={color.yellow} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <CustomText style={[globalStyles.f12Bold, { color: '#222' }]}>Payment Pending</CustomText>
                        <CustomText style={[globalStyles.f10Light, { color: '#666', marginTop: 2 }]}>To Pay: ₹{getPayableAmount(booking)}</CustomText>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => openRazorpayForBooking(booking)}
                      style={styles.resumeBtn}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="refresh-outline" size={16} color={color.black} style={{ marginRight: 6 }} />
                      <CustomText style={[globalStyles.f12Bold, { color: color.black }]}>Pay Now</CustomText>
                    </TouchableOpacity>
                  </View>
                )}
                {booking.BookingStatus?.toLowerCase() === "completed" && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.reviewSection}>
                      <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() =>
                          navigation.navigate("Reviews", { booking })
                        }
                      >
                        <CustomText style={styles.reviewButtonText}>
                          Write a Review
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
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
  countBadge: {
    marginLeft: 6,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  countBadgeInactive: {
    backgroundColor: '#eee',
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
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Android shadow
  },
  journeyCard: {
    borderWidth: 1,
    borderColor: color.primary,
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bookingR1: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  bookingID: {
    ...globalStyles.f10Bold,

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
  },
  bookingImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#eee",
    resizeMode: "contain",
  },
  techStatus: {
    ...globalStyles.f10Bold,
    // color: "#666",
  },
  techBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    borderBottomColor: "#ededed",
    borderBottomWidth: 1,
    marginVertical: 8,
  },
  onTheWayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 4,
  },
  resumeCard: {
    marginTop: 8,
    backgroundColor: '#F7FDFB',
    borderWidth: 1,
    borderColor: 'rgba(1,127,119,0.15)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resumeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,193,7,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBtn: {
    backgroundColor: color.white,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'column',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingDetails: {
    display: "flex",
    flexDirection: "column",
    alignContent: "flex-start",
    flex: 1,
    gap: 4,
    padding: 0,
  },
  bookingDate: {
    display: "flex",
    flexDirection: "column",
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 6,
  },
  reviewSection: {
    alignItems: "center",
    marginTop: 14,
  },
  reviewButton: {
    backgroundColor: color.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  reviewButtonText: {
    ...globalStyles.f12Medium,
    color: "#fff",
  },
});
