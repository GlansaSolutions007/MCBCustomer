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
  SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL, API_IMAGE_URL, GOOGLE_MAPS_APIKEY, RAZORPAY_KEY } from "../../../apiConfig";
import { getToken } from "../../utils/token";
import useGlobalRefresh from "../../hooks/useGlobalRefresh";
import SearchBox from "../../components/SearchBox";

const SkeletonLoader = () => (
  <View style={styles.skeletonCard}>
    <View style={[styles.cardImage, { backgroundColor: '#f8f8f8ff', borderRadius: 12 }]} />
    <View style={styles.skeletonTextContainer}>
      <View style={[styles.skeletonText, { width: '60%', height: 28, marginBottom: 8 }]} />
      <View style={[styles.skeletonText, { width: '40%', height: 20 }]} />
    </View>
  </View>
);

export default function BookServiceScreen() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const token = getToken();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}Category`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data) {
        const activeCategories = response.data.filter((cat) => cat.IsActive);
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const { refreshing, onRefresh } = useGlobalRefresh(fetchCategories);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Filter categories based on search query
    const filtered = categories.filter((cat) =>
      cat.CategoryName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [searchQuery, categories]);

  const handleCategoryPress = async (category) => {
    try {
      const response = await axios.get(
        `${API_URL}SubCategory1/subcategorybycategoryid?categoryid=${category.CategoryID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const activeSubCategories = (response.data || []).filter((sub) => sub.IsActive);

      navigation.navigate('InteriorService', {
        categoryId: category.CategoryID,
        categoryName: category.CategoryName,
        subCategories: activeSubCategories,
        subcategoryId: activeSubCategories[0]?.SubCategoryID,
      });
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        <SearchBox
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => { }} // Optional: Add logic if needed
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.services}>
              <SkeletonLoader />
              <SkeletonLoader />
            </View>
          ) : filteredCategories.length === 0 ? (
            <CustomText style={styles.noResultsText}>No categories found</CustomText>
          ) : (
            <View style={styles.services}>
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.CategoryID}
                  style={styles.card}
                  onPress={() => handleCategoryPress(cat)}
                >
                  <Image
                    source={{ uri: `${API_IMAGE_URL}/${cat.ThumbnailImage}` }}
                    style={styles.cardImage}
                  />
                  <LinearGradient
                    colors={['#136D6E', 'transparent']}
                    start={{ x: 0.5, y: 1 }}
                    end={{ x: 0.5, y: 0 }}
                    style={styles.gradientOverlay}
                  >
                    <CustomText style={[globalStyles.f28Bold, globalStyles.textWhite]}>
                      {cat.CategoryName.split(' ')[0]}
                    </CustomText>
                    <CustomText style={[globalStyles.f20Regular, globalStyles.textWhite]}>
                      {cat.CategoryName.split(' ')[1] || 'Service'}
                    </CustomText>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom:10,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
    marginTop:10
  },
  services: {
    flexDirection: 'column',
    gap: 20,
  },
  card: {
    width: '100%',
    height: 200,
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
    height: '70%',
    justifyContent: 'flex-end',
    padding: 10,
  },
  skeletonCard: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#efeeeeff',
  },
  skeletonTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  skeletonText: {
    backgroundColor: '#f0f0f0ff',
    borderRadius: 4,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
});