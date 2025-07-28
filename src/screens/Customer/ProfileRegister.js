import React, { useState } from 'react';
import {
    View,
    TextInput,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ImageBackground,
    Text,
} from 'react-native';
import CustomText from '../../components/CustomText';
import { color } from '../../styles/theme';
import globalStyles from '../../styles/globalStyles';
import * as ImagePicker from "expo-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import DefaultProfileImage from '../../../assets/images/profile-user.png'
import axios from 'axios';
import CustomAlert from '../../components/CustomAlert';

export const ProfileRegister = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [altPhoneNumber, setAltPhoneNumber] = useState('');
    const [image, setImage] = useState(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertStatus, setAlertStatus] = useState('info'); // 'success' | 'error'
    const [alertMessage, setAlertMessage] = useState('');

    const [errors, setErrors] = useState({
        firstName: '',
        email: '',
        phoneNumber: '',
    });

    const handleRegister = async () => {
        const newErrors = {
            firstName: '',
            email: '',
            phoneNumber: '',
        };

        let isValid = true;

        if (!firstName.trim()) {
            newErrors.firstName = 'Full Name is required';
            isValid = false;
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = 'Enter a valid email';
                isValid = false;
            }
        }

        if (!phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone Number is required';
            isValid = false;
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            newErrors.phoneNumber = 'Phone Number must be exactly 10 digits';
            isValid = false;
        }

        setErrors(newErrors);
        if (!isValid) return;

        const formData = new FormData();
        formData.append('FullName', firstName);
        formData.append('PhoneNumber', phoneNumber);
        formData.append('AlternateNumber', altPhoneNumber);
        formData.append('Email', email);
        formData.append('IsActive', true);
        formData.append('ProfileImage', image ? image.split('/').pop() : '');

        if (image) {
            const fileName = image.split('/').pop();
            const fileType = fileName.split('.').pop();
            formData.append('ProfileImageFile', {
                uri: image,
                name: fileName,
                type: `image/${fileType}`,
            });
        }

        try {
            const response = await axios.post(
                'https://api.mycarsbuddy.com/api/Customer/InsertCustomer',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            // Show success alert
            setAlertStatus('success');
            setAlertMessage('Customer registered successfully');
            setAlertVisible(true);

            // Reset form
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhoneNumber('');
            setAltPhoneNumber('');
            setImage(null);
            setErrors({
                firstName: '',
                email: '',
                phoneNumber: '',
            });
        } catch (error) {
            console.error('Registration failed:', error?.response?.data || error.message);
            setAlertStatus('error');
            setAlertMessage('Registration failed. Please try again.');
            setAlertVisible(true);
        }
    };

    const pickImage = async () => {
        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            alert("Permission to access photos is required!");
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,

            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.profileImageContainer}>
                        <ImageBackground
                            source={image ? { uri: image } : DefaultProfileImage}
                            style={styles.profileImage}
                            imageStyle={{ borderRadius: 60 }}
                        >
                            {image && (
                                <TouchableOpacity
                                    style={styles.removeIcon}
                                    onPress={() => setImage(null)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#fff" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.cameraIcon}
                                onPress={pickImage}
                            >
                                <Ionicons name="camera" size={20} color="#fff" />
                            </TouchableOpacity>
                        </ImageBackground>
                    </View>

                    <View style={styles.inputGroup}>
                        <CustomText style={styles.label}>Full Name</CustomText>
                        <TextInput
                            placeholder="Full Name"
                            placeholderTextColor="#999"
                            style={styles.textInput}
                            value={firstName}
                            onChangeText={(text) => {
                                setFirstName(text);
                                setErrors((prev) => ({ ...prev, firstName: '' }));
                            }}
                        />
                        {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <CustomText style={styles.label}>Email</CustomText>
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#999"
                            style={styles.textInput}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrors((prev) => ({ ...prev, email: '' }));
                            }}
                        />
                        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <CustomText style={styles.label}>Phone Number</CustomText>
                        <TextInput
                            placeholder="Phone Number"
                            placeholderTextColor="#999"
                            style={styles.textInput}
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={(text) => {
                                setPhoneNumber(text);
                                setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                            }}
                        />
                        {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <CustomText style={styles.label}>Additional Phone Number (optional)</CustomText>
                        <TextInput
                            placeholder="Additional Phone Number (optional)"
                            placeholderTextColor="#999"
                            style={styles.textInput}
                            keyboardType="phone-pad"
                            value={altPhoneNumber}
                            onChangeText={setAltPhoneNumber}
                        />
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
                        <CustomText style={styles.submitText}>Save</CustomText>
                    </TouchableOpacity>

                    <CustomAlert
                        visible={alertVisible}
                        status={alertStatus}
                        title={alertStatus === 'success' ? 'Success' : 'Error'}
                        message={alertMessage}
                        onClose={() => setAlertVisible(false)}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#f9f9f9',
    },
    inputGroup: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    errorText: {
        color: 'red',
        marginTop: 4,
        fontSize: 12,
    },
    label: {
        marginBottom: 6,
        color: '#333',
        ...globalStyles.f12Bold
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#000',
    },
    submitButton: {
        backgroundColor: color.secondary,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitText: {
        color: 'white',
        ...globalStyles.f12Bold
    },
    uploadBox: {
        borderWidth: 1,
        borderColor: color.secondary,
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    profileImageContainer: {
        alignSelf: 'center',
        marginBottom: 20,
        position: 'relative',
    },

    profileImage: {
        width: 120,
        height: 120,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },

    removeIcon: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#000',
        borderRadius: 12,
        padding: 2,
    },

    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: color.secondary,
        borderRadius: 20,
        padding: 6,
    },

    imageWrapper: {
        marginTop: 10,
        width: 80,
        height: 80,
        position: "relative",
    },
    imagePreview: {
        width: "100%",
        height: "100%",
        justifyContent: "flex-start",
        alignItems: "flex-end",
    },
    removeIcon: {
        position: "absolute",
        top: -10,
        right: -10,
        borderRadius: 12,
    },
});
