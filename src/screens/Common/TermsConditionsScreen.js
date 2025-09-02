import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";

export default function TermsAndConditionsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <CustomText style={[globalStyles.f14Bold, styles.heading]}>
          Terms & Conditions
        </CustomText>

        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          These Terms and Conditions (“Terms”) govern your use of the MyCarBuddy
          mobile application, website, and services (collectively, the
          “Platform”).
        </CustomText>

        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          For the purpose of these Terms: The terms "we", "us", "our" shall mean
          Glansa Solutions Private Limited, a company incorporated under the
          Companies Act, 2013, with its registered/operational office at Flat
          No. 102, Mahalaxmi Paradise, Aswini Colony, West Maredpally,
          Secunderabad, Hyderabad, Telangana – 500026, India. The terms "you",
          "your", "user", or "customer" shall mean any person accessing or using
          the Platform. MyCarBuddy is a registered product and service brand
          owned by Glansa Solutions Pvt. Ltd.
        </CustomText>

        <CustomText style={styles.subHeading}>1. Scope of Services</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          MyCarBuddy provides on-demand and scheduled vehicle care and car
          service solutions, including car wash, cleaning, detailing,
          diagnostics, repairs, and other technician services through verified
          partners and dealers.
        </CustomText>

        <CustomText style={styles.subHeading}>2. Use of Platform</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • You must be at least 18 years old to use the Platform.{"\n"}
          • You agree to provide accurate, current, and complete information.{"\n"}
          • You are responsible for maintaining the confidentiality of your
          account.{"\n"}• Fraudulent or unauthorized use may result in
          suspension/termination.
        </CustomText>

        <CustomText style={styles.subHeading}>3. Booking & Payment</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • All bookings must be made through the app or website.{"\n"}• Payments
          can be made via cash, debit/credit card, UPI, wallets, or other
          supported gateways.{"\n"}• Prepaid bookings not availed on time will be
          considered completed unless canceled as per our policy.
        </CustomText>

        <CustomText style={styles.subHeading}>4. Pricing & Billing</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          Prices are subject to change without prior notice. Final billing is
          based on actual services availed, applicable taxes (GST), and
          discounts. An e-invoice will be generated and shared electronically.
        </CustomText>

        <CustomText style={styles.subHeading}>5. Cancellation & Refunds</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          Customers may cancel or reschedule before service begins. Refunds, if
          applicable, will be processed to the original payment method in line
          with the MyCarBuddy Cancellation & Refund Policy.
        </CustomText>

        <CustomText style={styles.subHeading}>6. Service Quality & Liability</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          While we ensure reliable services via verified partners, MyCarBuddy /
          Glansa Solutions Pvt. Ltd. shall not be liable for incidental or
          consequential damages, inaccurate service details provided by
          customers, or delays beyond our reasonable control.
        </CustomText>

        <CustomText style={styles.subHeading}>7. Intellectual Property</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          All logos, trademarks, designs, and content are the property of Glansa
          Solutions Pvt. Ltd. Unauthorized reproduction or modification is
          strictly prohibited.
        </CustomText>

        <CustomText style={styles.subHeading}>8. Customer Responsibilities</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • Ensure vehicle location is accessible and safe.{"\n"}• Remove
          valuables before handing over for service.{"\n"}• Provide accurate
          service/vehicle details and be available on time.
        </CustomText>

        <CustomText style={styles.subHeading}>9. Privacy & Data Protection</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          We collect and process personal data in accordance with our Privacy
          Policy. Data is only shared with third parties as necessary for
          service fulfillment, payment, or legal compliance.
        </CustomText>

        <CustomText style={styles.subHeading}>10. Governing Law</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          These Terms are governed by the laws of India. All disputes shall be
          subject to the exclusive jurisdiction of the courts in Hyderabad,
          Telangana, India.
        </CustomText>

        <CustomText style={styles.subHeading}>11. Amendments</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          We may update these Terms from time to time. Continued use of the
          Platform implies acceptance of the revised Terms.
        </CustomText>

        <CustomText style={styles.subHeading}>12. Contact Information</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          Glansa Solutions Private Limited{"\n"}
          Flat No. 102, Mahalaxmi Paradise, Aswini Colony, West Maredpally,
          Secunderabad, Hyderabad, Telangana – 500026, India.{"\n"}
          📧 Email: info@glansa.com{"\n"}
          📞 Phone: +91 9885653865{"\n"}
          📞 Phone: +91 70752 43939
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
