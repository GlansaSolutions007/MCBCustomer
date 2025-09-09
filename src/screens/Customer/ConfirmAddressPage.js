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
  ActivityIndicator,
  Dimensions,
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
import { API_URL, GOOGLE_MAPS_APIKEY } from "@env";

const { width, height } = Dimensions.get('window');

const ConfirmAddressPage = ({ navigation }) => {

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("Home");
  const [region, setRegion] = useState({
    latitude: 17.4389998,
    longitude: 78.3873419,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
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
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [isLoadingCurrentLocation, setIsLoadingCurrentLocation] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Animation refs
  const predictionOpacity = useRef(new Animated.Value(0)).current;
  const mapScale = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const modalSlide = useRef(new Animated.Value(height)).current;
  const searchFade = useRef(new Animated.Value(1)).current;
  const currentLocationScale = useRef(new Animated.Value(1)).current;
  const mapOpacity = useRef(new Animated.Value(0)).current;
  const searchBoxScale = useRef(new Animated.Value(0.95)).current;
  const addressCardSlide = useRef(new Animated.Value(50)).current;
  const confirmButtonScale = useRef(new Animated.Value(1)).current;
  const loadingPulse = useRef(new Animated.Value(1)).current;

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

  // Animate components on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(mapScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(mapOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(searchBoxScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(addressCardSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const fetchAutocomplete = async () => {
    if (searchText.length < 3) return;

    setIsLoadingPredictions(true);

    // Start loading pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingPulse, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(loadingPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

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
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        console.warn(
          "Google Autocomplete Error:",
          json.status,
          json.error_message
        );
        setPredictions([]);
        Animated.timing(predictionOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error("Autocomplete fetch failed:", error);
      setPredictions([]);
    } finally {
      setIsLoadingPredictions(false);
      // Stop loading pulse animation
      loadingPulse.stopAnimation();
      loadingPulse.setValue(1);
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

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showModal = () => {
    setFormModalVisible(true);
    Animated.timing(modalSlide, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideModal = () => {
    Animated.timing(modalSlide, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setFormModalVisible(false));
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
        showModal();
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
        addressLine2: address,
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
      hideModal();
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
        <Animated.View
          style={{
            paddingHorizontal: 16,
            transform: [{ scale: searchBoxScale }]
          }}
        >
          <SearchBox value={searchText} onChangeText={setSearchText} />
        </Animated.View>
        {/* <TouchableOpacity onPress={()=>navigation.navigate("MapTest") } style={{alignItems:"center", justifyContent:"center", marginVertical:10}}>
          <CustomText style={{ fontSize: 16, fontWeight: "bold" }}>
            Test
          </CustomText> 
        </TouchableOpacity> */}
        {(predictions.length > 0 || isLoadingPredictions) && (
          <Animated.View style={{ opacity: predictionOpacity }}>
            {isLoadingPredictions ? (
              <Animated.View
                style={[
                  styles.loadingContainer,
                  {
                    transform: [{ scale: loadingPulse }]
                  }
                ]}
              >
                <ActivityIndicator size="large" color={color.primary} />
                <CustomText style={[globalStyles.f12Bold, { color: color.primary, marginLeft: 12 }]}>
                  Searching locations...
                </CustomText>
              </Animated.View>
            ) : (
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item, index }) => (
                  <Animated.View
                    style={{
                      opacity: predictionOpacity,
                      transform: [{
                        translateY: predictionOpacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }]
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleSelectPrediction(item)}
                      style={[
                        styles.predictionItem,
                        globalStyles.f10Bold,
                        index === predictions.length - 1 && { borderBottomWidth: 0 }
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.predictionIconContainer}>
                        <MaterialIcons
                          name="location-on"
                          size={22}
                          color={color.primary}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 4 }}>
                        <CustomText style={[globalStyles.f12Bold, { color: "#1a1a1a", lineHeight: 20 }]}>
                          {item.structured_formatting?.main_text || item.description.split(',')[0]}
                        </CustomText>
                        <CustomText
                          style={[globalStyles.f10Medium, { color: "#666", marginTop: 4, lineHeight: 16 }]}
                          numberOfLines={2}
                        >
                          {item.structured_formatting?.secondary_text || item.description}
                        </CustomText>
                      </View>
                      <View style={styles.chevronContainer}>
                        <Ionicons name="chevron-forward" size={18} color="#999" />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                style={styles.predictionsList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                scrollEnabled={true}
                bounces={false}
                removeClippedSubviews={false}
              />
            )}
          </Animated.View>
        )}

        <Animated.View style={{ transform: [{ scale: currentLocationScale }] }}>
          <TouchableOpacity
            style={[
              styles.currentLocationBtn,
              isLoadingCurrentLocation && styles.currentLocationBtnLoading
            ]}
            onPress={async () => {
              if (isLoadingCurrentLocation) return;

              setIsLoadingCurrentLocation(true);

              // Animate button press
              Animated.sequence([
                Animated.timing(currentLocationScale, {
                  toValue: 0.95,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(currentLocationScale, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }),
              ]).start();

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

                let location = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.High,
                });
                const { latitude, longitude } = location.coords;

                // Animate map to new location
                Animated.parallel([
                  Animated.timing(mapScale, {
                    toValue: 1.1,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                  Animated.timing(mapOpacity, {
                    toValue: 0.7,
                    duration: 300,
                    useNativeDriver: true,
                  })
                ]).start(() => {
                  setRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  });

                  // Animate back to normal
                  Animated.parallel([
                    Animated.timing(mapScale, {
                      toValue: 1,
                      duration: 300,
                      useNativeDriver: true,
                    }),
                    Animated.timing(mapOpacity, {
                      toValue: 1,
                      duration: 300,
                      useNativeDriver: true,
                    })
                  ]).start();
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
              } finally {
                setIsLoadingCurrentLocation(false);
              }
            }}
            disabled={isLoadingCurrentLocation}
          >
            {isLoadingCurrentLocation ? (
              <ActivityIndicator size="small" color={color.primary} />
            ) : (
              <MaterialIcons
                name="my-location"
                size={20}
                color={color.primary}
                style={{ marginRight: 8 }}
              />
            )}
            <CustomText style={[globalStyles.f12Bold, { color: isLoadingCurrentLocation ? color.primary : "#000" }]}>
              {isLoadingCurrentLocation ? "Getting Location..." : "Use Current Location"}
            </CustomText>
          </TouchableOpacity>
        </Animated.View>

        {address ? (
          <Animated.View
            style={{
              transform: [{ translateY: addressCardSlide }]
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginHorizontal: 16,
                marginVertical: 10,
                backgroundColor: "#f8f9fa",
                padding: 12,
                borderRadius: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
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
            <Animated.View style={{ transform: [{ scale: confirmButtonScale }] }}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={async () => {
                  // Animate button press
                  Animated.sequence([
                    Animated.timing(confirmButtonScale, {
                      toValue: 0.95,
                      duration: 100,
                      useNativeDriver: true,
                    }),
                    Animated.timing(confirmButtonScale, {
                      toValue: 1,
                      duration: 100,
                      useNativeDriver: true,
                    }),
                  ]).start();

                  await reverseGeocode();
                }}
              >
                <CustomText style={styles.confirmText}>
                  Confirm Address
                </CustomText>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        ) : null}

        {/* Map Container */}
        <Animated.View
          style={[
            styles.mapContainer,
            {
              transform: [{ scale: mapScale }],
              opacity: mapOpacity,
            }
          ]}
        >
          {region ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              region={region}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={false}
              showsScale={false}
              showsBuildings={true}
              showsTraffic={false}
              showsIndoors={true}
              onMapReady={() => setIsMapReady(true)}
              mapType="standard"
            >
              <Marker
                coordinate={region}
                title="Selected Location"
                description={address || "Tap to select location"}
              />
            </MapView>
          ) : (
            <View style={styles.mapLoading}>
              <ActivityIndicator size="large" color={color.primary} />
              <CustomText style={[globalStyles.f12Bold, { color: "#000", marginTop: 10 }]}>
                Loading Map...
              </CustomText>
            </View>
          )}
        </Animated.View>

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
                      {/* <CustomText style={styles.locationSub}>
                        Lat: {region?.latitude?.toFixed(4)}, Lng:{" "}
                        {region?.longitude?.toFixed(4)}
                      </CustomText> */}
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start" }}>
                    <CustomText style={styles.label}>
                      House / Flat / Block No
                    </CustomText>
                    <CustomText style={{ color: 'red', ...globalStyles.f12Bold, marginTop: 8 }}>
                      *
                    </CustomText>
                  </View>
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
                  <CustomText style={styles.label}>Full Address</CustomText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. My Residency"
                    placeholderTextColor="grey"
                    value={address}
                    onChangeText={setAddress}
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
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  mapLoading: {
    height: 400,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  confirmBtn: {
    margin: 16,
    backgroundColor: "black",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
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
    marginBottom: 10,
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
  currentLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 3 },
    // shadowOpacity: 0.15,
    // shadowRadius: 6,
    // elevation: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  currentLocationBtnLoading: {
    opacity: 0.7,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    minHeight: 70,
  },
  predictionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e3f2fd",
  },
  chevronContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  predictionsList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: "#ededed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    maxHeight: 500,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    flexGrow: 0,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
});
