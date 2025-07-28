import React, { useState } from 'react';
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
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { color } from '../../styles/theme';
import globalStyles from '../../styles/globalStyles';
import SearchBox from '../../components/SearchBox';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import interior from '../../../assets/images/interiorservice.png'
import { StatusBar } from 'react-native';
import Garage from '../../../assets/icons/garageIcon.png'
import CustomText from '../../components/CustomText';
import { useCart } from '../../contexts/CartContext';

const popularServices = [
  { id: '1', title: 'Dashboard & CoVishalllll', image: require('../../../assets/images/exteriorservice.png') },
  { id: '2', title: 'Roof / HeadlinerVishalllll', image: require('../../../assets/images/exteriorservice.png') },
  { id: '3', title: 'Door Pad & PanelVishalllll', image: require('../../../assets/images/exteriorservice.png') },
  { id: '4', title: 'Seat VacuumingVishalllll', image: require('../../../assets/images/exteriorservice.png') },
  { id: '5', title: 'Dashboard & CoVishalllll', image: require('../../../assets/images/exteriorservice.png') },
  { id: '6', title: 'Roof / HeadlinerVishalllll', image: require('../../../assets/images/exteriorservice.png') },
  { id: '7', title: 'Door Pad & PanelVishalllll', image: require('../../../assets/images/exteriorservice.png') },
  { id: '8', title: 'Seat VacuumingVishalllll', image: require('../../../assets/images/exteriorservice.png') },
];

const allServices = [
  { title: 'Steering & Gear Knob Sanitization', image: require('../../../assets/images/exteriorservice.png') },
  { title: 'AC Vent Sanitization', image: require('../../../assets/images/exteriorservice.png') },
  { title: 'Leather/ Fabric Seat Polishing', image: require('../../../assets/images/exteriorservice.png') },
  { title: 'Mat Washing & Floor Vacuuming', image: require('../../../assets/images/exteriorservice.png') },
  { title: 'Window Glass Cleaning', image: require('../../../assets/images/exteriorservice.png') },
  { title: 'Interior Perfume Spray', image: require('../../../assets/images/exteriorservice.png') },
];

const packages = [
  {
    id: 'essential',
    title: 'Essential Interior Care',
    price: 600,
    originalPrice: 800,
    services: [
      'Dashboard & Console Wipe',
      'Seat Surface Vacuuming',
      'Door Panel Dusting',
    ],
  },
  {
    id: 'deluxe',
    title: 'Deluxe Interior Detail',
    price: 600,
    originalPrice: 800,
    services: [
      'Dashboard & Console Wipe',
      'Seat Surface Vacuuming',
      'Door Panel Dusting',
    ],
  },
];

