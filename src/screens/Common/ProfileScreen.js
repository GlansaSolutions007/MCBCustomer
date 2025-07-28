import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import CustomText from '../../components/CustomText';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../../styles/globalStyles';

export default function ProfileScreen() {
  const navigation = useNavigation();

  const handleRegister = () => {
    navigation.navigate('ProfileRegister'); // Ensure 'Register' is a valid route
  };

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <CustomText style={[styles.heading, globalStyles.f28Bold]}>Profile</CustomText>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={handleRegister}>
          <Ionicons name="person-add" size={24} color="#333" />
          <CustomText style={styles.cardText}>My Profile</CustomText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: '#FF3333' }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="white" />
          <CustomText style={[styles.cardText, { color: 'white' }]}>Logout</CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#f9f9f9',
  },
  heading: {
    marginBottom: 30,
    textAlign: 'center',
  },
  cardContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 16,
    borderRadius: 12,
  },
  cardText: {
    fontSize: 16,
    marginLeft: 12,
  },
});
