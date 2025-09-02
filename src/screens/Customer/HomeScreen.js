import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  StyleSheet,
  RefreshControl,
  Alert,
  Pressable
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import globalStyles from "../../styles/globalStyles";
import CTAbannerhome from "../../../assets/images/CTAbannerhome.png";
import exteriorservice from "../../../assets/images/exteriorservice.png";
import interiorservice from "../../../assets/images/interiorservice.png";
import bluecar from "../../../assets/images/bluecar.png";
import logo from "../../../assets/Logo/logoWhite.png";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Device from "expo-device";
import * as Location from "expo-location";
import { useCallback, useContext, useEffect, useState } from "react";
import { LocationContext } from "../../contexts/LocationContext";
import axios from "axios";
// import { API_BASE_URL } from "@env";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Notifications from "expo-notifications";

import { API_URL, API_IMAGE_URL, GOOGLE_MAPS_APIKEY, RAZORPAY_KEY } from "@env";
import { getToken } from "../../utils/token";
import useGlobalRefresh from "../../hooks/useGlobalRefresh";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { monitorBookingsForNotifications } from "../../utils/notificationService";

const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

export default function HomeScreen() {
  const token = getToken();
  // alert(API_URL);
  const navigation = useNavigation();
  const { setLocationText, setLocationStatus } = useContext(LocationContext);
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}Category`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Catttt");

      if (response.data) {
        const activeCategories = response.data.filter((cat) => cat.IsActive);
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysBookings = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedUserData = (JSON.parse(userData));
      const custID = parsedUserData.custID;
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const response = await axios.get(`${API_URL}Bookings/${custID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log(custID, response, 'bookkkkkiiiinnnnnnggggg');

      if (response.data) {
        // Filter bookings for today
        const todaysBookings = response.data.filter(
          (booking) =>
            booking.BookingDate === today &&
            booking.BookingStatus?.toLowerCase() !== "cancelled");
        setBookings(todaysBookings);

        // Monitor bookings for notification changes
        if (custID) {
          monitorBookingsForNotifications(todaysBookings, custID);
        }
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
 
  useFocusEffect(
    useCallback(() => {
      fetchTodaysBookings();
    }, [])
  );

  const checkStorage = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log("All Keys:", allKeys);

    const allData = await AsyncStorage.multiGet(allKeys);
    // console.log("All Data:", allData);
  } catch (e) {
    console.error("Error reading AsyncStorage:", e);
  }
};

