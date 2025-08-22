import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, Animated, KeyboardAvoidingView, Platform } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import CustomText from "../../components/CustomText";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";

export default function ReviewsPage({ route }) {
    const { booking } = route.params;
    const [serviceRating, setServiceRating] = useState(0);
    const [technicianRating, setTechnicianRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [serviceStarAnim] = useState([1, 2, 3, 4, 5].map(() => new Animated.Value(1)));
    const [techStarAnim] = useState([1, 2, 3, 4, 5].map(() => new Animated.Value(1)));

    const handleServiceRating = (rating) => {
        setServiceRating(rating);
        serviceStarAnim.forEach((anim, index) => {
            Animated.spring(anim, {
                toValue: index < rating ? 1.2 : 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start(() => {
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 5,
                    tension: 40,
                    useNativeDriver: true,
                }).start();
            });
        });
    };

    const handleTechnicianRating = (rating) => {
        setTechnicianRating(rating);
        techStarAnim.forEach((anim, index) => {
            Animated.spring(anim, {
                toValue: index < rating ? 1.2 : 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start(() => {
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 5,
                    tension: 40,
                    useNativeDriver: true,
                }).start();
            });
        });
    };

    const handleSubmitReview = () => {
        console.log("Review submitted:", {
            bookingID: booking.BookingID,
            serviceRating,
            technicianRating,
            reviewText,
        });
        // Add API call to submit the review here
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <CustomText style={styles.headerText}>Share Your Experience</CustomText>
                    <CustomText style={styles.subHeaderText}>
                        Help us improve by rating your service for Booking ID: {booking.BookingTrackID}
                    </CustomText>
                </View>

                <View style={styles.summaryCard}>
                    <CustomText style={styles.summaryTitle}>Service Summary</CustomText>
                    <View style={styles.summaryRow}>
                        <CustomText style={styles.summaryLabel}>Vehicle:</CustomText>
                        <CustomText style={styles.summaryValue}>
                            {booking.ModelName} ({booking.VehicleNumber})
                        </CustomText>
                    </View>
                    <View style={styles.summaryRow}>
                        <CustomText style={styles.summaryLabel}>Technician:</CustomText>
                        <CustomText style={styles.summaryValue}>{booking.TechFullName}</CustomText>
                    </View>
                    <View style={styles.summaryRow}>
                        <CustomText style={styles.summaryLabel}>Services:</CustomText>
                        <CustomText style={styles.summaryValue}>
                            {(booking.Packages || []).map((pkg) => pkg.PackageName).join(", ")}
                        </CustomText>
                    </View>
                    <View style={styles.summaryRow}>
                        <CustomText style={styles.summaryLabel}>Date:</CustomText>
                        <CustomText style={styles.summaryValue}>{booking.BookingDate}</CustomText>
                    </View>
                </View>

                <View style={styles.section}>
                    <CustomText style={styles.sectionTitle}>Rate Your Experience</CustomText>

                    <View style={styles.ratingSection}>
                        <CustomText style={styles.subSectionTitle}>Service Quality</CustomText>
                        <CustomText style={styles.sectionDescription}>
                            How satisfied were you with the overall service experience?
                        </CustomText>
                        <View style={styles.starContainer}>
                            {[1, 2, 3, 4, 5].map((star, index) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => handleServiceRating(star)}
                                >
                                    <Animated.View style={{ transform: [{ scale: serviceStarAnim[index] }] }}>
                                        <FontAwesome
                                            name={star <= serviceRating ? "star" : "star-o"}
                                            size={32}
                                            color={star <= serviceRating ? "#FFD700" : "#d1d5db"}
                                            style={styles.star}
                                        />
                                    </Animated.View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.divider} />

                    <View style={[styles.ratingSection]}>
                        <CustomText style={styles.subSectionTitle}>
                            Technician ({booking.TechFullName})
                        </CustomText>
                        <CustomText style={styles.sectionDescription}>
                            How would you rate the professionalism and expertise of {booking.TechFullName}?
                        </CustomText>
                        <View style={styles.starContainer}>
                            {[1, 2, 3, 4, 5].map((star, index) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => handleTechnicianRating(star)}
                                >
                                    <Animated.View style={{ transform: [{ scale: techStarAnim[index] }] }}>
                                        <FontAwesome
                                            name={star <= technicianRating ? "star" : "star-o"}
                                            size={32}
                                            color={star <= technicianRating ? "#FFD700" : "#d1d5db"}
                                            style={styles.star}
                                        />
                                    </Animated.View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <CustomText style={styles.sectionTitle}>Your Feedback</CustomText>
                    <CustomText style={styles.sectionDescription}>
                        Share your thoughts to help us serve you better.
                    </CustomText>
                    <TextInput
                        style={styles.textArea}
                        multiline
                        numberOfLines={6}
                        placeholder="Tell us about your experience..."
                        value={reviewText}
                        onChangeText={setReviewText}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
                    <CustomText style={styles.submitButtonText}>Submit Your Review</CustomText>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
        alignItems: "center",
    },
    headerText: {
        ...globalStyles.f16Bold,
        color: "#1f2937",
    },
    subHeaderText: {
        ...globalStyles.f12Regular,
        color: "#6b7280",
        marginTop: 8,
        textAlign: "center",
    },
    summaryCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: "#0000007d",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 5,
    },
    summaryTitle: {
        ...globalStyles.f16Bold,
        color: color.primary,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    summaryLabel: {
        ...globalStyles.f12Regular,
        color: "#6b7280",
    },
    summaryValue: {
        ...globalStyles.f12Bold,
        color: "#1f2937",
        flex: 1,
        textAlign: "right",
    },
    section: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#0000007b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 5,
    },
    sectionTitle: {
        ...globalStyles.f16Bold,
        color: color.primary,
        marginBottom: 12,
    },
    subSectionTitle: {
        ...globalStyles.f14Bold,
        color: "#1f2937",
        marginBottom: 8,
    },
    sectionDescription: {
        ...globalStyles.f12Regular,
        color: "#6b7280",
        marginBottom: 16,
    },
    starContainer: {
        flexDirection: "row",
        justifyContent: "center",
    },
    star: {
        marginHorizontal: 8,
    },
    textArea: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: "#1f2937",
        backgroundColor: "#f9fafb",
        textAlignVertical: "top",
        ...globalStyles.f14Regular,
    },
    submitButton: {
        backgroundColor: color.secondary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 16,
    },
    submitButtonText: {
        ...globalStyles.f16Bold,
        color: "#fff",
    },
     divider: {
    borderBottomColor: "#ededed",
    borderBottomWidth: 1,
    marginVertical: 20,
    alignSelf: "center",
    width: '100%'
  },
};