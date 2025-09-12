import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ImageBackground,
  StyleSheet,
  Image,
} from "react-native";
import CustomText from "../../components/CustomText";
import moment from "moment";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import serv from "../../../assets/images/interiorservice.png";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import Entypo from "@expo/vector-icons/Entypo";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { API_URL, API_IMAGE_URL } from "@env";

// import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SchedulePage = () => {
  //
  const today = moment().startOf("day");
  const [currentWeekStart, setCurrentWeekStart] = useState(today.clone());
  const [selectedDate, setSelectedDate] = useState(today.clone());
  const [selectedTime, setSelectedTime] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [timeError, setTimeError] = useState("");

  const insets = useSafeAreaInsets();

  const navigation = useNavigation();

  const getWeekDates = () => {
    return [...Array(7)].map((_, i) => currentWeekStart.clone().add(i, "days"));
  };

  const goToNextWeek = () => {
    const nextWeekStart = currentWeekStart.clone().add(7, "days");
    setCurrentWeekStart(nextWeekStart);
    setSelectedDate(nextWeekStart);
  };

  const goToPreviousWeek = () => {
    const prevWeekStart = currentWeekStart.clone().subtract(7, "days");
    if (!prevWeekStart.isBefore(today)) {
      setCurrentWeekStart(prevWeekStart);
      setSelectedDate(prevWeekStart);
    }
  };

  const isAtCurrentWeek = currentWeekStart.isSame(today, "day");

  const scrollRef = useRef(null);

  const scrollRight = () => {
    scrollRef.current?.scrollTo({ x: 200, animated: true });
  };

  const route = useRoute();
  const { selectedServices } = route.params || {};

  console.log(selectedServices, "here are the selected services");

  const fetchTimeSlots = async () => {
    try {
      const response = await axios.get(`${API_URL}TimeSlot`);
      const sDate = selectedDate.format("YYYY-MM-DD");
      const currentDate = moment().format("YYYY-MM-DD");
      const currentTime = moment();
      console.log(response.data, "time slots data");

      const slots = response.data
        .filter((slot) => slot.Status)
        .filter((slot) => {
          if (currentDate === sDate) {
            const startTime = moment(slot.StartTime, "HH:mm:ss");
            return startTime.isAfter(currentTime);
          } else {
            return true; // For future dates, include all slots
          }
        })
        .sort((a, b) => {
          // Compare times directly
          return moment(a.StartTime, "HH:mm:ss").diff(
            moment(b.StartTime, "HH:mm:ss")
          );
        })
        .map((slot) => ({
          ...slot,
          label: `${moment(slot.StartTime, "HH:mm:ss").format(
            "hh:mm A"
          )} - ${moment(slot.EndTime, "HH:mm:ss").format("hh:mm A")}`,
        }));

      setTimeSlots(slots);
      // ✅ If no slots available for today -> show garage closed
      if (slots.length === 0 && currentDate === sDate) {
        setTimeSlots([]);
      } else {
        setTimeError("");
      }
    } catch (error) {
      console.error("Failed to fetch time slots:", error);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [selectedDate]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          backgroundColor: "#fff",
          paddingBottom: insets.bottom + 20,
        }}
      >
        <View
          style={{
            paddingVertical: 26,
            backgroundColor: "#f5f5f5ff",
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <CustomText style={[globalStyles.f32Bold, globalStyles.textBlack]}>
              {currentWeekStart.format("MMMM")}
            </CustomText>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={goToPreviousWeek}
                disabled={isAtCurrentWeek}
                style={{
                  backgroundColor: isAtCurrentWeek ? "#eee" : "#b9b7b7ff",
                  borderRadius: 20,
                  padding: 6,
                }}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={isAtCurrentWeek ? "#ccc" : "#000"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={goToNextWeek}
                style={{
                  backgroundColor: "#b9b7b7ff",
                  borderRadius: 20,
                  padding: 6,
                }}
              >
                <Ionicons name="chevron-forward" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            {getWeekDates().map((date) => {
              const isSelected = date.isSame(selectedDate, "day");
              return (
                <TouchableOpacity
                  key={date.format("YYYY-MM-DD")}
                  style={{
                    alignItems: "center",
                    marginHorizontal: 4,
                  }}
                  onPress={() => setSelectedDate(date)}
                >
                  <CustomText
                    style={[
                      { color: isSelected ? color.secondary : "black" },
                      globalStyles.f12Bold,
                    ]}
                  >
                    {date.format("dd").charAt(0)}
                  </CustomText>

                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: isSelected ? color.primary : "#F0F0F0",
                      marginTop: 4,
                    }}
                  >
                    <CustomText
                      style={[
                        { color: isSelected ? "#fff" : "#000" },
                        globalStyles.f12Bold,
                      ]}
                    >
                      {date.format("DD")}
                    </CustomText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={{ padding: 16 }}>
          <CustomText style={styles.sectionTitle}>Pick Your Time Slot</CustomText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            {timeSlots.length > 0 ? (
              <>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeSlotContainer}
                >
                  {timeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.TsID}
                      style={[
                        styles.timeSlot,
                        selectedTimes.includes(slot.TsID) && styles.selectedTimeSlot,
                      ]}
                      onPress={() => {
                        if (selectedTimes.includes(slot.TsID)) {
                          setSelectedTimes(selectedTimes.filter(id => id !== slot.TsID));
                        } else {
                          setSelectedTimes([...selectedTimes, slot.TsID]);
                        }
                        setTimeError("");
                      }}
                    >
                      <CustomText
                        style={[
                          {
                            color:
                              selectedTimes.includes(slot.TsID)
                                ? "white"
                                : color.secondary,
                          },
                          globalStyles.f10Bold,
                        ]}
                      >
                        {slot.label}
                      </CustomText>
                    </TouchableOpacity>
                  ))}

                </ScrollView>
                <TouchableOpacity
                  onPress={scrollRight}
                  style={{
                    marginLeft: 6,
                    backgroundColor: "#eee",
                    borderRadius: 20,
                    padding: 6,
                  }}
                >
                  <Ionicons name="chevron-forward" size={20} color="#008080" />
                </TouchableOpacity>
              </>
            ) : (
              <View
                style={{
                  flex: 1,
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: "#FFF3CD",
                    borderRadius: 12,
                    padding: 30,
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Ionicons name="alert-circle" size={28} color="#856404" />
                  <CustomText
                    style={[globalStyles.f14Bold, { color: "#856404", marginTop: 8 }]}
                  >
                    Garage closed for today
                  </CustomText>
                  <CustomText
                    style={[globalStyles.f12Regular, { color: "#856404", marginTop: 4 }]}
                  >
                    Please select another date to continue booking.
                  </CustomText>
                </View>
              </View>
            )}
            {/* Scroll Arrow */}

          </View>

          {timeError ? (
            <CustomText style={{ color: "red", marginTop: 8, marginLeft: 4 }}>
              {timeError}
            </CustomText>
          ) : null}
          {/* 
          {selectedTimes.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <CustomText
                style={[globalStyles.f16Bold, globalStyles.secondary]}
              >
                Scheduled On
              </CustomText>

              <View style={styles.scheduledRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <MaterialCommunityIcons
                    name="calendar"
                    size={20}
                    color="#444"
                  />
                  <CustomText style={styles.scheduledText}>
                    {selectedDate.format("Do MMMM, YYYY")}
                  </CustomText>
                </View>
                <CustomText style={styles.scheduledText}>
                  {timeSlots.find((t) => t.TsID === selectedTime)?.label}
                </CustomText>
              </View>
            </View>
          )} */}

          {selectedTimes.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <CustomText style={[globalStyles.f16Bold, globalStyles.secondary]}>
                Scheduled On
              </CustomText>

              {selectedTimes.map((id) => {
                const slot = timeSlots.find((t) => t.TsID === id);
                return (
                  <View key={id} style={styles.scheduledRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <MaterialCommunityIcons name="calendar" size={20} color="#444" />
                      <CustomText style={styles.scheduledText}>
                        {selectedDate.format("Do MMMM, YYYY")}
                      </CustomText>
                    </View>
                    <CustomText style={styles.scheduledText}>{slot?.label}</CustomText>
                  </View>
                );
              })}
            </View>
          )}


          <CustomText style={styles.sectionTitle}>Selected Services</CustomText>
          {selectedServices?.map((item) => (
            <View key={item.id} style={styles.serviceCard}>
              <ImageBackground
                source={{ uri: `${API_IMAGE_URL}${item.image}` }}
                style={styles.serviceImage}
                imageStyle={{
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                }}
              >
                <CustomText style={styles.serviceTitle}>
                  {item.title}
                </CustomText>
              </ImageBackground>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={18}
                  color="#444"
                />
                <CustomText style={styles.detailLabel}>
                  Estimated Hours
                </CustomText>
                <CustomText style={styles.detailValue}>
                  {item.estimatedMins}
                </CustomText>
              </View>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="currency-inr"
                  size={18}
                  color="#444"
                />
                <CustomText style={styles.detailLabel}>Amount</CustomText>
                <CustomText style={styles.detailValue}>
                  ₹{item.price}
                </CustomText>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={{
              backgroundColor: "#000",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 50,
            }}
            onPress={async () => {
              if (selectedTimes.length === 0) {
                setTimeError("Please select an available time slot.");
                return;
              } else {
                setTimeError("");
              }

              const selectedSlot = timeSlots.find(
                (t) => t.TsID === selectedTime
              );

              try {
                await AsyncStorage.setItem(
                  "selectedDate",
                  selectedDate.format("YYYY-MM-DD")
                );
                await AsyncStorage.setItem(
                  "selectedTimeSlotId",
                  selectedTime.toString()
                );
                await AsyncStorage.setItem(
                  "selectedTimeSlotLabel",
                  // selectedSlot.label
                  JSON.stringify(
                    selectedTimes.map(id => timeSlots.find(t => t.TsID === id)?.label)
                  )
                );

                navigation.goBack();
              } catch (e) {
                console.error("Failed to save schedule:", e);
              }
            }}
          >
            <Ionicons
              name="calendar"
              size={26}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <CustomText style={[globalStyles.f14Bold, { color: "#fff" }]}>
              Mark as scheduled
            </CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    ...globalStyles.f16Bold,
    ...globalStyles.textBlack,
    marginTop: 12,
  },
  timeSlotContainer: {
    paddingHorizontal: 4,
    gap: 10,
    alignItems: "center",
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: color.secondary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  selectedTimeSlot: {
    backgroundColor: color.secondary,
  },
  scheduledRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 10,
    justifyContent: "space-between",
  },
  scheduledText: {
    ...globalStyles.f12Bold,
    color: "#333",
  },
  serviceCard: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
    elevation: 2,
  },
  serviceImage: {
    height: 150,
    justifyContent: "flex-end",
    padding: 12,
  },
  serviceTitle: {
    color: "white",
    ...globalStyles.f16Bold,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  detailLabel: {
    flex: 1,
    marginLeft: 4,
    color: "#666",
    ...globalStyles.f12Bold,
  },
  detailValue: {
    fontWeight: "bold",
    color: "#000",
    ...globalStyles.f12Bold,
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 20,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  moreServiceCard: { width: 120, marginRight: 10, alignItems: "flex-start" },
  moreServiceImage: { width: 90, height: 90, borderRadius: 8, marginTop: 6 },
  moreServiceText: {
    textAlign: "flex-start",
    ...globalStyles.f10Bold,
    marginTop: 5,
    color: "black",
  },
  moreServicePrice: {
    ...globalStyles.f12Bold,
    color: color.secondary,
    marginTop: 2,
  },
  plusIcon: { position: "absolute", top: -3, right: 12 },
});

export default SchedulePage;
