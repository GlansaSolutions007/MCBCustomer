import React from "react";
import { Platform, ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
       <StatusBar
          backgroundColor={Platform.OS === "android" ? "#fff" : undefined}
          barStyle="dark-content"
        />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <CustomText style={[globalStyles.f14Bold, styles.title]}>
          Cancellation & Refund Policy
        </CustomText>

        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          At My Car Buddy, we value our customers and aim to provide a fair and
          transparent cancellation and refund process.
        </CustomText>

        <CustomText style={[globalStyles.f12SemiBold, styles.subtitle]}>
          Cancellations
        </CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • You can cancel a booking before the service has started.{"\n"}
          • Once the service has begun, cancellations will not be accepted.{"\n"}
          • Some services (like consumables or special packages) may not be
          eligible for cancellation.
        </CustomText>

        <CustomText style={[globalStyles.f12SemiBold, styles.subtitle]}>
          Refunds
        </CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • If a booking is prepaid and canceled before service starts, a full
          refund will be processed.{"\n"}
          • If you face issues with service quality, damaged/defective products,
          or if the service is not delivered as promised, please report it to
          our support team within 7 days.{"\n"}
          • Approved refunds will be credited back to your original payment
          method within 3–5 business days.
        </CustomText>

        <CustomText style={[globalStyles.f12SemiBold, styles.subtitle]}>
          Contact Us
        </CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          For any cancellation or refund-related queries, please contact our
          support team at: {"\n"}
          📧 info@mycarbuddy.in
        </CustomText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { padding: 20 },
  title: {
    ...globalStyles.f16Bold,
    marginBottom: 15,
    color: "#000",
  },
  subtitle: {
    ...globalStyles.f12Bold,
    marginTop: 10,
    marginBottom: 5,
    color: "#111",
  },
  paragraph: {
    marginBottom: 12,
    lineHeight: 22,
    color: "#333",
  },
});
