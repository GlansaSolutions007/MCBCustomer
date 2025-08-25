import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { Feather, FontAwesome } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as GoogleGeocoding from "expo-location";
import SearchBox from "../../components/SearchBox";
// import { GOOGLE_MAPS_APIKEY } from "@env";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert from "../../components/CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getToken } from "../../utils/token";
// import { API_BASE_URL } from "@env";
import { API_URL, API_IMAGE_URL, GOOGLE_MAPS_APIKEY, RAZORPAY_KEY } from "@env";

const ConfirmAddressPage = ({ navigation }) => {

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("Home");
  const [region, setRegion] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [address, setAddress] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertStatus, setAlertStatus] = useState("info");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [matchedState, setMatchedState] = useState(null);
  const [matchedCity, setMatchedCity] = useState(null);
  const [addressLine1Error, setAddressLine1Error] = useState(false);
  const predictionOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission to access location was denied");
        return;
      }
      setLocationPermission(true);

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  const fetchAutocomplete = async () => {
    if (searchText.length < 3) return;

    const apiKey = GOOGLE_MAPS_APIKEY;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      searchText
    )}&key=${apiKey}&location=${region?.latitude},${region?.longitude
      }&radius=50000`;

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (json.status === "OK") {
        setPredictions(json.predictions);
        Animated.timing(predictionOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        console.warn(
          "Google Autocomplete Error:",
          json.status,
          json.error_message
        );
        setPredictions([]);
      }
    } catch (error) {
      console.error("Autocomplete fetch failed:", error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchText.length > 2) {
        fetchAutocomplete();
      } else {
        setPredictions([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchText]);

  const hidePredictions = () => {
    Animated.timing(predictionOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setPredictions([]));
  };

  const handleSelectPrediction = async (prediction) => {
    const apiKey = GOOGLE_MAPS_APIKEY;
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${apiKey}`;

    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    const loc = detailsData.result.geometry.location;

    setRegion({
      latitude: loc.lat,
      longitude: loc.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setAddress(detailsData.result.formatted_address);
    setSearchText("");
    hidePredictions();
  };

  useEffect(() => {
    const fetchStatesAndCities = async () => {
      try {
        const stateRes = await fetch(`${API_URL}State`);
        const stateData = await stateRes.json();
        setStatesList(stateData.filter((state) => state.IsActive));

        const cityRes = await fetch(`${API_URL}City`);
        const cityData = await cityRes.json();
        setCitiesList(cityData.filter((city) => city.IsActive));
      } catch (error) {
        console.error("Failed to fetch states or cities", error);
      }
    };
    fetchStatesAndCities();
  }, []);

  const reverseGeocode = async () => {
    const apiKey = GOOGLE_MAPS_APIKEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${region.latitude},${region.longitude}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.results?.length > 0) {
        const addressComponents = data.results[0].address_components;

        const getComponent = (types) =>
          addressComponents.find((comp) =>
            types.every((type) => comp.types.includes(type))
          )?.long_name || "";

        const city =
          getComponent(["locality"]) ||
          getComponent(["administrative_area_level_2"]);
        const state = getComponent(["administrative_area_level_1"]);
        const pincode = getComponent(["postal_code"]);

        setAddress(data.results[0].formatted_address);
        setCity(city);
        setState(state);
        setPincode(pincode);

        // Check if the pincode exists in the citiesList
        const matchedCity = citiesList.find(
          (c) => c.Pincode === pincode && c.IsActive
        );

        if (!matchedCity) {
          setAlertStatus("error");
          setAlertTitle("Service Unavailable");
          setAlertMessage("We do not provide service at this pincode yet.");
          setAlertVisible(true);
          setMatchedCity(null);
          setMatchedState(null);
          return;
        }

        // Set matched city and state for form submission
        setMatchedCity(matchedCity);
        setMatchedState(
          statesList.find((s) => s.StateID === matchedCity.StateID)
        );
        setFormModalVisible(true);
      } else {
        setAlertStatus("error");
        setAlertTitle("Error");
        setAlertMessage("Could not retrieve address details.");
        setAlertVisible(true);
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setAlertStatus("error");
      setAlertTitle("Error");
      setAlertMessage("Failed to retrieve address details. Try again later.");
      setAlertVisible(true);
    }
  };

  const submitAddress = async () => {
    if (!matchedCity || !matchedState) {
      setAlertStatus("error");
      setAlertTitle("Invalid Location");
      setAlertMessage("Please select a valid address with a supported pincode.");
      setAlertVisible(true);
      return;
    }

    if (!addressLine1.trim()) {
      setAddressLine1Error(true);
      return;
    } else {
      setAddressLine1Error(false);
    }

    try {
      const token = await getToken();
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;

      if (!custID) {
        throw new Error("Customer ID not found.");
      }

      const payload = {
        custID,
        addressLine1,
        addressLine2,
        stateID: matchedState.StateID,
        cityID: matchedCity.CityID,
        pincode,
        latitude: region.latitude,
        longitude: region.longitude,
        isDefault: true,
        createdBy: custID,
        isActive: true,
      };

      const response = await axios.post(
        `${API_URL}CustomerAddresses`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Address saved successfully:", response.data);
      setFormModalVisible(false);
      navigation.goBack();
    } catch (err) {
      console.error("Failed to submit address:", err);
      setAlertStatus("error");
      setAlertTitle("Failed");
      setAlertMessage("Could not save address. Try again later.");
      setAlertVisible(true);
    }
  };
  const iconMap = {
    Home: <Feather name="home" size={16} style={{ marginRight: 6 }} />,
    Office: (
      <FontAwesome name="building" size={16} style={{ marginRight: 6 }} />
    ),
    "Friend and Family": (
      <Feather name="users" size={16} style={{ marginRight: 6 }} />
    ),
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["bottom"]}
    >
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={{ paddingHorizontal: 16 }}>
          <SearchBox value={searchText} onChangeText={setSearchText} />
        </View>
        {predictions.length > 0 && (
          <Animated.View style={{ opacity: predictionOpacity }}>
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectPrediction(item)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderColor: "#ddd",
                    backgroundColor: "#ffffffff",
                  }}
                >
                  <CustomText style={[globalStyles.f10Bold, { color: "#000" }]}>
                    {item.description}
                  </CustomText>
                </TouchableOpacity>
              )}
              style={{
                maxHeight: 180,
                backgroundColor: "#ffffffff",
              }}
              keyboardShouldPersistTaps="handled"
            />
          </Animated.View>
        )}

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            marginHorizontal: 16,
            marginTop: 10,
            borderRadius: 8,
            backgroundColor: "#f0f0f0",
          }}
          onPress={async () => {
            try {
              let { status } =
                await Location.requestForegroundPermissionsAsync();
              if (status !== "granted") {
                setAlertStatus("error");
                setAlertTitle("Permission Denied");
                setAlertMessage(
                  "Location permission is required to use this feature."
                );
                setAlertVisible(true);
                return;
              }
              let location = await Location.getCurrentPositionAsync({});
              const { latitude, longitude } = location.coords;

              setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });

              // Optional: also reverse geocode and update the address
              const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_APIKEY}`;
              const response = await fetch(url);
              const data = await response.json();

              if (data.results?.length > 0) {
                setAddress(data.results[0].formatted_address);
                const components = data.results[0].address_components;

                const getComponent = (types) =>
                  components.find((c) =>
                    types.every((t) => c.types.includes(t))
                  )?.long_name || "";

                setCity(
                  getComponent(["locality"]) ||
                  getComponent(["administrative_area_level_2"])
                );
                setState(getComponent(["administrative_area_level_1"]));
                setPincode(getComponent(["postal_code"]));
              }
            } catch (error) {
              console.error("Error fetching current location:", error);
              setAlertStatus("error");
              setAlertTitle("Error");
              setAlertMessage("Failed to fetch your current location.");
              setAlertVisible(true);
            }
          }}
        >
          <MaterialIcons
            name="my-location"
            size={20}
            color={color.secondary}
            style={{ marginRight: 8 }}
          />
          <CustomText style={[globalStyles.f12Bold, { color: "#000" }]}>
            Use Current Location
          </CustomText>
        </TouchableOpacity>

        {address ? (
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginHorizontal: 16,
                marginVertical: 10,
              }}
            >
              <View
                style={{
                  backgroundColor: color.secondary,
                  padding: 8,
                  borderRadius: 8,
                  marginRight: 10,
                  marginTop: 2,
                }}
              >
                <MaterialIcons name="location-on" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText style={{ ...globalStyles.f10Bold, color: "#000" }}>
                  {address}
                </CustomText>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setAddress("");
                  setSearchText("");
                  setPredictions([]);
                }}
              >
                <Ionicons name="close-circle" size={26} color="#666" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={async () => {
                await reverseGeocode();
              }}
            >
              <CustomText style={styles.confirmText}>
                Confirm Address
              </CustomText>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          {region ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              region={region}
              showsUserLocation={true}
            >
              <Marker coordinate={region} />
            </MapView>
          ) : (
            <View style={styles.mapLoading}>
              <CustomText style={[globalStyles.f12Bold, { color: "#000" }]}>
                Loading Map...
              </CustomText>
            </View>
          )}
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={formModalVisible}
          onRequestClose={() => setFormModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <TouchableWithoutFeedback
              onPress={() => setFormModalVisible(false)}
            >
              <View style={{ flex: 1 }} />
            </TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
              <View style={styles.modalContent}>
                <ScrollView
                  contentContainerStyle={{ paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Close Icon */}
                  <TouchableOpacity
                    style={{ alignSelf: "flex-end", marginBottom: 2 }}
                    onPress={() => setFormModalVisible(false)}
                  >
                    <Ionicons name="close-circle" size={30} color="black" />
                  </TouchableOpacity>

                  {/* Form content */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: color.secondary,
                        padding: 8,
                        borderRadius: 8,
                        marginRight: 10,
                        marginTop: 6,
                      }}
                    >
                      <MaterialIcons
                        name="location-on"
                        size={20}
                        color="#fff"
                      />
                    </View>

                    <View>
                      <CustomText style={styles.locationTitle}>
                        {address || "Selected Location"}
                      </CustomText>
                      <CustomText style={styles.locationSub}>
                        Lat: {region?.latitude?.toFixed(4)}, Lng:{" "}
                        {region?.longitude?.toFixed(4)}
                      </CustomText>
                    </View>
                  </View>

                  <CustomText style={styles.label}>
                    House / Flat / Block No *
                  </CustomText>
                  <TextInput
                    style={[
                      styles.input,
                      addressLine1Error && { borderColor: "red" },
                    ]}
                    placeholder="e.g. 11-2-553/1/1"
                    placeholderTextColor="grey"
                    value={addressLine1}
                    onChangeText={(text) => {
                      setAddressLine1(text);
                      if (text.trim()) setAddressLine1Error(false);
                    }}
                  />
                  {addressLine1Error && (
                    <CustomText
                      style={[
                        { color: "red", marginTop: -12, marginBottom: 10 },
                        globalStyles.f10Regular,
                      ]}
                    >
                      House / Flat number is required.
                    </CustomText>
                  )}
                  <CustomText style={styles.label}>Area / Apartment</CustomText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. My Residency"
                    placeholderTextColor="grey"
                    value={addressLine2}
                    onChangeText={setAddressLine2}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* <CustomText style={styles.label}>City</CustomText> */}
                    <TextInput
                      style={styles.inputAdd}
                      value={city}
                      onChangeText={setCity}
                      placeholder="City"
                      placeholderTextColor="grey"
                      editable={false}
                    />

                    {/* <CustomText style={styles.label}>State</CustomText> */}
                    <TextInput
                      style={styles.inputAdd}
                      value={state}
                      onChangeText={setState}
                      placeholder="State"
                      placeholderTextColor="grey"
                      editable={false}
                    />

                    {/* <CustomText style={styles.label}>Pincode</CustomText> */}
                    <TextInput
                      style={styles.inputAdd}
                      value={pincode}
                      onChangeText={setPincode}
                      placeholder="Pincode"
                      placeholderTextColor="grey"
                      keyboardType="numeric"
                      editable={false}
                    />
                  </View>
                  <CustomText style={styles.label}>Save As</CustomText>
                  <View style={styles.saveAsRow}>
                    {["Home", "Office", "Friend and Family"].map((label) => {
                      const isActive = selectedLabel === label;
                      return (
                        <TouchableOpacity
                          key={label}
                          style={[
                            styles.saveAsBtn,
                            isActive && { backgroundColor: color.secondary },
                          ]}
                          onPress={() => setSelectedLabel(label)}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            {iconMap[label]}
                            <CustomText
                              style={{
                                color: isActive ? "#fff" : "#000",
                                ...globalStyles.f12Bold,
                              }}
                            >
                              {label}
                            </CustomText>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {selectedLabel === "Friend and Family" && (
                    <>
                      <CustomText style={styles.label}>Full Name</CustomText>
                      <TextInput
                        style={styles.input}
                        placeholder="Your Name"
                        placeholderTextColor="grey"
                      />

                      <CustomText style={styles.label}>
                        Mobile Number
                      </CustomText>
                      <TextInput
                        style={styles.input}
                        placeholder="Your Mobile"
                        keyboardType="numeric"
                        placeholderTextColor="grey"
                      />
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={submitAddress}
                  >
                    <CustomText style={styles.saveText}>Save & Add</CustomText>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
      <CustomAlert
        visible={alertVisible}
        status={alertStatus}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ConfirmAddressPage;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  mapContainer: {
    height: 500,
    backgroundColor: "#eee",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 12,
  },
  mapLoading: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtn: {
    margin: 16,
    backgroundColor: "black",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmText: {
    color: "white",
    ...globalStyles.f14Bold,
  },
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: undefined,
    width: "100%",
  },
  locationTitle: {
    ...globalStyles.f12Bold,
    color: color.primary,
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  locationSub: {
    color: "#777",
    marginBottom: 20,
    ...globalStyles.f12Regular,
    paddingHorizontal: 10,
  },
  label: {
    marginTop: 14,
    marginBottom: 4,
    ...globalStyles.f12Bold,
    color: color.black,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 6,
    marginBottom: 16,
    color: "black",
  },
  inputAdd: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 6,
    marginBottom: 16,
    color: "#767474ff",
    ...globalStyles.f10Bold,
  },
  saveAsRow: {
    flexDirection: "row",
    marginVertical: 8,
  },
  saveAsBtn: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  saveBtn: {
    backgroundColor: "black",
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: {
    color: "white",
    ...globalStyles.f14Bold,
  },
});
