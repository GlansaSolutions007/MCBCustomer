// NotificationScreen.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import * as Notifications from 'expo-notifications';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import globalStyles from '../../styles/globalStyles';
import { color } from '../../styles/theme';

const notifications = [
    {
        id: 1,
        title: 'Service completed!',
        message: "Let us know how we did, we'd love your feedback.",
        time: '11:00 am',
        type: 'success',
    },
    {
        id: 2,
        title: 'Service started by your technician',
        message: 'Jhon has begun work on your vehicle.',
        time: '11:00 am',
        type: 'tech',
    },
    {
        id: 3,
        title: 'Technician is on the way 🚗',
        message: 'Your expert is just 2km away. Please be ready.',
        time: '11:00 am',
        type: 'tech',
    },
    {
        id: 4,
        title: 'Your car service is booked successfully!',
        message: "We're ready to shine it up on 16 July at 5:00 PM",
        time: '11:00 am',
        type: 'success',
    },
    {
        id: 5,
        title: 'Get ₹100 OFF on your next booking!',
        message: 'Refer a friend and both of you save big.',
        time: '11:00 am',
        type: 'offer',
    },
];

const NotificationScreen = () => {
    const sendTest = async () => {
        try {
            const userDataRaw = await AsyncStorage.getItem('userData');
            const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
            const id = userData?.custID ? Number(userData.custID) : 0;
            if (!id) return;
            const testNote = await axios.post(`${API_URL}Push/sendToCustomer`, {
                id,
                title: 'Test Notification',
                body: 'This is a test notification from the app.',
                data: { type: 'test' },
            });
            console.log('testNote', testNote);
        } catch (e) {
            console.log('sendTest error (customer):', e?.response?.data || e?.message || e);
            alert(`Send failed: ${e?.response?.data?.message || e?.message || 'Unknown error'}`);
        }
    };

    const triggerLocal = async () => {
        try {
            await Notifications.scheduleNotificationAsync({
                content: { title: 'My Car Buddy ', body: 'This is a local test notification.' },
                trigger: null,
            });
        } catch (e) {
            console.log('local notification error:', e?.message || e);
        }
    };

    const logAndReregister = async () => {
        try {
            const userDataRaw = await AsyncStorage.getItem('userData');
            const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
            const id = userData?.custID ? Number(userData.custID) : 0;
            let pushToken = await AsyncStorage.getItem('pushToken');
            let pushTokenType = await AsyncStorage.getItem('pushTokenType');

            // Fallback: fetch fresh tokens if not present in storage
            if (!pushToken || !pushTokenType) {
                try {
                    const devToken = await Notifications.getDevicePushTokenAsync();
                    if (devToken?.data) {
                        pushToken = devToken.data;
                        pushTokenType = 'fcm';
                        await AsyncStorage.setItem('pushToken', pushToken);
                        await AsyncStorage.setItem('pushTokenType', 'fcm');
                    }
                } catch (_) {}
                if (!pushToken) {
                    try {
                        const expoRes = await Notifications.getExpoPushTokenAsync();
                        if (expoRes?.data) {
                            pushToken = expoRes.data;
                            pushTokenType = 'expo';
                            await AsyncStorage.setItem('pushToken', pushToken);
                            await AsyncStorage.setItem('pushTokenType', 'expo');
                        }
                    } catch (_) {}
                }
            }

            console.log('custID:', id, 'pushTokenType:', pushTokenType, 'pushToken:', pushToken);
            if (!id) return;
            await axios.post(`${API_URL}Push/register`, {
                userType: 'customer',
                id,
                fcmToken: pushTokenType === 'fcm' ? pushToken : null,
                expoPushToken: pushTokenType === 'expo' ? pushToken : null,
                platform: Platform.OS,
            });
            alert('Re-registered token with backend');
        } catch (e) {
            console.log('reregister error:', e?.response?.data || e?.message || e);
        }
    };
    return (
        <View style={styles.container}>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {notifications.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.iconContainer}>
                            {item.type === 'success' && (
                                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                            )}
                            {item.type === 'tech' && (
                                <MaterialIcons name="miscellaneous-services" size={24} color="#007AFF" />
                            )}
                            {item.type === 'offer' && (
                                <Ionicons name="pricetag" size={24} color="#FF3B30" />
                            )}
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.message}>{item.message}</Text>
                            <Text style={styles.time}>{item.time}</Text>

                        </View>
                    </View>
                ))}
            </ScrollView>
            <TouchableOpacity onPress={sendTest} style={{ margin: 16, padding: 12, backgroundColor: color.primary, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>Send Test Push</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={triggerLocal} style={{ marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: '#444', borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>Trigger Local Notification</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={logAndReregister} style={{ marginHorizontal: 16, marginBottom: 16, padding: 12, backgroundColor: '#888', borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>Log & Re-register Token</Text>
            </TouchableOpacity>
        </View>
    );
};

export default NotificationScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    scrollContainer: {
        paddingTop: 16,
        paddingHorizontal: 10,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    iconContainer: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...globalStyles.f12Bold,
        color: color.primary,
        marginBottom: 2,
    },
    message: {
        ...globalStyles.f10Bold,
        color: 'black',
    },
    time: {
        ...globalStyles.f10Light,
        color: '#999',
        alignSelf: 'flex-end',
        marginLeft: 8,
        marginTop:4,
    },
});
