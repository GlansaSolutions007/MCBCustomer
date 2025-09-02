import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <CustomText style={[globalStyles.f14Bold, styles.heading]}>
          Privacy Policy
        </CustomText>

        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          At My Car Buddy, we respect your privacy and are committed to
          protecting your personal data.
        </CustomText>

        <CustomText style={styles.subHeading}>Information We Collect</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • Name, phone number, email, and vehicle details.{"\n"}
          • Location and booking history for providing accurate services.
        </CustomText>

        <CustomText style={styles.subHeading}>How We Use Your Data</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • To confirm bookings and deliver services.{"\n"}
          • To send updates, reminders, and offers.{"\n"}
          • To improve your app experience.
        </CustomText>

        <CustomText style={styles.subHeading}>Data Security</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • Your data is securely stored and never sold.{"\n"}
          • Shared only with trusted partners when required (e.g., payments,
          maps, notifications).
        </CustomText>

        <CustomText style={styles.subHeading}>Your Choices</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • Request deletion of your data anytime by contacting support.{"\n"}
          • Opt out of promotional messages whenever you like.
        </CustomText>

        <CustomText style={styles.subHeading}>Contact Us</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          📧 info@mycarbuddy.in
        </CustomText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { padding: 20 },
  heading: { ...globalStyles.f16Bold, marginBottom: 15, color: "#000" },
  subHeading: {
    ...globalStyles.f12Bold,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#222",
  },
  paragraph: { marginBottom: 15, lineHeight: 22, color: "#333" },
});
