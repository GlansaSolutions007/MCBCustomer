import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TextInput,
    TouchableOpacity,
    StatusBar,
    Platform,
    Modal,
    FlatList,
    Pressable,
    TouchableWithoutFeedback
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../contexts/CartContext";
import Config from "react-native-config";
import RazorpayCheckout from "react-native-razorpay";
import {RAZORPAY_KEY} from "@env"; 

const addressList = [
    {
        id: '1',
        label: '#B1 Spaces & More Business Park',
        address: '#M3 Dr.No.-#1-89/A/8, C/2, Vittal Rao Nagar Rd, Madhapur, Telangana 500081',
    },
    {
        id: '2',
        label: '#Madhapur',
        address: '#M3 Dr.No.-#1-89/A/8, C/2, Vittal Rao Nagar Rd, Madhapur, Telangana 500081',
    },
    {
        id: '3',
        label: 'Nampally',
        address: '#M3 Dr.No.-#1-89/A/8, C/2, Vittal Rao Nagar Rd, Madhapur, Telangana 500081',
    },

];


const CartPage = () => {
    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const { cartItems, removeFromCart } = useCart();

    const totalServiceAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
    const originalAmount = cartItems.reduce((sum, item) => sum + item.originalPrice, 0);
    const savedAmount = originalAmount - totalServiceAmount;
    const gst = Math.round(totalServiceAmount * 0.18); // assuming 18% GST
    const finalAmount = totalServiceAmount + gst;

    const handlePayment = () => {
        const options = {
            description: 'MyCarBuddy Service Payment',
            image: 'https://mycarsbuddy.com/logo.png',
            currency: 'INR',
            key: RAZORPAY_KEY,
            amount: finalAmount * 100,
            name: 'MyCarBuddy',
            prefill: {
                email: 'test@example.com',
                contact: '9999999999',
                name: 'Test User'
            },
            theme: { color: color.primary }
        };

        RazorpayCheckout.open(options)
            .then((data) => {
                console.log(`Success: ${data.razorpay_payment_id}`);
                Alert.alert("Payment Successful", `Payment ID: ${data.razorpay_payment_id}`);
            })
            .catch((error) => {
                console.log(`Error: ${error.description}`);
                Alert.alert("Payment Failed", error.description);
            });
    };


    return (
        <View style={[styles.container, { paddingBottom: insets.bottom + 1 }]}>
            <StatusBar
                backgroundColor={Platform.OS === "android" ? "#fff" : undefined}
                barStyle="dark-content"
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back-outline" size={24} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setAddressModalVisible(true)}
                    style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                >
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <CustomText style={styles.headerTitle}>Glansa Solutions</CustomText>
                        <CustomText style={styles.headerSubtitle}>
                            4031 Space E, Metro Business Park #4031 Dr No 6-95, GVR Colony...
                        </CustomText>
                    </View>
                    <Feather name="chevron-down" size={20} color="black" />
                </TouchableOpacity>
            </View>

            {/* Content Scrollable */}
            <ScrollView showsVerticalScrollIndicator={false}>
                {cartItems.length === 0 ? (
                    <CustomText style={{ textAlign: 'center', margin: 20 }}>Your cart is empty</CustomText>
                ) : (
                    cartItems.map((item) => (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.serviceHeader}>
                                <Image
                                    source={{ uri: `https://api.mycarsbuddy.com/Images/${item.image}` }}
                                    style={styles.serviceImage}
                                />

                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <CustomText style={styles.serviceTitle}>{item.title}</CustomText>

                                    {/* Remove Button (inline under title) */}
                                    <TouchableOpacity
                                        onPress={() => removeFromCart(item.id)}
                                        style={{
                                            marginTop: 4,
                                            alignSelf: 'flex-start',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#c62828" />
                                        <Text style={{ color: '#c62828', marginLeft: 2, ...globalStyles.f10Regular }}>Remove</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ alignItems: 'flex-end' }}>
                                    <CustomText style={styles.originalPrice}>₹{item.originalPrice}</CustomText>
                                    <CustomText style={styles.discountedPrice}>₹{item.price}</CustomText>
                                </View>
                            </View>

                            <View style={styles.savingsBox}>
                                <CustomText style={styles.savingsText}>
                                    + ₹{item.originalPrice - item.price} saved on this service!
                                </CustomText>
                            </View>
                        </View>


                    ))
                )}

                {/* Add More Services */}
                <View style={styles.card}>
                    <CustomText style={styles.sectionTitle}>Add More Services</CustomText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[1, 2, 3].map((i) => (
                            <View key={i} style={styles.moreServiceCard}>
                                <Image
                                    source={require('../../../assets/images/exteriorservice.png')}
                                    style={styles.moreServiceImage}
                                />
                                <TouchableOpacity style={styles.plusIcon}>
                                    <Entypo name="squared-plus" size={24} color={color.secondary} />
                                </TouchableOpacity>
                                <CustomText style={styles.moreServiceText}>
                                    Seat Vacuuming & Stain Treatment
                                </CustomText>
                                <CustomText style={styles.moreServicePrice}>₹100</CustomText>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Coupon Section */}
                <View style={styles.card}>
                    <CustomText style={styles.sectionTitle}>Get Discount</CustomText>
                    <View style={styles.rowBetween}>
                        <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]} >Apply coupon</CustomText>
                        <Feather name="chevron-right" size={20} color="black" />
                    </View>
                    <View style={styles.couponBox}>
                        <CustomText style={{ flex: 1, ...globalStyles.f12Bold, ...globalStyles.textBlack }}>Hurray you saved ₹100</CustomText>
                        <CustomText style={styles.appliedCoupon}>NEWCUS26 Applied</CustomText>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.card}>
                    <CustomText style={styles.sectionTitle}>Instructions</CustomText>
                    <TextInput
                        placeholder="e.g. Call after arrival"
                        style={styles.textInput}
                        maxLength={100}
                        multiline={true}
                        placeholderTextColor="grey"
                    />
                    <CustomText style={styles.textLimit}>100/100</CustomText>
                </View>

                {/* Price Summary */}
                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <View>
                            <CustomText style={styles.toPay}>To Pay ₹{finalAmount}</CustomText>
                            <CustomText style={styles.saved}>₹{savedAmount} saved by coupon</CustomText>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={[styles.rowBetween]}>
                        <CustomText style={{ color: color.secondary, ...globalStyles.f12Bold }}>Total Services</CustomText>
                        <CustomText style={{ color: color.black, ...globalStyles.f12Bold }}>₹{totalServiceAmount}</CustomText>
                    </View>
                    <View style={styles.rowBetween}>
                        <CustomText style={{ color: color.secondary, ...globalStyles.f12Bold }}>GST & Other Charges</CustomText>
                        <CustomText style={{ color: color.black, ...globalStyles.f10Bold }}>₹{gst}</CustomText>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                        <CustomText style={styles.toPayBold}>To Pay</CustomText>
                        <CustomText style={styles.toPayBold}>₹{finalAmount}</CustomText>
                    </View>
                </View>
            </ScrollView>

            {/* Pay Button */}
            <View style={styles.footerBtnWrapper}>
                <View style={styles.footerContent}>
                    <CustomText style={styles.totalAmount}>₹{finalAmount}</CustomText>
                    <TouchableOpacity style={styles.payNowBtn} onPress={handlePayment}>
                        <CustomText style={styles.payNowText} >Pay Now</CustomText>
                    </TouchableOpacity>
                </View>
            </View>
            <Modal
                animationType="slide"
                transparent={true}
                visible={addressModalVisible}
                onRequestClose={() => setAddressModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setAddressModalVisible(false)}>
                    <View style={{
                        flex: 1,
                        justifyContent: "flex-end",
                        backgroundColor: "rgba(0,0,0,0.4)"
                    }}>
                        {/* Prevent modal from closing when content is tapped */}
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={{
                                backgroundColor: "white",
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                padding: 20,
                                maxHeight: '90%'
                            }}>
                                <TouchableOpacity
                                    style={{ alignSelf: "flex-end", marginBottom: 2 }}
                                    onPress={() => setAddressModalVisible(false)}
                                >
                                    <Ionicons name="close-circle" size={30} color="black" />
                                </TouchableOpacity>
                                <CustomText style={[globalStyles.f20Bold, { color: color.secondary }, globalStyles.mb5]}>Choose your address</CustomText>

                                {/* Add new address */}
                                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", marginBottom: 26 }}
                                    onPress={() => {
                                        setAddressModalVisible(false);
                                        navigation.navigate("ConfirmAddressPage");
                                    }}>
                                    <View style={{
                                        width: 30, height: 30,
                                        backgroundColor: color.yellow,
                                        borderRadius: 6,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 10
                                    }}>
                                        <AntDesign name="plus" size={22} color="white" />
                                    </View>
                                    <CustomText style={[globalStyles.f14Bold, globalStyles.textBlack]}>Add new address</CustomText>
                                </TouchableOpacity>

                                {/* Address List */}
                                <FlatList
                                    data={addressList}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setAddressModalVisible(false);
                                            }}
                                            style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}
                                        >
                                            <Ionicons name="location-outline" size={20} color={color.primary} style={{ marginRight: 10, marginTop: 4 }} />
                                            <View style={{ flex: 1, marginBottom: 10 }}>
                                                <CustomText style={[globalStyles.f14Bold, globalStyles.textBlack]}>{item.label}</CustomText>
                                                <CustomText style={[globalStyles.f12Regular, { color: color.muted }]}>{item.address}</CustomText>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>


        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F1F0F5" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "android" ? 50 : 20,
        paddingBottom: 12,
        backgroundColor: "#fff",
    },
    headerTitle: { ...globalStyles.f16Bold, color: color.primary },
    headerSubtitle: { ...globalStyles.f10Regular, color: "black" },
    card: {
        backgroundColor: "#fff",
        padding: 16,
        marginTop: 20,
        marginHorizontal: 12,
        borderRadius: 12,

    },
    serviceHeader: { flexDirection: "row", alignItems: "center", ...globalStyles.f12 },
    serviceImage: { width: 50, height: 50, borderRadius: 8, marginRight: 10 },
    serviceTitle: { ...globalStyles.f14Bold, color: color.primary },
    originalPrice: { textDecorationLine: "line-through", color: "gray", ...globalStyles.f10Regular },
    discountedPrice: { ...globalStyles.f12Bold, color: color.secondary, marginTop: 2 },
    savingsBox: {
        marginTop: 30,
        backgroundColor: "#06c2b530",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "flex-start",
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: color.secondary,
    },
    savingsText: { color: color.secondary, ...globalStyles.f12Bold },
    sectionTitle: { ...globalStyles.f14Bold, color: color.primary, marginBottom: 10 },
    moreServiceCard: { width: 120, marginRight: 10, alignItems: "flex-start" },
    moreServiceImage: { width: 90, height: 120, borderRadius: 8, marginTop: 6 },
    moreServiceText: { textAlign: "flex-start", ...globalStyles.f10Bold, marginTop: 5, color: "black" },
    moreServicePrice: { ...globalStyles.f12Bold, color: color.secondary, marginTop: 2 },
    plusIcon: { position: "absolute", top: -3, right: 12 },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 6,
    },
    couponBox: {
        backgroundColor: "#00b1c51d",
        padding: 10,
        borderRadius: 8,
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    appliedCoupon: { color: color.secondary, ...globalStyles.f12Bold, marginLeft: 10 },
    textInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        color: "black",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginTop: 8,
        textAlignVertical: "top", // Ensures text starts at the top
        minHeight: 100, // Optional: gives textarea-like height
    },
    textLimit: { alignSelf: "flex-end", ...globalStyles.f10Bold, color: "gray", marginTop: 4 },
    toPay: { ...globalStyles.f12Bold, color: color.black, marginBottom: 4 },
    saved: { color: color.secondary, ...globalStyles.f10Bold },
    toPayBold: { ...globalStyles.f12Bold, color: color.black, },
    footerBtnWrapper: {
        backgroundColor: "#fff",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        marginTop: 10

    },

    footerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: 12,
    },

    totalAmount: {
        ...globalStyles.f16Bold,
        color: color.black,
    },

    payNowBtn: {
        backgroundColor: color.primary,
        paddingVertical: 16,
        paddingHorizontal: 104,
        borderRadius: 10,
        alignItems: "center",
    },

    payNowText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },

    divider: {
        height: 1,
        backgroundColor: "#e0e0e07a", // light grey separator
        marginVertical: 8,
    },
});

export default CartPage;
