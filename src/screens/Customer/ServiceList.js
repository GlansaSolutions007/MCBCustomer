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
  Modal,
  TextInput,
  Text,
  KeyboardAvoidingView,
  Keyboard,
  AppState,
} from "react-native";
import moment from "moment";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import CustomText from "../../components/CustomText";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import { API_URL, RAZORPAY_KEY, API_IMAGE_URL } from "@env";
import RazorpayCheckout from "react-native-razorpay";
import * as Notifications from "expo-notifications";
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
  const [selectedTab, setSelectedTab] = useState("Bookings");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const tabs = ["Bookings", "Completed", "Cancelled"];
  const { refreshing, onRefresh } = useGlobalRefresh(fetchBookings);
  const isFetchingRef = useRef(false);
  const appState = useRef(AppState.currentState);

  // Reschedule modal state
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Repay Schedule modal state
  const [repayModalVisible, setRepayModalVisible] = useState(false);
  const [repayBooking, setRepayBooking] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [repayDate, setRepayDate] = useState('');
  const [repayTimeSlot, setRepayTimeSlot] = useState('');
  const [repayTimeSlots, setRepayTimeSlots] = useState([]);
  const [repayLoading, setRepayLoading] = useState(false);
  const [repayCurrentWeekStart, setRepayCurrentWeekStart] = useState(moment().startOf("day"));
  const [repaySelectedDate, setRepaySelectedDate] = useState(moment().startOf("day"));

  // Calendar and time slot state for reschedule
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf("day"));
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState(moment().startOf("day"));
  const [selectedRescheduleTimes, setSelectedRescheduleTimes] = useState([]);
  const [rescheduleTimeSlots, setRescheduleTimeSlots] = useState([]);
  const [rescheduleTimeError, setRescheduleTimeError] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showReasonOnly, setShowReasonOnly] = useState(false);

  // Enable LayoutAnimation on Android for smooth transitions
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
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
      isFetchingRef.current = false;
    }
  }, []);

  // Reload bookings every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused, fetching bookings...");
      fetchBookings();
      return () => { };
    }, [fetchBookings])
  );

  // Refresh when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        fetchBookings();
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, [fetchBookings]);

  // Realtime: Listen for booking status change notifications and update UI
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      try {
        const data = notification?.request?.content?.data || {};
        if (data?.event === "booking_status_changed" && data?.bookingId) {
          const newStatus = (data?.status || "").toString();
          setBookings((prev) => {
            return (prev || []).map((b) =>
              b.BookingID === data.bookingId
                ? { ...b, BookingStatus: newStatus }
                : b
            );
          });
        }
      } catch (e) {
        console.log("notification parse error", e?.message || e);
      }
    });
    return () => {
      try { sub && Notifications.removeNotificationSubscription(sub); } catch { }
    };
  }, []);

  // useEffect(() => {
  //   fetchBookings();
  // }, [fetchBookings]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    console.log("Manual refresh triggered");
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onRefresh();
  }, [onRefresh]);

  const filteredBookings = (bookings || []).filter((b) => {
    const status = (b.BookingStatus || "").toLowerCase();
    console.log("Booking status:", status, "Selected tab:", selectedTab);
    if (selectedTab === "Bookings") {
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

  const updateBookingStatus = async (bookingID, status) => {
    try {
      const token = await getToken();
      const payload = {
        bookingID: bookingID,
        bookingStatus: status
      };

      console.log("Updating booking status:", payload);

      const response = await axios.put(
        `${API_URL}Bookings/booking-status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Booking status update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to update booking status:", error?.response || error);
      throw error;
    }
  };

  // const openRazorpayForBooking = async (booking) => {

  //   try {
  //     const amount = getPayableAmount(booking);
  //     const token = await getToken();

  //     let orderId = null;
  //     try {
  //       const payload = {
  //         // bookingID: booking.BookingID,
  //         BookingTrackID: booking.BookingTrackID,
  //         BookingDate: booking.BookingDate,
  //         TimeSlot: booking.TimeSlot,
  //         PaymentMethod: "Razorpay",
  //         BookingFrom: "app",
  //         CouponAmount: booking.CouponAmount,
  //         GSTAmount: booking.GSTAmount,
  //         TotalAmount: booking.TotalPrice,
  //       };

  //       const res = await axios.put(
  //         `${API_URL}Bookings/update-booking`,
  //         payload,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );

  //       orderId =
  // res?.data?.orderID ||
  // res?.data?.razorpay?.orderID ||
  // res?.data?.razorpayOrderId ||
  // null;
  //       console.log("Order ID:", orderId);
  //     } catch (e) {
  //       console.log(
  //         "create-order not available, proceeding without order_id",
  //         e?.response?.data || e?.message
  //       );
  //     }

  //     const options = {
  //       description: "MyCarBuddy Service Payment",
  //       image: "https://mycarsbuddy.com/logo2.png",
  //       currency: "INR",
  //       key: RAZORPAY_KEY,
  //       amount: amount * 100, // paise
  //       name: "MyCarBuddy | powered by Glansa Solutions",
  //       order_id: orderId || undefined,
  //       prefill: {},
  //       theme: { color: color.primary },
  //     };

  //     RazorpayCheckout.open(options)
  //       .then(async (data) => {
  //         try {
  //           const confirmPayload = {
  //             bookingID: booking.BookingID,
  //             amountPaid: amount,
  //             razorpayPaymentId: data?.razorpay_payment_id,
  //             razorpayOrderId: data?.razorpay_order_id,
  //             razorpaySignature: data?.razorpay_signature,
  //             paymentMode: "Razorpay",
  //           };

  //           await axios.post(
  //             `${API_URL}Bookings/confirm-Payment`,
  //             confirmPayload,
  //             {
  //               headers: {
  //                 Authorization: `Bearer ${token}`,
  //                 "Content-Type": "application/json",
  //               },
  //             }
  //           );

  //           // Refresh list
  //           fetchBookings();
  //         } catch (err) {
  //           console.error(
  //             "Payment confirmation failed:",
  //             err?.response?.data || err.message || err
  //           );
  //         }
  //       })
  //       .catch(async (err) => {
  //         try {
  //           await updateBookingStatus(booking.BookingID, "Failed"); // ✅ fixed
  //         } catch (statusErr) {
  //           console.warn("Failed to update booking status:", statusErr.message);
  //         }
  //         console.log(
  //           "Payment cancelled/failed:",
  //           err?.data || err?.message || err
  //         );
  //       });
  //   } catch (error) {
  //     console.error(
  //       "Failed to initiate Razorpay:",
  //       error?.response?.data || error.message || error
  //     );
  //   }
  // };


  const counts = {
    Bookings: (bookings || []).filter((b) => {
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

  const handleReschedule = (booking) => {
    console.log('Opening reschedule modal for booking:', booking);
    setSelectedBooking(booking);
    setNewDate('');
    setReason('');
    setSelectedRescheduleTimes([]);
    setRescheduleTimeError('');

    // Set minimum date based on current booking date
    const bookingDate = moment(booking.BookingDate);
    const today = moment().startOf("day");

    if (bookingDate.isSame(today, "day")) {
      // If booking is today, set minimum to 2 hours from now
      const minTime = moment().add(2, 'hours');
      setSelectedRescheduleDate(minTime.startOf("day"));
      setCurrentWeekStart(minTime.startOf("day"));
    } else {
      // If booking is future, allow rescheduling to any future date
      setSelectedRescheduleDate(today);
      setCurrentWeekStart(today);
    }

    setRescheduleModalVisible(true);
    console.log('Modal visibility set to true');
  };

  const getWeekDates = () => {
    return [...Array(7)].map((_, i) => currentWeekStart.clone().add(i, "days"));
  };

  const goToNextWeek = () => {
    const nextWeekStart = currentWeekStart.clone().add(7, "days");
    setCurrentWeekStart(nextWeekStart);
    setSelectedRescheduleDate(nextWeekStart);
  };

  const goToPreviousWeek = () => {
    const prevWeekStart = currentWeekStart.clone().subtract(7, "days");
    const today = moment().startOf("day");
    if (!prevWeekStart.isBefore(today)) {
      setCurrentWeekStart(prevWeekStart);
      setSelectedRescheduleDate(prevWeekStart);
    }
  };

  const isAtCurrentWeek = currentWeekStart.isSame(moment().startOf("day"), "day");

  const fetchRescheduleTimeSlots = async () => {
    try {
      const response = await axios.get(`${API_URL}TimeSlot`);
      const sDate = selectedRescheduleDate.format("YYYY-MM-DD");
      const currentDate = moment().format("YYYY-MM-DD");
      const currentTime = moment();

      const slots = response.data
        .filter((slot) => slot.Status)
        .filter((slot) => {
          if (currentDate === sDate) {
            const startTime = moment(slot.StartTime, "HH:mm:ss");
            // For today, only show slots 2 hours from now
            const minTime = moment().add(2, 'hours');
            return startTime.isAfter(minTime);
          } else {
            return true; // For future dates, include all slots
          }
        })
        .sort((a, b) => {
          return moment(a.StartTime, "HH:mm:ss").diff(
            moment(b.StartTime, "HH:mm:ss")
          );
        })
        .map((slot) => ({
          ...slot,
          label: `${moment(slot.StartTime, "HH:mm:ss").format(
            "hh:mm A"
          )} - ${moment(slot.EndTime, "HH:mm:ss").format("hh:mm A")}`,
        }));

      setRescheduleTimeSlots(slots);
      setRescheduleTimeError("");
    } catch (error) {
      console.error("Failed to fetch reschedule time slots:", error);
    }
  };

  useEffect(() => {
    if (rescheduleModalVisible) {
      fetchRescheduleTimeSlots();
    }
  }, [selectedRescheduleDate, rescheduleModalVisible]);

  useEffect(() => {
    if (repayModalVisible) {
      fetchRepayTimeSlots();
    }
  }, [repaySelectedDate, repayModalVisible]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      setShowReasonOnly(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setShowReasonOnly(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const submitReschedule = async () => {
    if (!reason.trim()) {
      setReasonError("Please provide a reason for rescheduling.");
      console.log('Error: Please provide a reason for rescheduling');
      return;
    } else {
      setReasonError("");
    }

    if (selectedRescheduleTimes.length === 0) {
      setRescheduleTimeError("Please select an available time slot.");
      return;
    }

    setRescheduleLoading(true);
    try {
      const token = await getToken();
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;

      // Get selected time slot labels
      const selectedTimeLabels = selectedRescheduleTimes.map(id =>
        rescheduleTimeSlots.find(t => t.TsID === id)?.label
      ).filter(Boolean);

      const payload = {
        bookingID: selectedBooking.BookingID,
        reason: reason.trim(),
        oldSchedule: selectedBooking.BookingDate,
        newSchedule: selectedRescheduleDate.format("YYYY-MM-DD"),
        timeSlot: selectedTimeLabels.join(", "),
        requestedBy: custID,
        Status: ''
      };

      console.log('Reschedule payload:', payload);

      const response = await axios.post(
        `${API_URL}Reschedules`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Reschedule response:', response.data);

      // Close modal and refresh bookings on success
      setRescheduleModalVisible(false);
      fetchBookings();

    } catch (error) {
      console.error('Reschedule failed:', error?.response || error);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const closeRescheduleModal = () => {
    Keyboard.dismiss();
    setRescheduleModalVisible(false);
    setSelectedBooking(null);
    setNewDate('');
    setReason('');
    setSelectedRescheduleTimes([]);
    setRescheduleTimeError('');
    setShowReasonOnly(false);
  };

  // Repay Schedule Functions
  const handleRepaySchedule = (booking) => {
    console.log('Opening repay schedule modal for booking:', booking);
    setRepayBooking(booking);
    setSelectedPaymentMethod('');
    setRepayDate('');
    setRepayTimeSlot('');
    setRepayTimeSlots([]);
    setRepayCurrentWeekStart(moment().startOf("day"));
    setRepaySelectedDate(moment().startOf("day"));
    setRepayModalVisible(true);
  };

  const getRepayWeekDates = () => {
    return [...Array(7)].map((_, i) => repayCurrentWeekStart.clone().add(i, "days"));
  };

  const goToRepayNextWeek = () => {
    const nextWeekStart = repayCurrentWeekStart.clone().add(7, "days");
    setRepayCurrentWeekStart(nextWeekStart);
    setRepaySelectedDate(nextWeekStart);
  };

  const goToRepayPreviousWeek = () => {
    const prevWeekStart = repayCurrentWeekStart.clone().subtract(7, "days");
    const today = moment().startOf("day");
    if (!prevWeekStart.isBefore(today)) {
      setRepayCurrentWeekStart(prevWeekStart);
      setRepaySelectedDate(prevWeekStart);
    }
  };

  const isRepayAtCurrentWeek = repayCurrentWeekStart.isSame(moment().startOf("day"), "day");

  const fetchRepayTimeSlots = async () => {
    try {
      const response = await axios.get(`${API_URL}TimeSlot`);
      const sDate = repaySelectedDate.format("YYYY-MM-DD");
      const currentDate = moment().format("YYYY-MM-DD");

      const slots = response.data
        .filter((slot) => slot.Status)
        .filter((slot) => {
          if (currentDate === sDate) {
            const startTime = moment(slot.StartTime, "HH:mm:ss");
            const minTime = moment().add(2, 'hours');
            return startTime.isAfter(minTime);
          } else {
            return true;
          }
        })
        .sort((a, b) => {
          return moment(a.StartTime, "HH:mm:ss").diff(
            moment(b.StartTime, "HH:mm:ss")
          );
        })
        .map((slot) => ({
          ...slot,
          label: `${moment(slot.StartTime, "HH:mm:ss").format(
            "hh:mm A"
          )} - ${moment(slot.EndTime, "HH:mm:ss").format("hh:mm A")}`,
        }));

      setRepayTimeSlots(slots);
    } catch (error) {
      console.error("Failed to fetch repay time slots:", error);
    }
  };

  const submitRepaySchedule = async () => {
    if (!selectedPaymentMethod) {
      console.log('Error: Please select a payment method');
      return;
    }

    if (!repayTimeSlot) {
      console.log('Error: Please select a time slot');
      return;
    }

    setRepayLoading(true);
    try {
      const token = await getToken();
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;

      if (selectedPaymentMethod === 'online') {
        // For online payment, process Razorpay payment first
        await processRepayRazorpayPayment(repayBooking);
      } else {
        const formData = new FormData();
        formData.append("BookingTrackID", repayBooking.BookingTrackID);
        formData.append("BookingDate", repaySelectedDate.format("YYYY-MM-DD"));
        formData.append(
          "TimeSlot",
          repayTimeSlots.find(slot => slot.TsID === repayTimeSlot)?.label || ''
        );
        formData.append("PaymentMethod", "COS");
        formData.append("BookingFrom", "app");
        formData.append("CouponAmount", repayBooking.CouponAmount);
        formData.append("GSTAmount", repayBooking.GSTAmount);
        formData.append("TotalAmount", repayBooking.TotalPrice);

        const res = await axios.put(
          `${API_URL}Bookings/update-booking`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );


        console.log('Repay schedule response:', res.data);

        // Close modal and refresh bookings on success
        setRepayModalVisible(false);
        fetchBookings();
      }

    } catch (error) {
      console.error('Repay schedule failed:', error?.response || error);
    } finally {
      setRepayLoading(false);
    }
  };

  const processRepayRazorpayPayment = async (booking) => {
    try {
      const amount = getPayableAmount(booking);
      const token = await getToken();

      let orderId = null;
      try {
        // Build FormData for update-booking
        const formData = new FormData();
        formData.append("BookingTrackID", booking.BookingTrackID);
        formData.append("BookingDate", repaySelectedDate.format("YYYY-MM-DD"));
        formData.append(
          "TimeSlot",
          repayTimeSlots.find((slot) => slot.TsID === repayTimeSlot)?.label || ""
        );
        formData.append("PaymentMethod", "Razorpay");
        formData.append("BookingFrom", "app");
        formData.append("CouponAmount", booking.CouponAmount);
        formData.append("GSTAmount", booking.GSTAmount);
        formData.append("TotalAmount", booking.TotalPrice);

        const res = await axios.put(
          `${API_URL}Bookings/update-booking`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        orderId = res?.data?.orderID || res?.data?.razorpay?.orderID || null;
      } catch (e) {
        console.log(
          "create-order not available, proceeding without order_id",
          e?.response?.data || e?.message
        );
      }

      const options = {
        description: "MyCarBuddy Service Repay Payment",
        image: "https://mycarsbuddy.com/logo2.png",
        currency: "INR",
        key: RAZORPAY_KEY,
        amount: amount * 100, // paise
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
              scheduledDate: repaySelectedDate.format("YYYY-MM-DD"),
              timeSlot: repayTimeSlots.find(slot => slot.TsID === repayTimeSlot)?.label || '',
            };

            await axios.post(
              `${API_URL}Bookings/confirm-Payment`,
              confirmPayload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            // Close modal and refresh bookings
            setRepayModalVisible(false);
            fetchBookings();
          } catch (err) {
            console.error(
              "Payment confirmation failed:",
              err?.response?.data || err.message || err
            );
          }
        })
        .catch(async (err) => {
          try {
            await updateBookingStatus(booking.BookingID, "Failed");
          } catch (statusErr) {
            console.warn("Failed to update booking status:", statusErr.message);
          }
          console.log(
            "Payment cancelled/failed:",
            err?.data || err?.message || err
          );
        });
    } catch (error) {
      console.error(
        "Failed to initiate Razorpay:",
        error?.response?.data || error.message || error
      );
    }
  };

  const closeRepayModal = () => {
    setRepayModalVisible(false);
    setRepayBooking(null);
    setSelectedPaymentMethod('');
    setRepayDate('');
    setRepayTimeSlot('');
    setRepayTimeSlots([]);
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
            <View
              key={booking.BookingID}
              style={[
                styles.bookingCard,
                (booking.BookingStatus || '').toLowerCase() === 'startjourney' && booking.TechID !== null ? styles.journeyCard : null,
              ]}
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
                {booking.BookingStatus?.toLowerCase() === "cancelled" && booking.Reason && (
                  <View style={{
                    backgroundColor: "#FFF3F3",
                    borderRadius: 8,
                    padding: 10,
                    marginTop: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: "red"
                  }}>
                    <CustomText style={[globalStyles.f10Bold, { color: "red" }]}>
                      Reason: {booking.Reason}
                    </CustomText>
                  </View>
                )}
                {(booking.BookingStatus || '').toLowerCase() === 'startjourney' && booking.TechID !== null && (
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
                        uri: `${API_IMAGE_URL}${booking.VehicleImage}`,
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
                      <View>
                        {booking.TimeSlot?.split(",").map((slot, index) => (
                          <CustomText key={index} style={[globalStyles.f12Bold]}>
                            {slot.trim()}
                          </CustomText>
                        ))}
                      </View>
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
                  {/* Header */}
                  <CustomText
                    style={[
                      globalStyles.f10Regular,
                      globalStyles.mb2,
                      { color: color.primary },
                    ]}
                  >
                    Services Booked:
                  </CustomText>

                  {/* Package List */}
                  {(booking.Packages || []).map((pkg, index) => (
                    <View
                      key={pkg.PackageID}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginVertical: 4,
                      }}
                    >
                      {/* Left: icon + package name */}
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <FontAwesome5
                          name="tools"
                          size={16}
                          color={color.primary}
                          style={{ marginRight: 6 }}
                        />
                        <CustomText
                          style={[globalStyles.f12Bold, { color: "#333", maxWidth: 180 }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {pkg.PackageName}
                        </CustomText>
                      </View>

                      {/* Right: show button only for last package */}
                      {index === booking.Packages.length - 1 && (
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("BookingsInnerPage", { booking })
                          }
                          style={{
                            backgroundColor: color.primary,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 6,
                          }}
                        >
                          <CustomText style={[globalStyles.f10Bold, { color: "#fff" }]}>
                            View Details
                          </CustomText>
                        </TouchableOpacity>
                      )}
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
                      onPress={() => {
                        const bookingDate = moment(booking.BookingDate);
                        const today = moment().startOf("day");

                        // if (bookingDate.isSame(today, "day")) {
                        //   // Same day - proceed with immediate payment
                        //   openRazorpayForBooking(booking);
                        // } else {
                        //   // After booking date - show repay schedule modal
                        handleRepaySchedule(booking);
                        // }
                      }}
                      style={styles.resumeBtn}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="refresh-outline" size={16} color={color.black} style={{ marginRight: 6 }} />
                      <CustomText style={[globalStyles.f12Bold, { color: color.black }]}>
                        {/* {(() => {
                          const bookingDate = moment(booking.BookingDate);
                          const today = moment().startOf("day");
                          return bookingDate.isSame(today, "day") ? "Pay Now" : "Repay Schedule";
                        })()} */}
                        Pay Now
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Reschedule Button - Show for pending and confirmed bookings */}
                {((
                  booking.BookingStatus?.toLowerCase() === "confirmed" ||
                  booking.BookingStatus?.toLowerCase() === "pending"
                )) && (
                    <View style={styles.rescheduleCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={styles.rescheduleIconWrap}>
                          <Ionicons name="calendar-outline" size={16} color={color.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <CustomText style={[globalStyles.f12Bold, { color: '#222' }]}>Need to reschedule?</CustomText>
                          <CustomText style={[globalStyles.f10Light, { color: '#666', marginTop: 2 }]}>Change your service date</CustomText>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleReschedule(booking)}
                        style={styles.rescheduleBtn}
                        activeOpacity={0.9}
                      >
                        <Ionicons name="calendar" size={16} color={color.white} style={{ marginRight: 6 }} />
                        <CustomText style={[globalStyles.f12Bold, { color: color.white }]}>Reschedule</CustomText>
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
            </View>
          ))
        )}
      </ScrollView>

      {/* Reschedule Modal */}
      {console.log('Modal visibility state:', rescheduleModalVisible)}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rescheduleModalVisible}
        onRequestClose={closeRescheduleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.rescheduleModalContent,
            showReasonOnly && styles.reasonOnlyModal
          ]}>
            {!showReasonOnly && (
              <>
                <View style={styles.modalHeader}>
                  <CustomText style={[globalStyles.f14Bold, { color: color.primary }]}>
                    Reschedule Service
                  </CustomText>
                  <TouchableOpacity onPress={closeRescheduleModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={color.black} />
                  </TouchableOpacity>
                </View>

                {selectedBooking && (
                  <View style={styles.bookingInfo}>
                    <CustomText style={[globalStyles.f10Bold, { color: color.primary, marginBottom: 8 }]}>
                      Current Schedule:
                    </CustomText>
                    <CustomText style={[globalStyles.f12Bold, { color: color.black, marginBottom: 4 }]}>
                      {formatDate(selectedBooking.BookingDate)}
                    </CustomText>
                    <CustomText style={[globalStyles.f10Regular, { color: color.muted }]}>
                      Time: {selectedBooking.TimeSlot}
                    </CustomText>
                  </View>
                )}

                {/* Calendar Section */}
                <View style={styles.calendarSection}>
                  <CustomText style={[globalStyles.f12Bold, { color: color.black, marginBottom: 12 }]}>
                    Select New Date
                  </CustomText>

                  <View style={styles.calendarHeader}>
                    <CustomText style={[globalStyles.f12Bold, { color: color.black }]}>
                      {currentWeekStart.format("MMMM")}
                    </CustomText>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={goToPreviousWeek}
                        disabled={isAtCurrentWeek}
                        style={[
                          styles.weekNavButton,
                          { backgroundColor: isAtCurrentWeek ? "#eee" : "#b9b7b7ff" }
                        ]}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={20}
                          color={isAtCurrentWeek ? "#ccc" : "#000"}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={goToNextWeek}
                        style={[styles.weekNavButton, { backgroundColor: "#b9b7b7ff" }]}
                      >
                        <Ionicons name="chevron-forward" size={20} color="#000" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.weekDatesContainer}>
                    {getWeekDates().map((date) => {
                      const isSelected = date.isSame(selectedRescheduleDate, "day");
                      const isPast = date.isBefore(moment().startOf("day"));
                      return (
                        <TouchableOpacity
                          key={date.format("YYYY-MM-DD")}
                          style={styles.dateButton}
                          onPress={() => setSelectedRescheduleDate(date)}
                          disabled={isPast}
                        >
                          <CustomText
                            style={[
                              { color: isSelected ? color.secondary : isPast ? "#ccc" : "black" },
                              globalStyles.f10Bold,
                            ]}
                          >
                            {date.format("dd").charAt(0)}
                          </CustomText>
                          <View
                            style={[
                              styles.dateCircle,
                              {
                                backgroundColor: isSelected ? color.primary : isPast ? "#f0f0f0" : "#F0F0F0",
                              }
                            ]}
                          >
                            <CustomText
                              style={[
                                { color: isSelected ? "#fff" : isPast ? "#ccc" : "#000" },
                                globalStyles.f10Bold,
                              ]}
                            >
                              {date.format("DD")}
                            </CustomText>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Time Slots Section */}
                <View style={styles.timeSlotsSection}>
                  <CustomText style={[globalStyles.f12Bold, { color: color.black, marginBottom: 12 }]}>
                    Select Time Slot
                  </CustomText>

                  {rescheduleTimeSlots.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.timeSlotContainer}
                    >
                      {rescheduleTimeSlots.map((slot) => (
                        <TouchableOpacity
                          key={slot.TsID}
                          style={[
                            styles.timeSlot,
                            selectedRescheduleTimes.includes(slot.TsID) && styles.selectedTimeSlot,
                          ]}
                          onPress={() => {
                            if (selectedRescheduleTimes.includes(slot.TsID)) {
                              setSelectedRescheduleTimes(selectedRescheduleTimes.filter(id => id !== slot.TsID));
                            } else {
                              setSelectedRescheduleTimes([...selectedRescheduleTimes, slot.TsID]);
                            }
                            setRescheduleTimeError("");
                          }}
                        >
                          <CustomText
                            style={[
                              {
                                color: selectedRescheduleTimes.includes(slot.TsID) ? "white" : color.secondary,
                              },
                              globalStyles.f10Bold,
                            ]}
                          >
                            {slot.label}
                          </CustomText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View>
                      <CustomText style={[globalStyles.f14Bold, { color: "#856404" }]}>
                        No available slots
                      </CustomText>
                      <CustomText style={[globalStyles.f12Regular, { color: "#856404", marginTop: 4 }]}>
                        Please select another date
                      </CustomText>
                    </View>
                  )}

                  {rescheduleTimeError ? (
                    <CustomText style={[globalStyles.f12Regular, { color: "red", marginTop: 8 }]}>
                      {rescheduleTimeError}
                    </CustomText>
                  ) : null}
                </View>
              </>
            )}

            {/* Reason Section - Always visible */}
            <View style={styles.inputContainer}>
              <CustomText style={[globalStyles.f12Bold, { color: color.black, marginBottom: 8 }]}>
                Reason for Reschedule <Text style={{ color: 'red' }}>*</Text>
              </CustomText>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={(t) => {
                  setReason(t);
                  if (t && t.trim().length > 0) {
                    setReasonError("");
                  }
                }}
                placeholder="Please provide a reason for rescheduling..."
                placeholderTextColor={color.muted}
                multiline={!isKeyboardVisible}
                numberOfLines={isKeyboardVisible ? 1 : (showReasonOnly ? 8 : 3)}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => {
                  if (reason && reason.trim().length > 0) {
                    submitReschedule();
                  } else {
                    Keyboard.dismiss();
                  }
                }}
              />
              {reasonError ? (
                <CustomText style={[globalStyles.f12Regular, { color: 'red', marginTop: 6 }]}>
                  {reasonError}
                </CustomText>
              ) : null}
            </View>

            {!showReasonOnly && (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={closeRescheduleModal}
                  style={[styles.modalButton, styles.cancelButton]}
                  disabled={rescheduleLoading}
                >
                  <CustomText style={[globalStyles.f12Bold, { color: color.black }]}>
                    Cancel
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={submitReschedule}
                  style={[styles.modalButton, styles.submitButton]}
                  disabled={rescheduleLoading}
                >
                  {rescheduleLoading ? (
                    <ActivityIndicator size="small" color={color.white} />
                  ) : (
                    <>
                      <Ionicons name="calendar" size={16} color={color.white} style={{ marginRight: 6 }} />
                      <CustomText style={[globalStyles.f12Bold, { color: color.white }]}>
                        Submit Request
                      </CustomText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Repay Schedule Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={repayModalVisible}
        onRequestClose={closeRepayModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rescheduleModalContent}>
            <View style={styles.modalHeader}>
              <CustomText style={[globalStyles.f14Bold, { color: color.primary }]}>
                Repay Schedule
              </CustomText>
              <TouchableOpacity onPress={closeRepayModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={color.black} />
              </TouchableOpacity>
            </View>

            {repayBooking && (
              <View style={styles.bookingInfo}>
                <CustomText style={[globalStyles.f10Bold, { color: color.primary, marginBottom: 8 }]}>
                  Booking Details:
                </CustomText>
                <CustomText style={[globalStyles.f12Bold, { color: color.black, marginBottom: 4 }]}>
                  BID: {repayBooking.BookingTrackID}
                </CustomText>
                <CustomText style={[globalStyles.f10Regular, { color: color.muted, marginBottom: 4 }]}>
                  Original Date: {formatDate(repayBooking.BookingDate)}
                </CustomText>
                <CustomText style={[globalStyles.f10Regular, { color: color.muted, marginBottom: 4 }]}>
                  Amount: ₹{getPayableAmount(repayBooking)}
                </CustomText>
              </View>
            )}

            {/* Payment Method Selection */}
            <View style={styles.paymentMethodSection}>
              <CustomText style={[globalStyles.f12Bold, { color: color.black, marginBottom: 12 }]}>
                Select Payment Method
              </CustomText>

              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  selectedPaymentMethod === 'cash' && styles.selectedPaymentMethod
                ]}
                onPress={() => setSelectedPaymentMethod('cash')}
              >
                <View style={styles.paymentMethodContent}>
                  <Ionicons
                    name="cash-outline"
                    size={24}
                    color={selectedPaymentMethod === 'cash' ? color.primary : color.muted}
                  />
                  <View style={styles.paymentMethodText}>
                    <CustomText style={[
                      globalStyles.f12Bold,
                      { color: selectedPaymentMethod === 'cash' ? color.primary : color.black }
                    ]}>
                      Cash on Service
                    </CustomText>
                    <CustomText style={[globalStyles.f10Regular, { color: color.muted }]}>
                      Pay when technician arrives
                    </CustomText>
                  </View>
                </View>
                {selectedPaymentMethod === 'cash' && (
                  <Ionicons name="checkmark-circle" size={20} color={color.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  selectedPaymentMethod === 'online' && styles.selectedPaymentMethod
                ]}
                onPress={() => setSelectedPaymentMethod('online')}
              >
                <View style={styles.paymentMethodContent}>
                  <Ionicons
                    name="card-outline"
                    size={24}
                    color={selectedPaymentMethod === 'online' ? color.primary : color.muted}
                  />
                  <View style={styles.paymentMethodText}>
                    <CustomText style={[
                      globalStyles.f12Bold,
                      { color: selectedPaymentMethod === 'online' ? color.primary : color.black }
                    ]}>
                      Online Payment
                    </CustomText>
                    <CustomText style={[globalStyles.f10Regular, { color: color.muted }]}>
                      Pay now with Razorpay
                    </CustomText>
                  </View>
                </View>
                {selectedPaymentMethod === 'online' && (
                  <Ionicons name="checkmark-circle" size={20} color={color.primary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Calendar Section - Only show if payment method is selected */}
            {selectedPaymentMethod && (
              <View style={styles.calendarSection}>
                <CustomText style={[globalStyles.f12Bold, { color: color.black, marginBottom: 12 }]}>
                  Select Service Date
                </CustomText>

                <View style={styles.calendarHeader}>
                  <CustomText style={[globalStyles.f12Bold, { color: color.black }]}>
                    {repayCurrentWeekStart.format("MMMM")}
                  </CustomText>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={goToRepayPreviousWeek}
                      disabled={isRepayAtCurrentWeek}
                      style={[
                        styles.weekNavButton,
                        { backgroundColor: isRepayAtCurrentWeek ? "#eee" : "#b9b7b7ff" }
                      ]}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={20}
                        color={isRepayAtCurrentWeek ? "#ccc" : "#000"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={goToRepayNextWeek}
                      style={[styles.weekNavButton, { backgroundColor: "#b9b7b7ff" }]}
                    >
                      <Ionicons name="chevron-forward" size={20} color="#000" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.weekDatesContainer}>
                  {getRepayWeekDates().map((date) => {
                    const isSelected = date.isSame(repaySelectedDate, "day");
                    const isPast = date.isBefore(moment().startOf("day"));
                    return (
                      <TouchableOpacity
                        key={date.format("YYYY-MM-DD")}
                        style={styles.dateButton}
                        onPress={() => setRepaySelectedDate(date)}
                        disabled={isPast}
                      >
                        <CustomText
                          style={[
                            { color: isSelected ? color.secondary : isPast ? "#ccc" : "black" },
                            globalStyles.f10Bold,
                          ]}
                        >
                          {date.format("dd").charAt(0)}
                        </CustomText>
                        <View
                          style={[
                            styles.dateCircle,
                            {
                              backgroundColor: isSelected ? color.primary : isPast ? "#f0f0f0" : "#F0F0F0",
                            }
                          ]}
                        >
                          <CustomText
                            style={[
                              { color: isSelected ? "#fff" : isPast ? "#ccc" : "#000" },
                              globalStyles.f10Bold,
                            ]}
                          >
                            {date.format("DD")}
                          </CustomText>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Time Slots Section - Show for both payment methods */}
            {selectedPaymentMethod && (
              <View style={styles.timeSlotsSection}>
                <View style={styles.timeSlotHeader}>
                  <CustomText style={[globalStyles.f12Bold, { color: color.black }]}>
                    Select Time Slot
                  </CustomText>
                  {repayTimeSlot && (
                    <View style={styles.selectedSlotIndicator}>
                      <Ionicons name="checkmark-circle" size={16} color={color.primary} />
                      <CustomText style={[globalStyles.f10Bold, { color: color.primary, marginLeft: 4 }]}>
                        Selected
                      </CustomText>
                    </View>
                  )}
                </View>

                {repayTimeSlots.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timeSlotContainer}
                  >
                    {repayTimeSlots.map((slot) => (
                      <TouchableOpacity
                        key={slot.TsID}
                        style={[
                          styles.timeSlot,
                          repayTimeSlot === slot.TsID && styles.selectedTimeSlot,
                        ]}
                        onPress={() => setRepayTimeSlot(slot.TsID)}
                      >
                        <CustomText
                          style={[
                            {
                              color: repayTimeSlot === slot.TsID ? "white" : color.secondary,
                            },
                            globalStyles.f10Bold,
                          ]}
                        >
                          {slot.label}
                        </CustomText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noSlotsContainer}>
                    <Ionicons name="time-outline" size={24} color="#856404" />
                    <CustomText style={[globalStyles.f14Bold, { color: "#856404", marginTop: 8 }]}>
                      No available slots
                    </CustomText>
                    <CustomText style={[globalStyles.f12Regular, { color: "#856404", marginTop: 4 }]}>
                      Please select another date
                    </CustomText>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={closeRepayModal}
                style={[styles.modalButton, styles.cancelButton]}
                disabled={repayLoading}
              >
                <CustomText style={[globalStyles.f12Bold, { color: color.black }]}>
                  Cancel
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={submitRepaySchedule}
                style={[
                  styles.modalButton,
                  selectedPaymentMethod === 'cash' ? styles.cosButton : styles.submitButton
                ]}
                disabled={repayLoading || !selectedPaymentMethod || !repayTimeSlot}
              >
                {repayLoading ? (
                  <ActivityIndicator size="small" color={color.white} />
                ) : (
                  <>
                    <Ionicons
                      name={selectedPaymentMethod === 'cash' ? "cash" : "card"}
                      size={16}
                      color={color.white}
                      style={{ marginRight: 6 }}
                    />
                    <CustomText style={[globalStyles.f12Bold, { color: color.white }]}>
                      {selectedPaymentMethod === 'cash' ? 'Proceed Cash' : 'Proceed Online'}
                    </CustomText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  rescheduleCard: {
    marginTop: 8,
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: 'rgba(1,127,119,0.15)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rescheduleIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(1,127,119,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleBtn: {
    backgroundColor: color.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  keyboardAvoidingContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 5,
  },
  bookingInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: color.primary,
  },
  inputContainer: {
    marginBottom: 20,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: color.black,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 12,
    color: color.black,
    minHeight: 60,
    textAlignVertical: 'top',
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: color.primary,
    marginLeft: 10,
  },
  cosButton: {
    backgroundColor: color.secondary,
    marginLeft: 10,
  },
  rescheduleModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reasonOnlyModal: {
    maxHeight: '60%',
    justifyContent: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  calendarSection: {
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekNavButton: {
    borderRadius: 20,
    padding: 6,
  },
  weekDatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  timeSlotsSection: {
    marginBottom: 20,
  },
  timeSlotContainer: {
    paddingHorizontal: 4,
    gap: 10,
    alignItems: 'center',
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: color.secondary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  selectedTimeSlot: {
    backgroundColor: color.secondary,
  },
  noSlotsContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  paymentMethodSection: {
    marginBottom: 20,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedPaymentMethod: {
    borderColor: color.primary,
    backgroundColor: '#f0f9ff',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodText: {
    marginLeft: 12,
    flex: 1,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedSlotIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.primary,
  },
});
