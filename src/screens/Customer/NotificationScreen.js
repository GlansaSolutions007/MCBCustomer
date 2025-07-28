// NotificationScreen.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
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
