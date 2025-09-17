import React from "react";
import { Platform, ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";

export default function TermsAndConditionsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
       <StatusBar
          backgroundColor={Platform.OS === "android" ? "#fff" : undefined}
          barStyle="dark-content"
        />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <CustomText style={[globalStyles.f14Bold, styles.heading]}>
          Terms & Conditions
        </CustomText>

        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          By using the My Car Buddy app, you agree to the following:
        </CustomText>

        <CustomText style={styles.subHeading}>1. Services</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          We provide car wash, cleaning, detailing, and other vehicle services
          through verified partners.
        </CustomText>

        <CustomText style={styles.subHeading}>2. Use of App</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • You must be 18 years or older.{"\n"}
          • Provide accurate details when creating or updating your account.{"\n"}
          • Misuse or fraud may lead to suspension.
        </CustomText>

        <CustomText style={styles.subHeading}>3. Bookings & Payments</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • All bookings must be made through the app.{"\n"}
          • Payments can be made via cards, UPI, wallets, or other methods.{"\n"}
          • Prepaid bookings not availed and not canceled on time will be marked
          as completed.
        </CustomText>

        <CustomText style={styles.subHeading}>4. Cancellations & Refunds</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • You can cancel before the service starts.{"\n"}
          • Refunds are processed as per our Cancellation & Refund Policy.
        </CustomText>

        <CustomText style={styles.subHeading}>5. Service Quality</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • We work with trusted partners but are not liable for delays beyond
          our control.{"\n"}
          • Customers must ensure vehicles are accessible and remove valuables
          before service.
        </CustomText>

        <CustomText style={styles.subHeading}>6. Ownership & Rights</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          The My Car Buddy brand, app design, and content belong to Glansa
          Solutions Pvt. Ltd. Unauthorized copying or misuse is prohibited.
        </CustomText>

        <CustomText style={styles.subHeading}>7. Governing Law</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          These terms are governed by Indian law. Disputes fall under Hyderabad
          jurisdiction.
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
    marginTop: 10,
    marginBottom: 5,
    color: "#222",
  },
  paragraph: { marginBottom: 15, lineHeight: 22, color: "#333" },
});
