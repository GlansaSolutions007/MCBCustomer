import React from "react";
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import BgImage from '../../../assets/images/WhatsApp Image 2025-07-16 at 12.35.56_406efcee.jpg'
import Logo from '../../../assets/Logo/my car buddy-02 yellow-01.png'
import globalStyles from "../../styles/globalStyles";
import CustomText from "../../components/CustomText";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WelcomeScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <ImageBackground
            source={BgImage}
            style={styles.container}
            imageStyle={{ opacity: 0.5 }}
        >
            <View style={styles.overlay} />
            <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.logoWrapper}>
                    <Image
                        source={Logo}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <CustomText style={[globalStyles.f40Bold, globalStyles.textWhite]}>Your Car. Our Care</CustomText>
                <CustomText style={[styles.description, globalStyles.f12Regular]}>
                    Discover professional interior and exterior services at your
                    fingertips. Because your car deserves the best.
                </CustomText>

                <TouchableOpacity
                    style={styles.registerBtn}
                    onPress={() => navigation.navigate("Register")}
                >
                    <CustomText style={styles.registerText}>Register</CustomText>
                </TouchableOpacity>

                <View style={styles.row}>
                    <View style={styles.seventy}>
                        <TouchableOpacity
                            style={styles.loginBtn}
                            onPress={() => navigation.navigate("Login")}
                        >
                            <CustomText style={styles.loginText}>Login</CustomText>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.skipBtn}
                        onPress={() => navigation.replace("CustomerTabs")}
                    >
                        <CustomText style={styles.skipText}>Skip</CustomText>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-end",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#01584aff",
        opacity: 0.5,
    },
    content: {
        padding: 20,
        zIndex: 1,
    },
    logoWrapper: {
        flex: 1,
        justifyContent: "center",
    },
    logo: {
        width: 250,
        height: 150,
        alignSelf: "flex-start",
        marginBottom: 300,
    },
    description: {
        color: "white",
        textAlign: "start",
        marginBottom: 25
    },
    registerBtn: {
        backgroundColor: "white",
        padding: 18,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 12,
    },
    registerText: {
        color: "black",
        ...globalStyles.f12Bold
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    seventy: {
        width: "70%"
    },
    loginBtn: {
        flex: 1,
        backgroundColor: "black",
        padding: 18,
        borderRadius: 8,
        marginRight: 8,
        alignItems: "center",
    },
    skipBtn: {
        flex: 1,
        backgroundColor: "#ccc",
        padding: 18,
        borderRadius: 8,
        marginLeft: 8,
        alignItems: "center",
    },
    loginText: {
        color: "white",
        ...globalStyles.f12Bold
    },
    skipText: {
        color: "black",
        ...globalStyles.f12Bold
    },
});
