import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import CustomText from '../../components/CustomText';
import { color } from '../../styles/theme';
import globalStyles from '../../styles/globalStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCoupon } from '../../contexts/CouponContext';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../../../apiConfig';

const CouponsList = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const { setAppliedCoupon } = useCoupon();
    const navigation = useNavigation();

    const fetchCoupons = async () => {
        try {
            const res = await axios.get(`${API_URL}Coupons`);
            const active = res.data.filter(c => c.IsActive && c.Status);
            console.log("Active Coupons:", active);
            setCoupons(active);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const isAmount = (type) => type === 'FixedAmount';

    const handleApplyCoupon = (coupon) => {
        setAppliedCoupon(coupon);
        navigation.goBack(); // navigate back to Cart
    };

    const CouponCardStyleA = (item) => (
        <View
            key={item.CouponID}
            style={{
                flexDirection: 'row',
                backgroundColor: color.primary,
                borderRadius: 14,
                marginBottom: 16,
                height: 100,
                overflow: 'hidden',
            }}
        >
            {/* Left White Section with Curved Right Edge */}
            <View style={{ width: '60%', position: 'relative' }}>
                <View
                    style={{
                        backgroundColor: '#fff',
                        padding: 14,
                        justifyContent: 'center',
                        borderTopLeftRadius: 14,
                        borderBottomLeftRadius: 14,
                        borderTopRightRadius: 20,
                        borderBottomRightRadius: 20,
                    }}
                >
                    <CustomText style={[{ color: color.secondary }, globalStyles.f36Bold]}>
                        {isAmount(item.DiscountType) ? `₹${item.DiscountValue}` : `${item.DiscountValue}%`}
                    </CustomText>
                    <CustomText style={[{ color: color.black }, globalStyles.f12Medium]}>
                        {item.Description}
                    </CustomText>
                </View>
            </View>

            {/* Right Section */}
            <View style={{
                flex: 1,
                padding: 12,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <CustomText style={[{ color: color.white }, globalStyles.f16Bold]}>{item.Code}</CustomText>
                <TouchableOpacity
                    style={{
                        backgroundColor: color.yellow,
                        paddingVertical: 6,
                        borderRadius: 20,
                        marginTop: 10,
                        paddingHorizontal: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                    onPress={() => handleApplyCoupon(item)}
                >
                    <MaterialCommunityIcons name="tag-outline" color="black" size={14} style={{ marginRight: 6 }} />
                    <CustomText style={[{ color: color.black, marginBottom: 2 }, globalStyles.f10Bold]}>
                        Apply Now
                    </CustomText>
                </TouchableOpacity>
            </View>
        </View>
    );


    const CouponCardStyleB = (item) => (
        <View
            key={item.CouponID}
            style={{
                borderRadius: 14,
                overflow: 'hidden',
                backgroundColor: color.primary,
                marginBottom: 16,
            }}
        >
            <View style={{ paddingVertical: 30, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="tag-outline" size={24} color="white" style={{ marginRight: 8 }} />
                <CustomText style={[{ color: color.white }, globalStyles.f24Bold]}>{item.Code}</CustomText>
            </View>

            <View
                style={{
                    backgroundColor: 'white',
                    padding: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <View>
                    <CustomText style={[{ color: color.secondary }, globalStyles.f28Bold]}>
                        {isAmount(item.DiscountType) ? `₹${item.DiscountValue}` : `${item.DiscountValue}%`}
                    </CustomText>
                    <CustomText style={[{ color: color.black }, globalStyles.f12Medium]}>{item.Description}</CustomText>
                </View>
                <View style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#000',
                            paddingHorizontal: 24,
                            paddingVertical: 6,
                            borderRadius: 20,
                            marginBottom: 4,
                        }}
                        onPress={() => handleApplyCoupon(item)}
                    >
                        <CustomText style={[{ color: 'white', marginBottom: 2 }, globalStyles.f10Bold]}>
                            Apply Now
                        </CustomText>
                    </TouchableOpacity>
                    <CustomText style={[{ fontSize: 10, color: color.yellow }, globalStyles.f10Bold]}>
                        Valid Till: {formatDate(item.ValidTill)}
                    </CustomText>
                </View>
            </View>
        </View>
    );

    if (loading) return <ActivityIndicator size="large" color="#15706f" style={{ marginTop: 50 }} />;

    return (
        <SafeAreaView style={{ flex: 1, }} edges={['bottom']}>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {coupons.map((coupon, index) =>
                    index % 2 === 0 ? CouponCardStyleA(coupon) : CouponCardStyleB(coupon)
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default CouponsList;
