import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  Button,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import CustomText from "../../components/CustomText";
import { API_URL, API_IMAGE_URL } from "@env";
import Icon from "react-native-vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlert from "../../components/CustomAlert";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, onValue } from "firebase/database";
import { db } from "../../config/firebaseConfig";
import polyline from "@mapbox/polyline";
import technMarker from "../../../assets/images/techMarker.png";
import recenter from "../../../assets/images/recenter.png";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};

export default function BookingsInnerPage() {
  const route = useRoute();
  const { booking } = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReasons, setCancelReasons] = useState([]);
  const [selectedCancelReason, setSelectedCancelReason] = useState("");
  const summaryOpacity = useState(new Animated.Value(0))[0];
  const contentOpacity = useState(new Animated.Value(0))[0];
  const [expandedPackages, setExpandedPackages] = useState({});
  const mapRef = useRef(null);
  const [technicianLocation, setTechnicianLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [technicianOffline, setTechnicianOffline] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const windowHeight = Dimensions.get('window').height;
  const mapMinHeight = 220;
  const mapMaxHeight = Math.max(320, windowHeight - insets.top - 120);
  const mapHeight = useRef(new Animated.Value(mapMinHeight)).current;
  const isExpandedRef = useRef(false);

  const animateMapHeight = (to) => {
    Animated.timing(mapHeight, { toValue: to, duration: 250, useNativeDriver: false }).start();
  };

  const toggleMapExpand = () => {
    const next = !isExpandedRef.current;
    isExpandedRef.current = next;
    animateMapHeight(next ? mapMaxHeight : mapMinHeight);
  };

  const currentDragHeightRef = useRef(mapMinHeight);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
      onPanResponderGrant: () => {
        mapHeight.stopAnimation((val) => { currentDragHeightRef.current = val; });
      },
      onPanResponderMove: (_, gestureState) => {
        const next = Math.min(mapMaxHeight, Math.max(mapMinHeight, currentDragHeightRef.current + gestureState.dy));
        mapHeight.setValue(next);
      },
      onPanResponderRelease: () => {
        mapHeight.stopAnimation((val) => {
          const mid = (mapMinHeight + mapMaxHeight) / 2;
          const expand = val > mid;
          isExpandedRef.current = expand;
          animateMapHeight(expand ? mapMaxHeight : mapMinHeight);
        });
      },
    })
  ).current;

  const togglePackage = (packageId) => {
    setExpandedPackages((prev) => ({ ...prev, [packageId]: !prev[packageId] }));
  };

  const statusText =
    booking.BookingStatus?.toLowerCase() === "startjourney"
      ? "Started Journey"
      : booking.BookingStatus;

  const getStatusColor = () => {
    const status = booking.BookingStatus?.toLowerCase();
    if (status === "pending") return "#FF9500";
    if (status === "startjourney") return color.primary;
    if (status === "cancelled") return color.alertError || "#FF3B30";
    if (status === "completed") return "#34C759";
    return color.primary;
  };

  useEffect(() => {
    const fetchCancelReasons = async () => {
      try {
        const response = await axios.get(`${API_URL}AfterServiceLeads`);
        const reasons = response.data
          .filter((item) => item.ReasonType === "Cancel" && item.IsActive)
          .map((item) => item.Reason);
        setCancelReasons([...reasons, "Other"]);
      } catch (error) {
        console.error("Error fetching cancellation reasons:", error);
        setCancelReasons([
          "Change of plans",
          "Found a better option",
          "Financial constraints",
          "Scheduling conflict",
          "Other",
        ]); // Fallback reasons
      }
    };
    fetchCancelReasons();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(summaryOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [summaryOpacity, contentOpacity]);

  // Setup customer location from booking coordinates
  useEffect(() => {
    const latNum = Number(booking.Latitude);
    const lngNum = Number(booking.Longitude);
    const hasValid = Number.isFinite(latNum) && Number.isFinite(lngNum);
    if (hasValid) {
      setCustomerLocation({ latitude: latNum, longitude: lngNum });
    }
  }, [booking.Latitude, booking.Longitude]);

  // Subscribe to technician location whenever a TechID exists
  useEffect(() => {
    if (!booking.TechID) return;

    const techIdSanitized = String(booking.TechID).trim();
    console.log("Tech ID sanitized:", techIdSanitized);
    const techPath = `technicians/${techIdSanitized}`;
    const technicianRef = ref(db, techPath);

    const unsubscribe = onValue(technicianRef, (snapshot) => {
      const data = snapshot.val();
      // Debug logs to verify incoming payload
      console.log("Technician path:", techPath);
      console.log("Technician snapshot exists:", snapshot.exists());
      if (!data) {
        console.log("Technician data missing at path");
        setTechnicianOffline(true);
        setTechnicianLocation(null);
        return;
      }

      // Support multiple possible data shapes
      // 1) { latitude, longitude }
      // 2) { lat, lng }
      // 3) { location: { latitude, longitude } }
      // 4) { coords: { latitude, longitude } }
      const candidate = {
        latitude:
          data?.latitude ?? data?.lat ?? data?.location?.latitude ?? data?.coords?.latitude,
        longitude:
          data?.longitude ?? data?.lng ?? data?.location?.longitude ?? data?.coords?.longitude,
      };

      const lat = typeof candidate.latitude === "number"
        ? candidate.latitude
        : parseFloat(candidate.latitude);
      const lng = typeof candidate.longitude === "number"
        ? candidate.longitude
        : parseFloat(candidate.longitude);

      console.log("Technician parsed coords:", { lat, lng, raw: data });

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const nextLoc = { latitude: lat, longitude: lng };
        setTechnicianLocation(nextLoc);
        setTechnicianOffline(false);
        setLastLocationUpdate(new Date());
        if (mapRef.current) {
          mapRef.current.animateCamera(
            { center: nextLoc, zoom: 15 },
            { duration: 700 }
          );
        }
      } else {
        console.log("Technician coords invalid or not numeric");
        setTechnicianOffline(true);
      }
    });

    // Seed initial value via one-time read
    // Helpful if the real-time listener fires later
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        // dynamic import to avoid adding get at top if unused elsewhere
        const { get } = await import('firebase/database');
        const snap = await get(technicianRef);
        if (snap.exists()) {
          const d = snap.val();
          const candidate = {
            latitude: d?.latitude ?? d?.lat ?? d?.location?.latitude ?? d?.coords?.latitude,
            longitude: d?.longitude ?? d?.lng ?? d?.location?.longitude ?? d?.coords?.longitude,
          };
          const lat0 = typeof candidate.latitude === 'number' ? candidate.latitude : parseFloat(candidate.latitude);
          const lng0 = typeof candidate.longitude === 'number' ? candidate.longitude : parseFloat(candidate.longitude);
          if (Number.isFinite(lat0) && Number.isFinite(lng0)) {
            const seeded = { latitude: lat0, longitude: lng0 };
            setTechnicianLocation(seeded);
            setTechnicianOffline(false);
          }
        }
      } catch (e) {
        console.log('Initial technician get() failed:', e?.message || e);
      }
    })();

    return () => unsubscribe();
  }, [booking.TechID]);

  const fetchRoute = useCallback(async (techLoc, custLoc) => {
    try {
      const origin = `${techLoc.latitude},${techLoc.longitude}`;
      const destination = `${custLoc.latitude},${custLoc.longitude}`;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${
          process.env.GOOGLE_MAPS_APIKEY || ""
        }&avoid=tolls&units=metric`
      );
      if (!response.ok) return;
      const json = await response.json();
      if (json.status === "OK" && json.routes?.length) {
        const points = polyline.decode(json.routes[0].overview_polyline.points);
        const coords = points.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setRouteCoords(coords);
        const leg = json.routes[0].legs?.[0];
        if (leg?.distance?.text) setDistance(leg.distance.text);
      } else {
        setRouteCoords([]);
      }
    } catch (e) {
      setRouteCoords([]);
    }
  }, []);

  // Fetch route when both locations are ready
  useEffect(() => {
    if (technicianLocation && customerLocation) {
      fetchRoute(technicianLocation, customerLocation);
    }
  }, [technicianLocation, customerLocation, fetchRoute]);

  const recenterMap = () => {
    if (technicianLocation && customerLocation && mapRef.current) {
      mapRef.current.fitToCoordinates([technicianLocation, customerLocation], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const handleCancelBooking = async (reason) => {
    const userData = await AsyncStorage.getItem("userData");
    const parsedData = JSON.parse(userData);
    const custID = parsedData?.custID;
    setIsCancelling(true);
    try {
      const response = await axios.post(`${API_URL}Cancellations`, {
        bookingID: booking.BookingID,
        cancelledBy: custID,
        reason: reason,
        refundStatus: "",
      });
      console.log(response.data, "rressssss");

      if (response.status === 200) {
        setShowCancelAlert(false);
        navigation.goBack();
      }
    } catch (error) {
      console.error("Cancel booking error:", error);
      setShowCancelAlert(false);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F5F5F5" }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {/* Live Map (shown first like Zomato) */}
        {booking.BookingStatus?.toLowerCase() === "startjourney" &&
          booking.TechID && (
            <Animated.View
              style={[styles.mapCard, { opacity: summaryOpacity }]}
            >
              <Animated.View
                style={{ height: mapHeight, borderRadius: 12, overflow: "hidden" }}
              >
                <View style={styles.mapDragHandle} {...panResponder.panHandlers}>
                  <View style={styles.mapGrabber} />
                </View>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={{ flex: 1 }}
                  initialRegion={
                    customerLocation
                      ? {
                          latitude: customerLocation.latitude,
                          longitude: customerLocation.longitude,
                          latitudeDelta: 0.05,
                          longitudeDelta: 0.05,
                        }
                      : undefined
                  }
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  zoomEnabled
                  scrollEnabled
                >
                  {technicianLocation && (
                    <Marker coordinate={technicianLocation} title="Technician">
                      <Image
                        source={technMarker}
                        style={{ width: 40, height: 40 }}
                        resizeMode="contain"
                      />
                    </Marker>
                  )}
                  {customerLocation && (
                    <Marker
                      coordinate={customerLocation}
                      title="You"
                      pinColor="red"
                    />
                  )}
                  {routeCoords.length > 0 && (
                    <Polyline
                      coordinates={routeCoords}
                      strokeWidth={5}
                      strokeColor={color.mapTracking || "#017F77"}
                    />
                  )}
                </MapView>
                <View style={styles.mapOverlayTop}>
                  <CustomText style={[globalStyles.f12Bold, { color: "#fff" }]}>
                    Technician is on the way
                  </CustomText>
                  {!!distance && (
                    <CustomText
                      style={[globalStyles.f12Medium, { color: "#fff" }]}
                    >
                      Approx distance: {distance}
                    </CustomText>
                  )}
                </View>
                <TouchableOpacity onPress={recenterMap} style={styles.mapRecenterBtn}>
                  <Icon name="my-location" size={22} color={color.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleMapExpand} style={styles.mapExpandBtn}>
                  <Icon name="open-in-full" size={20} color="#333" />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}

        {/* Booking Summary */}
        <Animated.View
          style={[styles.summaryCard, { opacity: summaryOpacity }]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor() + "20" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor() },
                ]}
              />
              <CustomText
                style={[styles.statusChipText, { color: getStatusColor() }]}
              >
                {statusText}
              </CustomText>
            </View>
            <CustomText style={[globalStyles.f10Bold, { color: "#999" }]}>
              BID: {booking.BookingTrackID}
            </CustomText>
          </View>

          {/* Debug: Show Technician ID for testing */}
          <View style={{ marginTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <CustomText style={[globalStyles.f10Bold, { color: "#666" }]}>TechID:</CustomText>
            <CustomText style={[globalStyles.f10Bold, { color: "#333" }]}>
              {booking?.TechID != null ? String(booking.TechID) : "N/A"}
            </CustomText>
          </View>
          {technicianLocation && (
            <View style={{ marginTop: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <CustomText style={[globalStyles.f10Bold, { color: "#666" }]}>Tech Coords:</CustomText>
              <CustomText style={[globalStyles.f10Bold, { color: "#333" }]}>
                {technicianLocation.latitude.toFixed(5)}, {technicianLocation.longitude.toFixed(5)}
              </CustomText>
            </View>
          )}

          <View style={[styles.dividerLine, { marginVertical: 12 }]} />

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: `${API_IMAGE_URL}${booking.VehicleImage}` }}
              style={styles.summaryVehicleImage}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <CustomText style={[globalStyles.f14Bold, { color: "#222" }]}>
                {booking.BrandName} {booking.ModelName}
              </CustomText>
              <CustomText
                style={[
                  globalStyles.f12Regular,
                  { color: "#666", marginTop: 2 },
                ]}
              >
                {booking.VehicleNumber} • {booking.FuelTypeName}
              </CustomText>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon
                name="event"
                size={16}
                color={color.primary}
                style={{ marginRight: 6 }}
              />
              <CustomText style={[globalStyles.f12Bold]}>
                {formatDate(booking.BookingDate)}
              </CustomText>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon
                name="schedule"
                size={16}
                color={color.primary}
                style={{ marginRight: 6 }}
              />
              <CustomText style={[globalStyles.f12Bold]}>
                {booking.TimeSlot}
              </CustomText>
            </View>
          </View>
        </Animated.View>

        <CustomText
          style={[styles.sectionTitle, globalStyles.f14Bold, { marginTop: 20 }]}
        >
          Packages
        </CustomText>
        {(booking.Packages || []).map((pkg) => {
          const isExpanded = !!expandedPackages[pkg.PackageID];
          return (
            <View key={pkg.PackageID} style={[styles.packageCard]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => togglePackage(pkg.PackageID)}
                style={styles.packageHeader}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <FontAwesome5
                    name="box-open"
                    size={16}
                    color={color.primary}
                    style={{ marginRight: 8 }}
                  />
                  <CustomText
                    style={[globalStyles.f14Bold, { color: "#222", flex: 1 }]}
                  >
                    {pkg.PackageName}
                  </CustomText>
                </View>
                <View style={styles.durationPill}>
                  <Icon
                    name="schedule"
                    size={14}
                    color={color.primary}
                    style={{ marginRight: 4 }}
                  />
                  <CustomText
                    style={[globalStyles.f10Bold, { color: color.primary }]}
                  >
                    {pkg.EstimatedDurationMinutes}m
                  </CustomText>
                </View>
                <Icon
                  name="expand-more"
                  size={22}
                  color="#999"
                  style={{
                    marginLeft: 8,
                    transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                  }}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.packageBody}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View style={styles.categoryPill}>
                      <Icon
                        name="category"
                        size={14}
                        color={"#fff"}
                        style={{ marginRight: 6 }}
                      />
                      <CustomText
                        style={[globalStyles.f10Bold, { color: "#fff" }]}
                      >
                        {pkg.Category.CategoryName}
                      </CustomText>
                    </View>
                  </View>

                  {(pkg.Category.SubCategories || []).map((subCat) => (
                    <View key={subCat.SubCategoryID} style={styles.subSection}>
                      <CustomText
                        style={[styles.subLabel, globalStyles.f12Bold]}
                      >
                        {subCat.SubCategoryName}
                      </CustomText>
                      <View style={styles.chipsRow}>
                        {(subCat.Includes || []).map((include) => (
                          <View
                            key={include.IncludeID}
                            style={styles.includeChip}
                          >
                            <Icon
                              name="check-circle"
                              size={14}
                              color={color.primary}
                              style={{ marginRight: 6 }}
                            />
                            <CustomText
                              style={[
                                globalStyles.f10Medium,
                                { color: "#333" },
                              ]}
                            >
                              {include.IncludeName}
                            </CustomText>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <CustomText
          style={[styles.sectionTitle, globalStyles.f14Bold, { marginTop: 8 }]}
        >
          Booking Details
        </CustomText>
        <Animated.View style={[styles.card, { opacity: contentOpacity }]}>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>
              Date:
            </CustomText>
            <CustomText style={[styles.value, globalStyles.f12Regular]}>
              {formatDate(booking.BookingDate)}
            </CustomText>
          </View>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>
              Time Slot:
            </CustomText>
            <CustomText style={[styles.value, globalStyles.f12Regular]}>
              {booking.TimeSlot}
            </CustomText>
          </View>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>
              Technician:
            </CustomText>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 2,
                justifyContent: "flex-end",
              }}
            >
              <View>
                <CustomText
                  style={[
                    styles.value,
                    globalStyles.f12Regular,
                    {
                      color: booking.TechID === null ? "#FF9500" : "#333",
                      fontWeight: booking.TechID === null ? "bold" : "normal",
                    },
                  ]}
                >
                  {booking.TechID === null
                    ? "Not Assigned Yet"
                    : `Assigned (${booking.TechFullName})`}
                </CustomText>
                {booking.BookingStatus.toLowerCase() === "startjourney" &&
                  booking.TechID !== null && (
                    <View style={{ marginRight: 4 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FontAwesome5
                          name="map-marker-alt"
                          size={18}
                          color={color.yellow}
                        />
                        <CustomText
                          style={[
                            styles.value,
                            globalStyles.f12Regular,
                            {
                              color: color.yellow || "#007AFF",
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          Journey Started
                        </CustomText>
                      </View>
                    </View>
                  )}
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>
              Status:
            </CustomText>
            <CustomText
              style={[
                styles.value,
                globalStyles.f12Regular,
                { color: color.primary || "#007AFF", fontWeight: "bold" },
              ]}
            >
              {booking.BookingStatus.toLowerCase() === "startjourney"
                ? "Started Journey"
                : booking.BookingStatus}
            </CustomText>
          </View>

          {booking.BookingStatus.toLowerCase() === "cancelled" && (
            <View style={styles.section}>
              <CustomText style={[styles.label, globalStyles.f12Bold]}>
                Cancellation Reason:
              </CustomText>
              <CustomText style={[styles.value, globalStyles.f12Regular]}>
                {booking.Reason || "N/A"}
              </CustomText>
            </View>
          )}

          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>
              Package Price:
            </CustomText>
            <CustomText style={[styles.value, globalStyles.f12Bold]}>
              ₹ {booking.TotalPrice}
            </CustomText>
          </View>

          {booking.CouponAmount > 0 && (
            <View style={styles.section}>
              <CustomText style={[styles.label, globalStyles.f12Bold]}>
                Discount Price:
              </CustomText>
              <CustomText style={[styles.value, globalStyles.f12Bold]}>
                - ₹ {booking.CouponAmount}
              </CustomText>
            </View>
          )}
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>
              GST Amount:
            </CustomText>
            <CustomText style={[styles.value, globalStyles.f12Bold]}>
              ₹ {booking.GSTAmount}
            </CustomText>
          </View>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>
              Total Price:
            </CustomText>
            <CustomText style={[styles.value, globalStyles.f12Bold]}>
              {booking.Payments && booking.Payments.length > 0
                ? `₹ ${booking.Payments[0].AmountPaid}`
                : "Payment Failed"}
            </CustomText>
          </View>
          {booking.BookingStatus.toLowerCase() === "pending" && 
            !(booking.BookingStatus.toLowerCase() === "pending" && (!booking.Payments || booking.Payments.length === 0)) && (
            <View
              style={[
                styles.section,
                { justifyContent: "space-between", alignItems: "center" },
              ]}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: color.alertError || "#FF3B30",
                  padding: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  minWidth: 140,
                  marginTop: 10,
                }}
                onPress={() => setShowCancelAlert(true)}
                disabled={isCancelling}
              >
                <CustomText style={[globalStyles.f10Bold, { color: "#FFF" }]}>
                  {isCancelling ? "Cancelling..." : "Cancel Booking"}
                </CustomText>
              </TouchableOpacity>
              {(!booking.Payments || booking.Payments.length === 0) && (
                <TouchableOpacity
                  style={{
                    backgroundColor: color.primary,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    minWidth: 140,
                    marginTop: 10,
                  }}
                  onPress={() =>
                    navigation.navigate("Cart", {
                      resumeBookingId: booking.BookingID,
                    })
                  }
                >
                  <CustomText style={[globalStyles.f10Bold, { color: "#FFF" }]}>
                    Resume Booking
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Resume Booking Section - for pending bookings with no payments */}
          {booking.BookingStatus.toLowerCase() === "pending" && 
            (!booking.Payments || booking.Payments.length === 0) && (
            <View
              style={[
                styles.section,
                { justifyContent: "center", alignItems: "center" },
              ]}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: color.primary,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  minWidth: 140,
                  marginTop: 10,
                }}
                onPress={() =>
                  navigation.navigate("Cart", {
                    resumeBookingId: booking.BookingID,
                  })
                }
              >
                <CustomText style={[globalStyles.f10Bold, { color: "#FFF" }]}>
                  Resume Booking
                </CustomText>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {booking.BookingStatus?.toLowerCase() !== "completed" &&
          booking.BookingStatus?.toLowerCase() !== "cancelled" &&
          booking.TechID !== null && (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                marginVertical: 12,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <CustomText style={[globalStyles.f14Bold, { color: "#333" }]}>
                  Booking OTP
                </CustomText>
                <View style={styles.otpRow}>
                  {String(booking.BookingOTP || "")
                    .split("")
                    .map((digit, idx) => (
                      <View key={`${digit}-${idx}`} style={styles.otpBox}>
                        <CustomText
                          style={[
                            globalStyles.f20Bold,
                            { color: color.primary },
                          ]}
                        >
                          {digit}
                        </CustomText>
                      </View>
                    ))}
                </View>
              </View>

              <View style={styles.otpNote}>
                <Icon
                  name="privacy-tip"
                  size={18}
                  color={color.primary}
                  style={{ marginRight: 8 }}
                />
                <CustomText
                  style={[globalStyles.f12Regular, styles.otpNoteText]}
                >
                  Dear buddy please wisper the OTP in our technician ear so that
                  he can start your service
                </CustomText>
              </View>
            </View>
          )}

        {/* <CustomText
          style={[styles.sectionTitle, globalStyles.f14Bold, { marginTop: 20 }]}
        >
          Vehicle Details
        </CustomText>
        <View style={styles.card}>
          <View style={[styles.section, { alignItems: 'center', justifyContent: 'flex-start' }]}>
            <Image
              source={{ uri: `${API_IMAGE_URL}${booking.VehicleImage}` }}
              style={styles.vehicleImage}
              onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
            />
          </View>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>
              Vehicle:
            </CustomText>
            <CustomText style={[styles.value, globalStyles.f12Regular]}>
              {booking.BrandName} {booking.ModelName}
            </CustomText>
          </View>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>
              Vehicle Number:
            </CustomText>
            <CustomText style={[styles.value, globalStyles.f12Regular]}>
              {booking.VehicleNumber}
            </CustomText>
          </View>
          <View style={styles.section}>
            <CustomText style={[styles.label, globalStyles.f12Bold]}>
              Fuel Type:
            </CustomText>
            <CustomText style={[styles.value, globalStyles.f12Regular]}>
              {booking.FuelTypeName}
            </CustomText>
          </View>
        </View> */}
      </ScrollView>
      <CustomAlert
        visible={showCancelAlert}
        status="error"
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking?"
        onClose={() => setShowCancelAlert(false)}
        showButton={false}
        showCancelReasons={true}
        reasons={cancelReasons}
        onConfirm={handleCancelBooking}
      />
    </>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    elevation: 3,
    marginBottom: 10,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusChipText: {
    ...globalStyles.f12Bold,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#eee",
    width: "100%",
  },
  summaryVehicleImage: {
    width: 68,
    height: 48,
    resizeMode: "contain",
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  mapCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    width: "100%",
    elevation: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  mapOverlayTop: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 10,
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mapRecenterBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  mapExpandBtn: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  mapDragHandle: {
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  mapGrabber: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
  },
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
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  otpBox: {
    width: 44,
    height: 48,
    marginHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#f7faf9",
    borderWidth: 1,
    borderColor: "rgba(1,127,119,0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  otpNote: {
    marginTop: 12,
    backgroundColor: "rgba(1,127,119,0.06)",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  otpNoteText: {
    color: "#333",
    flex: 1,
  },
  packageCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(1,127,119,0.08)",
  },
  packageBody: {
    marginTop: 10,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: color.primary,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  includeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
    marginRight: 6,
    marginBottom: 6,
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
