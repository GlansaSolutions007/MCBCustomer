import React, { useEffect, useState } from 'react';
import {
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import globalStyles from '../../styles/globalStyles';
import sampleCar from '../../../assets/images/xuv-3xo-exterior-right-front-three-quarter-34.webp';
import carIconPlus from '../../../assets/images/My Car.png';
import SearchBox from '../../components/SearchBox';
import { color } from '../../styles/theme';
import CustomText from '../../components/CustomText';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getToken } from '../../utils/token';
import { API_BASE_URL } from '@env';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MyCarsList = () => {
    const navigation = useNavigation();

    const [cars, setCars] = useState([]);

    useEffect(() => {
        const fetchCustomerCars = async () => {
            try {
                const token = await getToken();
                const userData = await AsyncStorage.getItem('userData');
                const parsedData = JSON.parse(userData);
                const custID = parsedData?.custID;

                if (!custID || !token) {
                    console.warn("Customer ID or token missing");
                    return;
                }

                const response = await axios.get(
                    `${API_BASE_URL}CustomerVehicles/CustId?CustId=${custID}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const carList = response.data;

                const normalizedList = carList
                    ? (Array.isArray(carList) ? carList : [carList])
                    : [];

                const formattedCars = normalizedList.map((car) => ({
                    id: car.VehicleID.toString(),
                    model: car.ModelName,
                    fuel: car.FuelTypeName,
                    manufacturer: car.BrandName,
                    image: { uri: `https://api.mycarsbuddy.com/Images${car.VehicleImage}` },
                    vehicleNumber: car.VehicleNumber,
                }));

                setCars(formattedCars);
                console.log("Fetched cars:", formattedCars);

            } catch (error) {
                console.error('Error fetching car list:', error);
            }
        };

        fetchCustomerCars();
    }, []);

    const renderCar = ({ item }) => (
        <View style={styles.carCard}>
            <View style={{ flexDirection: 'row' }}>
                <View style={styles.carContainer}>
                    <Image source={item.image} style={styles.carImage} />
                    <CustomText style={styles.numberText}>* {item.vehicleNumber} *</CustomText>
                </View>
                <View style={styles.carInfo}>
                    <CustomText style={[globalStyles.f10Bold, { color: '#737373' }]}>Model Name</CustomText>
                    <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{item.model}</CustomText>
                    <View style={{ height: 6 }} />
                    <CustomText style={[globalStyles.f10Bold, { color: '#737373' }]}>Fuel Type</CustomText>
                    <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{item.fuel}</CustomText>
                    <View style={{ height: 6 }} />
                    <CustomText style={[globalStyles.f10Bold, { color: '#737373' }]}>Manufacturer</CustomText>
                    <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{item.manufacturer}</CustomText>
                </View>
            </View>
            <View style={{ height: 16 }} />
            <TouchableOpacity style={styles.detailsButton}>
                <CustomText
                    style={{ color: '#fff' }}
                    onPress={() => navigation.navigate('MyCarDetails', {
                        vehicleId: item.id,
                        model: {
                            name: `${item.manufacturer} ${item.model}`,
                            image: item.image.uri,
                        }
                    })}>View Details
                </CustomText>
            </TouchableOpacity>
        </View>

    );

    return (
        <View style={[globalStyles.container, { backgroundColor: '#fff' }]}>
            {cars.length === 0 ? (
                <View style={styles.centered}>
                    <CustomText style={styles.emptyText}>Please add your car</CustomText>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('SelectCarBrand')}
                    >
                        <CustomText style={styles.addButtonText}>Add Your Car</CustomText>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Header */}

                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <SearchBox />
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('SelectCarBrand')}
                            style={styles.addIconWrapper}
                        >
                            <MaterialCommunityIcons name="car-info" size={28} color="white" />
                        </TouchableOpacity>
                    </View>


                    {/* Car List */}
                    <FlatList
                        data={cars}
                        keyExtractor={(item) => item.id}
                        renderItem={renderCar}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    addIconWrapper: {
        marginLeft: 10,
        padding: 6,
        backgroundColor: color.secondary,
        borderRadius: 8,
    },
    numberText: {
        borderWidth: 2,
        borderColor: '#ccc',
        paddingHorizontal: 12,
        backgroundColor: '#ffffff',
        paddingVertical: 2,
        borderRadius: 4,
        ...globalStyles.f14Bold,
        ...globalStyles.textBlack,
    },
    plusIcon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
        tintColor: '#fff',
    },
    carCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        borderColor: color.secondary,
        borderWidth: 1,
        marginBottom: 40,
        overflow: 'visible',
    },
    carContainer: {
        width: '57%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    carImage: {
        width: '100%',
        height: 120,
        resizeMode: 'contain'
    },
    carInfo: {
        width: '43%',
        paddingLeft: 12,
        flex: 1,
        position: 'relative',
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    value: {
        fontSize: 14,
        marginBottom: 6,
        color: '#000',
    },
    detailsButton: {
        position: 'absolute',
        bottom: -17,
        left: '80%',
        transform: [{ translateX: -60 }],
        backgroundColor: color.secondary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
        zIndex: 2,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        marginBottom: 16,
    },
    addButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
