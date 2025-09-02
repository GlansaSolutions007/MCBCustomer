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
          At My Car Buddy, operated by Glansa Solutions Private Limited, we
          value your privacy and are committed to protecting your personal
          information. This policy explains how we collect, use, and safeguard
          your data when you use our app, website, and services.
        </CustomText>

        <CustomText style={styles.subHeading}>Information We Collect</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          We collect only the necessary details such as your name, contact
          information, vehicle details, location, and booking history to provide
          smooth service.
        </CustomText>

        <CustomText style={styles.subHeading}>Use of Information</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          Your information is used solely for booking confirmations, service
          delivery, customer support, and enhancing your experience with My Car
          Buddy.
        </CustomText>

        <CustomText style={styles.subHeading}>Data Security</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          All personal data is securely stored. Glansa Solutions does not sell,
          trade, or rent your personal information to third parties.
        </CustomText>

        <CustomText style={styles.subHeading}>Communication</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          We may contact you regarding booking updates, service reminders,
          special offers, or important notifications related to your account.
        </CustomText>

        <CustomText style={styles.subHeading}>Third-Party Services</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          In certain cases (such as payments, maps, or notifications), we may
          integrate trusted third-party services, but your data is shared only
          as required to complete the service.
        </CustomText>

        {/* <CustomText style={styles.subHeading}>Cookies</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          Our website may use cookies to improve user experience, track
          preferences, and provide personalized content.
        </CustomText> */}

        <CustomText style={styles.subHeading}>Your Choices</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          You may opt out of promotional communications anytime by following
          unsubscribe instructions or contacting our support team.
        </CustomText>

        <CustomText style={styles.subHeading}>Policy Updates</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          This Privacy Policy may be updated periodically, and the latest
          version will always be available on our app/website.
        </CustomText>

        <CustomText style={styles.subHeading}>Contact Us</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          For any questions regarding this Privacy Policy, please contact Glansa
          Solutions Private Limited at{" "}
          <CustomText style={{ fontWeight: "600" }}>
            info@mycarbuddy.in
          </CustomText>
          .
        </CustomText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { padding: 20 },
  heading: {
    fontSize: 18,
    marginBottom: 15,
    color: "#000",
  },
  subHeading: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#222",
  },
  paragraph: {
    marginBottom: 15,
    lineHeight: 22,
    color: "#333",
  },
});
