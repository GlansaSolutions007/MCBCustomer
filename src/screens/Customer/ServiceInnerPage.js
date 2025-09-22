import React, { useEffect, useState } from 'react'
import { Image, ImageBackground, Platform, Pressable, ScrollView, StatusBar, TouchableOpacity, View, Text } from 'react-native'
import CustomText from '../../components/CustomText'
import globalStyles from '../../styles/globalStyles'
import { LinearGradient } from 'expo-linear-gradient'
import interior from '../../../assets/images/interiorservice.png'
import Garage from '../../../assets/icons/garageIcon.png'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useCart } from '../../contexts/CartContext'
import { color } from '../../styles/theme'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { API_URL, API_IMAGE_URL } from "@env";
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const ServiceInnerPage = () => {
    const route = useRoute();
    const { package: pkg } = route.params;
    const { cartItems, addToCart } = useCart();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [hasPrimaryVehicle, setHasPrimaryVehicle] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [descExpanded, setDescExpanded] = useState(false);
    const [descLineCount, setDescLineCount] = useState(0);
    const descriptionText = (pkg?.description && typeof pkg.description === 'string' && pkg.description.trim().length > 0)
        ? pkg.description
        : 'No description available for this service.';


    useEffect(() => {
        const checkPrimaryVehicle = async () => {
            try {
                const primaryVehicleId = await AsyncStorage.getItem('primaryVehicleId');
                setHasPrimaryVehicle(!!primaryVehicleId);
                console.log("Primary: ", primaryVehicleId);

            } catch (error) {
                console.error('Error checking primary vehicle ID:', error);
                setHasPrimaryVehicle(false);
            }
        };
        checkPrimaryVehicle();
    }, []);

    const isInCart = cartItems.some(item => item.id === pkg.id);

    const handleAddToCart = () => {
        if (!isInCart) {
            addToCart(pkg);
        } else {
            navigation.navigate("Cart");
        }
    };

    const handleAddYourCar = () => {
        navigation.navigate('My Cars', { screen: 'SelectCarBrand' });
    };

    const fetchNotifications = async () => {
        try {
            const userData = await AsyncStorage.getItem("userData");
            if (!userData) {
                setNotificationCount(0);
                return;
            }
            const parsedData = JSON.parse(userData);
            const customerId = parsedData?.custID;
            if (!customerId) {
                setNotificationCount(0);
                return;
            }

            const response = await axios.get(
                `${API_URL}Bookings/notifications?userId=${customerId}&userRole=customer`
            );

            // Top-level response
            const result = response?.data;

            // Your notifications are inside result.data
            const notifications = result?.data || [];

            // Count them
            const count = Array.isArray(notifications) ? notifications.length : 0;

            setNotificationCount(count);
            console.log("Notification Count:", count);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            setNotificationCount(0);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const DetailRow = ({ label, value, icon }) => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={icon} size={16} color="#000" style={{ marginRight: 6 }} />
                <CustomText style={[{ color: '#666' }, globalStyles.f12Medium]}>{label}</CustomText>
            </View>
            <CustomText style={[{ fontWeight: 'bold', color: '#000' }, globalStyles.f12Medium]}>{value}</CustomText>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
            {/* Sticky header */}
            <ImageBackground
                source={{ uri: `${API_IMAGE_URL}${pkg.image}` }}
                style={styles.imageBackground}
            >
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <LinearGradient
                    colors={['rgba(34, 34, 34, 0.6)', 'rgba(19,109,110,0.1)', 'rgba(0,0,0,1)']}
                    locations={[0.13, 0.52, 0.91]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.overlay}
                >
                    <View style={styles.topRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>

                        <View style={[styles.rightIcons]}>
                            <Pressable
                                onPress={() =>
                                    navigation.navigate("NotificationScreen")
                                }
                            >
                                <View style={{ paddingRight: 15 }}>
                                    <Ionicons
                                        name="notifications"
                                        size={24}
                                        style={globalStyles.textWhite}
                                    />

                                    {/* Badge */}

                                    {notificationCount > 0 && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>
                                                {notificationCount > 99
                                                    ? "99+"
                                                    : notificationCount}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </Pressable>
                            <View style={styles.iconWrapper}>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("Cart")}
                                >
                                    <MaterialCommunityIcons name="car-wrench" size={30} color="white" />
                                    {/* <Image source={Garage} style={styles.garageIcon} /> */}
                                    {cartItems.length > 0 && (
                                        <View style={styles.cartBadge}>
                                            <CustomText style={styles.badgeText}>
                                                {cartItems.length}
                                            </CustomText>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={styles.imageTextWrapper}>
                        <CustomText style={styles.serviceTitle}>{pkg.title}</CustomText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="star" size={16} color="#F4C150" />
                            <CustomText style={styles.ratingText}>4.9 (146 ratings)</CustomText>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>

            {/* Scrollable content */}
            <ScrollView style={{ backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={{ padding: 16 }}>


                    {/* Services Included */}
                    <CustomText style={[globalStyles.f16Bold, globalStyles.primary, { marginBottom: 10 }]}>
                        What we include
                    </CustomText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                        {pkg.services.map((s, i) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 8 }}>
                                <Ionicons name="shield-checkmark" size={16} color={color.secondary} style={{ marginRight: 6, marginTop: 2 }} />
                                <CustomText style={[{ color: '#333' }, globalStyles.f12Medium]}>{s}</CustomText>
                            </View>
                        ))}
                    </View>
                    <View style={styles.separator} />
                    {/* Description */}
                    <CustomText style={[globalStyles.f16Bold, globalStyles.primary]}>Description</CustomText>
                    {/* Hidden measurer to compute total lines */}
                    <Text
                        onTextLayout={(e) => {
                            const lines = e?.nativeEvent?.lines || [];
                            if (lines.length !== descLineCount) {
                                setDescLineCount(lines.length);
                            }
                        }}
                        style={[{ position: 'absolute', opacity: 0, left: -9999 }, globalStyles.f12Medium]}
                    >
                        {descriptionText}
                    </Text>
                    {/* Visible collapsible text */}
                    <Text
                        numberOfLines={descExpanded ? undefined : 4}
                        style={[{ color: '#333', marginTop: 6, lineHeight: 20 }, globalStyles.f12Medium]}
                    >
                        {descriptionText}
                    </Text>
                    {descLineCount > 4 && (
                        <TouchableOpacity
                            onPress={() => setDescExpanded(!descExpanded)}
                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6,justifyContent: 'flex-end' }}
                        >
                            <CustomText style={[globalStyles.f12Bold, { color: color.primary }]}>
                                {descExpanded ? 'less' : 'more'}
                            </CustomText>
                            <Ionicons
                                name={descExpanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={color.primary}
                                style={{ marginLeft: 4 }}
                            />
                        </TouchableOpacity>
                    )}
                    <View style={styles.separator} />
                    {/* Details */}
                    <CustomText style={[globalStyles.f16Bold, globalStyles.primary]}>Details</CustomText>
                    <View style={{ marginTop: 10 }}>
                        <DetailRow label="Estimated Hours" value={`${pkg.estimatedMins}`} icon="time-outline" />
                        <DetailRow label="Actual Amount" value={`₹${pkg.originalPrice}`} icon="pricetag-outline" />
                        <DetailRow label="Discount" value={`₹${pkg.originalPrice - pkg.price}`} icon="trending-down-outline" />
                        <DetailRow label="Amount" value={`₹${pkg.price}`} icon="cash-outline" />
                    </View>
                </View>
                

            </ScrollView>
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, paddingBottom: 16 + insets.bottom, borderTopWidth: 1, borderColor: '#eee' }}>
                {hasPrimaryVehicle ? (
                    <TouchableOpacity
                        style={{
                            backgroundColor: isInCart ? color.yellow : color.primary,
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                        }}
                        onPress={handleAddToCart}
                    >
                        <CustomText style={[globalStyles.f14Bold, { color: '#fff' }]}>
                            {isInCart ? 'View Cart' : 'Add to Cart'}
                        </CustomText>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={{
                            backgroundColor: color.black,
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                        }}
                        onPress={handleAddYourCar}
                    >
                        <CustomText style={[globalStyles.f14Bold, { color: '#fff' }]}>Add Your Car</CustomText>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    )
}

export default ServiceInnerPage

const styles = {
    imageBackground: {
        height: 230,
        resizeMode: 'cover',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    backIcon: {
        padding: 5,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.79)',
    },
    garageIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20
    },
    rightIcons: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        alignItems: "center",
    },
    iconWrapper: {
        position: 'relative',
    },
    badge: {
        position: "absolute",
        right: 6,
        top: -4,
        backgroundColor: color.yellow,
        borderRadius: 80,
        minWidth: 16,
        height: 16,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 2,
    },
    cartBadge: {
        position: "absolute",
        right: -4,
        top: -4,
        backgroundColor: color.yellow,
        borderRadius: 80,
        minWidth: 16,
        height: 16,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 2,
    },
    badgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    imageTextWrapper: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
    },
    serviceTitle: {
        ...globalStyles.f28Bold,
        color: '#fff',
    },
    ratingText: {
        color: '#fff',
        ...globalStyles.f12Regular,
        marginLeft: 4,
    },
    separator: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 20,
    }

}