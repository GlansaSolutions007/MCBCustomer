import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ImageBackground, StatusBar, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import SearchBox from "../../components/SearchBox";
import globalStyles from "../../styles/globalStyles";
import CustomText from "../../components/CustomText";
import { color } from "../../styles/theme";
import axios from "axios";
import Loader from "../../components/Loader";
import Logo from '../../../assets/Logo/logo2.png'
// import { API_BASE_URL } from "@env";
import { API_URL, API_IMAGE_URL } from "@env";
import { getToken } from "../../utils/token";
import useGlobalRefresh from "../../hooks/useGlobalRefresh";


export default function MyCars() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredBrands, setFilteredBrands] = useState([]);
    const [showManualFlow, setShowManualFlow] = useState(false);

    // const getBrands = async () => {
    //     try {
    //         const token = await getToken();
    //         if (!token) {
    //             console.warn('Token not found');
    //             return;
    //         }

    //         const config = {
    //             headers: {
    //                 Authorization: `Bearer ${token}`
    //             }
    //         };

    //         const brandRes = await axios.get(`${API_URL}VehicleBrands/GetVehicleBrands`, config);
    //         const modelRes = await axios.get(`${API_URL}VehicleModels/GetListVehicleModel`, config);
    //         const brands = brandRes.data.data;
    //         const models = modelRes.data.data;

    //         // Format and attach models to each brand
    //         const formattedBrands = brands
    //             .filter(brand => brand.IsActive)
    //             .map(brand => {
    //                 const brandModels = models
    //                     .filter(model => model.BrandID === brand.BrandID && model.IsActive)
    //                     .map(model => {

    //                         const getModelImageUrl = (path) => {
    //                             if (!path) return null;
    //                             const fileName = path.split('/').pop();
    //                             return `${API_IMAGE_URL}VehicleModel/${fileName}`;
    //                         };


    //                         return {
    //                             id: model.ModelID,
    //                             name: model.ModelName,
    //                             image: getModelImageUrl(model.VehicleImage),
    //                             fuelType: model.FuelTypeID
    //                         };
    //                     });

    //                 return {
    //                     brand: brand.BrandName,
    //                     brandId: brand.BrandID,
    //                     logo: brand.BrandLogo
    //                         ? { uri: `${API_IMAGE_URL}BrandLogo/${brand.BrandLogo.split('/').pop()}` }
    //                         : Logo,
    //                     models: brandModels
    //                 };
    //             });

    //         setBrands(formattedBrands);
    //         setFilteredBrands(formattedBrands);
    //     } catch (error) {
    //         console.error('Failed to fetch car brands or models:', error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const getBrands = async () => {
        try {
            const token = await getToken();
            if (!token) {
                console.warn("Token not found");
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            // Get all brands
            const brandRes = await axios.get(
                `${API_URL}VehicleBrands/GetVehicleBrands`,
                config
            );
            const brands = brandRes.data.data;

            // For each brand, fetch its models
            const formattedBrands = await Promise.all(
                brands
                    .filter((brand) => brand.IsActive)
                    .map(async (brand) => {
                        try {
                            const modelRes = await axios.get(
                                `${API_URL}VehicleModels/BrandId?brandid=${brand.BrandID}`,
                                config
                            );

                            const models = modelRes.data || [];

                            const brandModels = models
                                .filter((model) => model.IsActive)
                                .map((model) => {
                                    const getModelImageUrl = (path) => {
                                        if (!path) return null;
                                        return `${API_IMAGE_URL}${path.replace(/^\//, '')}`;
                                    };

                                    return {
                                        id: model.ModelID,
                                        name: model.ModelName,
                                        image: getModelImageUrl(model.VehicleImage),
                                        fuelType: model.FuelTypeID,
                                    };
                                });

                            console.log(`Fetched ${brandModels}`);


                            return {
                                brand: brand.BrandName,
                                brandId: brand.BrandID,
                                logo: brand.BrandLogo
                                    ? {
                                        uri: `${API_IMAGE_URL}BrandLogo/${brand.BrandLogo.split(
                                            "/"
                                        ).pop()}`,
                                    }
                                    : Logo,
                                models: brandModels,
                            };
                        } catch (err) {
                            console.error(`Failed to fetch models for ${brand.BrandName}`, err);
                            return {
                                brand: brand.BrandName,
                                brandId: brand.BrandID,
                                logo: brand.BrandLogo
                                    ? {
                                        uri: `${API_IMAGE_URL}BrandLogo/${brand.BrandLogo.split(
                                            "/"
                                        ).pop()}`,
                                    }
                                    : Logo,
                                models: [],
                            };
                        }
                    })
            );

            setBrands(formattedBrands);
            setFilteredBrands(formattedBrands);
        } catch (error) {
            console.error("Failed to fetch car brands:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        getBrands();
    }, []);

    const { refreshing, onRefresh } = useGlobalRefresh(getBrands);

    const navigation = useNavigation();

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredBrands(brands);
            return;
        }

        const filtered = brands.filter(brand =>
            brand.brand.toLowerCase().includes(query.toLowerCase()) ||
            brand.models.some(model =>
                model.name.toLowerCase().includes(query.toLowerCase())
            )
        );

        setFilteredBrands(filtered);
    };

    const SkeletonLoader = () => (
        <View style={styles.card}>
            <View style={[styles.logo, { backgroundColor: '#f1f1f1ff' }]} />
            <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '60%', borderRadius: 4, marginTop: 5, alignSelf: 'center' }} />
        </View>
    );

    const renderBrand = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                navigation.navigate("CarModels", { models: item.models, brand: item.brand, brandId: item.brandId })
                console.log("Selected brand:", item.brand);
            }}
        >
            <ImageBackground
                source={item.logo}
                style={styles.logo}
                imageStyle={{ resizeMode: 'contain' }}
            >
            </ImageBackground>
            <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{item.brand}</CustomText>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { padding: 10, flex: 1 }]}>
            <StatusBar
                backgroundColor={Platform.OS === "android" ? "#fff" : undefined}
                barStyle="dark-content"
            />
            {loading ? (
                <FlatList
                    data={Array(6).fill().map((_, i) => ({ id: `skeleton${i}` }))}
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
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    <View style={{ marginVertical: 10 }}>
                        <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>Add Your Car</CustomText>
                        <CustomText style={{ ...globalStyles.f10Bold, color: color.secondary }}>
                            Choose how you want to add your vehicle
                        </CustomText>
                    </View>

                    {/* Add Car Options */}
                    <View style={styles.addCarOptions}>
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => navigation.navigate("RcVerification")}
                        >
                            <View style={styles.optionIcon}>
                                <Ionicons name="document-text" size={24} color={color.primary} />
                            </View>
                            <View style={styles.optionContent}>
                                <CustomText style={[globalStyles.f14Bold, globalStyles.textBlack]}>
                                    Add by RC Number
                                </CustomText>
                                <CustomText style={[globalStyles.f10Bold, globalStyles.textGray]}>
                                    Automatically fetch vehicle details using registration number
                                </CustomText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={color.textLight} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => setShowManualFlow(true)}
                        >
                            <View style={styles.optionIcon}>
                                <Ionicons name="build" size={24} color={color.secondary} />
                            </View>
                            <View style={styles.optionContent}>
                                <CustomText style={[globalStyles.f14Bold, globalStyles.textBlack]}>
                                    Manual Entry
                                </CustomText>
                                <CustomText style={[globalStyles.f10Bold, globalStyles.textGray]}>
                                    Manually select manufacturer and enter details
                                </CustomText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={color.textLight} />
                        </TouchableOpacity>
                    </View>

                    {/* Manual Flow - Brand Selection */}
                    {showManualFlow && (
                        <>
                            <View style={{ marginVertical: 10 }}>
                                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>Select Manufacturer</CustomText>
                                <CustomText style={{ ...globalStyles.f10Bold, color: color.secondary }}>
                                    Start From Selecting Your Manufacturer.
                                </CustomText>
                            </View>
                            <FlatList
                                data={filteredBrands}
                                renderItem={renderBrand}
                                keyExtractor={(item) => item.brand}
                                numColumns={3}
                                columnWrapperStyle={styles.row}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                showsVerticalScrollIndicator={false}
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        </>
                    )}
                </>
            )}
        </View>);
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
    addCarOptions: {
        marginBottom: 20,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: color.neutral[100],
        shadowColor: color.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    optionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: color.lightSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    optionContent: {
        flex: 1,
    },
});
