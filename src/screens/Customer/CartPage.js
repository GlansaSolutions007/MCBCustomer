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
                {/* Selected Service */}
                <View style={styles.card}>
                    <View style={styles.serviceHeader}>
                        <Image
                            source={require('../../../assets/images/exteriorservice.png')}
                            style={styles.serviceImage}
                        />
                        <View style={{ flex: 1 }}>
                            <CustomText style={styles.serviceTitle}>Essential Interior Care</CustomText>
                        </View>
                        <View>
                            <CustomText style={styles.originalPrice}>₹1400</CustomText>
                            <CustomText style={styles.discountedPrice}>₹600</CustomText>
                        </View>
                    </View>
                    <View style={styles.savingsBox}>
                        <CustomText style={styles.savingsText}>+ ₹800 Saved! On this services</CustomText>
                    </View>
                </View>

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
                        <CustomText>Apply coupon</CustomText>
                        <Feather name="chevron-right" size={20} color="black" />
                    </View>
                    <View style={styles.couponBox}>
                        <CustomText style={{ flex: 1 }}>Hurray you saved ₹100</CustomText>
                        <CustomText style={styles.appliedCoupon}>NEWCUS26 Applied</CustomText>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.card}>
                    <CustomText style={styles.sectionTitle}>Instructions</CustomText>
                    <TextInput
                        placeholder="e.g. Call after arrival reached"
                        style={styles.textInput}
                        maxLength={100}
                        multiline={true}
                    />
                    <CustomText style={styles.textLimit}>100/100</CustomText>
                </View>

                {/* Price Summary */}
                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <View>
                            <CustomText style={styles.toPay}>To Pay ₹1298</CustomText>
                            <CustomText style={styles.saved}>₹100 saved by coupon</CustomText>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={[styles.rowBetween]}>
                        <CustomText style={{ color: color.secondary }}>Total Services</CustomText>
                        <CustomText>₹1100</CustomText>
                    </View>
                    <View style={styles.rowBetween}>
                        <CustomText style={{ color: color.secondary }}>GST & Other Charges</CustomText>
                        <CustomText>₹198</CustomText>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                        <CustomText style={styles.toPayBold}>To Pay</CustomText>
                        <CustomText style={styles.toPayBold}>₹1298</CustomText>
                    </View>
                </View>
            </ScrollView>

            {/* Pay Button */}
            <View style={styles.footerBtnWrapper}>
                <View style={styles.footerContent}>
                    <CustomText style={styles.totalAmount}>₹1298</CustomText>
                    <TouchableOpacity style={styles.payNowBtn}>
                        <CustomText style={styles.payNowText}>Pay Now</CustomText>
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
                                    <CustomText style={[globalStyles.f14Bold]}>Add new address</CustomText>
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
                                                <CustomText style={[globalStyles.f14Bold]}>{item.label}</CustomText>
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
    discountedPrice: { ...globalStyles.f12Bold },
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
    savingsText: { color: color.secondary },
    sectionTitle: { ...globalStyles.f14Bold, color: color.primary, marginBottom: 10 },
    moreServiceCard: { width: 120, marginRight: 10, alignItems: "flex-start" },
    moreServiceImage: { width: 90, height: 120, borderRadius: 8, marginTop: 6 },
    moreServiceText: { textAlign: "flex-start", fontSize: 12, marginTop: 5 },
    moreServicePrice: { fontWeight: "bold" },
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
    appliedCoupon: { color: color.secondary, fontWeight: "bold" },
    textInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginTop: 8,
        textAlignVertical: "top", // Ensures text starts at the top
        minHeight: 100, // Optional: gives textarea-like height
    },
    textLimit: { alignSelf: "flex-end", fontSize: 12, color: "gray", marginTop: 4 },
    toPay: { ...globalStyles.f12Bold },
    saved: { color: color.secondary, ...globalStyles.f10Bold },
    toPayBold: { ...globalStyles.f12Bold },
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
        fontWeight: "bold",
        fontSize: 16,
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
