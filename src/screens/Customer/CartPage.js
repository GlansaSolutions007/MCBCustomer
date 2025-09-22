import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  Modal,
  FlatList,
  Pressable,
  TouchableWithoutFeedback,
  ImageBackground,
  Alert,
  ActivityIndicator,
  AppState,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import CustomText from "../../components/CustomText";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../contexts/CartContext";
import RazorpayCheckout from "react-native-razorpay";
import { API_URL, API_IMAGE_URL, RAZORPAY_KEY } from "@env";
import bg from "../../../assets/images/info.png";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCoupon } from "../../contexts/CouponContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { all } from "axios";
import { getToken } from "../../utils/token";
// import { API_BASE_URL } from "@env";

import moment from "moment";
import CustomAlert from "../../components/CustomAlert";

const CartPage = () => {
  //
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressList, setAddressList] = useState([]);
  const [primaryAddress, setPrimaryAddress] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledTimeLabel, setScheduledTimeLabel] = useState(null);
  const [customerDetailsExpanded, setCustomerDetailsExpanded] = useState(false);
  const [customerName, setCustomerName] = useState(null);
  const [customerPhone, setCustomerPhone] = useState(null);
  const [customerEmail, setCustomerEmail] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertStatus, setAlertStatus] = useState("info"); // 'success', 'error', 'info'
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnClose, setAlertOnClose] = useState(() => () => setAlertVisible(false));
  // for selection of payment method
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [disable, setDisable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingTrackId, setBookingTrackId] = useState(null);
  const scrollViewRef = useRef(null);
  const [customerDetailsY, setCustomerDetailsY] = useState(0);
  const isFetching = useRef(false);
  const appState = useRef(AppState.currentState);

  const PENDING_PAYMENT_KEY = "pendingPayment";

  const setPendingPayment = async (data) => {
    try {
      await AsyncStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({ ...data, createdAt: Date.now() }));
    } catch {}
  };

  const clearPendingPayment = async () => {
    try {
      await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
    } catch {}
  };

  const getPendingPayment = async () => {
    try {
      const raw = await AsyncStorage.getItem(PENDING_PAYMENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const showCustomAlert = (status, title, message, onCloseCallback = () => { }) => {
    // Use setTimeout to ensure the alert shows immediately after state updates
    setTimeout(() => {
      setAlertStatus(status);
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertOnClose(() => () => {
        console.log('Alert closed, executing callback');
        setAlertVisible(false);
        onCloseCallback();
      });
      setAlertVisible(true);
    }, 50);
  };

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { cartItems, removeFromCart, clearCart } = useCart();

  const { appliedCoupon, setAppliedCoupon } = useCoupon();

  useEffect(() => {
    const loadPhone = async () => {
      const userData = await AsyncStorage.getItem("userData");
      console.log("userData in cart page:", userData);
      const user = JSON.parse(userData);
      if (user?.phone) {
        setCustomerPhone(user.phone);
        setCustomerName(user.name || "");
        setCustomerEmail(user.email || "");
      }
    };
    loadPhone();
  }, []);

  useEffect(() => {
    const getPrimaryVehicle = async () => {
      const id = await AsyncStorage.getItem("primaryVehicleId");
      console.log(id, "primary vehicle id in cart page");
      setVehicleId(id);
    };
    getPrimaryVehicle();
  }, []);

  // Reconcile pending payment when app returns to foreground and on focus
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        await reconcilePendingPayment();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      reconcilePendingPayment();
    }, [])
  );

  const reconcilePendingPayment = async () => {
    try {
      const pending = await getPendingPayment();
      if (!pending) return;

      const userData = await AsyncStorage.getItem("userData");
      const user = JSON.parse(userData || "null");
      if (!user?.custID) return;

      const res = await axios.get(`${API_URL}Bookings/${user.custID}`);
      const list = Array.isArray(res.data) ? res.data : [];
      const found = list.find((b) => b.BookingID === pending.bookingID);

      if (found && Array.isArray(found.Payments) && found.Payments.length > 0) {
        await clearPendingPayment();
        showCustomAlert(
          "success",
          "Payment Successful",
          `Booking Track ID: ${found.BookingTrackID}\nYour booking is confirmed!`
        );
        setTimeout(() => {
          clearCart();
          navigation.navigate('CustomerTabs', {
            screen: 'My Bookings',
            params: { screen: 'ServiceList' },
          });
        }, 1200);
      }
    } catch (e) {
      console.log("reconcilePendingPayment error", e?.message || e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const refreshPrimaryVehicle = async () => {
        try {
          const id = await AsyncStorage.getItem("primaryVehicleId");
          if (id !== vehicleId) {
            setVehicleId(id);
          }
        } catch (e) {
          console.warn("Failed to load primaryVehicleId on focus", e);
        }
      };
      refreshPrimaryVehicle();
    }, [vehicleId])
  );

  useFocusEffect(
    useCallback(() => {
      const loadSchedule = async () => {
        try {
          const date = await AsyncStorage.getItem("selectedDate");
          const timeLabel = await AsyncStorage.getItem("selectedTimeSlotLabel");
          if (date && timeLabel) {
            setScheduledDate(date);
            const parsedLabels = JSON.parse(timeLabel);
            setScheduledTimeLabel(parsedLabels.join(", "));
          } else {
            setScheduledDate(null);
            setScheduledTimeLabel(null);
          }
        } catch (e) {
          console.error("Error loading schedule:", e);
        }
      };

      loadSchedule();
    }, [])
  );

  const fetchAddresses = async (retryCount = 0) => {
    if (isFetching.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }
    isFetching.current = true;
    try {
      const userData = await AsyncStorage.getItem("userData");

      if (!userData) {
        console.warn("No userData found in AsyncStorage");

        if (retryCount < 2) {
          console.log(`Retrying fetchAddresses in 1 second... (attempt ${retryCount + 1})`);
          setTimeout(() => fetchAddresses(retryCount + 1), 1000);
        }
        return;
      }

      const parsedData = JSON.parse(userData);

      if (!parsedData || !parsedData.custID) {
        console.warn("Invalid userData or missing custID:", parsedData);

        if (retryCount < 2) {
          console.log(`Retrying fetchAddresses in 1 second... (attempt ${retryCount + 1})`);
          setTimeout(() => fetchAddresses(retryCount + 1), 1000);
        }
        return;
      }

      console.log(parsedData.custID, "user data in cart page");
      const custID = parsedData.custID;
      console.log(custID, "customer id in cart page");

      const response = await axios.get(
        `${API_URL}CustomerAddresses/custid?custid=${custID}`
      );
      const allAddresses = response.data;

      console.log(allAddresses, "customer addresses");

      setAddressList(allAddresses);

      const primary = allAddresses.find((addr) => addr.IsPrimary);
      if (primary) setPrimaryAddress(primary);
    } catch (error) {
      console.error("Failed to fetch addresses:", error.message || error);

      if (retryCount < 2) {
        console.log(`Retrying fetchAddresses in 1 second... (attempt ${retryCount + 1})`);
        setTimeout(() => fetchAddresses(retryCount + 1), 1000);
      }
    }
    finally {
      isFetching.current = false; // Reset fetching state
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAddresses(); // Initial fetch on mount
    }, 500);

    const unsubscribe = navigation.addListener("focus", () => {
      // Add a small delay to ensure userData is available
      const focusTimer = setTimeout(() => {
        fetchAddresses(); // Re-fetch when screen is focused
      }, 100);

      return () => clearTimeout(focusTimer);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe; // Cleanup listener on unmount
    };
  }, [navigation]);

  const makePrimaryAddress = async (addressId) => {
    try {
      await axios.post(
        `${API_URL}CustomerAddresses/primary-address?AddressId=${addressId}`
      );
      setAddressModalVisible(false);
      fetchAddresses();
    } catch (err) {
      console.error("Failed to set primary address:", err);
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    removeFromCart(itemId);

    const updatedCartItems = cartItems.filter((item) => item.id !== itemId);
    if (updatedCartItems.length === 0) {
      setScheduledDate(null);
      setScheduledTimeLabel(null);
      setAppliedCoupon(null);

      try {
        await AsyncStorage.removeItem("selectedDate");
        await AsyncStorage.removeItem("selectedTimeSlotLabel");
      } catch (e) {
        console.error("Error removing schedule from AsyncStorage:", e);
      }
    }
  };

  let discountAmount = 0;

  const totalServiceAmount = cartItems.reduce(
    (sum, item) => sum + item.price,
    0
  );
  const originalAmount = cartItems.reduce(
    (sum, item) => sum + item.originalPrice,
    0
  );
  const savedAmount = originalAmount - totalServiceAmount;
  let couponCode = null;
  let couponId = null;

  if (appliedCoupon && appliedCoupon.CouponID) {
    couponCode = appliedCoupon.Code;
    couponId = appliedCoupon.CouponID;

    if (appliedCoupon.DiscountType === "amount") {
      discountAmount = appliedCoupon.DiscountValue;
    } else if (appliedCoupon.DiscountType === "percentage") {
      let calculated = (totalServiceAmount * appliedCoupon.DiscountValue) / 100;

      if (
        appliedCoupon.MaxDisAmount !== null &&
        appliedCoupon.MaxDisAmount > 0
      ) {
        discountAmount = Math.min(calculated, appliedCoupon.MaxDisAmount);
      } else {
        discountAmount = calculated;
      }

      discountAmount = Math.round(discountAmount);
    }
  }

  const taxableAmount = Math.max(totalServiceAmount - discountAmount, 0);
  const gst = Math.round(taxableAmount * 0.18);

  // ✅ Final amount = discounted price + GST
  const finalAmount = taxableAmount + gst;

  // Function to validate if scheduled date/time is in the past
  const validateScheduledDateTime = () => {
    if (!scheduledDate || !scheduledTimeLabel) {
      return { isValid: false, message: "Please choose a date and time to schedule your service." };
    }

    const now = new Date();
    const scheduledDateTime = new Date(scheduledDate);
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDateOnly = new Date(scheduledDate);
    scheduledDateOnly.setHours(0, 0, 0, 0);

    // Check if the date is before today (past dates)
    if (scheduledDateOnly < today) {
      return { 
        isValid: false, 
        message: "Cannot book for past dates. Please select today or a future date." 
      };
    }
    return { isValid: true };
  };

  const postBooking = async () => {
    // alert(paymentMethod);
    try {
      setIsLoading(true);
      setDisable(true);
      const userData = await AsyncStorage.getItem("userData");
      const user = JSON.parse(userData);
      const token = getToken();
      console.log("At the payment:", API_URL);

      // Validate scheduled date and time first
      const dateTimeValidation = validateScheduledDateTime();
      if (!dateTimeValidation.isValid) {
        showCustomAlert(
          "error",
          "Missing Date and Time",
          dateTimeValidation.message,
          () => {
            navigation.navigate("Schedule", { selectedServices: cartItems });
          }
        );
        setIsLoading(false);
        setDisable(false);
        return;
      }

      if (
        !customerName ||
        !customerPhone ||
        !customerEmail ||
        !user ||
        !primaryAddress ||
        !vehicleId ||
        !scheduledDate ||
        !scheduledTimeLabel
      ) {
        if (!scheduledDate) {
          showCustomAlert(
            "error",
            "Missing Date",
            "Please choose a date to schedule your service.",
            () => {
              navigation.navigate("Schedule", { selectedServices: cartItems });
            }
          );
          setIsLoading(false);
          setDisable(false);
          return;
        }

        if (!scheduledTimeLabel) {
          showCustomAlert(
            "error",
            "Missing Time Slot",
            "Please select a scheduled time slot.",
            () => {
              navigation.navigate("Schedule", { selectedServices: cartItems });
            }
          );
          setIsLoading(false);
          setDisable(false);
          return;
        }
        if (!primaryAddress) {
          showCustomAlert(
            "error",
            "Missing Address",
            "Please select or add your primary address.",
            () => {
              setAddressModalVisible(true);
              if (addressList.length === 0) {
                setAddressModalVisible(false);
                navigation.navigate("ConfirmAddressPage");
              }
            }
          );
          setIsLoading(false);
          setDisable(false);
          return;
        }

        if (!customerName) {
          showCustomAlert(
            "error",
            "Missing Information",
            "Please fill Customer Name",
            () => {
              setCustomerDetailsExpanded(true);
              scrollViewRef.current?.scrollTo({ y: customerDetailsY, animated: true });
            }
          );
          setIsLoading(false);
          setDisable(false);
          return;
        }
        if (!customerEmail) {
          showCustomAlert(
            "error",
            "Missing Information",
            "Please fill Customer Email",
            () => {
              setCustomerDetailsExpanded(true);
              scrollViewRef.current?.scrollTo({ y: customerDetailsY, animated: true });
            }
          );
          setIsLoading(false);
          setDisable(false);
          return;
        }


        if (!vehicleId) {
          showCustomAlert(
            "error",
            "Missing Vehicle",
            "Please select your vehicle for booking."
          );
          setIsLoading(false);
          setDisable(false);
          return;
        }


        console.log("Missing information for booking:", {
          user,
          primaryAddress,
          vehicleId,
          scheduledDate,
          scheduledTimeLabel,
        });
        showCustomAlert(
          "error",
          "Missing information",
          "Please ensure all booking details are filled."
        );
        setIsLoading(false);
        setDisable(false);
        return;
      }

      const custFormData = new FormData();
      custFormData.append("custID", user.custID);
      custFormData.append("FullName", customerName);
      custFormData.append("PhoneNumber", customerPhone);
      custFormData.append("Email", customerEmail);
      custFormData.append("IsActive", true);

      await axios.post(`${API_URL}Customer/update-customer`, custFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUser = { ...user, name: customerName, email: customerEmail };
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));

      const bookingPayload = {
        custID: user.custID,
        CustFullName: customerName || "Customer",
        CustPhoneNumber: customerPhone,
        CustEmail: customerEmail,
        StateID: primaryAddress.StateID,
        CityID: primaryAddress.CityID,
        Pincode: primaryAddress.Pincode,
        FullAddress: `${primaryAddress.AddressLine1}, ${primaryAddress.AddressLine2}`,
        Longitude: primaryAddress.Longitude,
        Latitude: primaryAddress.Latitude,
        PackageIds: cartItems.map((item) => item.id).join(","),
        PackagePrice: cartItems.map((item) => item.price).join(","),
        TotalPrice: totalServiceAmount,
        CouponCode: couponCode,
        CouponAmount: discountAmount,
        GSTAmount: gst,
        CityName: primaryAddress.CityName,
        BookingFrom: "app",
        PaymentMethod: paymentMethod,
        Notes: instructions || "",
        BookingDate: scheduledDate,
        TimeSlot: scheduledTimeLabel,
        IsOthers: false,
        OthersFullName: "",
        OthersPhoneNumber: "",
        // CreatedBy: 'user.custID',
        IsActive: true,
        // Images: '',
        VechicleId: vehicleId,
      };

      const formData = new FormData();
      Object.entries(bookingPayload).forEach(([key, value]) => {
        formData.append(key, value?.toString());
      });

      console.log("📦 Booking Payload as FormData:");
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      // if (user.name == "") {
      //   const custFormData = new FormData();
      //   custFormData.append("custID", user.custID);
      //   custFormData.append("FullName", customerName);
      //   custFormData.append("PhoneNumber", customerPhone);
      //   custFormData.append("Email", customerEmail);
      //   custFormData.append("IsActive", true);
      //   custFormData.append("ProfileImageFile", ""); // Assuming no profile image

      //   await axios.post(`${API_URL}Customer/update-customer`, custFormData, {
      //     headers: {
      //       "Content-Type": "multipart/form-data",
      //       Authorization: `Bearer ${token}`,
      //     },
      //   });

      //   const updatedUser = { ...user, name: customerName,email: customerEmail };
      //   await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
      // }

      const response = await axios.post(
        `${API_URL}Bookings/insert-booking`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (paymentMethod === "Razorpay") {
        console.log("✅ Booking successful:", response.data);
        setBookingTrackId(response.data.bookingTrackID);
        handlePayment(response.data.razorpay.orderID, response.data.bookingID);
      } else {
        // For cash payment, show success alert with BookingTrackID
        showCustomAlert(
          "success",
          "Payment Successful",
          `Booking Track ID: ${response.data.bookingTrackID}\nYour booking is confirmed!`
        );

        await AsyncStorage.removeItem("selectedDate");
        await AsyncStorage.removeItem("selectedTimeSlotLabel");

        setAppliedCoupon(null);

        setTimeout(() => {
          clearCart();
          navigation.navigate('CustomerTabs', {
            screen: 'My Bookings',
            params: { screen: 'ServiceList' },
          });
        }, 1500);
      }
    } catch (error) {
      if (error.response) {
        // Server responded with an error
        console.log("🔴 Response data:", error.response.data);
        console.log("🔴 Response status:", error.response.status);
        console.log("🔴 Response headers:", error.response.headers);
      } else if (error.request) {
        // Request was made but no response received
        console.log("🟠 No response received. Request details:", error.request);
      } else {
        // Something went wrong before sending
        console.log("⚠️ Error setting up request:", error.message);
      }

      console.log("🔵 Config:", error.config);

      showCustomAlert(
        "error",
        "Booking Failed",
        "Something went wrong while booking. Please try again."
      );
    } finally {
      setIsLoading(false);
      setDisable(false);
    }
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

  const handlePayment = async (orderid, bookingID) => {
    await setPendingPayment({ orderId: orderid, bookingID, amount: finalAmount });
    const options = {
      description: "MyCarBuddy Service Payment",
      image: "https://mycarsbuddy.com/logo2.png",
      currency: "INR",
      key: RAZORPAY_KEY,
      order_id: orderid,
      amount: finalAmount * 100,
      name: "MyCarBuddy | powered by Glansa Solutions",
      prefill: {
        email: customerEmail || "test@example.com",
        contact: customerPhone || "9999999999",
        name: customerName || "Test User",
      },
      theme: { color: color.primary },
    };

    try {
      RazorpayCheckout.open(options)

        .then(async (data) => {
          console.log("Payment options:", options);
          console.log("Payment success data:", data);

          try {
            const token = await getToken();

            const confirmPayload = {
              bookingID: bookingID,
              amountPaid: finalAmount,
              razorpayPaymentId: data.razorpay_payment_id,
              razorpayOrderId: data.razorpay_order_id,
              razorpaySignature: data.razorpay_signature,
              paymentMode: "Razorpay",
            };

            console.log("Confirm payment JSON payload:", confirmPayload);

            const confirmResponse = await axios.post(
              `${API_URL}Bookings/confirm-Payment`,
              confirmPayload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            console.log("Confirm payment API response:", confirmResponse.data);
            await clearPendingPayment();

            // Show success alert immediately with BookingTrackID
            showCustomAlert(
              "success",
              "Payment Successful",
              `Booking Track ID: ${bookingTrackId}\nYour booking is confirmed!`
            );

            // Clean up storage and navigate after a short delay
            setTimeout(async () => {
              await AsyncStorage.removeItem("selectedDate");
              await AsyncStorage.removeItem("selectedTimeSlotLabel");
              clearCart();
              navigation.navigate('CustomerTabs', {
                screen: 'My Bookings',
                params: { screen: 'ServiceList' },
              });
            }, 800);
          } catch (error) {
            console.error(
              "Payment confirmation failed:",
              error?.response || error
            );
            //   showCustomAlert(
            //     "error",
            //     "Payment Confirmation Failed",
            //     "Your payment succeeded, but confirmation failed. Please contact support."
            //   );
            showCustomAlert(
              "error",
              "Payment Failed",
              error?.description || "Something went wrong"
            );
          }
        })
        .catch(async (error) => {
          console.log(`Payment cancelled or failed: ${error.data?.message || error.message}`);

          // Update booking status to Failed when payment is cancelled
          try {
            await updateBookingStatus(bookingID, "Failed");
            console.log("Booking status updated to Failed due to payment cancellation");
          } catch (statusError) {
            console.error("Failed to update booking status:", statusError);
          }

          await clearPendingPayment();
          // Show appropriate message based on error type
          if (error.data?.code === 'BAD_REQUEST_ERROR' && error.data?.description?.includes('cancelled')) {
            showCustomAlert(
              "error",
              "Payment Cancelled",
              "Your payment was cancelled. You can try again or book for later."
            );
          } else {
            showCustomAlert(
              "error",
              "Payment Failed",
              error.data?.message || error.message || "Something went wrong with the payment"
            );
          }
        });
    } catch (error) {
      console.log("Unexpected Razorpay call error:", error);
      showCustomAlert("error", "Payment Error", "Unable to process payment. Please try again.");
    }
  };




  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 1 }]}>
      <StatusBar
        backgroundColor={Platform.OS === "android" ? "#fff" : undefined}
        barStyle="dark-content"
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: 20 }}
        >
          <Ionicons name="arrow-back-outline" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setAddressModalVisible(true)}
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        >
          <View style={{ flex: 1, maxWidth: 300 }}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                globalStyles.f12Bold,
                globalStyles.mt1,
                { flexShrink: 1, color: color.primary },
              ]}
            >
              {primaryAddress
                ? `${primaryAddress.AddressLine1}`
                : "Choose delivery address"}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                globalStyles.f10Regular,
                globalStyles.mt1,
                { flexShrink: 1 },
              ]}
            >
              {primaryAddress
                ? `${primaryAddress.AddressLine2}, ${primaryAddress.CityName},${primaryAddress.StateName},${primaryAddress.Pincode}`
                : "Choose delivery address"}
            </Text>
          </View>
          <Feather name="chevron-down" size={20} color="black" />
        </TouchableOpacity>
      </View>

      {/* Content Scrollable */}
      {cartItems.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          {/* Empty Cart Icon */}
          <View
            style={{
              backgroundColor: "#F5F7FA",
              padding: 30,
              borderRadius: 60,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Ionicons name="cart-outline" size={48} color={color.primary} />
          </View>

          {/* Title */}
          <CustomText
            style={[
              { color: "#333", textAlign: "center", marginBottom: 6 },
              globalStyles.f14Bold,
            ]}
          >
            Your cart is empty
          </CustomText>

          {/* Subtext */}
          <CustomText style={[{ color: "#777", textAlign: "center", marginBottom: 20 }, globalStyles.f10Medium]}>
            Browse our services and add them to your cart to continue
          </CustomText>

          {/* Button */}
          <TouchableOpacity
            style={{
              backgroundColor: color.secondary,
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              width: "80%",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 5,
            }}
            onPress={() =>
              navigation.navigate("CustomerTabs", {
                screen: "Services",
                params: { screen: "BookServiceScreen" } ,
              })
            }
          >
            <CustomText style={[{ color: "#fff" }, globalStyles.f12Bold]}>
              + Book Your Service
            </CustomText>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} ref={scrollViewRef}>
            <View style={styles.card}>
              {cartItems.map((item, index) => (
                <View key={item.id}>
                  <View style={styles.serviceHeader}>
                    <Image
                      source={{
                        uri: `${API_IMAGE_URL}/${item.image}`,
                      }}
                      style={styles.serviceImage}
                    />

                    <View style={{ flex: 1, justifyContent: "center" }}>
                      <CustomText style={styles.serviceTitle}>
                        {item.title}
                      </CustomText>

                      <TouchableOpacity
                        onPress={() => handleRemoveFromCart(item.id)}
                        style={{
                          marginTop: 4,
                          alignSelf: "flex-start",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#c62828"
                        />
                        <Text
                          style={{
                            color: "#c62828",
                            marginLeft: 2,
                            ...globalStyles.f10Regular,
                          }}
                        >
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <CustomText style={styles.originalPrice}>
                        ₹{item.originalPrice}
                      </CustomText>
                      <CustomText style={styles.discountedPrice}>
                        ₹{item.price}
                      </CustomText>
                    </View>
                  </View>

                  {index < cartItems.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "#eee",
                        marginVertical: 10,
                      }}
                    />
                  )}
                </View>
              ))}

              <View style={styles.savingsBox}>
                <CustomText style={styles.savingsText}>
                  + ₹
                  {cartItems.reduce(
                    (sum, item) => sum + (item.originalPrice - item.price),
                    0
                  )}{" "}
                  saved on these services!
                </CustomText>
              </View>
            </View>

            <View style={{ marginHorizontal: 16, marginTop: 20 }}>
              <View style={{ borderRadius: 16, overflow: "hidden" }}>
                <ImageBackground
                  source={bg}
                  resizeMode="cover"
                  style={{
                    height: 150,
                    justifyContent: "center",
                    paddingHorizontal: 20,
                  }}
                >
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 40,
                    }}
                  >
                    <CustomText
                      style={[{ color: "white" }, globalStyles.f20Bold]}
                    >
                      Hey, Buddy... Busy?
                    </CustomText>
                    <CustomText
                      style={[{ color: "white" }, globalStyles.f20Bold]}
                    >
                      Schedule right now
                    </CustomText>
                  </View>
                </ImageBackground>
              </View>

              <TouchableOpacity
                style={{
                  marginTop: -44,
                  alignSelf: "center",
                  backgroundColor: "white",
                  paddingHorizontal: 64,
                  paddingVertical: 10,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }}
                onPress={() => {
                  navigation.navigate("Schedule", {
                    selectedServices: cartItems,
                  });
                }}
              >
                <CustomText
                  style={[globalStyles.f14Bold, globalStyles.textBlack]}
                >
                  Choose Date
                </CustomText>
              </TouchableOpacity>
            </View>

            {scheduledDate && scheduledTimeLabel && (
              <View
                style={[
                  styles.card,
                  {
                    marginTop: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                  },
                ]}
              >
                <CustomText
                  style={[globalStyles.f14Bold, { color: color.secondary }]}
                >
                  Scheduled for:
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Bold, globalStyles.textBlack]}
                >
                  {moment(scheduledDate).format("Do MMMM, YYYY")} at{" "}
                  {scheduledTimeLabel}
                </CustomText>
              </View>
            )}

            {/* Choose Address Section */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <CustomText style={styles.sectionTitle}>
                  Service Address
                </CustomText>
                <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                  <CustomText
                    style={[
                      globalStyles.f10Bold,
                      { color: color.muted, marginTop: 5 },
                    ]}
                  >
                    change
                  </CustomText>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setAddressModalVisible(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <CustomText
                    style={[globalStyles.f14Bold, { color: color.black }]}
                  >
                    {primaryAddress
                      ? primaryAddress.AddressLine1
                      : "Choose delivery address"}
                  </CustomText>
                  <CustomText
                    numberOfLines={1}
                    style={[globalStyles.f12Regular, { color: color.muted }]}
                  >
                    {primaryAddress
                      ? `${primaryAddress.AddressLine2}, ${primaryAddress.CityName}, ${primaryAddress.StateName}, ${primaryAddress.Pincode}`
                      : "Select from your saved addresses or add new address"}
                  </CustomText>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={color.muted}
                  style={{ marginLeft: 10 }}
                />
              </TouchableOpacity>
            </View>

            {/* Customer Details Section */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <TouchableOpacity
                onPress={() =>
                  setCustomerDetailsExpanded(!customerDetailsExpanded)
                }
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <CustomText style={styles.sectionTitle}>
                  Customer Details
                </CustomText>
                {/* <Feather
                  name={customerDetailsExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={color.muted}
                /> */}
              </TouchableOpacity>

              {/* {customerDetailsExpanded && ( */}
              <View style={{ marginTop: 12 }}>
                {/* Full Name */}
                <CustomText style={[{ color: color.textBlack }, globalStyles.f10Bold]}>
                  Full Name <Text style={{ color: "red" }}>*</Text>
                </CustomText>
                <TextInput
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Enter Full Name"
                  style={styles.input}
                  placeholderTextColor={color.muted}
                />

                {/* Phone Number (read-only) */}
                <CustomText style={[{ color: color.textBlack, marginTop: 10 }, globalStyles.f10Bold]}>
                  Mobile Number <Text style={{ color: "red" }}>*</Text>
                </CustomText>
                <TextInput
                  value={customerPhone}
                  editable={false}
                  style={[
                    styles.input,
                    { backgroundColor: "#f2f2f2ff", color: color.muted },
                  ]}
                  placeholder="Phone Number"
                />

                {/* Email */}
                <CustomText style={[{ color: color.textBlack, marginTop: 10 }, globalStyles.f10Bold]}>
                  Email <Text style={{ color: "red" }}>*</Text>
                </CustomText>
                <TextInput
                  value={customerEmail}
                  onChangeText={setCustomerEmail}
                  placeholder="Enter Email"
                  style={styles.input}
                  placeholderTextColor={color.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {/* )} */}
            </View>

            {/* Coupon Section */}
            <View style={styles.cardSecondary}>
              <CustomText style={styles.sectionTitleSec}>
                Get Discount
              </CustomText>

              <View style={styles.rowBetween}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="tag-outline"
                    size={16}
                    color="white"
                    style={{ marginRight: 6 }}
                  />
                  <CustomText
                    style={[globalStyles.f12Bold, globalStyles.textWhite]}
                  >
                    {appliedCoupon ? "Coupon Applied" : "Apply coupon"}
                  </CustomText>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate("Coupons")}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <CustomText
                    style={[globalStyles.f10Bold, globalStyles.neutral300]}
                  >
                    {appliedCoupon ? "change" : "view coupons"}
                  </CustomText>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color="white"
                    style={[globalStyles.mt1]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.separator} />

              {appliedCoupon ? (
                <View
                  style={[
                    styles.couponBox,
                    { flexDirection: "row", alignItems: "center" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="tag-outline"
                    size={16}
                    color="white"
                    style={{ marginRight: 6 }}
                  />
                  <CustomText
                    style={{
                      flex: 1,
                      ...globalStyles.f12Bold,
                      ...globalStyles.textWhite,
                    }}
                  >
                    Hurray! You saved ₹{discountAmount}
                  </CustomText>
                  <View
                    style={{
                      backgroundColor: color.yellow,
                      paddingVertical: 6,
                      borderRadius: 20,
                      marginTop: 10,
                      paddingHorizontal: 14,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="tag-outline"
                      size={18}
                      color={color.black}
                      style={{ marginLeft: 2 }}
                    />
                    <CustomText style={styles.appliedCoupon}>
                      {" "}
                      {appliedCoupon?.Code}{" "}
                    </CustomText>
                    <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={18}
                        color={color.black}
                        style={{ marginLeft: 6 }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Instructions */}
            <View style={styles.card}>
              <CustomText style={styles.sectionTitle}>Instructions</CustomText>
              <TextInput
                placeholder="e.g. Call after arrival"
                style={styles.textInput}
                maxLength={100}
                multiline={true}
                placeholderTextColor="grey"
                value={instructions}
                onChangeText={setInstructions}
              />
              <CustomText style={styles.textLimit}>
                {Math.max(0, 200 - (instructions ? instructions.length : 0))}/200
              </CustomText>
            </View>

            {/* Price Summary */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View>
                  <CustomText style={styles.toPay}>
                    To Pay: ₹{finalAmount}
                  </CustomText>
                  <CustomText style={styles.saved}>
                    Saving: ₹{savedAmount + discountAmount}
                  </CustomText>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={[styles.rowBetween]}>
                <CustomText
                  style={{ color: color.secondary, ...globalStyles.f12Bold }}
                >
                  Total Services
                </CustomText>
                <CustomText
                  style={{ color: color.black, ...globalStyles.f12Bold }}
                >
                  ₹{totalServiceAmount}
                </CustomText>
              </View>

              {appliedCoupon && (
                <View style={styles.rowBetween}>
                  <CustomText
                    style={{ color: color.secondary, ...globalStyles.f12Bold }}
                  >
                    Discount
                  </CustomText>
                  <CustomText
                    style={{ color: color.black, ...globalStyles.f10Bold }}
                  >
                    - ₹{discountAmount}
                  </CustomText>
                </View>
              )}
              <View style={styles.rowBetween}>
                <CustomText
                  style={{ color: color.secondary, ...globalStyles.f12Bold }}
                >
                  GST & Other Charges
                </CustomText>
                <CustomText
                  style={{ color: color.black, ...globalStyles.f10Bold }}
                >
                  ₹{gst}
                </CustomText>
              </View>
              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <CustomText style={styles.toPayBold}>To Pay</CustomText>
                <CustomText style={styles.toPayBold}>₹{finalAmount}</CustomText>
              </View>
            </View>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => setPaymentMethod("Razorpay")}
              >
                <View style={styles.radioCircle}>
                  {paymentMethod === "Razorpay" && (
                    <View style={styles.selectedRb} />
                  )}
                </View>
                <Text style={styles.optionText}>Pay with RazorPay</Text>
              </TouchableOpacity>
              {/* Option 1: Cash On Service */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => setPaymentMethod("COS")}
              >
                <View style={styles.radioCircle}>
                  {paymentMethod === "COS" && (
                    <View style={styles.selectedRb} />
                  )}
                </View>
                <Text style={styles.optionText}>Pay on Completion</Text>
              </TouchableOpacity>

              {/* Option 2: Pay with RazorPay */}

            </View>
          </ScrollView>

          <View style={styles.footerBtnWrapper}>
            <View style={styles.footerContent}>
              <CustomText style={styles.totalAmount}>₹{finalAmount}</CustomText>
              <TouchableOpacity
                disabled={disable}
                // style={[
                //   paymentMethod === "Razorpay"
                //     ? styles.payNowBtn
                //     : styles.bookNowBtn,
                // ]}
                style={[
                  isLoading ? styles.disabledBtn : (paymentMethod === "Razorpay" ? styles.payNowBtn : styles.bookNowBtn),
                ]}
                onPress={postBooking}
              >
                {/* <CustomText style={styles.payNowText}>
                  {paymentMethod === "Razorpay" ? "Pay Now" : "Book Now"}
                </CustomText> */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  {isLoading && (
                    <ActivityIndicator
                      size="small"
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <CustomText style={styles.payNowText}>
                    {isLoading ? (paymentMethod === "Razorpay" ? "Processing Payment..." : "Booking...") : (paymentMethod === "Razorpay" ? "Pay Now" : "Book Now")}
                  </CustomText>
                </View>
              </TouchableOpacity>
            </View>
          </View>

        </>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addressModalVisible}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setAddressModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          >
            {/* Prevent modal from closing when content is tapped */}
            <TouchableWithoutFeedback onPress={() => { }}>
              <View
                style={{
                  backgroundColor: "white",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: 20,
                  maxHeight: "90%",
                }}
              >
                <TouchableOpacity
                  style={{ alignSelf: "flex-end", marginBottom: 2 }}
                  onPress={() => setAddressModalVisible(false)}
                >
                  <Ionicons name="close-circle" size={30} color="black" />
                </TouchableOpacity>
                <CustomText
                  style={[
                    globalStyles.f20Bold,
                    { color: color.secondary },
                    globalStyles.mb5,
                  ]}
                >
                  Choose your address
                </CustomText>

                {/* Add new address */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 26,
                  }}
                  onPress={() => {
                    setAddressModalVisible(false);
                    navigation.navigate("ConfirmAddressPage");
                  }}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      backgroundColor: color.yellow,
                      borderRadius: 6,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <AntDesign name="plus" size={22} color="white" />
                  </View>
                  <CustomText
                    style={[globalStyles.f14Bold, globalStyles.textBlack]}
                  >
                    Add new address
                  </CustomText>
                </TouchableOpacity>

                {/* Address List */}
                <FlatList
                  data={[...addressList].sort(
                    (a, b) => b.IsPrimary - a.IsPrimary
                  )}
                  keyExtractor={(item) => item.AddressID.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => makePrimaryAddress(item.AddressID)}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        marginBottom: 14,
                      }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color={color.primary}
                        style={{ marginRight: 10, marginTop: 4 }}
                      />
                      <View style={{ flex: 1, marginBottom: 10 }}>
                        <CustomText
                          style={[
                            globalStyles.f14Bold,
                            item.IsPrimary
                              ? { color: color.secondary }
                              : globalStyles.textBlack,
                          ]}
                        >
                          {item.AddressLine1}
                        </CustomText>
                        <CustomText
                          style={[
                            globalStyles.f12Regular,
                            { color: color.muted },
                          ]}
                        >
                          {item.AddressLine2}, {item.CityName},{" "}
                          {item.StateName}, {item.Pincode}
                        </CustomText>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <CustomAlert
        visible={alertVisible}
        status={alertStatus}
        title={alertTitle}
        message={alertMessage}
        onClose={alertOnClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F0F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  headerTitle: { ...globalStyles.f16Bold, color: color.primary },
  headerSubtitle: { ...globalStyles.f10Regular, color: "black" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 20,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  cardSecondary: {
    backgroundColor: color.secondary,
    padding: 16,
    marginTop: 20,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    ...globalStyles.f12,
  },
  serviceImage: { width: 50, height: 50, borderRadius: 8, marginRight: 10 },
  serviceTitle: { ...globalStyles.f14Bold, color: color.primary },
  originalPrice: {
    textDecorationLine: "line-through",
    color: "gray",
    ...globalStyles.f10Regular,
  },
  discountedPrice: {
    ...globalStyles.f12Bold,
    color: color.secondary,
    marginTop: 2,
  },
  savingsBox: {
    marginTop: 30,
    backgroundColor: "#06c2b530",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "flex-start",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: color.secondary,
  },
  savingsText: { color: color.secondary, ...globalStyles.f12Bold },
  sectionTitle: {
    ...globalStyles.f14Bold,
    color: color.primary,
    marginBottom: 4,
  },
  sectionTitleSec: { ...globalStyles.f14Bold, color: "#fff", marginBottom: 10 },
  separator: {
    height: 1,
    backgroundColor: "#ffffffff",
    marginVertical: 20,
  },
  moreServiceCard: { width: 120, marginRight: 10, alignItems: "flex-start" },
  moreServiceImage: { width: 90, height: 120, borderRadius: 8, marginTop: 6 },
  moreServiceText: {
    textAlign: "flex-start",
    ...globalStyles.f10Bold,
    marginTop: 5,
    color: "black",
  },
  moreServicePrice: {
    ...globalStyles.f12Bold,
    color: color.secondary,
    marginTop: 2,
  },
  plusIcon: { position: "absolute", top: -3, right: 12 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  couponBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  appliedCoupon: {
    color: "black",
    ...globalStyles.f12Bold,
    marginRight: 6,
    marginBottom: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    color: "black",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 8,
    textAlignVertical: "top", // Ensures text starts at the top
    minHeight: 100, // Optional: gives textarea-like height
  },
  textLimit: {
    alignSelf: "flex-end",
    ...globalStyles.f10Bold,
    color: "gray",
    marginTop: 4,
  },
  toPay: { ...globalStyles.f12Bold, color: color.black, marginBottom: 4 },
  saved: { color: color.secondary, ...globalStyles.f10Medium },
  toPayBold: { ...globalStyles.f12Bold, color: color.black },
  footerBtnWrapper: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 10,
  },

  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 12,
  },

  totalAmount: {
    ...globalStyles.f16Bold,
    color: color.black,
  },

  payNowBtn: {
    backgroundColor: color.primary,
    paddingVertical: 16,
    paddingHorizontal: 104,
    borderRadius: 10,
    alignItems: "center",
  },
  bookNowBtn: {
    backgroundColor: color.black,
    paddingVertical: 16,
    paddingHorizontal: 104,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: color.yellow, 
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  payNowText: {
    color: "white",
    ...globalStyles.f12Bold,
  },

  divider: {
    height: 1,
    backgroundColor: "#e0e0e07a", // light grey separator
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...globalStyles.f10Bold,
    marginTop: 10,
    color: "#000",
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "center",
    marginVertical: 10,
  },
  optionText: {
    marginLeft: 10,
    ...globalStyles.f12Bold,
    marginBottom: 4
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2c3e50",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2c3e50",
  },
});

export default CartPage;
