import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL, API_IMAGE_URL } from "@env";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import CustomText from "../../components/CustomText";
import { getToken } from "../../utils/token";
const { height } = Dimensions.get("window");
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function GlobalSearch() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const inputRef = useRef(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null); // 'UNDER_500' | 'BETWEEN_500_1500' | 'ABOVE_1500' | null
  const filterOpacity = useRef(new Animated.Value(0)).current;
  const [displayedResults, setDisplayedResults] = useState([]);
  const [hasCars, setHasCars] = useState(false);

  useEffect(() => {
    const initializeSearch = async () => {
      setTimeout(() => inputRef.current?.focus?.(), 50);
      const userDataRaw = await AsyncStorage.getItem("userData");
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const custID = userData?.custID;
      console.log("customer ID in global search", custID);

      // Check if user has cars
      await checkUserCars(custID);
    };

    initializeSearch();
  }, []);

  const checkUserCars = async (custID) => {
    try {
      if (!custID) {
        setHasCars(false);
        return;
      }

      const response = await axios.get(
        `${API_URL}CustomerVehicles/CustId?CustId=${custID}`,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      const carList = response.data;
      const normalizedList = carList
        ? Array.isArray(carList)
          ? carList
          : [carList]
        : [];

      setHasCars(normalizedList.length > 0);
    } catch (error) {
      console.error("Error checking user cars:", error);
      setHasCars(false);
    }
  };

  const buildImageUrl = (path) => {
    if (!path) return null;
    if (String(path).startsWith("http")) return path;
    const normalized = String(path).startsWith("/") ? path.slice(1) : path;
    return `${API_IMAGE_URL}/${normalized}`;
  };

  useEffect(() => {
    const term = (searchQuery || "").trim();
    if (term.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    setSearchLoading(true);
    setSearchError("");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = `${API_URL}PlanPackage/GetPlanPackagesByCategoryAndSubCategory?searchTerm=${encodeURIComponent(
          term
        )}`;
        const resp = await axios.get(url, { signal: controller.signal });
        const data = Array.isArray(resp.data) ? resp.data : [];
        setSearchResults(data);
      } catch (err) {
        if (err?.name !== "CanceledError")
          setSearchError("Failed to fetch results");
      } finally {
        setSearchLoading(false);
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const getPrice = (item) => {
    const off = Number(item?.Serv_Off_Price ?? 0);
    const reg = Number(item?.Serv_Reg_Price ?? 0);
    return off || reg || 0;
  };

  const applyFilter = (list) => {
    if (!selectedFilter) return list;
    if (!Array.isArray(list)) return [];
    switch (selectedFilter) {
      case "UNDER_500":
        return list.filter((i) => getPrice(i) < 500);
      case "BETWEEN_500_1500":
        return list.filter((i) => getPrice(i) >= 500 && getPrice(i) <= 1500);
      case "ABOVE_1500":
        return list.filter((i) => getPrice(i) > 1500);
      default:
        return list;
    }
  };

  useEffect(() => {
    const filtered = applyFilter(searchResults || []);
    setDisplayedResults(Array.isArray(filtered) ? filtered : []);
  }, [searchResults, selectedFilter]);

  const toggleFilter = () => {
    const toShow = !showFilter;
    setShowFilter(toShow);
    Animated.timing(filterOpacity, {
      toValue: toShow ? 1 : 0,
      duration: toShow ? 180 : 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      if (!toShow) setShowFilter(false);
    });
  };

  const onSelectFilter = (val) => {
    setSelectedFilter(val);
    toggleFilter();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View className="flex-1" style={{ paddingVertical: 0 }}>
        <StatusBar
          backgroundColor={
            Platform.OS === "android" ? color.primary : undefined
          }
          barStyle="dark-content"
        />
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.homeBtn}
          >
            <Ionicons name="home" size={22} color={color.primary} />
          </TouchableOpacity>
          <View style={[styles.headerSearchWrap, globalStyles.bgwhite]}>
            <Ionicons
              name="search"
              size={16}
              color={color.primary}
              style={{ marginRight: 6 }}
            />
            <TextInput
              ref={inputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search services…"
              placeholderTextColor="#999"
              style={[styles.searchInput, globalStyles.f16Regular]}
              returnKeyType="search"
            />
          </View>
          {hasCars && (
            <TouchableOpacity onPress={toggleFilter} style={styles.filterBtn}>
              <Ionicons name="filter" size={20} color={color.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Active filter chip */}
      {hasCars && selectedFilter && (
        <View style={styles.filterChipRow}>
          <View style={styles.filterChip}>
            <CustomText style={[styles.filterChipText, globalStyles.f14Bold]}>
              {selectedFilter === "UNDER_500" && "Under ₹500"}
              {selectedFilter === "BETWEEN_500_1500" && "₹500 – ₹1500"}
              {selectedFilter === "ABOVE_1500" && "Above ₹1500"}
            </CustomText>
            <TouchableOpacity
              onPress={() => setSelectedFilter(null)}
              style={{ marginLeft: 6 }}
            >
              <Ionicons name="close" size={16} color={color.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter popup */}
      {hasCars && showFilter && (
        <Animated.View style={[styles.filterPopup, { opacity: filterOpacity }]}>
          <CustomText style={[styles.filterTitle, globalStyles.f14Bold]}>
            Filter by price
          </CustomText>
          <TouchableOpacity
            style={styles.filterOption}
            onPress={() => onSelectFilter("UNDER_500")}
          >
            <CustomText
              style={[styles.filterOptionText, globalStyles.f16Regular]}
            >
              Under ₹500
            </CustomText>
            {selectedFilter === "UNDER_500" && (
              <Ionicons name="checkmark" size={18} color={color.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterOption}
            onPress={() => onSelectFilter("BETWEEN_500_1500")}
          >
            <CustomText
              style={[styles.filterOptionText, globalStyles.f16Regular]}
            >
              ₹500 – ₹1500
            </CustomText>
            {selectedFilter === "BETWEEN_500_1500" && (
              <Ionicons name="checkmark" size={18} color={color.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterOption}
            onPress={() => onSelectFilter("ABOVE_1500")}
          >
            <CustomText
              style={[styles.filterOptionText, globalStyles.f16Regular]}
            >
              Above ₹1500
            </CustomText>
            {selectedFilter === "ABOVE_1500" && (
              <Ionicons name="checkmark" size={18} color={color.primary} />
            )}
          </TouchableOpacity>
          <View style={styles.filterFooterRow}>
            <TouchableOpacity onPress={() => setSelectedFilter(null)}>
              <CustomText style={[styles.clearText, globalStyles.f14Bold]}>
                Clear
              </CustomText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <View style={styles.resultsHeader}>
        <CustomText style={[styles.resultsTitle, globalStyles.f18Bold]}>
          Search results
        </CustomText>
        {!hasCars && (
          <TouchableOpacity
            style={styles.addCarButton}
            onPress={() =>
              navigation.navigate("My Cars", { screen: "SelectCarBrand" })
            }
          >
            <CustomText style={styles.addCarButtonText}>
              Add Your Car to See Prices
            </CustomText>
          </TouchableOpacity>
        )}
      </View>

      {searchLoading ? (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator size="small" color={color.primary} />
          <CustomText
            style={[globalStyles.f16Regular, { marginTop: 10, color: "#666" }]}
          >
            Searching…
          </CustomText>
        </View>
      ) : searchError ? (
        <CustomText
          style={[
            globalStyles.f16Regular,
            { color: "#D00", marginVertical: 10, paddingHorizontal: 16 },
          ]}
        >
          {searchError}
        </CustomText>
      ) : (searchResults || []).length === 0 ? (
        <CustomText
          style={[
            globalStyles.f16Regular,
            { color: "#666", marginVertical: 10, paddingHorizontal: 16 },
          ]}
        >
          {searchQuery.trim().length === 0
            ? "Type at least 2 characters to search."
            : "No services found. Try a different term."}
        </CustomText>
      ) : (
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {Array.isArray(displayedResults) &&
            displayedResults.map((item) => {
              const img = buildImageUrl(item.PackageImage || item.BannerImage);
              return (
                <TouchableOpacity
                  key={String(item.PackageID)}
                  activeOpacity={0.7}
                  style={styles.resultRow}
                  onPress={() => {
                    // Format package data exactly like InteriorService.js does
                    const formattedPackage = {
                      id: item.PackageID,
                      title: item.PackageName,
                      image: item.PackageImage,
                      bannerImages: item.BannerImage?.split(","),
                      price: item.Serv_Off_Price,
                      originalPrice: item.Serv_Reg_Price,
                      services: item.IncludeNames?.split(",") || [],
                      estimatedMins: item.EstimatedDurationMinutes,
                      desc: item.Description,
                    };

                    navigation.navigate("ServiceInnerPage", {
                      package: formattedPackage,
                    });
                  }}
                >
                  {img ? (
                    <Image
                      source={{ uri: img }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[styles.thumb, { backgroundColor: "#f2f2f2" }]}
                    />
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <CustomText
                      style={[styles.pkgTitle, globalStyles.f16Bold]}
                      numberOfLines={1}
                    >
                      {item.PackageName}
                    </CustomText>
                    <CustomText
                      style={[styles.pkgMeta, globalStyles.f14Regular]}
                      numberOfLines={1}
                    >
                      {item.CategoryName} • {item.SubCategoryName}
                    </CustomText>
                    {hasCars && (
                      <CustomText
                        style={[styles.pkgPrice, globalStyles.f16Bold]}
                      >
                        ₹ {item.Serv_Off_Price ?? item.Serv_Reg_Price}
                      </CustomText>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: color.white,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    height: 55,
    margin: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: color.white,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  homeBtn: {
    padding: 8,
    marginRight: 4,
  },
  headerSearchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    height: 50,
    marginHorizontal: 6,
  },
  filterBtn: {
    padding: 8,
    marginLeft: 4,
  },
  filterChipRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  filterChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(1,127,119,0.08)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipText: {
    color: color.primary,
  },
  filterPopup: {
    position: "absolute",
    top: height * 0.12,
    right: 12,
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#eee",
    zIndex: 1000,
  },
  filterTitle: {
    color: "#666",
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f3f3",
  },
  filterOptionText: {
    color: "#111",
  },
  filterFooterRow: {
    alignItems: "flex-end",
    paddingTop: 8,
  },
  clearText: {
    color: color.primary,
  },
  addCarButton: {
    backgroundColor: color.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  addCarButtonText: {
    color: color.white,
    fontSize: 12,
    fontWeight: "600",
  },
  backBtn: {
    marginRight: 6,
    padding: 4,
  },
  searchInput: {
    flex: 1,
    color: "#333",
    fontSize: 16,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsTitle: {
    color: "#111",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  pkgTitle: {
    color: "#111",
    marginBottom: 4,
  },
  pkgMeta: {
    color: "#666",
    marginBottom: 4,
  },
  pkgPrice: {
    color: color.primary,
  },
});
