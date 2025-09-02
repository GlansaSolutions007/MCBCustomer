import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

const PreLoader = ({ onAnimationFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onAnimationFinish) onAnimationFinish();
    }, 3000); // Adjust based on your animation length
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../assets/animations/meter.json")}
        // source={require("../../assets/animations/carr.json")}
        autoPlay
        loop={false}
        onAnimationFinish={onAnimationFinish}
        style={{ width: 150, height: 150 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // match app theme
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PreLoader;
