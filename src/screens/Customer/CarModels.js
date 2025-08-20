import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ImageBackground, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import carPic from "../../../assets/images/xuv-3xo-exterior-right-front-three-quarter-34.webp"
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomAlert from "../../components/CustomAlert";
import Petrol from "../../../assets/icons/fuelTypes/petrol.png";
import Diesel from "../../../assets/icons/fuelTypes/diesel.png";
import CNG from "../../../assets/icons/fuelTypes/cng.png";
import Electric from "../../../assets/icons/fuelTypes/ev.png";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
// import { API_BASE_URL } from "@env";
import { API_URL, API_IMAGE_URL, GOOGLE_MAPS_APIKEY, RAZORPAY_KEY } from "../../../apiConfig";
import axios from "axios";
import SearchBox from "../../components/SearchBox";
import useGlobalRefresh from "../../hooks/useGlobalRefresh";

export default function CarModels() {
  //
  // Alert.alert("Debug", `API URL: ${API_URL}`);
  const route = useRoute();
  const { brand, models } = route.params;
  const [searchText, setSearchText] = useState('');
  const [filteredModels, setFilteredModels] = useState(models);
  const [selectedModel, setSelectedModel] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  const handleModelPress = (model) => {
    setSelectedModel(model);
    setAlertVisible(true);
  };

  const fetchFuelTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}FuelTypes/GetFuelTypes`);
      const json = response.data;

      if (json.status && Array.isArray(json.data)) {
        const activeFuelTypes = json.data.filter(f => f.IsActive);
        setFuelTypes(activeFuelTypes);
      } else {
        console.warn("Failed to load fuel types.");
      }
    } catch (error) {
      console.error("Error fetching fuel types:", error);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  useEffect(() => {
    fetchFuelTypes();
  }, []);

  const getFuelImageUrl = (path) => {
    if (!path) return null;

    const fileName = path.split("/").pop();
    const encodedFileName = encodeURIComponent(fileName);

    return `${API_IMAGE_URL}/FuelImages/${encodedFileName}`;
  };

  useEffect(() => {
    const text = searchText.toLowerCase();
    const filtered = models.filter((model) =>
      model.name.toLowerCase().includes(text)
    );
    setFilteredModels(filtered);
  }, [searchText, models]);

  const refreshData = async () => {
    await fetchFuelTypes();
    setFilteredModels(models);
  };

  const { refreshing, onRefresh } = useGlobalRefresh(refreshData);

  const SkeletonLoader = () => (
    <View style={styles.card}>
      <View style={[styles.image, { backgroundColor: '#f1f0f0ff' }]} />
      <View style={{ backgroundColor: '#f1f0f0ff', height: 15, width: '60%', borderRadius: 4, marginTop: 5, alignSelf: 'center' }} />
    </View>
  );

  const renderModel = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleModelPress(item)}>
      <ImageBackground source={{ uri: item.image }} style={styles.image} imageStyle={{ resizeMode: 'contain' }}></ImageBackground>
      <CustomText style={{ ...globalStyles.f12Bold, color: color.primary }}>{item.name}</CustomText>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <FlatList
          data={Array(9).fill().map((_, i) => ({ id: `skeleton${i}` }))}
          renderItem={() => <SkeletonLoader />}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <>
          <SearchBox
            placeholder="Search car models"
            value={searchText}
            onChangeText={setSearchText}
            style={{ marginBottom: 40 }}
          />
          <FlatList
            data={filteredModels}
            renderItem={renderModel}
            keyExtractor={(item) => item.name}
            numColumns={3}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
          <CustomAlert
            visible={alertVisible}
            onClose={() => setAlertVisible(false)}
            title={selectedModel ? selectedModel.name : ''}
            message="Select Fuel Type"
            status="info"
            showButton={false}
          >
            {selectedModel && (
              <Image source={{ uri: selectedModel.image }} style={styles.alertCarImage} />
            )}
            <View style={styles.fuelRow}>
              {fuelTypes.map((fuel) => (
                <TouchableOpacity
                  key={fuel.FuelTypeID}
                  style={styles.fuelIcon}
                  onPress={() => {
                    console.log(`Selected ${fuel.FuelTypeName} for ${selectedModel?.name}`);
                    navigation.navigate('MyCarDetails', {
                      brandId: route.params.brandId,
                      modelId: selectedModel.id,
                      fuelId: fuel.FuelTypeID,
                      model: selectedModel,
                      fuelType: fuel.FuelTypeName,
                    });
                    setAlertVisible(false);
                  }}
                >
                  <Image
                    source={
                      fuel.FuelImage
                        ? { uri: getFuelImageUrl(fuel.FuelImage) }
                        : Petrol
                    }
                    style={styles.fuelImage}
                  />
                  <CustomText style={[globalStyles.f10Bold, globalStyles.textBlack]}>
                    {fuel.FuelTypeName}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </CustomAlert>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "#fff",
    flex: 1,
  },

  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  image: {
    width: 100,
    height: 70,
    resizeMode: "contain",
    marginBottom: 4,
  },
  fuelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 2,
  },
  fuelIcon: {
    alignItems: 'center',
    marginHorizontal: 2,
  },
  fuelImage: {
    width: 60,
    height: 50,
    resizeMode: "contain",
    marginVertical: 6,
  },
  fuelText: {
    fontSize: 12,
    marginVertical: 8,
  },
  alertCarImage: {
    width: 320,
    height: 90,
    resizeMode: "contain",
    marginBottom: 14,
  },
});
