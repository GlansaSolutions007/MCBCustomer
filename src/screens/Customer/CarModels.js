import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ImageBackground } from "react-native";
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

export default function CarModels() {
  const route = useRoute();
  const { brand, models } = route.params;

  const [selectedModel, setSelectedModel] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [fuelTypes, setFuelTypes] = useState([]);

  const navigation = useNavigation();

  const handleModelPress = (model) => {
    setSelectedModel(model);
    setAlertVisible(true);
  };

  useEffect(() => {
    const fetchFuelTypes = async () => {
      try {
        const response = await fetch("https://api.mycarsbuddy.com/api/FuelTypes/GetFuelTypes");
        const json = await response.json();

        if (json.status && Array.isArray(json.data)) {
          const activeFuelTypes = json.data.filter(f => f.IsActive);
          setFuelTypes(activeFuelTypes);
        } else {
          console.warn("Failed to load fuel types.");
        }
      } catch (error) {
        console.error("Error fetching fuel types:", error);
      }
    };

    fetchFuelTypes();
  }, []);

  const getFuelImageUrl = (path) => {
    if (!path) return null;

    const fileName = path.split("/").pop();
    const encodedFileName = encodeURIComponent(fileName); 

    return `https://api.mycarsbuddy.com/images/FuelImages/${encodedFileName}`;
  };


  const renderModel = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleModelPress(item)}>
      <ImageBackground source={{ uri: item.image }} style={styles.image} imageStyle={{ resizeMode: 'contain' }}></ImageBackground>
      <CustomText style={{ ...globalStyles.f16SemiBold, color: color.primary }}>{item.name}</CustomText>
    </TouchableOpacity>
  );

  const fuelOptions = [
    { name: 'Petrol', icon: Petrol },
    { name: 'Diesel', icon: Diesel },
    { name: 'CNG', icon: CNG },
    { name: 'Electric', icon: Electric }
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={models}
        renderItem={renderModel}
        keyExtractor={(item) => item.name}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 20 }}
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
                navigation.navigate("MyCarDetails", {
                  model: selectedModel,
                  fuelType: fuel.FuelTypeName
                });
                setAlertVisible(false);
              }}

            >

              <Image
                source={
                  fuel.FuelImage
                    ? { uri: getFuelImageUrl(fuel.FuelImage) }
                    : Petrol // fallback image
                }
                style={styles.fuelImage}
              />
              <CustomText style={globalStyles.f10Bold}>{fuel.FuelTypeName}</CustomText>

            </TouchableOpacity>
          ))}
        </View>
      </CustomAlert>
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
