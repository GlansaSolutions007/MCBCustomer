import React, { cloneElement, useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Image,
    ImageBackground,
} from 'react-native';
import bannerImage from '../../../assets/images/info.png'
import globalStyles from '../../styles/globalStyles';
import { color } from '../../styles/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
// import { Dropdown } from 'react-native-element-dropdown';
import CustomAlert from '../../components/CustomAlert';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import Checkbox from 'expo-checkbox';
import CustomDropdown from '../../components/CustomDropdown';
import { API_BASE_URL } from '@env';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../../utils/token';
import { SafeAreaView } from 'react-native-safe-area-context';

export const MyCarDetails = () => {
    const [transmission, setTransmission] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const [yearOfPurchase, setYearOfPurchase] = useState(null);
    const [showYearPicker, setShowYearPicker] = useState(false);

    const [alertVisible, setAlertVisible] = useState(false);
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [engineType, setEngineType] = useState('');
    const [kilometersDriven, setKilometersDriven] = useState('');

    const [vehicleNumberError, setVehicleNumberError] = useState(false);
    const [transmissionError, setTransmissionError] = useState(false);
    const [isViewOnly, setIsViewOnly] = useState(false);

    const transmissionOptions = [
        { label: 'Automatic', value: 'Automatic' },
        { label: 'Manual', value: 'Manual' },
    ];

    const route = useRoute();
    const [model, setModel] = useState(null);

    useEffect(() => {
        if (route.params?.model) {
            setModel(route.params.model);
        }
    }, [route.params]);

    const { brandId, modelId, fuelId, fuelType } = route.params;

    const formatDate = (date) => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleSubmit = async () => {
        let hasError = false;

        if (!vehicleNumber.trim()) {
            setVehicleNumberError(true);
            hasError = true;
        }

        if (!transmission.trim()) {
            setTransmissionError(true);
            hasError = true;
        }

        if (hasError) return;

        try {
            const storedUserData = await AsyncStorage.getItem('userData');
            const userData = JSON.parse(storedUserData);
            const custID = userData?.custID;

            if (!custID) {
                console.warn("Customer ID not found.");
                return;
            }

            const payload = {
                custID: custID,
                vehicleNumber: vehicleNumber,
                yearOfPurchase: yearOfPurchase ? yearOfPurchase.getFullYear().toString() : "",
                engineType: engineType,
                kilometersDriven: kilometersDriven,
                transmissionType: transmission,
                createdBy: custID,
                brandID: brandId,
                modelID: modelId,
                fuelTypeID: fuelId
            };

            const token = await getToken();

            const res = await axios.post(`${API_BASE_URL}CustomerVehicles/InsertCustomerVehicle`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log("Car added:", res.data);
            setAlertVisible(true);

        } catch (error) {
            console.error("Error submitting car:", error);
        }
    };

    useEffect(() => {
        const fetchCarDetails = async () => {
            if (!route.params?.vehicleId) return;
            try {
                const token = await getToken();
                const response = await axios.get(
                    `${API_BASE_URL}CustomerVehicles/CustVehicleId?CustVehicleId=${route.params.vehicleId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                const data = response.data;
                setVehicleNumber(data.VehicleNumber);
                setYearOfPurchase(new Date(`${data.YearOfPurchase}-01-01`));
                setTransmission(data.TransmissionType);
                setEngineType(data.EngineType);
                setKilometersDriven(data.KilometersDriven);
                setIsViewOnly(true);

            } catch (err) {
                console.error("Error fetching vehicle details:", err);
            }
        };
        fetchCarDetails();
    }, []);

    const navigation = useNavigation();

    const goCarList = () => {
        setAlertVisible(false);
        navigation.navigate('CustomerTabNavigator', { screen: 'My Cars' });
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
                >
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ flex: 1, }}>
                            {model?.image && (
                                <View style={{ backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
                                    <View style={styles.modelImageContainer}>
                                        <ImageBackground source={{ uri: model.image }} style={styles.modelImage} resizeMode="contain" />
                                        <View style={styles.modelNameTag}>
                                            <CustomText style={styles.modelNameText}>{model.name}</CustomText>
                                        </View>
                                    </View>
                                </View>
                            )}
                            <View style={{ padding: 20, backgroundColor: '#f1f0f5', flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                                <View style={styles.bannerContainer}>
                                    <Image source={bannerImage} style={styles.bannerImage} />

                                    <View style={styles.bannerTextContainer}>
                                        <CustomText style={styles.bannerTitle}>Your car,{'\n'}our priority</CustomText>
                                        <CustomText style={styles.bannerSubtitle}>
                                            Filling these details ensures better{'\n'}service accuracy & reminders
                                        </CustomText>
                                    </View>
                                </View>
                                <CustomText style={styles.label}>
                                    Registration Number<CustomText style={styles.optional}> *</CustomText>
                                </CustomText>
                                <TextInput
                                    placeholder="e.g. TS08-AB-1234"
                                    placeholderTextColor="#888"
                                    value={vehicleNumber}
                                    onChangeText={(text) => {
                                        setVehicleNumber(text);
                                        setVehicleNumberError(false);
                                    }}
                                    style={[
                                        styles.input,
                                        vehicleNumberError && styles.inputError,
                                    ]}
                                    editable={!isViewOnly}
                                />

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <CustomText style={styles.label}>
                                            Year of Purchase
                                        </CustomText>
                                        <TouchableOpacity onPress={() => setShowYearPicker(true)}>
                                            <TextInput
                                                value={formatDate(yearOfPurchase)}
                                                placeholder="DD/MM/YYYY"
                                                style={styles.input}
                                                placeholderTextColor="#888"
                                                editable={false}
                                                pointerEvents="none"

                                            />
                                        </TouchableOpacity>
                                        {showYearPicker && (
                                            <DateTimePicker
                                                value={yearOfPurchase || new Date()}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={(event, selectedDate) => {
                                                    setShowYearPicker(false);
                                                    if (selectedDate) {
                                                        setYearOfPurchase(selectedDate);
                                                    }
                                                }}
                                                maximumDate={new Date()}
                                            />
                                        )}
                                    </View>
                                    <View style={[{ flex: 1, marginLeft: 8 }]}>
                                        <CustomText style={styles.label}>
                                            Transmission Type<CustomText style={styles.optional}> *</CustomText>
                                        </CustomText>
                                        <CustomDropdown

                                            value={transmission}
                                            onSelect={(value) => {
                                                setTransmission(value);
                                                setTransmissionError('');
                                            }}
                                            options={transmissionOptions}
                                            error={!!transmissionError}
                                            disabled={isViewOnly}
                                        />

                                    </View>
                                </View>
                                <View style={styles.labelWithHelperRow}>
                                    <CustomText style={styles.label}>
                                        Engine Type / Size
                                    </CustomText>
                                    <CustomText style={styles.helperTextInline}>Useful for technicians</CustomText>
                                </View>
                                <TextInput
                                    placeholder="e.g. 1.2L i-VTEC"
                                    style={styles.input}
                                    placeholderTextColor="#888"
                                    value={engineType}
                                    onChangeText={setEngineType}
                                />
                                <View style={styles.labelWithHelperRow}>
                                    <CustomText style={styles.label}>
                                        Kilometers Driven
                                    </CustomText>
                                    <CustomText style={styles.helperTextInline}>Useful for technicians</CustomText>
                                </View>
                                <TextInput
                                    placeholder="---"
                                    style={styles.input}
                                    placeholderTextColor="#888"
                                    value={kilometersDriven}
                                    onChangeText={setKilometersDriven}
                                />
                                {!isViewOnly && (
                                    <View style={styles.privacyContainer}>
                                        <View style={styles.privacyRow}>
                                            <Checkbox
                                                value={privacyAccepted}
                                                onValueChange={setPrivacyAccepted}
                                            />
                                            <CustomText style={styles.privacyText}>I accept the Privacy Policy</CustomText>
                                        </View>
                                    </View>
                                )}
                                {!isViewOnly && (
                                    <TouchableOpacity
                                        style={[styles.submitButton, !privacyAccepted && styles.disabledButton]}
                                        onPress={handleSubmit}
                                        disabled={!privacyAccepted}
                                    >
                                        <CustomText style={{ ...globalStyles.f12Bold, color: color.white }}>
                                            Submit
                                        </CustomText>
                                    </TouchableOpacity>
                                )}

                            </View>
                            <CustomAlert
                                visible={alertVisible}
                                onClose={goCarList}
                                title="Success"
                                message="Your Car Added Successfully"
                                status="info"
                                showButton={false} // hide default button
                            >
                                <TouchableOpacity onPress={goCarList} style={styles.submitButton} >
                                    <CustomText style={{ ...globalStyles.f12Bold, color: color.white }}>Go To Cars List</CustomText>
                                </TouchableOpacity>
                            </CustomAlert>
                        </View>
                    </ScrollView >
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback >
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    modelImageContainer: {
        alignItems: 'center',
        position: 'relative',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        marginTop: 40,
    },
    modelImage: {
        width: 180,
        height: 200,
        padding: 20,
    },
    modelNameTag: {
        position: 'absolute',
        top: 10,
        backgroundColor: color.yellow,
        paddingHorizontal: 12,
        borderRadius: 10,
        paddingBottom: 4
    },
    modelNameText: {
        color: 'white',
        ...globalStyles.f20Bold,
        textAlign: 'center',
    },
    modelText: {
        color: 'white',
        ...globalStyles.f10Bold,
        textAlign: 'center',
        paddingVertical: 4,
    },
    bannerContainer: {
        position: 'relative',
        width: '100%',
        height: 140,
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden', // ensures rounded corners affect children
    },

    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    bannerTextContainer: {
        position: 'absolute',
        padding: 20
    },

    bannerTitle: {
        ...globalStyles.textWhite,
        ...globalStyles.f16Bold,
        marginBottom: 4,
    },

    bannerSubtitle: {
        ...globalStyles.textWhite,
        ...globalStyles.f10Regular,
    },

    label: {
        ...globalStyles.f12Bold,
        marginBottom: 4,
        ...globalStyles.textBlack,
        // marginTop: 10,
    },
    optional: {
        ...globalStyles.f12Bold,
        color: 'red',
    },
    input: {
        backgroundColor: '#fff',
        color: '#111111',
        borderRadius: 8,
        padding: 20,
        ...globalStyles.f10Bold,
        marginBottom: 10,
    },
    itemTextStyle: {
        ...globalStyles.f10Bold,
    },

    itemContainerStyle: {
        paddingVertical: 10,
        paddingHorizontal: 12,
    },

    labelWithHelperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    helperTextInline: {
        marginTop: 4,
        ...globalStyles.f10Regular,
        color: '#999',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    privacyContainer: {
        alignItems: 'flex-start',
        marginBottom: 5,
        marginTop: 5,
    },

    privacyRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    privacyText: {
        marginLeft: 6,
        ...globalStyles.f10Regular,
        color: '#999',
    },
    submitButton: {
        backgroundColor: color.secondary,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#f16b6bff',
    },
});
