import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import globalStyles from '../../styles/globalStyles';
import { color } from '../../styles/theme';
import CustomText from '../../components/CustomText';
import { Feather, FontAwesome } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as GoogleGeocoding from 'expo-location';
import SearchBox from '../../components/SearchBox';
import { GOOGLE_MAPS_APIKEY } from '@env';

const ConfirmAddressPage = ({ navigation }) => {
    const [formModalVisible, setFormModalVisible] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState("Home");
    const [region, setRegion] = useState(null);
    const [locationPermission, setLocationPermission] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [address, setAddress] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const predictionOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permission to access location was denied');
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
        )}&key=${apiKey}&location=${region?.latitude},${region?.longitude}&radius=50000`;

        try {
            const res = await fetch(url);
            const json = await res.json();

            if (json.status === 'OK') {
                setPredictions(json.predictions);
            } else {
                console.warn('Google Autocomplete Error:', json.status, json.error_message);
                setPredictions([]);
            }
        } catch (error) {
            console.error('Autocomplete fetch failed:', error);
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
        setSearchText(prediction.description);
        hidePredictions();
    };


    const reverseGeocode = async () => {
        const apiKey = GOOGLE_MAPS_APIKEY;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${region.latitude},${region.longitude}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.results?.length > 0) {
            setAddress(data.results[0].formatted_address);
        }
    };


    const iconMap = {
        Home: <Feather name="home" size={16} style={{ marginRight: 6 }} />,
        Office: <FontAwesome name="building" size={16} style={{ marginRight: 6 }} />,
        "Friend and Family": <Feather name="users" size={16} style={{ marginRight: 6 }} />,
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <SearchBox
                value={searchText}
                onChangeText={setSearchText}
            />
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
                                    borderColor: '#eee',
                                    backgroundColor: 'white',
                                }}
                            >
                                <Text style={{ fontSize: 14, color: color.black }}>{item.description}</Text>
                            </TouchableOpacity>
                        )}
                        style={{
                            maxHeight: 180,
                            backgroundColor: 'white',
                        }}
                        keyboardShouldPersistTaps="handled"
                    />
                </Animated.View>
            )}


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
                        <CustomText >Loading Map...</CustomText>
                    </View>
                )}
            </View>

            {address ? (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginHorizontal: 16,
                        marginBottom: 10,
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
                        <CustomText style={{ ...globalStyles.f14Bold, color: '#000' }}>{address}</CustomText>
                    </View>
                </View>
            ) : null}


            {/* Confirm Address Button */}
            <TouchableOpacity
                style={styles.confirmBtn}
                onPress={async () => {
                    await reverseGeocode();
                    setFormModalVisible(true);
                }}
            >
                <CustomText style={styles.confirmText}>Confirm Address</CustomText>
            </TouchableOpacity>

            {/* Address Form Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={formModalVisible}
                onRequestClose={() => setFormModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setFormModalVisible(false)} />

                    <View style={styles.modalContent}>
                        {/* Close Icon */}
                        <TouchableOpacity
                            style={{ alignSelf: "flex-end", marginBottom: 2 }}
                            onPress={() => setFormModalVisible(false)}
                        >
                            <Ionicons name="close-circle" size={30} color="black" />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                            <View
                                style={{
                                    backgroundColor: color.secondary,
                                    padding: 8,
                                    borderRadius: 8,
                                    marginRight: 10,
                                    marginTop: 6
                                }}
                            >
                                <MaterialIcons name="location-on" size={20} color="#fff" />
                            </View>

                            <View>
                                <CustomText style={styles.locationTitle}>
                                    {address || "Selected Location"}
                                </CustomText>
                                <CustomText style={styles.locationSub}>
                                    Lat: {region?.latitude?.toFixed(4)}, Lng: {region?.longitude?.toFixed(4)}
                                </CustomText>
                            </View>
                        </View>

                        <CustomText style={styles.label}>House / Flat / Block No</CustomText>
                        <TextInput style={styles.input} placeholder="e.g. 11-2-553/1/1" placeholderTextColor="grey" />

                        <CustomText style={styles.label}>Area / Apartment</CustomText>
                        <TextInput style={styles.input} placeholder="e.g. My Residency" placeholderTextColor="grey" />

                        <CustomText style={styles.label}>Save As</CustomText>
                        <View style={styles.saveAsRow}>
                            {["Home", "Office", "Friend and Family"].map((label, idx) => {
                                const isActive = selectedLabel === label; // optional selection logic
                                return (
                                    <TouchableOpacity
                                        key={label}
                                        style={[
                                            styles.saveAsBtn,
                                            isActive && { backgroundColor: color.secondary },
                                        ]}
                                        onPress={() => setSelectedLabel(label)} // optional selection handler
                                    >
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            {iconMap[label]}
                                            <CustomText style={{ color: isActive ? "#fff" : "#000", ...globalStyles.f12Bold }}>
                                                {label}
                                            </CustomText>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <CustomText style={styles.label}>Full Name</CustomText>
                        <TextInput style={styles.input} placeholder="Your Name" placeholderTextColor="grey" />

                        <CustomText style={styles.label}>Mobile Number</CustomText>
                        <TextInput style={styles.input} placeholder="Your Mobile" keyboardType="numeric" placeholderTextColor="grey" />

                        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.navigate("Cart")}>
                            <CustomText style={styles.saveText}>Save & Add</CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ConfirmAddressPage;

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 12,
    },
    mapPlaceholder: {
        height: 300,
        backgroundColor: "#eee",
        justifyContent: "center",
        alignItems: "center",
    },
    mapContainer: {
        height: 420,
        backgroundColor: '#eee',
        borderRadius: 12,
        overflow: 'hidden',
        marginHorizontal: 16,
        marginBottom: 12,
        marginTop: 12
    },
    mapLoading: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtn: {
        margin: 16,
        backgroundColor: 'black',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center'
    },
    confirmText: {
        color: 'white',
        ...globalStyles.f14Bold
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: "80%",
    },
    locationTitle: {
        ...globalStyles.f16Bold,
        color: color.primary,
        marginBottom: 4,
    },
    locationSub: {
        color: '#777',
        marginBottom: 20,
        ...globalStyles.f12Regular
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
        marginBottom: 16
    },
    saveAsRow: {
        flexDirection: 'row',
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
        backgroundColor: 'black',
        marginTop: 20,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center'
    },
    saveText: {
        color: 'white',
        ...globalStyles.f14Bold
    }
});
