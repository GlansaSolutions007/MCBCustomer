import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import globalStyles from '../../styles/globalStyles';
import { color } from '../../styles/theme';
import CustomText from '../../components/CustomText';
import { Feather, FontAwesome } from "@expo/vector-icons";
const ConfirmAddressPage = ({ navigation }) => {
    const [formModalVisible, setFormModalVisible] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState("Home");

    const iconMap = {
        Home: <Feather name="home" size={16} style={{ marginRight: 6 }} />,
        Office: <FontAwesome name="building" size={16} style={{ marginRight: 6 }} />,
        "Friend and Family": <Feather name="users" size={16} style={{ marginRight: 6 }} />,
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>

            {/* Map Placeholder */}
            <View style={styles.mapPlaceholder}>
                <CustomText>Map Placeholder (To be integrated)</CustomText>
            </View>

            {/* Confirm Address Button */}
            <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => setFormModalVisible(true)}
            >
                <CustomText style={styles.confirmText}>Confirm Address</CustomText>
            </TouchableOpacity>

            {/* Address Form Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={formModalVisible}
                onRequestClose={() => setFormModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setFormModalVisible(false)} />

                    <View style={styles.modalContent}>
                        {/* Close Icon */}
                        <TouchableOpacity
                            style={{ alignSelf: "flex-end", marginBottom: 2 }}
                            onPress={() => setFormModalVisible(false)}
                        >
                            <Ionicons name="close-circle" size={30} color="black" />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                            <View
                                style={{
                                    backgroundColor: color.secondary,
                                    padding: 8,
                                    borderRadius: 8,
                                    marginRight: 10,
                                    marginTop:6
                                }}
                            >
                                <MaterialIcons name="location-on" size={20} color="#fff" />
                            </View>

                            <View>
                                <CustomText style={styles.locationTitle}>
                                    Durgam Cheruvu Lake Front Park
                                </CustomText>
                                <CustomText style={styles.locationSub}>
                                    Madhapur, Telangana 500081, India
                                </CustomText>
                            </View>
                        </View>

                        <CustomText style={styles.label}>House / Flat / Block No</CustomText>
                        <TextInput style={styles.input} placeholder="e.g. 11-2-553/1/1" />

                        <CustomText style={styles.label}>Area / Apartment</CustomText>
                        <TextInput style={styles.input} placeholder="e.g. My Residency" />

                        <CustomText style={styles.label}>Save As</CustomText>
                        <View style={styles.saveAsRow}>
                            {["Home", "Office", "Friend and Family"].map((label, idx) => {
                                const isActive = selectedLabel === label; // optional selection logic
                                return (
                                    <TouchableOpacity
                                        key={label}
                                        style={[
                                            styles.saveAsBtn,
                                            isActive && { backgroundColor: color.secondary },
                                        ]}
                                        onPress={() => setSelectedLabel(label)} // optional selection handler
                                    >
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            {iconMap[label]}
                                            <CustomText style={{ color: isActive ? "#fff" : "#000" }}>
                                                {label}
                                            </CustomText>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <CustomText style={styles.label}>Full Name</CustomText>
                        <TextInput style={styles.input} placeholder="Your Name" />

                        <CustomText style={styles.label}>Mobile Number</CustomText>
                        <TextInput style={styles.input} placeholder="Your Mobile" keyboardType="numeric" />

                        <TouchableOpacity style={styles.saveBtn} onPress={()=>navigation.navigate("Cart")}>
                            <CustomText style={styles.saveText}>Save & Add</CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ConfirmAddressPage;

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 12,
    },
    mapPlaceholder: {
        height: 300,
        backgroundColor: "#eee",
        justifyContent: "center",
        alignItems: "center",
    },
    confirmBtn: {
        margin: 16,
        backgroundColor: 'black',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center'
    },
    confirmText: {
        color: 'white',
       ...globalStyles.f14Bold
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: "80%",
    },
    locationTitle: {
        ...globalStyles.f16Bold,
        color: color.primary,
        marginBottom: 4,
    },
    locationSub: {
        color: '#777',
        marginBottom: 20,
    },
    label: {
        marginTop: 14,
        marginBottom: 4,
    },
    input: {
        borderBottomWidth: 1,
        borderColor: "#ccc",
        paddingVertical: 6,
        marginBottom: 16
    },
    saveAsRow: {
        flexDirection: 'row',
        marginVertical: 8,
    },
    saveAsBtn: {
        backgroundColor: "#f0f0f0",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginRight: 10,
    },
    saveBtn: {
        backgroundColor: 'black',
        marginTop: 20,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center'
    },
    saveText: {
        color: 'white',
        ...globalStyles.f14Bold
    }
});
