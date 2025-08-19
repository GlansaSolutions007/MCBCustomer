import React from "react";
import { ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";

export default function RefundPolicyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          At MyCarBuddy, customer satisfaction is our priority. This refund
          policy explains the conditions under which a refund may be issued.
        </CustomText>

        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          1. Refunds are applicable only if the service has not been availed or
          cancelled within the allowed time frame.
        </CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          2. Refund requests must be raised within 48 hours of booking.
        </CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          3. Refunds will be processed to the original payment method within
          7–10 business days.
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