const InteriorService = () => {
  const navigation = useNavigation();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState(popularServices[0]?.id);
  const [selectedServiceId, setSelectedServiceId] = useState(popularServices[0]?.id);
  const { cartItems, addToCart } = useCart();


  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        source={interior}
        style={styles.imageBackground}
      >
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <LinearGradient
          colors={['rgba(19, 109, 110, .6)', 'rgba(19, 109, 110, .10)', 'rgba(19, 109, 110, .6)']}
          locations={[0.13, 0.52, 0.91]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.overlay}
        >
          {/* Top Row */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <View style={styles.iconWrapper}>
              <TouchableOpacity onPress={() => navigation.navigate('Cart')} >
                <Image source={Garage} style={styles.garageIcon} />
                {cartItems.length > 0 && (
                  <View style={styles.badge}>
                    <CustomText style={styles.badgeText}>{cartItems.length}</CustomText>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <SearchBox />
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CustomText style={[globalStyles.f16Bold, globalStyles.primary]}>Popular Services</CustomText>
          <Ionicons name="arrow-forward-circle" size={20} color={color.primary} style={styles.scrollHintIcon} />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={popularServices}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.flatListContainer}
          renderItem={({ item }) => {
            const isSelected = selectedServiceId === item.id;
            return (
              <TouchableOpacity
                style={styles.popularItem}
                onPress={() => setSelectedServiceId(item.id)}
              >
                <View style={[styles.imageWrapper, isSelected && styles.selectedImageWrapper]}>
                  <Image
                    source={item.image}
                    style={styles.popularImage}
                  />
                </View>
                <CustomText
                  style={[
                    globalStyles.f10Bold,
                    styles.popularText,
                    isSelected && styles.selectedText,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.title}
                </CustomText>
              </TouchableOpacity>
            );
          }}
        />
        <View style={styles.tabContent}>
          {popularServices.map((item) =>
            item.id === selectedServiceId ? (
              <View key={item.id}>
                <View style={styles.section}>
                  <CustomText style={[globalStyles.f20Bold, globalStyles.primary, { marginBottom: 8 }]}>
                    {item.title}
                  </CustomText>
                  {packages.map((item) => (
                    <View key={item.id} style={styles.rowCard}>
                      <ImageBackground
                        source={require('../../../assets/images/exteriorservice.png')}
                        style={styles.sideImage}
                        imageStyle={{ borderRadius: 10 }}
                      >
                        <View style={styles.discountBadge}>
                          <CustomText style={styles.discountText}>
                            {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                          </CustomText>
                        </View>
                      </ImageBackground>

                      <View style={styles.cardRight}>
                        <CustomText style={[globalStyles.f16Bold, { color: color.primary, marginBottom: 6 }]}>
                          {item.title}
                        </CustomText>

                        <View>
                          <CustomText style={styles.cardSubheading}>Services Included:</CustomText>
                          {item.services.map((service, index) => (
                            <CustomText key={index} style={styles.serviceText}>
                              • {service}
                            </CustomText>
                          ))}
                        </View>

                        <View style={styles.priceRow}>
                          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                            <CustomText style={styles.striked}>₹{item.originalPrice}</CustomText>
                            <CustomText style={[globalStyles.f14Bold, { marginLeft: 6 }]}>₹{item.price}</CustomText>
                          </View>

                          {cartItems.find(ci => ci.id === item.id) ? (
                            <TouchableOpacity
                              style={[styles.addButton, { backgroundColor: '#444' }]}
                              onPress={() => navigation.navigate('Cart')}
                            >
                              <CustomText style={styles.addButtonText}>View Cart</CustomText>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.addButton}
                              onPress={() => addToCart(item)}
                            >
                              <CustomText style={styles.addButtonText}>Add Service</CustomText>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}

                </View>
              </View>
            ) : null
          )}
        </View>
      </View>

      <View style={styles.bannerContainer}>
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={[interior, interior, interior]}
          keyExtractor={(_, index) => index.toString()}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
            setActiveBannerIndex(index);
          }}
          renderItem={({ item }) => (
            <Image source={item} style={styles.bannerImage} resizeMode="cover" />
          )}
        />
        <View style={styles.dotContainer}>
          {[0, 1, 2].map((_, i) => (
            <View key={i} style={i === activeBannerIndex ? styles.activeDot : styles.inactiveDot} />
          ))}
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  imageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },

  selectedImageWrapper: {
    borderColor: color.primary,
  },

  popularImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'cover',
  },

  selectedText: {
    color: color.primary,
  },

  // tabContent: {
  //   padding: 10,
  //   backgroundColor: '#fff',
  //   borderRadius: 10,
  //   elevation: 1,
  //   marginTop: 10
  // },

  imageBackground: {
    height: 260,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 20,
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
  badgeTextWrapper: {
    alignItems: 'center',
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scrollHintIcon: {
    marginLeft: 10,
  },
  section: {
    padding: 10,
    borderTopEndRadius: 30
  },
  flatListContainer: {
    paddingHorizontal: 10,
  },
  popularItem: {
    width: 80,
    alignItems: 'center',
    marginRight: 26,
  },
  popularText: {
    marginTop: 5,
    width: 70,
    textAlign: 'center',
  },
  bannerContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bannerImage: {
    width: 360,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  rowCard: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  sideImage: {
    width: 160,
    height: 210,
    marginRight: 10,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },

  discountBadge: {
    backgroundColor: '#FFC107',
    borderRadius: 50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    margin: 6,
  },

  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  cardRight: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'space-around'
  },

  cardSubheading: {
    ...globalStyles.f14Bold,
    ...globalStyles.neutral500,
    marginBottom: 2,
  },

  serviceText: {
    ...globalStyles.f10Bold,
    color: '#333',
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  striked: {
    textDecorationLine: 'line-through',
    color: '#888',
    fontSize: 14,
  },

  addButton: {
    backgroundColor: color.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#fff',
    ...globalStyles.f10Bold
  },
});

export default InteriorService;
