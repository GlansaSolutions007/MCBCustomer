import React from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BgImage from "../../../assets/images/loginbg5.png";
import Logo from "../../../assets/Logo/logo2.png";
import globalStyles from "../../styles/globalStyles";
import CustomText from "../../components/CustomText";
import { color } from "../../styles/theme";
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
        <View style={[styles.logoContainer]}>
          <View style={styles.logoWrapper}>
            <Image source={Logo} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        <CustomText style={[globalStyles.f40Bold, globalStyles.textBlack]}>
          Your Car. Our Care
        </CustomText>
        <CustomText style={[styles.description, globalStyles.f20Regular]}>
          Discover professional interior and exterior services at your
          fingertips. Because your car deserves the best.
        </CustomText>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate("Login")}
        >
          <CustomText style={styles.loginText}>Login</CustomText>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  //   overlay: {
  //     ...StyleSheet.absoluteFillObject,
  //     backgroundColor: "#ffffffff",
  //     opacity: 1,
  //   },
  logoContainer:{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
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
    width: 220,
    height: 130,
    alignSelf: "flex-start",
    marginBottom: 300,
  },
  description: {
    color: color.primary,
    textAlign: "start",
    marginBottom: 25,
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
    ...globalStyles.f12Bold,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  seventy: {
    width: "70%",
  },
  loginBtn: {
    backgroundColor: color.primary,
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
    ...globalStyles.f12Bold,
  },
  skipText: {
    color: "black",
    ...globalStyles.f12Bold,
  },
});
