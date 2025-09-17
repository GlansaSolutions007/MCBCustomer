import { React, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  StatusBar,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL, API_IMAGE_URL } from "@env";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { MaterialIcons } from "@expo/vector-icons";
import { color } from "../../styles/theme";

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState(null);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    if (isFocused) {
      loadCustomerId();
    }
  }, [isFocused]);

  const loadCustomerId = async () => {
    try {
      // Primary: app stores a JSON blob under 'userData'
      const userDataRaw = await AsyncStorage.getItem("userData");
      if (userDataRaw) {
        try {
          const parsed = JSON.parse(userDataRaw);
          const idFromUserData =
            parsed?.custID || parsed?.customerId || parsed?.CustID;
          if (idFromUserData) {
            const idStr = String(idFromUserData);
            setCustomerId(idStr);
            await getNotifications(idStr);
            return;
          }
        } catch (_) { }
      }

      // Fallbacks: sometimes stored directly
      const direct =
        (await AsyncStorage.getItem("custID")) ||
        (await AsyncStorage.getItem("customerId")) ||
        (await AsyncStorage.getItem("CustID"));
      const idStr = direct ? String(direct) : null;
      setCustomerId(idStr);
      if (idStr) {
        await getNotifications(idStr);
      }
    } catch (e) {
      console.log("Failed to load customerId from storage:", e?.message || e);
      setCustomerId(null);
    }
  };

  const getNotifications = async (id) => {
    try {
      setLoading(true);
      const userId = id || customerId;
      if (!userId) return;
      const response = await axios.get(
        `${API_URL}Bookings/notifications?userId=${userId}&&userRole=customer`
      );
      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      console.log(data, "notifications data");
      setNotifications(data);
    } catch (e) {
      console.log("Failed to load notifications:", e?.message || e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getNotifications();
  };

  const actionIconFor = (actionType) => {
    const key = String(actionType || "").toLowerCase();
    if (key.includes("completed") || key.includes("ended"))
      return "check-circle";
    if (key.includes("service") || key.includes("started")) return "build";
    if (key.includes("payment")) return "payment";
    if (key.includes("booking")) return "event";
    return "notifications";
  };

  const handleMarkRead = async (id) => {
    try {
      const uid = customerId;
      if (!uid) return;
      await axios.put(`${API_URL}Bookings/notifications/${id}/read`, null, {
        params: { userId: uid, userRole: "customer" },
      });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setNotifications((prev) =>
        prev.filter((n) => String(n.id) !== String(id))
      );
      await getNotifications();
    } catch (e) {
      console.log("Failed to mark read:", e?.message || e);
    }
  };

  const handleAllNotfications = () => {
    try {
      //   const uid = customerId;
      if (!customerId) return;
      axios.put(
        `${API_URL}Bookings/notifications/All?userId=${customerId}&&userRole=customer`
      );
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setNotifications([]);
      getNotifications();
    } catch (e) {
      console.log("Failed to mark all read:", e?.message || e);
    }
  };

  const handleNavigate = async (item) => {
    // Do NOT mark as read on tap; only on Clear All or X
    // Determine potential booking track id fields
    const trackId =
      item?.bookingTrackId ||
      item?.BookingTrackID ||
      item?.relatedId ||
      item?.bookingId ||
      item?.BookingID || null;

    if (!trackId) {
      return;
    }

    try {
      // Fetch customer's bookings and find the one by BookingTrackID or BookingID
      const userDataRaw = await AsyncStorage.getItem('userData');
      const parsed = userDataRaw ? JSON.parse(userDataRaw) : null;
      const custID = parsed?.custID;
      if (!custID) return;

      const res = await axios.get(`${API_URL}Bookings/${custID}`);
      const list = Array.isArray(res.data) ? res.data : [];

      const match = list.find(
        (b) => String(b.BookingTrackID) === String(trackId) || String(b.BookingID) === String(trackId)
      );

      if (match) {
        // Navigate through CustomerTabs → Home → BookingsInnerPage with full booking object
        // Use a frame delay to make the transition smoother from a separate stack
        requestAnimationFrame(() => {
          navigation.navigate('CustomerTabs', {
            screen: 'Home',
            params: { screen: 'BookingsInnerPage', params: { booking: match } },
          });
        });
        return;
      }
    } catch (e) {
      console.log('Failed navigating to booking from notification:', e?.message || e);
    }
  };
  const formatNotificationDate = (createdDate) => {
    if (!createdDate) return "";

    const date = new Date(createdDate);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);

    // < 24 hours → show only time
    if (diffHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    // ≥ 24 hours → show dd-mm-yyyy (hh:mm AM/PM)
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    const time = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${dd}-${mm}-${yyyy} (${time})`;
  };


  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleNavigate(item)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MaterialIcons
            name={actionIconFor(item.actionType)}
            size={20}
            color={color.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <CustomText style={[globalStyles.f14Bold, { color: "#222" }]}>
            {item.title || "Notification"}
          </CustomText>
          <CustomText
            style={[globalStyles.f10Regular, { color: "#555", marginTop: 2 }]}
          >
            {item.message || ""}
          </CustomText>
        </View>
        <TouchableOpacity
          onPress={() => handleMarkRead(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" style={{ backgroundColor: color.primary + "20", borderRadius: 100, padding: 4 }} size={15} color="#999" />
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: 2,
        }}
      >
        <CustomText style={[globalStyles.f8Regular, { color: "#555" }]}>
          {formatNotificationDate(item.createdDate)}
        </CustomText>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
        <View style={styles.headerRow}>
          {/* <CustomText style={[globalStyles.f14Bold, { color: "#222" }]}>
            Notifications
          </CustomText> */}
        </View>
        <View style={{ padding: 16 }}>
          {[...Array(6)].map((_, idx) => (
            <View key={idx} style={styles.skeletonCard}>
              <View style={styles.skeletonIcon} />
              <View style={{ flex: 1 }}>
                <View style={styles.skeletonLineWide} />
                <View style={styles.skeletonLine} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // const handleClearAll = async () => {
  //     try {
  //         // Mark all as read sequentially (simple implementation). Backend can add bulk endpoint later.
  //         const ids = notifications.map(n => n.id);
  //         LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  //         const uid = customerId;
  //         await Promise.all(ids.map(id => axios.put(`${API_URL}Bookings/notifications/${id}/read`, null, { params: { userId: uid, userRole: 'customer' } }).catch(() => {})));
  //         setNotifications([]);
  //         await getNotifications();
  //     } catch (e) {
  //         console.log('Failed to clear all:', e?.message || e);
  //     }
  // };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <StatusBar
        backgroundColor={Platform.OS === "android" ? "#fff" : undefined}
        barStyle="dark-content"
      />
        {/* <CustomText style={[globalStyles.f14Bold, { color: "#222" }]}>
          Notifications
        </CustomText> */}
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleAllNotfications}>
            <View style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", justifyContent: "flex-end", paddingHorizontal: 18, paddingTop: 12 }}>
              <CustomText
                style={[globalStyles.f12Bold, { color: color.primary }]}
              >
                Clear All
              </CustomText>
            </View>
          </TouchableOpacity>
        )}
      <FlatList
        style={{ flex: 1, backgroundColor: "#F5F5F5" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CustomText style={[globalStyles.f14Bold, { color: "#888" }]}>
              No notifications yet
            </CustomText>
          </View>
        }
      />
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "start",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(1,127,119,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#017F77",
    alignSelf: "center",
  },
  unreadBar: {
    height: 2,
    backgroundColor: color.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e9ecef",
    marginRight: 12,
  },
  skeletonLineWide: {
    height: 12,
    backgroundColor: "#e9ecef",
    borderRadius: 6,
    marginBottom: 8,
    width: "70%",
  },
  skeletonLine: {
    height: 10,
    backgroundColor: "#eef1f3",
    borderRadius: 5,
    width: "95%",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
