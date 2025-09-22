import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import globalStyles from "../../styles/globalStyles";
import SearchBox from "../../components/SearchBox";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getToken } from "../../utils/token";
import Entypo from '@expo/vector-icons/Entypo';
// import { API_BASE_URL } from "@env";
import { API_URL, API_IMAGE_URL } from "@env";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import carAddIcon from "../../../assets/icons/caddAddIcon.png";
import useGlobalRefresh from "../../hooks/useGlobalRefresh";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../contexts/CartContext";
import CustomAlert from "../../components/CustomAlert";

export const MyCarsList = () => {

  const navigation = useNavigation();
  const { cartItems, clearCart } = useCart();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertStatus, setAlertStatus] = useState("info");

  const [cars, setCars] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomerCars = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;

      if (!custID || !token) {
        console.warn("Customer ID or token missing");
        return;
      }

      const response = await axios.get(
        `${API_URL}CustomerVehicles/CustId?CustId=${custID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const carList = response.data;
      // console.log(carList, "Car List Response");

      const normalizedList = carList
        ? Array.isArray(carList)
          ? carList
          : [carList]
        : [];

      // const activeCars = normalizedList.filter((car) =>car.IsActive===true);
      // console.log("Active Cars:", activeCars);

      const formattedCars = normalizedList.map((car) => ({
        id: car.VehicleID.toString(),
        model: car.ModelName,
        fuel: car.FuelTypeName,
        manufacturer: car.BrandName,
        image: {
          uri: `${API_IMAGE_URL}${car.VehicleImage}`,
        },
        vehicleNumber: car.VehicleNumber,
        isPrimary: car.IsPrimary,
        yearOfPurchase: car.YearOfPurchase,
        transmission: car.TransmissionType,
        engineType: car.EngineType,
        kilometersDriven: car.KilometersDriven,
      }));

      setCars(formattedCars);
      setFilteredCars(formattedCars);
      console.log(formattedCars);

      const primaryCar = formattedCars.find((car) => car.isPrimary);
      if (primaryCar) {
        await AsyncStorage.setItem("primaryVehicleId", primaryCar.id);
      }

      if (formattedCars.length === 1 && !formattedCars[0].isPrimary) {
        await makeCarPrimary(formattedCars[0].id);
        formattedCars[0].isPrimary = true;
      }
    } catch (error) {
      console.error("Error fetching car list:", error);
    } finally {
      setLoading(false);
    }
  };

  const { refreshing, onRefresh } = useGlobalRefresh(fetchCustomerCars);

  useFocusEffect(
    useCallback(() => {
      fetchCustomerCars();
    }, [])
  );

  const makeCarPrimary = async (vehicleId) => {
    try {
      const token = await getToken();
      const userData = await AsyncStorage.getItem("userData");
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;

      await axios.post(
        `${API_URL}CustomerVehicles/primary-vehicle?vehicleId=${vehicleId}&custid=${custID}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Clear cart if the primary car actually changes
      const previousPrimaryId = cars.find((car) => car.isPrimary)?.id;
      if (previousPrimaryId && previousPrimaryId !== vehicleId) {
        if (Array.isArray(cartItems) && cartItems.length > 0) {
          clearCart();
          setAlertTitle("Cart Cleared");
          setAlertMessage(
            "Cart was cleared due to primary car change. Please add services for the new car."
          );
          setAlertStatus("info");
          setAlertVisible(true);
        }
      }

      // Option 2 (optional): Also update locally while waiting for API
      const updatedCars = cars.map((car) => ({
        ...car,
        isPrimary: car.id === vehicleId,
      }));
      setCars(updatedCars);
      setFilteredCars(updatedCars);

      await AsyncStorage.setItem("primaryVehicleId", vehicleId);
    } catch (error) {
      console.error("Error setting primary car:", error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredCars(cars);
      return;
    }

    const filtered = cars.filter(
      (car) =>
        car.vehicleNumber.toLowerCase().includes(query.toLowerCase()) ||
        car.model.toLowerCase().includes(query.toLowerCase()) ||
        car.manufacturer.toLowerCase().includes(query.toLowerCase()) ||
        car.fuel.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCars(filtered);
  };

  const SkeletonLoader = () => (
    <View style={styles.carCard}>
      <View style={{ flexDirection: 'row' }}>
        <View style={styles.carContainer}>
          <View style={[styles.carImage, { backgroundColor: '#f1f1f1ff', borderRadius: 8 }]} />
          <View style={{ backgroundColor: '#f1f1f1ff', height: 20, width: '80%', borderRadius: 4, marginTop: 5 }} />
        </View>
        <View style={styles.carInfo}>
          <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '60%', borderRadius: 4 }} />
          <View style={{ backgroundColor: '#f1f1f1ff', height: 20, width: '80%', borderRadius: 4, marginTop: 5 }} />
          <View style={{ height: 6 }} />
          <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '60%', borderRadius: 4 }} />
          <View style={{ backgroundColor: '#f1f1f1ff', height: 20, width: '80%', borderRadius: 4, marginTop: 5 }} />
          <View style={{ height: 6 }} />
          <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '60%', borderRadius: 4 }} />
          <View style={{ backgroundColor: '#f1f1f1ff', height: 20, width: '80%', borderRadius: 4, marginTop: 5 }} />
        </View>
      </View>
      <View style={{ height: 16 }} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* <View style={[styles.detailsButton, { backgroundColor: '#f1f1f1ff' }]} />
        <View style={[styles.makePrimaryBtn, { backgroundColor: '#f1f1f1ff' }]} /> */}
      </View>
    </View>
  );

  const renderCar = ({ item }) => (
    <View style={styles.carCard}>
      <View style={{ flexDirection: "row" }}>
        <View style={styles.carContainer}>
          <Image source={item.image} style={styles.carImage} />
          <CustomText style={styles.numberText}>
            * {item.vehicleNumber} *
          </CustomText>
        </View>
        <View style={styles.carInfo}>
          <CustomText style={[globalStyles.f10Bold, { color: "#737373" }]}>
            Model Name
          </CustomText>
          <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>
            {item.model}
          </CustomText>
          <View style={{ height: 6 }} />
          <CustomText style={[globalStyles.f10Bold, { color: "#737373" }]}>
            Fuel Type
          </CustomText>
          <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>
            {item.fuel}
          </CustomText>
          <View style={{ height: 6 }} />
          <CustomText style={[globalStyles.f10Bold, { color: "#737373" }]}>
            Manufacturer
          </CustomText>
          <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>
            {item.manufacturer}
          </CustomText>
        </View>
      </View>
      <View style={{ height: 16 }} />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Pressable
          style={styles.detailsButton}
          onPress={() =>
            navigation.navigate("MyCarDetails", {
              vehicleId: item.id,
              model: {
                name: item.model,
                image: item.image.uri,
              },
              vehicleNumber: item.vehicleNumber,
              fuelType: item.fuel,
              manufacturer: item.manufacturer,
              yearOfPurchase: item.yearOfPurchase,
              transmission: item.transmission,
              engineType: item.engineType,
              kilometersDriven: item.kilometersDriven,
              isPrimary: item.isPrimary,
            })
          }>
          <CustomText style={{ color: "#fff" }}>
            View Details
          </CustomText>
        </Pressable>

        {item.isPrimary ? (
          <View style={styles.primaryBadge}>
            <Entypo name="star-outlined" size={18} color="white" />
            <CustomText style={styles.primaryText}>Primary Car</CustomText>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => makeCarPrimary(item.id)}
            style={styles.makePrimaryBtn}
          >
            <CustomText style={[{ color: "#fff", marginBottom: 2 }, globalStyles.f10Bold]}> Make Primary</CustomText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[globalStyles.container, { backgroundColor: "#fff" }]}>
      {loading ? (
        <FlatList
          data={[{ id: 'skeleton1' }, { id: 'skeleton2' }]}
          keyExtractor={(item) => item.id}
          renderItem={() => <SkeletonLoader />}
          contentContainerStyle={{ paddingTop: 40 }}
          showsVerticalScrollIndicator={false}
        />
      ) : cars.length === 0 ? (
        <Pressable
          onPress={() => navigation.navigate("SelectCarBrand")}
          style={{
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 16,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Ionicons
            name="car-sport-outline"
            size={40}
            color={color.secondary}
            style={{ marginBottom: 12 }}
          />
          <CustomText style={[globalStyles.f16Bold, { color: color.black }]}>
            Please add your car
          </CustomText>
          <CustomText
            style={[
              globalStyles.f12Regular,
              { color: "#666", marginTop: 6, textAlign: "center" },
            ]}
          >
            Add your car now to start booking services hassle-free!
          </CustomText>

          <View
            style={{
              backgroundColor: color.secondary,
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 6,
              marginTop: 14,
            }}
          >
            <CustomText style={[globalStyles.f12Bold, { color: "#fff" }]}>
              Add Your Car
            </CustomText>
          </View>
        </Pressable>

      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <SearchBox
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleSearch(text);
                }}
              />
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => navigation.navigate("OCRScreen")}
                style={[styles.addIconWrapper, styles.ocrButton]}
              >
                <Ionicons name="scan" size={30} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("SelectCarBrand")}
                style={styles.addIconWrapper}
              >
                {/* <MaterialCommunityIcons name="car-info" size={28} color="white" /> */}
                <Image
                  source={carAddIcon}
                  style={{ width: 30, height: 30, resizeMode: "contain" }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Car List */}
          <FlatList
            data={filteredCars}
            keyExtractor={(item) => item.id}
            renderItem={renderCar}
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </>
      )}
      <View style={styles.floatingButtonWrapper}>
        <TouchableOpacity
          style={styles.bookServiceBtn}
          onPress={() =>  navigation.navigate("Services", { screen: 'BookServiceScreen' })}
        >
          <CustomText style={styles.bookServiceText}>Book a Service</CustomText>
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertTitle}
        message={alertMessage}
        status={alertStatus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addIconWrapper: {
    padding: 6,
    backgroundColor: color.primary,
    borderRadius: 8,
    marginTop: 8
  },
  ocrButton: {
    backgroundColor: color.primary,
    marginLeft: 8,
  },
  numberText: {
    borderWidth: 2,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    paddingVertical: 2,
    borderRadius: 4,
    ...globalStyles.f14Bold,
    ...globalStyles.textBlack,
  },
  plusIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
    tintColor: "#fff",
  },
  carCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderColor: color.secondary,
    borderWidth: 1,
    marginBottom: 40,
    overflow: "visible",
  },
  carContainer: {
    width: "57%",
    justifyContent: "center",
    alignItems: "center",
  },
  carImage: {
    width: "100%",
    height: 120,
    resizeMode: "contain",
  },
  carInfo: {
    width: "43%",
    paddingLeft: 12,
    flex: 1,
    position: "relative",
  },
  value: {
    fontSize: 14,
    marginBottom: 6,
    color: "#000",
  },
  detailsButton: {
    position: "absolute",
    bottom: -22,
    left: "80%",
    transform: [{ translateX: -60 }],
    backgroundColor: color.secondary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 2,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    ...globalStyles.f12Bold,
    color: color.black,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: color.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    ...globalStyles.f12Bold,
    marginBottom: 1,
  },
  primaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryText: {
    color: "white",
    marginLeft: 5,
    ...globalStyles.f10Bold,
    marginBottom: 2
  },
  makePrimaryBtn: {
    backgroundColor: color.yellow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-end",
  },
  floatingButtonWrapper: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    marginTop: 20,
  },
  bookServiceBtn: {
    backgroundColor: color.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  bookServiceText: {
    color: "#fff",
    ...globalStyles.f14Bold,
    marginBottom: 1,
  },

});
