import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  StyleSheet,
  RefreshControl,
  Alert,
  Pressable,
  Modal,
  TextInput,
  LayoutAnimation,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import globalStyles from "../../styles/globalStyles";
import CTAbannerhome from "../../../assets/images/CTAbannerhome.png";
import exteriorservice from "../../../assets/images/exteriorservice.png";
import interiorservice from "../../../assets/images/interiorservice.png";
import bluecar from "../../../assets/images/bluecar.png";
import logo from "../../../assets/Logo/whiteLogo.png";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Device from "expo-device";
import * as Location from "expo-location";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationContext } from "../../contexts/LocationContext";
import axios from "axios";
// import { API_BASE_URL } from "@env";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
// import * as Notifications from "expo-notifications";

import { API_URL, API_IMAGE_URL, RAZORPAY_KEY } from "@env";
import { getToken } from "../../utils/token";
import useGlobalRefresh from "../../hooks/useGlobalRefresh";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { monitorBookingsForNotifications } from "../../utils/notificationService";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};

const getStatusColor = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "failed") return color.alertError;
  if (s === "cancelled") return "#999";
  if (s === "completed") return "#34C759";
  if (s === "startjourney") return color.primary;
  if (s === "pending") return color.yellow;
  return color.secondary;
};

export default function HomeScreen() {
  // alert(API_URL);
  const navigation = useNavigation();
  const { setLocationText, setLocationStatus } = useContext(LocationContext);
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [latestNotification, setLatestNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchBarRef = useRef(null);
  const [panelTop, setPanelTop] = useState(160);
  const panelTranslateY = useState(new Animated.Value(20))[0];
  const panelOpacity = useState(new Animated.Value(0))[0];
  const [openTimer, setOpenTimer] = useState(null);
  const panelSearchInputRef = useRef(null);

  const handleChange = (t) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchQuery(t);

    // Debounce opening the panel for smoother feel
    if (openTimer) clearTimeout(openTimer);
    if (t.length > 1) {
      const timer = setTimeout(() => setModalVisible(true), 150);
      setOpenTimer(timer);
    } else {
      setModalVisible(false);
    }
  };

  // Helper to build full image URL safely
  const buildImageUrl = (path) => {
    if (!path) return null;
    if (String(path).startsWith("http")) return path;
    // Some APIs return paths without leading slash
    const normalized = String(path).startsWith("/") ? path.slice(1) : path;
    return `${API_IMAGE_URL}/${normalized}`;
  };

  // Debounced global search for services
  useEffect(() => {
    const term = (searchQuery || "").trim();
    if (term.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    setSearchLoading(true);
    setSearchError("");

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = `${API_URL}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?searchTerm=${encodeURIComponent(
          term
        )}`;
        const resp = await axios.get(url, { signal: controller.signal });
        const data = Array.isArray(resp.data) ? resp.data : [];
        setSearchResults(data);
      } catch (err) {
        if (err?.name !== "CanceledError") {
          setSearchError("Failed to fetch results");
        }
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Measure search bar position to anchor panel top
  const updatePanelTop = () => {
    try {
      // measure(x, y, w, h, px, py) => screen coords
      searchBarRef?.measure?.((x, y, w, h, px, py) => {
        if (h && py >= 0) setPanelTop(py + h);
      });
    } catch (_) {}
  };

  useEffect(() => {
    if (modalVisible) {
      setTimeout(updatePanelTop, 0);
      Animated.parallel([
        Animated.timing(panelTranslateY, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(panelOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      // Focus the panel search input so typing continues seamlessly
      setTimeout(() => {
        panelSearchInputRef.current?.focus?.();
      }, 50);
    } else {
      panelTranslateY.setValue(20);
      panelOpacity.setValue(0);
    }
  }, [modalVisible]);

  const actionIconFor = (actionType) => {
    const key = String(actionType || "").toLowerCase();
    if (key.includes("completed") || key.includes("ended"))
      return "check-circle";
    if (key.includes("service") || key.includes("started")) return "build";
    if (key.includes("payment")) return "payment";
    if (key.includes("booking")) return "event";
    return "notifications";
  };

  const formatNotificationDate = (createdDate) => {
    if (!createdDate) return "";
    const date = new Date(createdDate);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
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

  const isRecentNotification = (createdDate) => {
    if (!createdDate) return false;
    const date = new Date(createdDate);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  const fetchLatestNotification = async () => {
    try {
      const userDataRaw = await AsyncStorage.getItem("userData");
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const custID = userData?.custID;
      if (!custID) {
        setLatestNotification(null);
        return;
      }

      const response = await axios.get(
        `${API_URL}Bookings/notifications?userId=${custID}&&userRole=customer`
      );

      const list = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];

      const latest = list?.[0] || null;
      setLatestNotification(latest);

      // Optional: cache for offline or next launch
      try {
        if (latest) {
          await AsyncStorage.setItem(
            "latestNotification",
            JSON.stringify(latest)
          );
        } else {
          await AsyncStorage.removeItem("latestNotification");
        }
      } catch (_) {}
    } catch (_) {
      // Fallback to cached value if network fails
      try {
        const raw = await AsyncStorage.getItem("latestNotification");
        setLatestNotification(raw ? JSON.parse(raw) : null);
      } catch (_) {
        setLatestNotification(null);
      }
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}Category`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Catttt");

      if (response.data) {
        // Ensure response.data is an array
        const categoriesData = Array.isArray(response.data)
          ? response.data
          : [];
        // console.log("📊 Categories data:", categoriesData);

        const activeCategories = categoriesData.filter((cat) => cat.IsActive);
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysBookings = async () => {
    // Prevent multiple simultaneous calls
    if (bookingsLoading) return;

    setBookingsLoading(true);
    try {
      const userData = await AsyncStorage.getItem("userData");

      // Check if userData exists
      if (!userData) {
        console.warn(
          "No userData found in AsyncStorage - this might be a timing issue"
        );
        console.log("Retrying in 500ms...");
        setTimeout(() => {
          fetchTodaysBookings();
        }, 500);
        return;
      }

      const parsedUserData = JSON.parse(userData);

      // Check if parsedUserData is valid and has custID
      if (!parsedUserData || !parsedUserData.custID) {
        console.warn("Invalid userData or missing custID:", parsedUserData);
        return;
      }

      const custID = parsedUserData.custID;
      const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const token = await getToken();
      const response = await axios.get(`${API_URL}Bookings/${custID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        // Ensure response.data is an array
        const bookingsData = Array.isArray(response.data) ? response.data : [];
        // console.log("📊 Bookings data:", bookingsData);

        const upcoming = bookingsData.filter(
          (booking) =>
            booking.BookingDate >= today &&
            booking.BookingStatus?.toLowerCase() !== "cancelled" &&
            booking.BookingStatus?.toLowerCase() !== "failed"
        );
        // console.log("Upcoming Bookings:", upcoming);

        setUpcomingBookings(upcoming);

        // if (custID) {
        //   monitorBookingsForNotifications(upcoming, custID);
        // }
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTodaysBookings();
    // Load latest notification from API (with cache fallback)
    fetchLatestNotification();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Only fetch bookings when screen comes into focus, not categories
      // Add a small delay to prevent immediate refetch after initial load
      const timer = setTimeout(() => {
        fetchTodaysBookings();
        fetchLatestNotification();
      }, 100);

      return () => clearTimeout(timer);
    }, [])
  );

  const checkStorage = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("All Keys:", allKeys);

      const allData = await AsyncStorage.multiGet(allKeys);
      // console.log("All Data:", allData);
    } catch (e) {
      console.error("Error reading AsyncStorage:", e);
    }
  };

  useEffect(() => {
    checkStorage();
  }, []);

  const handleCategoryPress = async (category) => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${API_URL}SubCategory1/subcategorybycategoryid?categoryid=${category.CategoryID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const activeSubCategories = (response.data || []).filter(
        (sub) => sub.IsActive
      );

      navigation.navigate("InteriorService", {
        categoryId: category.CategoryID,
        categoryName: category.CategoryName,
        subCategories: activeSubCategories,
        subcategoryId: activeSubCategories[0]?.SubCategoryID,
      });
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const goToCar = () => {
    navigation.navigate("My Cars", {
      screen: "SelectCarBrand",
    });
  };

  const DeviceId =
    Device.osInternalBuildId || Device.osBuildId || "unknown-device-id";

  useEffect(() => {
    (async () => {
      setLocationStatus("loading");
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLocationStatus("denied");
          setLocationText("Select your location");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync(loc.coords);

        if (geo.length > 0) {
          const { city, region } = geo[0];
          setLocationText(`${city || "City"}, ${region || "Region"}`);
          setLocationStatus("granted");
        } else {
          setLocationText("Select your location");
          setLocationStatus("error");
        }
      } catch (err) {
        setLocationStatus("error");
        setLocationText("Select your location");
      }
    })();
  }, []);
  const { refreshing, onRefresh } = useGlobalRefresh(async () => {
    // Only refresh bookings on pull-to-refresh, categories don't change often
    await fetchTodaysBookings();
  });

  const SkeletonLoader = () => (
    <View>
      {/* Banner Skeleton */}
      <View style={[styles.banner, globalStyles.mb35]}>
        <View style={styles.bannerHeader}>
          <View
            style={[
              styles.logo,
              { backgroundColor: "rgba(78, 200, 202, 0.18)", borderRadius: 10 },
            ]}
          />
        </View>
        <View style={styles.bannerContent}>
          <View
            style={[
              styles.carImagePositioned,
              { backgroundColor: "rgba(78, 200, 202, 0.18)", borderRadius: 10 },
            ]}
          />
          <View style={styles.bannerTextContainer}>
            <View
              style={{
                backgroundColor: "rgba(78, 200, 202, 0.18)",
                height: 20,
                width: "90%",
                borderRadius: 4,
                marginBottom: 8,
              }}
            />
            <View
              style={{
                backgroundColor: "rgba(78, 200, 202, 0.18)",
                height: 16,
                width: "70%",
                borderRadius: 4,
              }}
            />
          </View>
        </View>
      </View>

      <View style={globalStyles.container}>
        {/* Section Header Skeleton */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View
              style={{
                backgroundColor: "#f1f1f1ff",
                height: 20,
                width: 120,
                borderRadius: 4,
                marginBottom: 4,
              }}
            />
            <View
              style={{
                backgroundColor: "#f1f1f1ff",
                height: 14,
                width: 200,
                borderRadius: 4,
              }}
            />
          </View>
          <View
            style={[styles.arrowContainer, { backgroundColor: "#f1f1f1ff" }]}
          />
        </View>

        {/* Category Cards Skeleton */}
        <View style={styles.categoriesContainer}>
          <View style={styles.twoCategoriesLayout}>
            {[1, 2].map((_, index) => (
              <View
                key={index}
                style={[styles.categoryCard, { backgroundColor: "#f1f1f1ff" }]}
              >
                <View
                  style={[
                    styles.cardImageContainer,
                    { backgroundColor: "#e8e8e8ff" },
                  ]}
                />
                <View style={styles.cardContent}>
                  <View
                    style={{
                      backgroundColor: "#f1f1f1ff",
                      height: 16,
                      width: "80%",
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={[styles.cardArrow, { backgroundColor: "#f1f1f1ff" }]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Banner Skeleton */}
        <View style={styles.ctaSection}>
          <View style={[styles.ctaContainer, { backgroundColor: "#f1f1f1ff" }]}>
            <View style={styles.ctaContent}>
              <View style={styles.ctaTextContainer}>
                <View
                  style={{
                    backgroundColor: "#f1f1f1ff",
                    height: 24,
                    width: "90%",
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <View
                  style={{
                    backgroundColor: "#f1f1f1ff",
                    height: 20,
                    width: "70%",
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <View
                  style={{
                    backgroundColor: "#f1f1f1ff",
                    height: 16,
                    width: "60%",
                    borderRadius: 4,
                  }}
                />
              </View>
              <View
                style={[styles.ctaButton, { backgroundColor: "#f1f1f1ff" }]}
              />
            </View>
          </View>
        </View>

        {/* Upcoming Bookings Section Skeleton */}
        <View style={[globalStyles.mt4]}>
          <View
            style={{
              backgroundColor: "#f1f1f1ff",
              height: 20,
              width: 150,
              borderRadius: 4,
              marginBottom: 16,
            }}
          />

          {/* Booking Card Skeleton */}
          <View style={[styles.bookingCard, { backgroundColor: "#f1f1f1ff" }]}>
            <View style={styles.bookingR1}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "#f1f1f1ff",
                    height: 20,
                    width: 80,
                    borderRadius: 10,
                  }}
                />
                <View
                  style={{
                    backgroundColor: "#f1f1f1ff",
                    height: 24,
                    width: 100,
                    borderRadius: 12,
                    marginLeft: 8,
                  }}
                />
              </View>
              <View
                style={{
                  backgroundColor: "#f1f1f1ff",
                  height: 20,
                  width: 60,
                  borderRadius: 4,
                }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.bookingR1}>
              <View style={styles.bookingCarImage}>
                <View
                  style={[
                    styles.bookingImage,
                    { backgroundColor: "#f1f1f1ff" },
                  ]}
                />
                <View
                  style={{
                    backgroundColor: "#f1f1f1ff",
                    height: 16,
                    width: "80%",
                    borderRadius: 4,
                    marginTop: 8,
                  }}
                />
                <View
                  style={{
                    backgroundColor: "#f1f1f1ff",
                    height: 14,
                    width: "60%",
                    borderRadius: 4,
                    marginTop: 4,
                  }}
                />
              </View>
              <View style={styles.bookingDetails}>
                <View style={styles.bookingDate}>
                  <View
                    style={{
                      backgroundColor: "#f1f1f1ff",
                      height: 14,
                      width: "70%",
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      backgroundColor: "#f1f1f1ff",
                      height: 16,
                      width: "50%",
                      borderRadius: 4,
                      marginTop: 4,
                    }}
                  />
                </View>
                <View style={styles.bookingDate}>
                  <View
                    style={{
                      backgroundColor: "#f1f1f1ff",
                      height: 14,
                      width: "70%",
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      backgroundColor: "#f1f1f1ff",
                      height: 16,
                      width: "50%",
                      borderRadius: 4,
                      marginTop: 4,
                    }}
                  />
                </View>
                <View style={styles.bookingDate}>
                  <View
                    style={{
                      backgroundColor: "#f1f1f1ff",
                      height: 14,
                      width: "70%",
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      backgroundColor: "#f1f1f1ff",
                      height: 16,
                      width: "50%",
                      borderRadius: 4,
                      marginTop: 4,
                    }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.bookingServices}>
              <View
                style={{
                  backgroundColor: "#f1f1f1ff",
                  height: 14,
                  width: "60%",
                  borderRadius: 4,
                  marginBottom: 8,
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
                    marginRight: 8,
                  }}
                />
                <View
                  style={{
                    backgroundColor: "#f1f1f1ff",
                    height: 16,
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
                    marginRight: 8,
                  }}
                />
                <View
                  style={{
                    backgroundColor: "#f1f1f1ff",
                    height: 16,
                    width: "80%",
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      style={{ backgroundColor: color.textWhite }}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
          <View style={[styles.banner, { marginBottom: 30 }]}>
            <View style={styles.bannerHeader}>
              {/* <Image source={logo} style={styles.logo} resizeMode="contain" /> */}
              {/* <CustomText style={styles.bannerTagline}>
                Professional Car Care Services
              </CustomText> */}
              <View
                style={styles.searchBar}
                ref={(ref) => {
                  searchBarRef.current = ref;
                }}
                onLayout={updatePanelTop}
              >
                <Ionicons
                  name="search"
                  size={16}
                  color={"#999"}
                  style={{ marginRight: 6 }}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={handleChange}
                  placeholder="Search services…"
                  placeholderTextColor="#999"
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={() => navigation.navigate("GlobalSearch")}
                  onFocus={() => navigation.navigate("GlobalSearch")}
                />
              </View>
            </View>
            {/* Inline Latest Notification */}
            {latestNotification && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("NotificationScreen")}
              >
                <LinearGradient
                  colors={[
                    "rgba(1,127,119,0.25)",
                    "rgba(1,127,119,0.08)",
                    "rgba(1,127,119,0)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.latestNotificationCardContainer}
                >
                  <View style={styles.latestNotificationCardInner}>
                    <View style={styles.latestRow}>
                      <View style={styles.iconWrap}>
                        <MaterialIcons
                          name={actionIconFor(latestNotification.actionType)}
                          size={20}
                          color={color.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <CustomText
                            style={[globalStyles.f14Bold, { color: "#1f2937" }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {latestNotification.title || "Notification"}
                          </CustomText>
                          <View style={styles.timeBadge}>
                            <CustomText
                              style={[
                                globalStyles.f10Bold,
                                { color: color.primary },
                              ]}
                            >
                              {formatNotificationDate(
                                latestNotification.createdDate
                              )}
                            </CustomText>
                          </View>
                        </View>
                        {!!latestNotification.message && (
                          <CustomText
                            style={[
                              globalStyles.f10Regular,
                              { color: "#4b5563", marginTop: 4 },
                            ]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {latestNotification.message}
                          </CustomText>
                        )}
                      </View>
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color="#9CA3AF"
                        style={styles.chevron}
                      />
                    </View>
                    {isRecentNotification(latestNotification.createdDate) && (
                      <View style={styles.footerRow}>
                        <View style={styles.newDot} />
                        <CustomText
                          style={[
                            globalStyles.f10Bold,
                            { color: color.primary },
                          ]}
                        >
                          New
                        </CustomText>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("NotificationScreen")
                          }
                        >
                          <CustomText
                            style={[
                              globalStyles.f10Bold,
                              { color: color.primary },
                            ]}
                          >
                            View all
                          </CustomText>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <View style={styles.bannerContent}>
              <Image
                source={bluecar}
                style={styles.carImagePositioned}
                resizeMode="contain"
              />
              <View style={styles.bannerTextContainer}>
                <CustomText style={styles.bannerSubtitle}>
                  A Professional Car Care Services in Hyderabad
                </CustomText>
                <CustomText style={styles.bannerDescription}>
                  Quality service at your doorstep
                </CustomText>
              </View>
            </View>
          </View>
          <View style={globalStyles.container}>
            <View
              style={[
                globalStyles.flexrow,
                globalStyles.alineItemscenter,
                globalStyles.mb3,
              ]}
            >
              <View style={{ flex: 1 }}>
                <CustomText
                  style={[
                    globalStyles.f16Bold,
                    globalStyles.textBlack,
                    globalStyles.mb1,
                  ]}
                >
                  Our Services
                </CustomText>
                <CustomText
                  style={[globalStyles.f12Regular, { color: "#666" }]}
                >
                  Choose from our range of professional car care services
                </CustomText>
              </View>
              {categories.length > 2 && (
                <View
                  style={[
                    globalStyles.p2,
                    {
                      backgroundColor: "rgba(1, 127, 119, 0.1)",
                      borderRadius: 20,
                      marginLeft: 12,
                    },
                  ]}
                >
                  <Ionicons
                    name="arrow-forward-circle"
                    size={24}
                    color={color.primary}
                    onPress={() =>
                      navigation.navigate("Services", {
                        screen: "BookServiceScreen",
                      })
                    }
                  />
                </View>
              )}
            </View>
            <View style={globalStyles.mb5}>
              {categories.length === 2 ? (
                <View
                  style={[
                    globalStyles.flexrow,
                    globalStyles.justifysb,
                    { gap: 16 },
                  ]}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.CategoryID}
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress(cat)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardImageContainer}>
                        <Image
                          source={{
                            uri: `${API_IMAGE_URL}/${cat.ThumbnailImage}`,
                          }}
                          style={styles.categoryCardImage}
                        />
                        <View style={styles.cardOverlay} />
                      </View>
                      <View style={styles.cardContent}>
                        <CustomText style={styles.categoryCardTitle}>
                          {cat.CategoryName}
                        </CustomText>
                        <View style={styles.cardArrow}>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color={color.white}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingVertical: 8,
                    paddingRight: 16,
                  }}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.CategoryID}
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress(cat)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardImageContainer}>
                        <Image
                          source={{
                            uri: `${API_IMAGE_URL}/${cat.ThumbnailImage}`,
                          }}
                          style={styles.categoryCardImage}
                        />
                        <LinearGradient
                          colors={["#136D6E", "transparent"]}
                          start={{ x: 0.5, y: 1 }}
                          end={{ x: 0.5, y: 0 }}
                          style={styles.gradientOverlay}
                        />
                      </View>
                      <View style={styles.cardContent}>
                        <CustomText style={styles.categoryCardTitle}>
                          {cat.CategoryName}
                        </CustomText>
                        <View style={styles.cardArrow}>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color={color.white}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
            <View style={globalStyles.mb5}>
              <ImageBackground
                source={CTAbannerhome}
                style={styles.ctaContainer}
                resizeMode="cover"
                imageStyle={styles.ctaBackgroundImage}
              >
                <View style={styles.ctaContent}>
                  <View style={styles.ctaTextContainer}>
                    <CustomText
                      style={[
                        globalStyles.f20Bold,
                        globalStyles.textWhite,
                        globalStyles.mb2,
                      ]}
                    >
                      Give your car's intro {"\n"} to your care buddy
                    </CustomText>
                    <CustomText
                      style={[globalStyles.f12Regular, globalStyles.textWhite]}
                    >
                      We'll remember it, pamper it,{"\n"} and keep it shining.
                    </CustomText>
                  </View>
                  <TouchableOpacity
                    style={[
                      globalStyles.bgwhite,
                      globalStyles.mt3,
                      styles.ctaButton,
                    ]}
                    onPress={goToCar}
                    activeOpacity={0.8}
                  >
                    <CustomText
                      style={[
                        globalStyles.f12Bold,
                        globalStyles.textBlack,
                        globalStyles.mr2,
                      ]}
                    >
                      Add Car & Book Service
                    </CustomText>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={color.black}
                    />
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>
            {/* <View style={styles.bookingsSection}> */}
            {/* <View style={styles.bookingsHeader}>
                <View style={styles.bookingsTitleContainer}>
                  <Ionicons name="calendar" size={20} color={color.primary} style={styles.bookingsIcon} />
                  <CustomText style={styles.bookingsTitle}>
                    Today's Bookings
                  </CustomText>
                </View>
                <CustomText style={styles.bookingsSubtitle}>
                  Your scheduled services for today
                </CustomText>
              </View> */}
            {/* <View style={styles.ctaButtonWrapper}>
                <TouchableOpacity
                  style={[styles.ctaButton, globalStyles.bgwhite]}
                  onPress={goToCar}
                >
                  <CustomText
                    style={[globalStyles.f14Bold, globalStyles.textBlack]}
                  >
                    Add Car & Book
                  </CustomText>
                </TouchableOpacity>
              </View> */}
            {/* </View> */}
            <View style={[globalStyles.mt4]}>
              <CustomText
                style={[
                  globalStyles.f16Bold,
                  globalStyles.textBlack,
                  globalStyles.mb1,
                ]}
              >
                Upcoming Bookings
              </CustomText>
              {upcomingBookings.length === 0 ? (
                <Pressable
                  onPress={() =>
                    navigation.navigate("Services", {
                      screen: "BookServiceScreen",
                    })
                  }
                  style={[
                    globalStyles.bgwhite,
                    globalStyles.p4,
                    globalStyles.mt4,
                    globalStyles.alineItemscenter,
                    { borderRadius: 12 },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={40}
                    color={color.primary}
                    style={globalStyles.mb2}
                  />
                  <CustomText
                    style={[globalStyles.f16Bold, globalStyles.primary]}
                  >
                    No upcoming bookings
                  </CustomText>
                  <View
                    style={[globalStyles.alineItemscenter, globalStyles.mt2]}
                  >
                    <CustomText
                      style={[
                        globalStyles.f12Regular,
                        { color: "#666" },
                        globalStyles.textac,
                      ]}
                    >
                      Plan ahead! Book your next car service today for a
                      hassle-free experience.
                    </CustomText>
                  </View>

                  {/* CTA button */}
                  <Pressable
                    onPress={() =>
                      navigation.navigate("Services", {
                        screen: "BookServiceScreen",
                      })
                    }
                    style={[
                      globalStyles.bgprimary,
                      globalStyles.mt4,
                      {
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                      },
                    ]}
                  >
                    <CustomText
                      style={[globalStyles.textWhite, globalStyles.f12Bold]}
                    >
                      Book a Service
                    </CustomText>
                  </Pressable>
                  <CustomText
                    style={[
                      globalStyles.mt2,
                      globalStyles.f12Bold,
                      globalStyles.primary,
                    ]}
                  >
                    👉 Tap the button to get started
                  </CustomText>
                </Pressable>
              ) : (
                upcomingBookings.map((booking) => (
                  <Pressable
                    key={booking.BookingID}
                    style={[
                      styles.bookingCard,
                      (booking.BookingStatus || "").toLowerCase() ===
                        "startjourney" && booking.TechID !== null
                        ? styles.journeyCard
                        : null,
                    ]}
                    disabled={booking.BookingStatus?.toLowerCase() === "failed"}
                    onPress={() =>
                      navigation.navigate("BookingsInnerPage", { booking })
                    }
                  >
                    <View>
                      <View style={styles.bookingR1}>
                        <View
                          style={[
                            globalStyles.flexrow,
                            globalStyles.alineItemscenter,
                          ]}
                        >
                          <CustomText
                            style={[
                              styles.bookingID,
                              {
                                backgroundColor: getStatusColor(
                                  booking.BookingStatus
                                ),
                              },
                            ]}
                          >
                            BID: {booking.BookingTrackID}
                          </CustomText>
                          <View
                            style={[
                              globalStyles.flexrow,
                              globalStyles.alineItemscenter,
                              globalStyles.ph2,
                              globalStyles.pv1,
                              globalStyles.ml2,
                              styles.statusChip,
                              {
                                backgroundColor:
                                  getStatusColor(booking.BookingStatus) + "26",
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor: getStatusColor(
                                    booking.BookingStatus
                                  ),
                                },
                              ]}
                            />
                            <CustomText
                              style={[
                                globalStyles.f10Bold,
                                {
                                  color: getStatusColor(booking.BookingStatus),
                                },
                              ]}
                            >
                              {(booking.BookingStatus || "").toLowerCase() ===
                              "startjourney"
                                ? "Started Journey"
                                : booking.BookingStatus}
                            </CustomText>
                          </View>
                        </View>

                        {booking.BookingStatus?.toLowerCase() !==
                          "cancelled" && (
                          <View
                            style={[
                              globalStyles.flexrow,
                              globalStyles.alineItemscenter,
                            ]}
                          >
                            {booking.TechID === null ? (
                              <CustomText
                                style={[
                                  styles.techStatus,
                                  { color: color.primary },
                                ]}
                              >
                                {booking.TechID === null
                                  ? " "
                                  : "Tech Assigned"}
                              </CustomText>
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
                      {(booking.BookingStatus || "").toLowerCase() ===
                        "startjourney" &&
                        booking.TechID !== null && (
                          <View
                            style={[
                              globalStyles.flexrow,
                              globalStyles.alineItemscenter,
                              globalStyles.mt1,
                              { paddingVertical: 4 },
                            ]}
                          >
                            <Ionicons
                              name="navigate"
                              color={color.primary}
                              size={16}
                              style={globalStyles.mr2}
                            />
                            <CustomText
                              style={[
                                globalStyles.f12Medium,
                                globalStyles.primary,
                              ]}
                            >
                              Technician is on the way
                            </CustomText>
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
                              console.log(
                                "Image load error:",
                                e.nativeEvent.error
                              )
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
                              {booking.PaymentMethod === "COS"
                                ? `Pay On Completion`
                                : "Online Payment"}
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
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <FontAwesome5
                                name="tools"
                                size={16}
                                color={color.primary}
                                style={{ marginRight: 6 }}
                              />
                              <CustomText
                                style={[
                                  globalStyles.f12Bold,
                                  { color: "#333", maxWidth: 180 },
                                ]}
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
                                  navigation.navigate("BookingsInnerPage", {
                                    booking,
                                  })
                                }
                                style={{
                                  backgroundColor: color.primary,
                                  paddingHorizontal: 16,
                                  paddingVertical: 8,
                                  borderRadius: 6,
                                }}
                              >
                                <CustomText
                                  style={[
                                    globalStyles.f10Bold,
                                    { color: "#fff" },
                                  ]}
                                >
                                  View Details
                                </CustomText>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
            {/* Modal for Booking Details */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <Animated.View
                  style={[
                    styles.panel,
                    { top: panelTop, opacity: panelOpacity, transform: [{ translateY: panelTranslateY }] },
                  ]}
                >
                  <View style={{ marginBottom: 10 }}>
                    <View style={[styles.searchBar, { height: 48, shadowOpacity: 0.04 }]}> 
                      <Ionicons
                        name="search"
                        size={16}
                        color={"#999"}
                        style={{ marginRight: 6 }}
                      />
                      <TextInput
                        ref={panelSearchInputRef}
                        value={searchQuery}
                        onChangeText={handleChange}
                        placeholder="Search services…"
                        placeholderTextColor="#999"
                        style={styles.searchInput}
                        returnKeyType="search"
                        autoFocus={true}
                      />
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 8,
                    }}
                  >
                    Search results for: {searchQuery?.trim()}
                  </Text>

                  {searchLoading ? (
                    <View style={{ paddingVertical: 20, alignItems: "center" }}>
                      <ActivityIndicator size="small" color={color.primary} />
                      <Text style={{ marginTop: 10, color: "#666" }}>
                        Searching…
                      </Text>
                    </View>
                  ) : searchError ? (
                    <Text style={{ color: "#D00", marginVertical: 10 }}>
                      {searchError}
                    </Text>
                  ) : (searchResults || []).length === 0 ? (
                    <Text style={{ color: "#666", marginVertical: 10 }}>
                      No services found. Try a different term.
                    </Text>
                  ) : (
                    <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
                      {(searchResults || []).map((item) => {
                        const img = buildImageUrl(item.PackageImage || item.BannerImage);
                        return (
                          <View
                            key={String(item.PackageID)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: "#eee",
                            }}
                          >
                            {img ? (
                              <Image
                                source={{ uri: img }}
                                style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: "#f2f2f2" }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: "#f2f2f2" }}
                              />
                            )}
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={{ fontSize: 14, fontWeight: "600", color: "#111" }} numberOfLines={1}>
                                {item.PackageName}
                              </Text>
                              <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }} numberOfLines={1}>
                                {item.CategoryName} • {item.SubCategoryName}
                              </Text>
                               <Text style={{ fontSize: 12, color: color.primary, marginTop: 2 }}>
                                 ₹ {item.Serv_Off_Price ?? item.Serv_Reg_Price}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                  )}

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Modal>
          </View>
        </>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  banner: {
    backgroundColor: color.primary,
    padding: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    minHeight: 260,
  },
  bannerHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  latestNotificationCard: {
    backgroundColor: color.white,
    borderRadius: 12,
    padding: 12,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 6,
    // elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  latestNotificationCardContainer: {
    borderRadius: 14,
    padding: 1,
  },
  latestNotificationCardInner: {
    backgroundColor: color.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eef4f4",
  },
  latestRow: {
    flexDirection: "row",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // backgroundColor: 'rgba(1,127,119,0.08)',
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(1,127,119,0.08)",
    borderRadius: 8,
    marginLeft: 8,
  },
  chevron: {
    marginLeft: 8,
    alignSelf: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.primary,
    marginRight: 6,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 8,
  },
  bannerTagline: {
    ...globalStyles.f12Regular,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    marginTop: 20,
    marginBottom: 20,
  },
  carImagePositioned: {
    width: "50%",
    height: 120,
    resizeMode: "contain",
  },
  bannerTextContainer: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: "flex-end",
  },
  bannerSubtitle: {
    ...globalStyles.f16Bold,
    color: color.white,
    marginBottom: 4,
    lineHeight: 22,
  },
  bannerDescription: {
    ...globalStyles.f12Regular,
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Section Header Styles
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // marginTop: 32,
    marginBottom: 10,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...globalStyles.f16Bold,
    color: color.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...globalStyles.f12Regular,
    color: "#666",
    fontWeight: "400",
  },
  arrowContainer: {
    padding: 8,
    backgroundColor: "rgba(1, 127, 119, 0.1)",
    borderRadius: 20,
  },

  // Categories Styles
  categoriesContainer: {
    marginBottom: 24,
  },
  twoCategoriesLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  categoryCard: {
    width: 160,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 16,
  },
  cardImageContainer: {
    flex: 1,
    position: "relative",
  },
  categoryCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryCardTitle: {
    ...globalStyles.f12Bold,
    color: color.white,
    flex: 1,
  },
  cardArrow: {
    backgroundColor: color.orange,
    borderRadius: 12,
    padding: 4,
  },
  horizontalScrollContent: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  // CTA Section Styles
  ctaSection: {
    // marginTop: 32,
    marginBottom: 24,
  },
  ctaContainer: {
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 200,
  },
  ctaBackgroundImage: {
    borderRadius: 20,
  },
  ctaContent: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  ctaTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  ctaTitle: {
    ...globalStyles.f20Bold,
    color: color.white,
    marginBottom: 8,
    lineHeight: 28,
  },
  ctaSubtitle: {
    ...globalStyles.f12Regular,
    color: "white",
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 10,
    backgroundColor: color.white,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    ...globalStyles.f12Bold,
    color: color.black,
    marginRight: 8,
  },
  ctaButtonIcon: {
    marginLeft: 4,
  },
  // Bookings Section Styles
  bookingsSection: {
    marginTop: 12,
  },
  bookingsHeader: {
    marginBottom: 20,
  },
  bookingsTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  bookingsIcon: {
    marginRight: 8,
  },
  bookingsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: color.black,
  },
  bookingsSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
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
    elevation: 2,
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
  },
  techBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
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
  onTheWayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingVertical: 4,
  },
  divider: {
    borderBottomColor: "#ededed",
    borderBottomWidth: 1,
    marginVertical: 8,
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
  title: {
    ...globalStyles.f12Bold,
    color: "#222",
  },
  subText: {
    ...globalStyles.f10Bold,
    color: "#666",
    marginTop: 2,
  },
  bookingServices: {
    marginTop: 8,
  },
  // Empty Bookings Styles
  emptyBookingsCard: {
    backgroundColor: color.white,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    // marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  emptyBookingsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(1, 127, 119, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyBookingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: color.black,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyBookingsSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBookingsButton: {
    backgroundColor: color.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBookingsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: color.white,
    marginRight: 8,
  },
  resumeCard: {
    marginTop: 8,
    backgroundColor: "#F7FDFB",
    borderWidth: 1,
    borderColor: "rgba(1,127,119,0.15)",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resumeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,193,7,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  resumeBtn: {
    backgroundColor: color.white,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    height: 55,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    // Shadow/elevation for floating feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