useEffect(() => {
  checkStorage();
}, []);

  const handleCategoryPress = async (category) => {
    try {
      // const token = await getToken();
      const response = await axios.get(
        `${API_URL}SubCategory1/subcategorybycategoryid?categoryid=${category.CategoryID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const activeSubCategories = (response.data || []).filter(
        (sub) => sub.IsActive
      );

      navigation.navigate("InteriorService", {
        categoryId: category.CategoryID,
        categoryName: category.CategoryName,
        subCategories: activeSubCategories,
        subcategoryId: activeSubCategories[0]?.SubCategoryID,
      });
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const goToCar = () => {
    navigation.navigate("CustomerTabs", {
      screen: "SelectCarBrand",
    });
  };

  const DeviceId =
    Device.osInternalBuildId || Device.osBuildId || "unknown-device-id";

  useEffect(() => {
    (async () => {
      setLocationStatus("loading");
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLocationStatus("denied");
          setLocationText("Select your location");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync(loc.coords);

        if (geo.length > 0) {
          const { city, region } = geo[0];
          setLocationText(`${city || "City"}, ${region || "Region"}`);
          setLocationStatus("granted");
        } else {
          setLocationText("Select your location");
          setLocationStatus("error");
        }
      } catch (err) {
        setLocationStatus("error");
        setLocationText("Select your location");
      }
    })();
  }, []);
  const { refreshing, onRefresh } = useGlobalRefresh(async () => {
    await fetchCategories();
    await fetchTodaysBookings();
  });

  const SkeletonLoader = () => (
    <View>
      <View style={globalStyles.container}>
        <View style={{ backgroundColor: '#f1f1f1ff', height: 20, width: '50%', borderRadius: 4, marginBottom: 10, marginTop: 40 }} />
        {/* Category Cards Placeholder */}
        <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.card}>
              <View style={[styles.cardImage, { backgroundColor: '#f1f1f1ff' }]} />
              <LinearGradient
                colors={['#f1f1f1ff', 'transparent']}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                style={styles.gradientOverlay}
              >
                <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '60%', borderRadius: 4 }} />
                <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '40%', borderRadius: 4, marginTop: 5 }} />
              </LinearGradient>
            </View>
          ))}
        </View>
        {/* CTA Banner Placeholder */}
        <View
          style={[
            styles.ctaContainer,
            globalStyles.p5,
            globalStyles.mt5,
            { backgroundColor: '#f1f1f1ff', borderRadius: 8 },
          ]}
        >
          <View>
            <View style={{ backgroundColor: '#f1f1f1ff', height: 25, width: '70%', borderRadius: 4 }} />
            <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '50%', borderRadius: 4, marginTop: 5 }} />
          </View>
          <View style={styles.ctaButtonWrapper}>
            <View style={[styles.ctaButton, { backgroundColor: '#f1f1f1ff' }]} />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      style={{ backgroundColor: color.textWhite }}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
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
            <View
              style={[
                globalStyles.mt4,
                globalStyles.mb1,
                { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }
              ]}
            >
              <CustomText
                style={[
                  globalStyles.f16Bold,
                  globalStyles.textBlack,
                ]}
              >
                We Provide Services Like
              </CustomText>

              {categories.length > 2 && (
                <Ionicons
                  name="arrow-forward-circle"
                  size={20}
                  color={color.primary}
                />
              )}
            </View>
            <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
              {categories.length === 2 ? (
                <View style={[globalStyles.flexrow, globalStyles.justifysb]}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.CategoryID}
                      style={styles.card}
                      onPress={() => handleCategoryPress(cat)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{
                          uri: `${API_IMAGE_URL}/${cat.ThumbnailImage}`,
                        }}
                        style={styles.cardImage}
                      />
                      <LinearGradient
                        colors={[color.primary, 'transparent']}
                        start={{ x: 0.5, y: 1 }}
                        end={{ x: 0.5, y: 0 }}
                        style={styles.gradientOverlay}
                      >
                        <CustomText
                          style={[globalStyles.f14Bold, globalStyles.textWhite]}
                        >
                          {cat.CategoryName}
                        </CustomText>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.CategoryID}
                      style={styles.card}
                      onPress={() => handleCategoryPress(cat)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{
                          uri: `${API_IMAGE_URL}/${cat.ThumbnailImage}`,
                        }}
                        style={styles.cardImage}
                      />
                      <LinearGradient
                        colors={[color.primary, 'transparent']}
                        start={{ x: 0.5, y: 1 }}
                        end={{ x: 0.5, y: 0 }}
                        style={styles.gradientOverlay}
                      >
                        <CustomText
                          style={[globalStyles.f14Bold, globalStyles.textWhite]}
                        >
                          {cat.CategoryName}
                        </CustomText>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
            <ImageBackground
              source={CTAbannerhome}
              style={[
                styles.ctaContainer,
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
                  <CustomText
                    style={[globalStyles.f16Bold, globalStyles.textBlack]}
                  >
                    Add My Car
                  </CustomText>
                </TouchableOpacity>
              </View>
            </ImageBackground>
            <View style={[globalStyles.mt4]}>
              <CustomText style={[globalStyles.f16Bold, globalStyles.textBlack, globalStyles.mb1]}>
                Today's Bookings
              </CustomText>
              {bookings.length === 0 ? (
                <Pressable
                  onPress={() => navigation.navigate("CustomerTabNavigator", { screen: 'Services' })}
                  style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 16,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={40}
                    color={color.primary}
                    style={{ marginBottom: 8 }}
                  />
                  <CustomText
                    style={[globalStyles.f16Bold, { color: color.primary }]}
                  >
                    No bookings for today.
                  </CustomText>
                  <View style={{ alignItems: "center", marginTop: 8 }}>
                    <CustomText
                      style={[
                        globalStyles.f12Regular,
                        { color: "#666", textAlign: "center" },
                      ]}
                    >
                      Book your service now and enjoy a hassle-free experience!
                    </CustomText>
                  </View>
                </Pressable>

              ) : (
                bookings.map((booking) => (
                  <Pressable
                    key={booking.BookingID}
                    style={styles.bookingCard}
                    onPress={() => navigation.navigate('BookingsInnerPage', { booking })}
                  >
                    <View>
                      <View style={styles.bookingR1}>
                        <CustomText style={styles.bookingID}>
                          BID: {booking.BookingTrackID}
                        </CustomText>
                        <CustomText
                          style={[
                            styles.techStatus,
                            {
                              color: booking.TechID === null ? color.text : color.primary,
                            },
                          ]}
                        >
                          Tech {booking.TechID === null ? 'Not Assigned' : 'Assigned'}
                        </CustomText>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.bookingR1}>
                        <View style={styles.bookingCarImage}>
                          <Image
                            source={{ uri: `${API_IMAGE_URL}${booking.VehicleImage}` }}
                            style={{
                              width: '60%',
                              height: 60,
                              borderRadius: 8,
                              backgroundColor: '#eee',
                            }}
                            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                          />
                          <CustomText style={styles.title}>
                            {booking.BrandName} {booking.ModelName} (
                            {booking.FuelTypeName === 'Petrol'
                              ? 'P'
                              : booking.FuelTypeName === 'Diesel'
                                ? 'D'
                                : 'E'}
                            )
                          </CustomText>
                          <CustomText style={styles.subText}>{booking.VehicleNumber}</CustomText>
                        </View>
                        <View style={styles.bookingDetails}>
                          <View style={styles.bookingDate}>
                            <CustomText style={[globalStyles.f10Regular, { color: color.primary }]}>
                              Booking Date:
                            </CustomText>
                            <CustomText style={[globalStyles.f12Bold]}>{formatDate(booking.BookingDate)}</CustomText>
                          </View>
                          <View style={styles.bookingDate}>
                            <CustomText style={[globalStyles.f10Regular]}>Booked Slot:</CustomText>
                            <CustomText style={[globalStyles.f12Bold]}>{booking.TimeSlot}</CustomText>
                          </View>
                          <View style={styles.bookingDate}>
                            <CustomText style={[globalStyles.f10Regular]}>Service Amount:</CustomText>
                            <CustomText style={[globalStyles.f12Bold]}>
                              ₹ {booking.TotalPrice.toFixed(2)}
                            </CustomText>
                          </View>
                        </View>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.bookingServices}>
                        <CustomText style={[globalStyles.f10Regular, { color: color.primary }]}>
                          Services Booked:
                        </CustomText>
                        {(booking.Packages || []).map((pkg, index) => (
                          <View
                            key={pkg.PackageID}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent:
                                index === booking.Packages.length - 1 ? 'space-between' : 'flex-start',
                              marginVertical: 4,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <FontAwesome5
                                name="tools"
                                size={16}
                                color={color.primary}
                                style={{ marginRight: 6 }}
                              />
                              <CustomText style={[globalStyles.f12Bold, { color: '#333' }]}>
                                {pkg.PackageName}
                              </CustomText>
                            </View>
                            {index === booking.Packages.length - 1 && (
                              <CustomText style={[globalStyles.f10Medium]}>
                                Status:{' '}
                                <CustomText style={[globalStyles.f10Bold, { color: color.primary }]}>
                                  {booking.BookingStatus}
                                </CustomText>
                              </CustomText>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </>
      )}
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
    width: 170,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    height: '50%',
    justifyContent: 'flex-end',
    padding: 10,
  },
  scrollContent: {
    paddingVertical: 8,
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
  bookingCard: {
    backgroundColor: color.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingR1: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  bookingID: {
    ...globalStyles.f10Bold,
    backgroundColor: color.secondary,
    padding: 5,
    borderRadius: 10,
    color: color.white,
  },
  bookingCarImage: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  techStatus: {
    ...globalStyles.f10Bold,
  },
  divider: {
    borderBottomColor: '#ededed',
    borderBottomWidth: 1,
    marginVertical: 3,
  },
  bookingDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'flex-start',
    flex: 1,
    gap: 6,
    padding: 5,
  },
  bookingDate: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    ...globalStyles.f12Bold,
    color: '#222',
  },
  subText: {
    ...globalStyles.f10Bold,
    color: '#666',
    marginTop: 2,
  },
  bookingServices: {
    marginTop: 8,
  },
});
