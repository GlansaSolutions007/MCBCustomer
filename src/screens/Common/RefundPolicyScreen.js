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
        <CustomText style={[globalStyles.f14Bold, styles.heading]}>
          Cancellation & Refund Policy
        </CustomText>

        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          At My Car Buddy (GLANSA SOLUTIONS PRIVATE LIMITED), we value our
          customers and follow a fair cancellation and refund policy to ensure
          transparency and satisfaction.
        </CustomText>

        <CustomText style={styles.subHeading}>Cancellation Policy</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • Cancellations will be considered only if the request is made within
          7 days of placing the order/booking. However, the cancellation request
          may not be entertained if the service or order process has already
          been initiated.{"\n\n"}• Cancellation requests are not accepted for
          perishable or consumable items (e.g., flowers, eatables). However,
          refund/replacement can be made if the customer establishes that the
          quality of the product or service delivered is not satisfactory.
        </CustomText>

        <CustomText style={styles.subHeading}>
          Damaged/Defective Services
        </CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • In case of damaged, defective, or unsatisfactory services/products,
          customers must report the same to our Customer Support Team within 7
          days of receiving the service/product. The request will be verified by
          our merchant/partner before processing.{"\n\n"}• If you feel the
          service/product delivered is not as shown or as per expectations,
          please contact our support team within 7 days. After review, our team
          will take an appropriate decision.{"\n\n"}• For products/services
          covered under manufacturer warranty, complaints should be directed to
          the respective manufacturer.
        </CustomText>

        <CustomText style={styles.subHeading}>Refund Policy</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          • In case of approved refunds by My Car Buddy, the amount will be
          processed within 3–5 business days to the original payment method.
        </CustomText>

        <CustomText style={styles.subHeading}>Contact Us</CustomText>
        <CustomText style={[globalStyles.f12Medium, styles.paragraph]}>
          For any refund or cancellation related queries, please contact our My
          Car Buddy Support team with your details at{" "}
          <CustomText style={{ fontWeight: "600" }}>info@glansa.com</CustomText>
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
