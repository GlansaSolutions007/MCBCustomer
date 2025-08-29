import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useRoute } from "@react-navigation/native";
import { ref, onValue } from "firebase/database";
import { db } from "../../config/firebaseConfig";
// import { GOOGLE_MAPS_APIKEY } from "@env";
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

  const route = useRoute();
  const { techId, latitude, longitude } = route.params;

  const mapRef = useRef(null);

  // Subscribe to technician live location from Firebase
  useEffect(() => {
    if (!techId) return;

    const technicianRef = ref(db, `technicians/${techId}`);
    const unsubscribe = onValue(technicianRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const latNum = typeof data.latitude === "number" ? data.latitude : parseFloat(data.latitude);
      const lngNum = typeof data.longitude === "number" ? data.longitude : parseFloat(data.longitude);

      if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
        const nextTechLoc = { latitude: latNum, longitude: lngNum };
        setTechnicianLocation(nextTechLoc);

        // Smoothly move camera towards technician for live-tracking feel
        if (mapRef.current) {
          mapRef.current.animateCamera({ center: nextTechLoc, zoom: 16 }, { duration: 800 });
        }

        // Refresh route on every tech update when customer location and API key are available
        if (customerLocation && GOOGLE_MAPS_APIKEY) {
          fetchRoute(nextTechLoc, customerLocation);
        }
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

  // Fetch route initially and every 10 seconds when both points exist and API key is present
  useEffect(() => {
    if (!technicianLocation || !customerLocation) return;
    if (!GOOGLE_MAPS_APIKEY) return;

    fetchRoute(technicianLocation, customerLocation);

    const intervalId = setInterval(() => {
      fetchRoute(technicianLocation, customerLocation);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [technicianLocation, customerLocation]);

  const fetchRoute = async (techLoc, custLoc) => {
    try {
      if (!GOOGLE_MAPS_APIKEY) {
        console.warn("GOOGLE_MAPS_APIKEY is missing. Skipping route fetch.");
        return;
      }
      const origin = `${techLoc.latitude},${techLoc.longitude}`;
      const destination = `${custLoc.latitude},${custLoc.longitude}`;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const json = await response.json();

      if (json.routes?.length) {
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
      } else {
        console.warn("No routes found:", json);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      Alert.alert("Route Error", "Could not fetch route from Google Maps API.");
    }
  };

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
          style={{ flex: 1 }}
          initialRegion={initialRegion}
        >
        {/* Technician Marker */}
        {technicianLocation && (
          <Marker coordinate={technicianLocation} title="Technician">
            <Image
              source={technMarker}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </Marker>
        )}

        {/* Customer Marker */}
        {customerLocation && (
          <Marker coordinate={customerLocation} title="Customer" pinColor="red" />
        )}

        {/* Route Polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={6}
            strokeColor={color.mapTracking}
          />
        )}
        </MapView>
      ) : (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={color.secondary} />
        </View>
      )}

      {/* Recenter Button */}
      <TouchableOpacity onPress={recenterMap} style={styles.recenterButton}>
        <Image source={recenter} style={{ width: 30, height: 30 }} />
      </TouchableOpacity>

      {/* Distance Info */}
      <View style={styles.bottomContainer}>
        <Text style={styles.distanceText}>
          {distance ? `Distance: ${distance}` : "Calculating distance..."}
        </Text>
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
});
