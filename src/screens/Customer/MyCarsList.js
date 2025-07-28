import React, { useState } from 'react';
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
// import {color} from '../../../'

export const MyCarsList = () => {
    const navigation = useNavigation();

    const [cars, setCars] = useState([
        {
            id: '1',
            model: 'Car Model No 1',
            fuel: 'Petrol',
            manufacturer: 'Honda',
            image: sampleCar,
        },
        {
            id: '2',
            model: 'Car Model No 2',
            fuel: 'Petrol',
            manufacturer: 'Honda',
            image: sampleCar,
        },
        {
            id: '3',
            model: 'Car Model No 3',
            fuel: 'Petrol',
            manufacturer: 'Honda',
            image: sampleCar,
        },
        {
            id: '4',
            model: 'Car Model No 4',
            fuel: 'Petrol',
            manufacturer: 'Honda',
            image: sampleCar,
        },
        {
            id: '5',
            model: 'Car Model No 5',
            fuel: 'Petrol',
            manufacturer: 'Honda',
            image: sampleCar,
        },
    ]);

    const renderCar = ({ item }) => (
        <View style={styles.carCard}>
            <View style={{ flexDirection: 'row' }}>
                <Image source={item.image} style={styles.carImage} />
                <View style={styles.carInfo}>
                    <CustomText style={[globalStyles.f10Bold, { color: '#737373' }]}>Model Name</CustomText>
                    <CustomText style={globalStyles.f12Bold}>{item.model}</CustomText>
                    <View style={{ height: 6 }} />
                    <CustomText style={[globalStyles.f10Bold, { color: '#737373' }]}>Fuel Type</CustomText>
                    <CustomText style={globalStyles.f12Bold}>{item.fuel}</CustomText>
                    <View style={{ height: 6 }} />
                    <CustomText style={[globalStyles.f10Bold, { color: '#737373' }]}>Manufacturer</CustomText>
                    <CustomText style={globalStyles.f12Bold}>{item.manufacturer}</CustomText>
                </View>
            </View>
            <View style={{ height: 16 }} />
            <TouchableOpacity style={styles.detailsButton}>
                <CustomText style={{ color: '#fff' }}>View Details</CustomText>
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
    carImage: {
        width: '57%',       // 60% of the parent container
        height: 100,
        resizeMode: 'contain'
    },
    carInfo: {
        width: '43%',       // 40% of the parent container
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
