import React from "react";
import { ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          This is the Privacy Policy for MyCarBuddy. We are committed to
          protecting your personal information and your right to privacy. This
          policy explains how we collect, use, and safeguard your data when you
          use our app.
        </CustomText>

        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          1. We collect personal details like name, phone number, and email for
          service purposes only.
        </CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          2. We do not share your data with third parties without consent.
        </CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          3. You can request deletion of your data by contacting support.
        </CustomText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  contentContainer: {
    padding: 20,
  },
  paragraph: {
    marginBottom: 15,
    lineHeight: 22,
    color: "#333",
  },
});
