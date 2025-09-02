import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import globalStyles from '../../styles/globalStyles';
import { color } from '../../styles/theme';

const NotificationScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const notificationListener = useRef();

    // 🔹 Load saved notifications
    useEffect(() => {
        (async () => {
            const saved = await AsyncStorage.getItem('notifications');
            if (saved) {
                setNotifications(JSON.parse(saved));
            }
        })();

        // 🔹 Listen for live notifications
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            const newNote = {
                id: Date.now(),
                title: notification.request.content.title,
                message: notification.request.content.body,
                time: new Date().toLocaleTimeString(),
                type: notification.request.content.data?.type || 'info',
            };

            // Update state
            setNotifications((prev) => {
                const updated = [newNote, ...prev];
                AsyncStorage.setItem('notifications', JSON.stringify(updated)); // persist
                return updated;
            });
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
        };
    }, []);

    // 🔹 Trigger local test
    const triggerLocal = async () => {
        await Notifications.scheduleNotificationAsync({
            content: { title: 'My Car Buddy', body: 'This is a local test notification.', data: { type: 'test' } },
            trigger: null,
        });
    };

    // 🔹 Send push test via API
    const sendTest = async () => {
        try {
            const userDataRaw = await AsyncStorage.getItem('userData');
            const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
            const id = userData?.custID ? Number(userData.custID) : 0;
            if (!id) return;

            await axios.post(`${API_URL}Push/sendToCustomer`, {
                id,
                title: 'Test Notification',
                body: 'This is a test notification from the app.',
                data: { type: 'test' },
            });
        } catch (e) {
            console.log('sendTest error:', e?.message || e);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {notifications.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.iconContainer}>
                            {item.type === 'success' && <Ionicons name="checkmark-circle" size={24} color="#34C759" />}
                            {item.type === 'tech' && <MaterialIcons name="miscellaneous-services" size={24} color="#007AFF" />}
                            {item.type === 'offer' && <Ionicons name="pricetag" size={24} color="#FF3B30" />}
                            {item.type === 'test' && <Ionicons name="notifications" size={24} color="#FFA500" />}
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.message}>{item.message}</Text>
                            <Text style={styles.time}>{item.time}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity onPress={sendTest} style={styles.btnPrimary}>
                <Text style={{ color: '#fff' }}>Send Test Push</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={triggerLocal} style={styles.btnDark}>
                <Text style={{ color: '#fff' }}>Trigger Local Notification</Text>
            </TouchableOpacity>
        </View>
    );
};

export default NotificationScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    scrollContainer: { paddingTop: 16, paddingHorizontal: 10 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    iconContainer: { width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    textContainer: { flex: 1 },
    title: { ...globalStyles.f12Bold, color: color.primary, marginBottom: 2 },
    message: { ...globalStyles.f10Bold, color: 'black' },
    time: { ...globalStyles.f10Light, color: '#999', alignSelf: 'flex-end', marginLeft: 8, marginTop: 4 },
    btnPrimary: {
        margin: 16,
        padding: 12,
        backgroundColor: color.primary,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnDark: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#444',
        borderRadius: 8,
        alignItems: 'center',
    },
});
