import React from 'react'
import { Image, ImageBackground, Platform, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native'
import CustomText from '../../components/CustomText'
import globalStyles from '../../styles/globalStyles'
import { LinearGradient } from 'expo-linear-gradient'
import interior from '../../../assets/images/interiorservice.png'
import Garage from '../../../assets/icons/garageIcon.png'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useCart } from '../../contexts/CartContext'
import { color } from '../../styles/theme'

const ServiceInnerPage = () => {
    const route = useRoute();
    const { package: pkg } = route.params;
    const { cartItems, addToCart } = useCart();
    const navigation = useNavigation();

    const serviceDetails = () => {
        console.log(`Service ID: ${pkg.id}`);
    }

    const isInCart = cartItems.some(item => item.id === pkg.id);

    const handleAddToCart = () => {
        if (!isInCart) {
            addToCart(pkg);
        } else {
            navigation.navigate('Cart');
        }
    };


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
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView style={{ backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: 100 }}>
                <ImageBackground
                    source={{ uri: `https://api.mycarsbuddy.com/Images/${pkg.image}` }}
                    style={styles.imageBackground}
                >
                    <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                    <LinearGradient
                        colors={['rgba(19,109,110,0.6)', 'rgba(19,109,110,0.1)', 'rgba(0,0,0,1)']}
                        locations={[0.13, 0.52, 0.91]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.overlay}
                    >
                        <View style={styles.topRow}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
                                <Ionicons name="arrow-back" size={24} color="black" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.iconWrapper}>
                                <Image source={Garage} style={styles.garageIcon} />
                                {cartItems.length > 0 && (
                                    <View style={styles.badge}>
                                        <CustomText style={styles.badgeText}>{cartItems.length}</CustomText>
                                    </View>
                                )}
                            </TouchableOpacity>
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
                    <CustomText style={[{ color: '#333', marginTop: 6, lineHeight: 20 }, globalStyles.f12Medium]}>
                        {pkg.description || 'No description provided.'}
                    </CustomText>
                    <View style={styles.separator} />
                    {/* Details */}
                    <CustomText style={[globalStyles.f16Bold, globalStyles.primary]}>Details</CustomText>
                    <View style={{ marginTop: 10 }}>
                        <DetailRow label="Estimated Hours" value="1hr 30min" icon="time-outline" />
                        <DetailRow label="Actual Amount" value={`₹${pkg.originalPrice}`} icon="pricetag-outline" />
                        <DetailRow label="Discount" value={`₹${pkg.originalPrice - pkg.price}`} icon="trending-down-outline" />
                        <DetailRow label="Amount" value={`₹${pkg.price}`} icon="cash-outline" />
                    </View>
                </View>
                {/* Reviews */}
                <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                    <CustomText style={[globalStyles.f16Bold, globalStyles.primary, { marginBottom: 10 }]}>
                        Reviews
                    </CustomText>

                    <View style={{ backgroundColor: '#f9f9f9', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Image
                                source={interior}
                                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                            />
                            <View>
                                <CustomText style={[globalStyles.f14Bold]}>Sri Wedari Soekarno</CustomText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                    <Ionicons name="star" size={14} color="#F4C150" />
                                    <Ionicons name="star" size={14} color="#F4C150" />
                                    <Ionicons name="star" size={14} color="#F4C150" />
                                    <Ionicons name="star" size={14} color="#F4C150" />
                                    <Ionicons name="star-outline" size={14} color="#F4C150" />
                                    <CustomText style={[globalStyles.f10Regular, { marginLeft: 6, color: '#666' }]}>15 minutes ago</CustomText>
                                </View>
                            </View>
                        </View>
                        <CustomText style={[globalStyles.f12Regular, { color: '#333', lineHeight: 18 }]}>
                            This garage is a local asset, the staff are brilliant, polite and helpful, excellent customer service. Will continue to use and recommend. Great job as always by the Oxted crew.
                        </CustomText>
                    </View>

                    {/* Call help line button */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#000',
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            marginBottom: 20,
                        }}
                        onPress={() => {
                            // your hotline action
                        }}
                    >
                        <Ionicons name="call-outline" size={18} color={color.secondary} style={{ marginRight: 8 }} />
                        <CustomText style={[globalStyles.f14Bold, { color: '#fff' }]}>Call help line</CustomText>
                    </TouchableOpacity>
                </View>

            </ScrollView>
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderColor: '#eee' }}>
                <TouchableOpacity
                    style={{
                        backgroundColor: color.primary,
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
            </View>
        </View>
    )
}

export default ServiceInnerPage

const styles = {
    imageBackground: {
        height: 350,
        resizeMode: 'cover',
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
    iconWrapper: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: 'yellow',
        borderRadius: 8,
        paddingHorizontal: 4,
        minWidth: 16,
        alignItems: 'center',
        justifyContent: 'center',
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