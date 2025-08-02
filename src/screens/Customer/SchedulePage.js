import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    FlatList,
    ImageBackground,
    StyleSheet,
    Image,
} from 'react-native';
import CustomText from '../../components/CustomText';
import moment from 'moment';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import serv from '../../../assets/images/interiorservice.png'
import { color } from '../../styles/theme';
import globalStyles from '../../styles/globalStyles';
import Entypo from '@expo/vector-icons/Entypo';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

const timeSlots = [
    '10:00 AM',
    '11:00 AM',
    '12:00 AM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM'
];

const SchedulePage = () => {
    const today = moment().startOf('day');
    const [currentWeekStart, setCurrentWeekStart] = useState(today.clone());
    const [selectedDate, setSelectedDate] = useState(today.clone());
    const [selectedTime, setSelectedTime] = useState(null);
    const insets = useSafeAreaInsets();

    const getWeekDates = () => {
        return [...Array(7)].map((_, i) => currentWeekStart.clone().add(i, 'days'));
    };

    const goToNextWeek = () => {
        const nextWeekStart = currentWeekStart.clone().add(7, 'days');
        setCurrentWeekStart(nextWeekStart);
        setSelectedDate(nextWeekStart);
    };

    const goToPreviousWeek = () => {
        const prevWeekStart = currentWeekStart.clone().subtract(7, 'days');
        if (!prevWeekStart.isBefore(today)) {
            setCurrentWeekStart(prevWeekStart);
            setSelectedDate(prevWeekStart);
        }
    };

    const isAtCurrentWeek = currentWeekStart.isSame(today, 'day');

    const scrollRef = useRef(null);

    const scrollRight = () => {
        scrollRef.current?.scrollTo({ x: 200, animated: true });
    };

    const route = useRoute();
    const { selectedServices } = route.params || {};

    console.log(selectedServices);
    


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
            <ScrollView contentContainerStyle={{ backgroundColor: '#fff', paddingBottom: insets.bottom + 20, }} >
                <View style={{ paddingVertical: 26, backgroundColor: '#f5f5f5ff', paddingHorizontal: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <CustomText style={[globalStyles.f32Bold, globalStyles.textBlack]}>
                            {currentWeekStart.format('MMMM')}
                        </CustomText>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                onPress={goToPreviousWeek}
                                disabled={isAtCurrentWeek}
                                style={{
                                    backgroundColor: isAtCurrentWeek ? '#eee' : '#b9b7b7ff',
                                    borderRadius: 20,
                                    padding: 6
                                }}
                            >
                                <Ionicons name="chevron-back" size={20} color={isAtCurrentWeek ? '#ccc' : '#000'} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={goToNextWeek}
                                style={{
                                    backgroundColor: '#b9b7b7ff',
                                    borderRadius: 20,
                                    padding: 6
                                }}
                            >
                                <Ionicons name="chevron-forward" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                        {getWeekDates().map((date) => {
                            const isSelected = date.isSame(selectedDate, 'day');
                            return (
                                <TouchableOpacity
                                    key={date.format('YYYY-MM-DD')}
                                    style={{
                                        alignItems: 'center',
                                        marginHorizontal: 4,
                                    }}
                                    onPress={() => setSelectedDate(date)}
                                >
                                    <CustomText style={[{ color: isSelected ? color.secondary : 'black' }, globalStyles.f12Bold]}>
                                        {date.format('dd').charAt(0)}
                                    </CustomText>

                                    <View
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 18,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: isSelected ? color.primary : '#F0F0F0',
                                            marginTop: 4,
                                        }}
                                    >
                                        <CustomText style={[{ color: isSelected ? '#fff' : '#000' }, globalStyles.f12Bold]}>
                                            {date.format('DD')}
                                        </CustomText>
                                    </View>
                                </TouchableOpacity>

                            );
                        })}
                    </View>
                </View>
                <View style={{ padding: 16 }}>
                    <CustomText style={styles.sectionTitle}>Available Time</CustomText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        <ScrollView
                            ref={scrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.timeSlotContainer}
                        >
                            {timeSlots.map((slot) => (
                                <TouchableOpacity
                                    key={slot}
                                    style={[
                                        styles.timeSlot,
                                        selectedTime === slot && styles.selectedTimeSlot,
                                    ]}
                                    onPress={() => setSelectedTime(slot)}
                                >
                                    <CustomText style={[{ color: selectedTime === slot ? 'white' : color.secondary }, globalStyles.f10Bold]}>{slot}</CustomText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Scroll Arrow */}
                        <TouchableOpacity
                            onPress={scrollRight}
                            style={{
                                marginLeft: 6,
                                backgroundColor: '#eee',
                                borderRadius: 20,
                                padding: 6,
                            }}
                        >
                            <Ionicons name="chevron-forward" size={20} color="#008080" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 20 }}>
                        {/* Heading */}
                        <CustomText style={[globalStyles.f16Bold, globalStyles.secondary]}>
                            Your Schedule
                        </CustomText>

                        {/* Scheduled Info Row */}
                        <View style={styles.scheduledRow}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 2
                            }}>
                                <MaterialCommunityIcons name="calendar" size={20} color="#444" />
                                <CustomText style={styles.scheduledText}>
                                    {selectedDate.format('Do MMMM,YYYY')}
                                </CustomText>
                            </View>
                            <CustomText style={styles.scheduledText}>
                                {selectedTime || '--:--'}
                            </CustomText>
                        </View>
                    </View>

                    <CustomText style={styles.sectionTitle}>Selected Services</CustomText>
                    {selectedServices?.map((item) => (
                        <View key={item.id} style={styles.serviceCard}>
                            <ImageBackground
                                source={{ uri: `https://api.mycarsbuddy.com/Images/${item.image}` }}
                                style={styles.serviceImage}
                                imageStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                            >
                                <CustomText style={styles.serviceTitle}>{item.title}</CustomText>
                            </ImageBackground>
                            <View style={styles.detailRow}>
                                <MaterialCommunityIcons name="clock-outline" size={18} color="#444" />
                                <CustomText style={styles.detailLabel}>Estimated Hours</CustomText>
                                <CustomText style={styles.detailValue}>{item.estimatedMins}</CustomText> 
                            </View>
                            <View style={styles.detailRow}>
                                <MaterialCommunityIcons name="currency-inr" size={18} color="#444" />
                                <CustomText style={styles.detailLabel}>Amount</CustomText>
                                <CustomText style={styles.detailValue}>₹{item.price}</CustomText>
                            </View>
                        </View>
                    ))}

                    <View style={styles.card}>
                        <CustomText style={[styles.sectionTitle, globalStyles.mb2]}>Add More Services</CustomText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {[1, 2, 3, 4].map((i) => (
                                <View key={i} style={styles.moreServiceCard}>
                                    <Image
                                        source={require('../../../assets/images/exteriorservice.png')}
                                        style={styles.moreServiceImage}
                                    />
                                    <TouchableOpacity style={styles.plusIcon}>
                                        <Entypo name="squared-plus" size={24} color={color.secondary} />
                                    </TouchableOpacity>
                                    <CustomText style={styles.moreServiceText}>
                                        Seat Vacuuming & Stain Treatment
                                    </CustomText>
                                    <CustomText style={styles.moreServicePrice}>₹100</CustomText>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#000',
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            marginTop: 50,
                        }}
                        onPress={() => {
                            // your hotline action
                        }}
                    >
                        <Ionicons name="calendar" size={26} color='#fff' style={{ marginRight: 8 }} />
                        <CustomText style={[globalStyles.f14Bold, { color: '#fff' }]}>Mark as scheduled</CustomText>
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
        alignItems: 'center',
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginVertical: 10,
        justifyContent: 'space-between'
    },
    scheduledText: {
        ...globalStyles.f12Bold,
        color: '#333',
    },
    serviceCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 10,
        elevation: 2,
    },
    serviceImage: {
        height: 150,
        justifyContent: 'flex-end',
        padding: 12,
    },
    serviceTitle: {
        color: 'white',
        ...globalStyles.f16Bold
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#eee',
    },
    detailLabel: {
        flex: 1,
        marginLeft: 4,
        color: '#666',
        ...globalStyles.f12Bold
    },
    detailValue: {
        fontWeight: 'bold',
        color: '#000',
        ...globalStyles.f12Bold
    },
    card: {
        backgroundColor: "#fff",
        marginTop: 20,
        marginHorizontal: 12,
        borderRadius: 12,

    },
    moreServiceCard: { width: 120, marginRight: 10, alignItems: "flex-start" },
    moreServiceImage: { width: 90, height: 90, borderRadius: 8, marginTop: 6 },
    moreServiceText: { textAlign: "flex-start", ...globalStyles.f10Bold, marginTop: 5, color: "black" },
    moreServicePrice: { ...globalStyles.f12Bold, color: color.secondary, marginTop: 2 },
    plusIcon: { position: "absolute", top: -3, right: 12 },
});

export default SchedulePage;