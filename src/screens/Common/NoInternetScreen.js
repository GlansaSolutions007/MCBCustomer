import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Button } from "react-native"; // replace with your custom button if you have
import CustomText from "../../components/CustomText";

export default function NoInternetScreen({ onRetry }) {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected) return null; // Don’t render if internet is available

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/no-internet.png")} // put your own illustration here
        style={styles.image}
        resizeMode="contain"
      />
      <CustomText style={styles.title}>No Internet Connection</CustomText>
      <CustomText style={styles.subtitle}>
        Please check your network settings and try again.
      </CustomText>
      <Button title="Retry" onPress={onRetry} />
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
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
});
