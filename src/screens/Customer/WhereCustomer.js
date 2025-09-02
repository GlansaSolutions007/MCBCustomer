import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute } from "@react-navigation/native";
import { ref, onValue } from "firebase/database";
import { db } from "../../config/firebaseConfig";
import { GOOGLE_MAPS_APIKEY } from "@env";
import polyline from "@mapbox/polyline";
import technMarker from "../../../assets/images/techMarker.png";
import recenter from "../../../assets/images/recenter.png";
import { color } from "../../styles/theme";

export default function LiveTracking() {
  const [technicianLocation, setTechnicianLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [technicianOffline, setTechnicianOffline] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);

  const route = useRoute();
  const { techId, latitude, longitude } = route.params;

  const mapRef = useRef(null);
  const routeIntervalRef = useRef(null);
  const lastRouteFetchRef = useRef(0);

  // Subscribe to technician live location from Firebase
  useEffect(() => {
    if (!techId) return;

    const technicianRef = ref(db, `technicians/${techId}`);
    const unsubscribe = onValue(technicianRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        // Technician location not available
        setTechnicianOffline(true);
        setTechnicianLocation(null);
        return;
      }

      const latNum = typeof data.latitude === "number" ? data.latitude : parseFloat(data.latitude);
      const lngNum = typeof data.longitude === "number" ? data.longitude : parseFloat(data.longitude);

      if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
        const nextTechLoc = { latitude: latNum, longitude: lngNum };
        setTechnicianLocation(nextTechLoc);
        setTechnicianOffline(false);
        setLastLocationUpdate(new Date());

        // Smoothly move camera towards technician for live-tracking feel
        if (mapRef.current) {
          mapRef.current.animateCamera({ center: nextTechLoc, zoom: 16 }, { duration: 800 });
        }

        // Only fetch route if it's been more than 30 seconds since last fetch
        const now = Date.now();
        if (customerLocation && GOOGLE_MAPS_APIKEY && (now - lastRouteFetchRef.current) > 30000) {
          fetchRoute(nextTechLoc, customerLocation);
        }
      } else {
        setTechnicianOffline(true);
      }
    });

    return () => unsubscribe();
  }, [techId]);

  // Set customer location
  useEffect(() => {
    console.log("latitude", latitude);
    console.log("longitude", longitude);
    console.log("techId", techId);
    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    const hasValidCoords =
      latitude !== null &&
      longitude !== null &&
      latitude !== undefined &&
      longitude !== undefined &&
      !Number.isNaN(latNum) &&
      !Number.isNaN(lngNum);
    if (hasValidCoords) {
      
      const cusLoc = {
        latitude: latNum,
        longitude: lngNum,
      }
      setCustomerLocation(cusLoc);
      console.log("Set customerLocation from params", cusLoc);
    }
  }, [latitude, longitude]);

  // Log when customerLocation actually updates (state updates are async)
  useEffect(() => {
    if (customerLocation) {
      console.log("customerLocation updated", customerLocation);
    }
  }, [customerLocation]);

  // Route calculation will re-run every 10 seconds; technician location is live-updated

  // Optimized route calculation - only when needed
  useEffect(() => {
    if (!technicianLocation || !customerLocation || !GOOGLE_MAPS_APIKEY) {
      setRouteCoords([]);
      setDistance(null);
      return;
    }

    // Initial route fetch
    fetchRoute(technicianLocation, customerLocation);

    // Set up interval for periodic updates (every 60 seconds to avoid API limits)
    routeIntervalRef.current = setInterval(() => {
      if (technicianLocation && customerLocation) {
        fetchRoute(technicianLocation, customerLocation);
      }
    }, 60000); // 60 seconds

    return () => {
      if (routeIntervalRef.current) {
        clearInterval(routeIntervalRef.current);
      }
    };
  }, [technicianLocation, customerLocation]);

  const fetchRoute = useCallback(async (techLoc, custLoc) => {
    if (isLoadingRoute) return; // Prevent multiple simultaneous requests

    setIsLoadingRoute(true);
    lastRouteFetchRef.current = Date.now();

    try {
      if (!GOOGLE_MAPS_APIKEY) {
        console.warn("GOOGLE_MAPS_APIKEY is missing. Skipping route fetch.");
        return;
      }

      const origin = `${techLoc.latitude},${techLoc.longitude}`;
      const destination = `${custLoc.latitude},${custLoc.longitude}`;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_APIKEY}&avoid=tolls&units=metric`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.status === 'OK' && json.routes?.length) {
        const points = polyline.decode(json.routes[0].overview_polyline.points);
        const coords = points.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setRouteCoords(coords);

        const routeLeg = json.routes[0].legs[0];
        if (routeLeg?.distance?.text) {
          setDistance(routeLeg.distance.text);
        }
      } else if (json.status === 'ZERO_RESULTS') {
        console.warn("No routes found between technician and customer location");
        setRouteCoords([]);
        setDistance("Route not available");
      } else {
        console.warn("Route API error:", json.status, json.error_message);
        setRouteCoords([]);
        setDistance("Unable to calculate route");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      setRouteCoords([]);
      setDistance("Route calculation failed");
      // Don't show alert for every route error, just log it
    } finally {
      setIsLoadingRoute(false);
    }
  }, [isLoadingRoute]);

  const recenterMap = () => {
    if (technicianLocation && customerLocation && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [technicianLocation, customerLocation],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
    }
  };

  // Compute an initial region based on whichever location is available
  const initialRegion = technicianLocation || customerLocation
    ? {
        latitude: (technicianLocation || customerLocation).latitude,
        longitude: (technicianLocation || customerLocation).longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      {initialRegion ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          zoomEnabled={true}
          scrollEnabled={true}
        >
          {/* Technician Marker */}
          {technicianLocation && (
            <Marker
              coordinate={technicianLocation}
              title="Technician Location"
              description={lastLocationUpdate ? `Last updated: ${lastLocationUpdate.toLocaleTimeString()}` : "Live location"}
            >
              <Image
                source={technMarker}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </Marker>
          )}

          {/* Customer Marker */}
          {customerLocation && (
            <Marker
              coordinate={customerLocation}
              title="Your Location"
              pinColor="red"
            />
          )}

          {/* Route Polyline */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={6}
              strokeColor={color.mapTracking || "#017F77"}
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={color.secondary} />
          <Text style={styles.loadingText}>
            {technicianOffline ? "Technician location unavailable" : "Loading map..."}
          </Text>
        </View>
      )}

      {/* Recenter Button */}
      {technicianLocation && customerLocation && (
        <TouchableOpacity onPress={recenterMap} style={styles.recenterButton}>
          <Image source={recenter} style={{ width: 30, height: 30 }} />
        </TouchableOpacity>
      )}

      {/* Status and Distance Info */}
      <View style={styles.bottomContainer}>
        {technicianOffline && (
          <Text style={[styles.statusText, { color: "#FF9500" }]}>
            ⚠️ Technician location unavailable
          </Text>
        )}
        <Text style={styles.distanceText}>
          {isLoadingRoute ? "Updating route..." : (distance || "Calculating distance...")}
        </Text>
        {lastLocationUpdate && (
          <Text style={styles.updateText}>
            Last update: {lastLocationUpdate.toLocaleTimeString()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recenterButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.primary,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: color.primary,
    textAlign: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  updateText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
});
