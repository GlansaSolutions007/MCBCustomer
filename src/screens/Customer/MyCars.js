import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ImageBackground } from "react-native";
import carData from "../../../assets/data/carBrands.json";
import { useNavigation } from "@react-navigation/native";
import SearchBox from "../../components/SearchBox";
import globalStyles from "../../styles/globalStyles";
import CustomText from "../../components/CustomText";
import { color } from "../../styles/theme";
import axios from "axios";
import Loader from "../../components/Loader";
import Logo from '../../../assets/Logo/logo.png'


export default function MyCars() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true)

    const getBrands = async () => {
        try {
            const brandRes = await axios.get('https://api.mycarsbuddy.com/api/VehicleBrands/GetVehicleBrands');
            const modelRes = await axios.get('https://api.mycarsbuddy.com/api/VehicleModels/GetListVehicleModel');

            const brands = brandRes.data.data;
            const models = modelRes.data.data;

            // Format and attach models to each brand
            const formattedBrands = brands.map(brand => {
                const brandModels = models
                    .filter(model => model.BrandID === brand.BrandID)
                    .map(model => {
                        let imagePath = '';

                        if (model.VehicleImage) {
                            imagePath = model.VehicleImage.includes("Images/VehicleModel")
                                ? model.VehicleImage
                                : `Images/VehicleModel/${model.VehicleImage}`;
                        }

                        return {
                            id: model.ModelID,
                            name: model.ModelName,
                            image: imagePath ? `https://api.mycarsbuddy.com/${imagePath.replace(/^\/+/, '')}` : null,
                            fuelType: model.FuelTypeID
                        };
                    });

                return {
                    brand: brand.BrandName,
                    logo: brand.BrandLogo
                        ? { uri: `https://api.mycarsbuddy.com/Images/BrandLogo/${brand.BrandLogo.split('/').pop()}` }
                        : Logo,
                    models: brandModels
                };
            });

            setBrands(formattedBrands);

        } catch (error) {
            console.error('Failed to fetch car brands or models:', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        getBrands();
    }, []);

    const navigation = useNavigation();

    const renderBrand = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                navigation.navigate("CarModels", { models: item.models, brand: item.brand })
                console.log("Selected brand:", item.brand);
            }}
        >
            <ImageBackground
                source={item.logo }
                style={styles.logo}
                imageStyle={{ resizeMode: 'contain' }}
            >
            </ImageBackground>
            <CustomText style={globalStyles.f12Bold}>{item.brand} {item.brandId}</CustomText>
        </TouchableOpacity>
    );

    if (loading) return <Loader />;

    return (
        <View style={[styles.container, { padding: 10, flex: 1 }]}>
            <SearchBox />
            <View style={{ marginVertical: 10 }}>
                <CustomText style={globalStyles.f12Bold}>Add Your Car</CustomText>
                <CustomText style={{ ...globalStyles.f10Bold, color: color.secondary }}>Start From Selecting Your Manufacturer.</CustomText>
            </View>
            <FlatList
                data={brands}
                renderItem={renderBrand}
                keyExtractor={(item) => item.brand}
                numColumns={3}
                columnWrapperStyle={styles.row}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: "#fff", flex: 1 },
    row: { justifyContent: "space-between", marginBottom: 16 },
    card: {
        alignItems: "center",
        flex: 1,
        marginHorizontal: 2,
        marginVertical: 2
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: "cover",
        marginBottom: 1,
        overflow: 'hidden',
    },
});
