import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Platform,
  Animated,
  RefreshControl,
  Alert,
  InteractionManager,
  Pressable,
} from "react-native";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import SearchBox from "../../components/SearchBox";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import interior from "../../../assets/images/interiorservice.png";
import { StatusBar } from "react-native";
import Garage from "../../../assets/icons/garageIcon.png";
import CustomText from "../../components/CustomText";
import { useCart } from "../../contexts/CartContext";
import { getToken } from "../../utils/token";
import axios from "axios";
// import { API_BASE_URL } from "@env";
import {
  API_URL,
  API_IMAGE_URL,
  GOOGLE_MAPS_APIKEY,
  RAZORPAY_KEY,
} from "../../../apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../../components/CustomAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import useGlobalRefresh from "../../hooks/useGlobalRefresh";
// import PackageSkeleton from "../../components/PackageSkeleton";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const InteriorService = () => {
  const token = getToken();
  const navigation = useNavigation();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [packages, setPackages] = useState([]);
  const [packageCache, setPackageCache] = useState({});
  const { cartItems, addToCart } = useCart();
  const route = useRoute();
  const { categoryId, categoryName, subCategories, subCategoryId } = route.params;
  const [selectedServiceId, setSelectedServiceId] = useState(subCategories?.[0]?.SubCategoryID || null);
  const [cars, setCars] = useState([]);
  const [showCarModal, setShowCarModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [fuelId, setFuelId] = useState('');

  // Initialize fadeAnims dynamically based on filteredPackages length
  const fadeAnims = useRef([]);

  const resetFadeAnims = (count) => {
    fadeAnims.current = Array(count)
      .fill()
      .map(() => new Animated.Value(0));
  };

  const fadeIn = (index) => {
    if (fadeAnims.current[index]) {
      InteractionManager.runAfterInteractions(() => {
        Animated.timing(fadeAnims.current[index], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  useEffect(() => {
    const fetchCustomerCars = async () => {
      try {
        const token = await getToken();
        const userData = await AsyncStorage.getItem('userData');
        const parsedData = JSON.parse(userData);
        const custID = parsedData?.custID;

        if (!custID || !token) {
          console.warn('Customer ID or token missing');
          return;
        }

        const response = await axios.get(
          `${API_URL}CustomerVehicles/CustId?CustId=${custID}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const carList = response.data;
        const normalizedList = carList
          ? Array.isArray(carList)
            ? carList
            : [carList]
          : [];

        const formattedCars = normalizedList.map((car) => ({
          id: car.VehicleID.toString(),
          model: car.ModelName,
          fuel: car.FuelTypeName,
          manufacturer: car.BrandName,
          image: {
            uri: `https://api.mycarsbuddy.com/Images${car.VehicleImage}`,
          },
          vehicleNumber: car.VehicleNumber,
          isPrimary: car.IsPrimary,
          brandId: car.BrandID,
          modelId: car.ModelID,
          fuelId: parseInt(car.FuelTypeID),
        }));

        setCars(formattedCars);
        const primaryCar = formattedCars.find((car) => car.isPrimary);
        if (primaryCar) {
          setSelectedCar(primaryCar);
        }
        if (formattedCars.length === 1 && !formattedCars[0].isPrimary) {
          await makeCarPrimary(formattedCars[0].id);
          formattedCars[0].isPrimary = true;
        }
      } catch (error) {
        console.error('Error fetching car list:', error);
      }
    };

    fetchCustomerCars();
  }, []);

  useEffect(() => {
    if (cars.length > 0 && !selectedCar) {
      setSelectedCar(cars[0]);
    }
  }, [cars]);

  const makeCarPrimary = async (vehicleId) => {
    try {
      const token = await getToken();
      const userData = await AsyncStorage.getItem('userData');
      const parsedData = JSON.parse(userData);
      const custID = parsedData?.custID;

      await axios.post(
        `${API_URL}CustomerVehicles/primary-vehicle?vehicleId=${vehicleId}&custid=${custID}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updated = cars.map((car) => ({
        ...car,
        isPrimary: car.id === vehicleId,
      }));
      setCars(updated);
    } catch (error) {
      console.error('Error setting primary car:', error);
    }
  };

  const debouncedFetchPackages = debounce(async (subCategoryId, brandId = '', modelId = '', fuelId = '') => {
    if (!subCategoryId) {
      console.warn('No subCategoryId provided, skipping fetch');
      return;
    }

    // Clear cache for this subcategory to ensure fresh data
    setPackageCache((prev) => {
      const newCache = { ...prev };
      delete newCache[subCategoryId];
      return newCache;
    });

    try {
      console.log(
        `Fetching packages: categoryId=${categoryId}, subCategoryId=${subCategoryId}, brandId=${brandId}, modelId=${modelId}, fuelId=${fuelId}`
      );
      setLoading(true);
      const response = await axios.get(
        `${API_URL}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?categoryId=${categoryId}&subCategoryId=${subCategoryId}&BrandId=${brandId || ''}&ModelId=${modelId || ''}&fuelTypeId=${fuelId || ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const rawData = response.data;
      const dataArray = Array.isArray(rawData) ? rawData : [rawData];
      const data = dataArray.filter((pkg) => pkg.IsActive);

      const formatted = data.map((pkg) => ({
        id: pkg.PackageID,
        title: pkg.PackageName,
        image: pkg.PackageImage,
        bannerImages: pkg.BannerImage?.split(','),
        price: pkg.Serv_Off_Price,
        originalPrice: pkg.Serv_Reg_Price,
        services: pkg.IncludeNames?.split(',') || [],
        estimatedMins: pkg.EstimatedDurationMinutes,
        desc: pkg.Description,
      }));

      setPackageCache((prev) => ({ ...prev, [subCategoryId]: formatted }));
      setPackages(formatted);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    if (subCategories.length > 0) {
      const firstActive = subCategories.find((sub) => sub.IsActive);
      setSelectedSubCategoryId(firstActive?.SubCategoryID || null);
      setSelectedServiceId(firstActive?.SubCategoryID || null);

      if (firstActive) {
        const primaryCar = cars.find((car) => car.isPrimary);
        if (cars.length > 0 && primaryCar) {
          setSelectedCar(primaryCar);
          debouncedFetchPackages(
            firstActive.SubCategoryID,
            primaryCar.brandId,
            primaryCar.modelId,
            primaryCar.fuelId
          );
        } else {
          debouncedFetchPackages(firstActive.SubCategoryID);
        }
      }
    }
  }, [subCategories, cars]);

  const handleTabPress = (subCategory) => {
    setSelectedSubCategoryId(subCategory.SubCategoryID);
    setSelectedServiceId(subCategory.SubCategoryID);
    if (selectedCar) {
      debouncedFetchPackages(
        subCategory.SubCategoryID,
        selectedCar.brandId,
        selectedCar.modelId,
        selectedCar.fuelId
      );
    } else {
      debouncedFetchPackages(subCategory.SubCategoryID);
    }
  };

  const filteredPackagesMemo = useMemo(() => {
    return packages.filter((pkg) =>
      pkg.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [packages, searchQuery]);

  useEffect(() => {
    // Reset fadeAnims based on the number of filtered packages
    resetFadeAnims(filteredPackagesMemo.length);
    setFilteredPackages(filteredPackagesMemo);
    filteredPackagesMemo.forEach((_, index) => {
      fadeIn(index);
    });
  }, [filteredPackagesMemo]);

  const { refreshing, onRefresh } = useGlobalRefresh(async () => {
    if (selectedSubCategoryId && selectedCar) {
      await debouncedFetchPackages(
        selectedSubCategoryId,
        selectedCar.brandId,
        selectedCar.modelId,
        selectedCar.fuelId
      );
    } else if (selectedSubCategoryId) {
      await debouncedFetchPackages(selectedSubCategoryId);
    }
  });

  const SkeletonLoader = () => (
    <View style={styles.rowCard}>
      <View style={[styles.sideImage, { backgroundColor: '#f1f1f1ff', borderRadius: 10 }]} />
      <View style={styles.cardRight}>
        <View style={{ backgroundColor: '#f1f1f1ff', height: 20, width: '80%', marginBottom: 5, borderRadius: 10 }} />
        <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '70%', marginBottom: 5, borderRadius: 10 }} />
        <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '60%', marginBottom: 5, borderRadius: 10 }} />
        <View style={{ backgroundColor: '#f1f1f1ff', height: 15, width: '50%', borderRadius: 10 }} />
      </View>
    </View>
  );

  const PackageCard = React.memo(({ item, index }) => (
    <Animated.View style={{ opacity: fadeAnims.current[index] || 1 }}>
      <View style={styles.rowCard}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ServiceInnerPage', {
              package: item,
            })
          }
        >
          <ImageBackground
            source={{
              uri: `${API_IMAGE_URL}${item.image}`,
            }}
            style={styles.sideImage}
            imageStyle={{ borderRadius: 10 }}
          >
            <View style={styles.discountBadge}>
              <CustomText style={styles.discountText}>
                {Math.round(
                  ((item.originalPrice - item.price) /
                    item.originalPrice) *
                  100
                )}
                %
              </CustomText>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <View style={styles.cardRight}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ServiceInnerPage', {
                package: item,
              })
            }
          >
            <CustomText
              style={[
                { color: color.primary },
                globalStyles.f16Bold,
              ]}
            >
              {item.title}
            </CustomText>
          </TouchableOpacity>
          <CustomText style={styles.cardSubheading}>
            Services Included:
          </CustomText>
          {item.services.slice(0, 3).map((service, idx) => {
            const isLastVisible =
              idx === 2 && item.services.length > 3;
            return (
              <CustomText
                key={`${service}-${idx}`}
                style={styles.serviceText}
              >
                • {service}
                {isLastVisible && (
                  <Text
                    onPress={() =>
                      navigation.navigate('ServiceInnerPage', {
                        package: item,
                      })
                    }
                    style={{ color: color.primary }}
                  >
                    {' '}
                    +more
                  </Text>
                )}
              </CustomText>
            );
          })}

          {cars.length === 0 || !selectedCar ? (
            <TouchableOpacity
              style={styles.addCarButton}
              onPress={() =>
                navigation.navigate('SelectCarBrand')
              }
            >
              <CustomText style={styles.addButtonText}>
                Add Your Car
              </CustomText>
            </TouchableOpacity>
          ) : (
            <View style={styles.priceRow}>
              <View
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <CustomText style={styles.striked}>
                  ₹{item.originalPrice}
                </CustomText>
                <CustomText
                  style={[
                    globalStyles.textBlack,
                    globalStyles.f16Bold,
                  ]}
                >
                  ₹{item.price}
                </CustomText>
              </View>

              {cartItems.find((ci) => ci.id === item.id) ? (
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: color.yellow },
                  ]}
                  onPress={() => navigation.navigate('Cart')}
                >
                  <CustomText style={styles.addButtonTextCart}>
                    View Cart
                  </CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addToCart(item)}
                >
                  <CustomText style={styles.addButtonText}>
                    Add Service
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  ));

  // Data for the single FlatList
  const renderData = [
    { type: 'header', id: 'header' },
    { type: 'subcategories', id: 'subcategories' },
    { type: 'content', id: 'content' },
  ];

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        return (
          <View>
            <ImageBackground source={interior} style={styles.imageBackground}>
              <LinearGradient
                colors={[
                  'rgba(19, 109, 110, .6)',
                  'rgba(19, 109, 110, .10)',
                  'rgba(0, 0, 0, 1)',
                ]}
                locations={[0.13, 0.52, 0.91]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.overlay}
              >
                <View style={styles.topRow}>
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backIcon}
                  >
                    <Ionicons name="arrow-back" size={24} color="black" />
                  </TouchableOpacity>
                  <View style={styles.iconWrapper}>
                    <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
                      <Image source={Garage} style={styles.garageIcon} />
                      {cartItems.length > 0 && (
                        <View style={styles.badge}>
                          <CustomText style={styles.badgeText}>
                            {cartItems.length}
                          </CustomText>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.searchContainer}>
                  <View style={styles.textContainer}>
                    <CustomText
                      style={[globalStyles.textWhite, globalStyles.f32Bold]}
                    >
                      {categoryName}
                    </CustomText>
                    <CustomText
                      style={[globalStyles.textWhite, globalStyles.f12Regular]}
                    >
                      Here you can find the suitable packages for your car!
                    </CustomText>
                  </View>
                  <View style={styles.chooseCarRow}>
                    <View style={styles.chooseCarDiv}>
                      <SearchBox
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                    {cars.length > 0 && (
                      <Pressable
                        style={styles.chooseCarButton}
                        onPress={() => setShowCarModal(true)}
                      >
                        {selectedCar?.image?.uri && (
                          <Image
                            source={{ uri: selectedCar.image.uri }}
                            style={{
                              width: 40,
                              height: 40,
                              resizeMode: 'contain',
                              backgroundColor: color.white,
                              borderRadius: 10,
                            }}
                          />
                        )}
                        {cars.length > 1 && (
                          <CustomText style={styles.chooseCarText}>Change</CustomText>
                        )}
                      </Pressable>)}

                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        );
      case 'subcategories':
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="arrow-forward-circle"
                size={20}
                color={color.primary}
                style={styles.scrollHintIcon}
              />
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={subCategories}
              keyExtractor={(item) => item.SubCategoryID.toString()}
              initialNumToRender={5}
              contentContainerStyle={styles.flatListContainer}
              renderItem={({ item }) => {
                const isSelected = selectedServiceId === item.SubCategoryID;
                return (
                  <TouchableOpacity
                    style={styles.popularItem}
                    onPress={() => {
                      setSelectedServiceId(item.SubCategoryID);
                      handleTabPress(item);
                    }}
                  >
                    <View
                      style={[
                        styles.imageWrapper,
                        isSelected && styles.selectedImageWrapper,
                      ]}
                    >
                      <Image
                        source={{
                          uri: `${API_IMAGE_URL}${item.ThumbnailImage}`,
                        }}
                        style={styles.popularImage}
                      />
                    </View>
                    <CustomText
                      style={[
                        globalStyles.f10Bold,
                        styles.popularText,
                        globalStyles.textBlack,
                        isSelected && styles.selectedText,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.SubCategoryName}
                    </CustomText>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        );
      case 'content':
        return (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              {loading ? (
                <View>
                  <SkeletonLoader />
                  <SkeletonLoader />
                  <SkeletonLoader />
                </View>
              ) : filteredPackages.length === 0 ? (
                <CustomText
                  style={{
                    textAlign: 'center',
                    marginTop: 20,
                    color: color.black,
                  }}
                >
                  No Packages Available
                </CustomText>
              ) : (
                <FlatList
                  data={filteredPackages}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item, index }) => (
                    <PackageCard item={item} index={index} />
                  )}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  scrollEnabled={false} // Disable scrolling to let parent FlatList handle it
                />
              )}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#fff' }}
      edges={['bottom']}
    >
      <FlatList
        data={renderData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.container}
      />
      <CustomAlert
        visible={showCarModal}
        onClose={() => setShowCarModal(false)}
        title="Select Your Car"
        showButton={false}
      >
        <View style={{ marginTop: 10 }}>
          {cars.length === 1 ? (
            <TouchableOpacity
              style={[styles.carItem, { alignSelf: 'center' }]}
              onPress={() => {
                console.log('Selected single car:', cars[0].id);
                setSelectedCar(cars[0]);
                setShowCarModal(false);
                if (selectedSubCategoryId) {
                  debouncedFetchPackages(
                    selectedSubCategoryId,
                    cars[0].brandId,
                    cars[0].modelId,
                    cars[0].fuelId
                  );
                }
              }}
            >
              <Image source={cars[0].image} style={styles.singleCarImage} />
              <CustomText style={styles.carModel}>{cars[0].model}</CustomText>
            </TouchableOpacity>
          ) : (
            <View style={styles.carGrid}>
              {cars.map((car) => {
                const isSelected = selectedCar?.id === car.id;
                return (
                  <TouchableOpacity
                    key={car.id}
                    style={[
                      styles.carItem,
                      car.isPrimary && styles.primaryCarItem,
                      isSelected && styles.selectedCarItem,
                    ]}
                    onPress={async () => {
                      console.log('Selected car:', car.id, 'SubCategoryID:', selectedSubCategoryId);
                      setSelectedCar(car);
                      setShowCarModal(false);
                      if (!car.isPrimary) {
                        await makeCarPrimary(car.id);
                      }
                      if (selectedSubCategoryId) {
                        debouncedFetchPackages(
                          selectedSubCategoryId,
                          car.brandId,
                          car.modelId,
                          car.fuelId
                        );
                      } else {
                        console.warn('No subCategoryId selected, cannot fetch packages');
                      }
                    }}
                  >
                    <Image source={car.image} style={styles.carImage} />
                    <CustomText style={styles.carModel}>
                      {car.model}
                    </CustomText>
                    {car.isPrimary && (
                      <CustomText style={styles.primaryLabel}>
                        Primary
                      </CustomText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </CustomAlert>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 45,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },

  selectedImageWrapper: {
    borderColor: color.yellow,
  },

  popularImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: "cover",
  },

  selectedText: {
    color: color.yellow,
  },

  imageBackground: {
    height: 350,
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  iconWrapper: {
    position: "relative",
  },
  backIcon: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.79)",
  },
  garageIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "yellow",
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTextWrapper: {
    alignItems: "center",
  },
  badgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  searchContainer: {
    backgroundColor: "transparent",
    flexDirection: "column",
    justifyContent: "space-between",
    height: 140, // adjust as needed
  },

  textContainer: {
    flex: 1,
    marginBottom: 10,
  },

  chooseCarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  chooseCarButton: {
    // backgroundColor: color.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    width: 70,
    marginLeft: 8,
    marginTop: 14,
  },
  chooseCarDiv: {
    width: "80%",
  },
  chooseCarText: {
    color: color.white,
    ...globalStyles.f10Bold,
    textAlign: "center",
    // marginTop:-15
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  scrollHintIcon: {
    marginLeft: 10,
  },
  section: {
    padding: 10,
    borderTopEndRadius: 30,
    borderTopLeftRadius: 30,
    borderTopStartRadius: 30,
  },
  flatListContainer: {
    paddingHorizontal: 10,
  },
  popularItem: {
    width: 80,
    alignItems: "center",
    marginRight: 26,
  },
  popularText: {
    marginTop: 5,
    width: 70,
    textAlign: "center",
  },
  bannerContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  bannerImage: {
    width: 360,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    marginBottom: 15,
    borderRadius: 10,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: 100,
    justifyContent: "flex-end",
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 4,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: color.secondary,
    marginHorizontal: 4,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  rowCard: {
    flexDirection: "row",
    marginBottom: 20,
  },

  sideImage: {
    width: 120,
    height: 180,
    marginRight: 10,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },

  discountBadge: {
    backgroundColor: color.yellow,
    borderRadius: 50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    margin: 6,
  },

  discountText: {
    color: "#fff",
    fontWeight: "bold",
    ...globalStyles.f12Bold,
  },

  cardRight: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "space-around",
  },

  cardSubheading: {
    ...globalStyles.f14Bold,
    ...globalStyles.neutral500,
    marginBottom: 2,
  },

  serviceText: {
    ...globalStyles.f10Bold,
    color: "#333",
  },
  addCarButton: {
    backgroundColor: "#000000ff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  striked: {
    textDecorationLine: "line-through",
    color: "#888",
    ...globalStyles.f12Bold,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },

  addButton: {
    backgroundColor: color.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#fff",
    ...globalStyles.f10Bold,
  },
  addButtonTextCart: {
    color: color.black,
    ...globalStyles.f10Bold,
  },
  carGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    width: "100%",
    // paddingHorizontal: 8,
  },
  carItem: {
    width: "30%",
    alignItems: "center",
    // marginBottom: 16,
  },

  carImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginRight: 10,
    // borderRadius: 6,
    // backgroundColor: '#f0f0f0',
  },

  carModel: {
    ...globalStyles.f12Bold,
    color: "#333",
  },
  singleCarImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 10,
  },
  // primaryCarItem: {
  //   backgroundColor: '#e6f5e6', // light green highlight
  //   borderColor: '#28a745',
  //   borderWidth: 1.5,
  //   borderRadius: 8,
  //   padding: 8,
  // },

  // selectedCarItem: {
  //   borderWidth: 2,
  //   borderColor: '#007BFF',
  //   borderRadius: 8,
  // },

  primaryLabel: {
    marginTop: 4,
    ...globalStyles.f12Bold,
    color: color.yellow,
    fontWeight: "bold",
  },
});

export default InteriorService;
