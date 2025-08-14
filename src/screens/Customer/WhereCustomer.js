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
import { GOOGLE_MAPS_APIKEY } from "../../../apiConfig";
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

  // Set customer location
  useEffect(() => {
    if (latitude && longitude) {
      setCustomerLocation({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
    }
  }, [latitude, longitude]);

  // Subscribe to technician location from Firebase
  useEffect(() => {
    if (!techId) return;

    const locationRef = ref(db, `technicians/${techId}`);
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.lat && data?.lng) {
        setTechnicianLocation({
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lng),
        });
      }
    });

    return () => unsubscribe();
  }, [techId]);

  // Fetch route initially and every 10 seconds
  useEffect(() => {
    if (!technicianLocation || !customerLocation) return;

    fetchRoute(technicianLocation, customerLocation);

    const intervalId = setInterval(() => {
      fetchRoute(technicianLocation, customerLocation);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [technicianLocation, customerLocation]);

  const fetchRoute = async (techLoc, custLoc) => {
    try {
      const origin = `${techLoc.latitude},${techLoc.longitude}`;
      const destination = `${custLoc.latitude},${custLoc.longitude}`;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=AIzaSyAC8UIiyDI55MVKRzNTHwQ9mnCnRjDymVo`
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

  if (!technicianLocation || !customerLocation) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: technicianLocation.latitude,
          longitude: technicianLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
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
