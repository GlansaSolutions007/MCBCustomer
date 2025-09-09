import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../../components/CustomText";
import { globalStyles } from "../../styles/globalStyles";
import { color } from "../../styles/theme";

export default function NoInternetScreen({ onRetry }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Check initial connection state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    // Listen for connection changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected);
      if (state.isConnected) {
        onRetry && onRetry();
      } else {
        Alert.alert("No Internet", "Please check your internet connection and try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to check internet connection.");
    } finally {
      setIsRetrying(false);
    }
  };

  if (isConnected) return null; // Don't render if internet is available

  return (
    <View style={styles.container}>
      {/* Icon Container */}
      <View style={styles.iconContainer}>
        <Ionicons 
          name="wifi-outline" 
          size={80} 
          color={color.primary} 
          style={styles.icon}
        />
        <View style={styles.iconBackground} />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <CustomText style={[globalStyles.f24Bold, globalStyles.textBlack, globalStyles.mb2]}>
          No Internet Connection
        </CustomText>
        
        <CustomText style={[globalStyles.f16Regular, globalStyles.textac, globalStyles.mb4]}>
          Please check your network settings and try again.
        </CustomText>

        <CustomText style={[globalStyles.f14Regular, globalStyles.textac, globalStyles.mb5]}>
          Make sure you're connected to Wi-Fi or mobile data
        </CustomText>
      </View>

      {/* Retry Button */}
      <TouchableOpacity 
        style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
        onPress={handleRetry}
        disabled={isRetrying}
      >
        <Ionicons 
          name="refresh" 
          size={20} 
          color={color.white} 
          style={globalStyles.mr2}
        />
        <CustomText style={[globalStyles.f16Bold, globalStyles.textWhite]}>
          {isRetrying ? "Checking..." : "Try Again"}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    zIndex: 2,
  },
  iconBackground: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(1, 127, 119, 0.1)",
    zIndex: 1,
  },
  contentContainer: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: color.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
    shadowColor: color.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  retryButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
});
