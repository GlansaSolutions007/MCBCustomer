import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import globalStyles from "../../styles/globalStyles";
import CTAbannerhome from "../../../assets/images/CTAbannerhome.png";
import exteriorservice from "../../../assets/images/exteriorservice.png";
import interiorservice from "../../../assets/images/interiorservice.png";
import bluecar from "../../../assets/images/bluecar.png";
import logo from "../../../assets/Logo/logo.png";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import * as Device from "expo-device";
import * as Location from 'expo-location';
import { useContext, useEffect } from "react";
import { LocationContext } from "../../contexts/LocationContext";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { setLocationText, setLocationStatus } = useContext(LocationContext);

  const goToCar = () => {
    navigation.navigate("CustomerTabs", {
      screen: "SelectCarBrand"
    });
  };

  const interiorService = () => {
    navigation.navigate("InteriorService");
  }

  const DeviceId = Device.osInternalBuildId || Device.osBuildId || "unknown-device-id";

  useEffect(() => {
    (async () => {
      setLocationStatus('loading');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setLocationStatus('denied');
          setLocationText('Select your location');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync(loc.coords);

        if (geo.length > 0) {
          const { city, region } = geo[0];
          setLocationText(`${city || 'City'}, ${region || 'Region'}`);
          setLocationStatus('granted');
        } else {
          setLocationText('Select your location');
          setLocationStatus('error');
        }
      } catch (err) {
        setLocationStatus('error');
        setLocationText('Select your location');
      }
    })();
  }, []);

  return (
    <ScrollView
      style={{ backgroundColor: color.textWhite }}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={[styles.banner, globalStyles.mb35]}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <View style={styles.bannerAbsolute}>
          <Image
            source={bluecar}
            style={styles.carImagePositioned}
            resizeMode="contain"
          />
          <CustomText
            style={[styles.bannerSubtitlePositioned, globalStyles.f18Regular]}
          >
            A Professional Car Care Services in Hyderabad
          </CustomText>
        </View>
      </View>
      <View style={globalStyles.container}>
        <CustomText>{DeviceId}</CustomText>
        <CustomText
          style={[globalStyles.mt4, globalStyles.mb1, globalStyles.f16Bold]}
        >
          We Provide Services Like
        </CustomText>
        <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
          <TouchableOpacity style={styles.card}>
            <Image source={exteriorservice} style={styles.cardImage} />

            <LinearGradient
              colors={[color.primary, 'transparent']}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={styles.gradientOverlay}
            >
              <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>Exterior</CustomText>
              <CustomText style={[globalStyles.f12Regular, globalStyles.textWhite]}>Service</CustomText>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={interiorService}>
            <Image source={interiorservice} style={styles.cardImage} />

            <LinearGradient
              colors={[color.primary, 'transparent']}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={styles.gradientOverlay}
            >
              <CustomText style={[globalStyles.f12Bold, globalStyles.textWhite]}>Interior</CustomText>
              <CustomText style={[globalStyles.f12Regular, globalStyles.textWhite]}>Service</CustomText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <ImageBackground
          source={CTAbannerhome}
          style={[
            styles.ctaContainer,
            globalStyles.radius,
            globalStyles.p5,
            globalStyles.mt5,
          ]}
          resizeMode="cover"
        >
          <View>
            <View>
              <CustomText
                style={[
                  styles.ctaTitle,
                  globalStyles.f20Bold,
                  globalStyles.w60,
                  globalStyles.textWhite,
                  globalStyles.f16Bold,
                ]}
              >
                Give your car’s intro to your care buddy
              </CustomText>
              <CustomText
                style={[
                  globalStyles.w50,
                  globalStyles.textWhite,
                  globalStyles.f12Regular,
                ]}
              >
                We’ll remember it, pamper it, and keep it shining.
              </CustomText>
            </View>
          </View>
          <View style={styles.ctaButtonWrapper}>
            <TouchableOpacity
              style={[styles.ctaButton, globalStyles.bgwhite]}
              onPress={goToCar}
            >
              <CustomText style={globalStyles.f16Bold}>Add My Car</CustomText>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  logo: {
    width: 200,
    height: 100,
  },
  bannerAbsolute: {
    position: "relative",
    height: 100,
  },

  carImagePositioned: {
    position: "absolute",
    bottom: -50,
    left: 0,
    width: "55%",
    height: 130,
  },

  bannerSubtitlePositioned: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: "45%",
    textAlign: "right",
    color: color.white,
  },

  title: {
    fontSize: 22,
    color: color.white,
  },

  buttonText: {
    color: color.textDark,
    fontSize: 16,
  },
  banner: {
    backgroundColor: color.primary,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  carImage: {
    width: "60%",
    // height: 130,
  },

  bannerSubtitle: {
    width: "40%",
    color: color.white,
  },

  card: {
    width: '47%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ccc',
  },

  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%', // adjust how far the gradient fades up
    justifyContent: 'flex-end',
    padding: 10,
  },
  ctaContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    minHeight: 160,
  },

  ctaTitle: {
    width: "60%",
    marginBottom: 5,
    lineHeight: 25,
  },
  ctaButtonWrapper: {
    position: "absolute",
    bottom: 8,
    right: 10,
  },

  ctaButton: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 10,
    alignItems: "center",
  },
});
