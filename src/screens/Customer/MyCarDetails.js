import React, { useState } from 'react';
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
} from 'react-native';
import bannerImage from '../../../assets/images/CTAbannerhome.png'
import globalStyles from '../../styles/globalStyles';
import { color } from '../../styles/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
// import { Dropdown } from 'react-native-element-dropdown';
import CustomAlert from '../../components/CustomAlert';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import Checkbox from 'expo-checkbox';

export const MyCarDetails = () => {
    const [transmission, setTransmission] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const [yearOfPurchase, setYearOfPurchase] = useState(null);
    const [showYearPicker, setShowYearPicker] = useState(false);

    const [alertVisible, setAlertVisible] = useState(false);

    const route = useRoute();
    const { model, fuelType } = route.params;

    const formatDate = (date) => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleSubmit = () => {
        setAlertVisible(true)
    }

    const navigation = useNavigation();

    const goCarList = () => {
        setAlertVisible(false);
        navigation.navigate('CustomerTabNavigator', { screen: 'My Cars' });
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80} 
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 20,
                        paddingVertical: 20,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ flex: 1 }}>
                        {model?.image && (
                            <View style={styles.modelImageContainer}>
                                <Image source={{ uri: model.image }} style={styles.modelImage} resizeMode="contain" />
                                <View style={styles.modelNameTag}>
                                    <CustomText style={styles.modelNameText}>{model.name}</CustomText>
                                </View>
                            </View>
                        )}
                        <View style={styles.bannerContainer}>
                            <Image source={bannerImage} style={styles.bannerImage} />

                            <View style={styles.bannerTextContainer}>
                                <CustomText style={styles.bannerTitle}>Your car,{'\n'}our priority</CustomText>
                                <CustomText style={styles.bannerSubtitle}>
                                    Filling these details ensures better{'\n'}service accuracy & reminders
                                </CustomText>
                            </View>
                        </View>
                        <CustomText style={styles.label}>Registration Number</CustomText>
                        <TextInput
                            placeholder="e.g. TS08-AB-1234"
                            style={styles.input}
                            placeholderTextColor="#888"
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <CustomText style={styles.label}>Year of Purchase</CustomText>
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
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <CustomText style={styles.label}>Transmission Type</CustomText>
                                {/* <Dropdown
                                    data={[
                                        { label: 'Automatic', value: 'Automatic' },
                                        { label: 'Manual', value: 'Manual' },
                                    ]}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select Type"
                                    value={transmission}
                                    onChange={(item) => setTransmission(item.value)}
                                    style={styles.dropdown}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    itemTextStyle={styles.itemTextStyle}
                                    containerStyle={styles.dropdownContainer}
                                    activeColor="#f0f0f0"
                                    itemContainerStyle={styles.itemContainerStyle}
                                /> */}
                            </View>
                        </View>
                        <View style={styles.labelWithHelperRow}>
                            <CustomText style={styles.label}>
                                Engine Type / Size <CustomText style={styles.optional}>(optional)</CustomText>
                            </CustomText>
                            <CustomText style={styles.helperTextInline}>Useful for technicians</CustomText>
                        </View>
                        <TextInput
                            placeholder="e.g. 1.2L i-VTEC"
                            style={styles.input}
                            placeholderTextColor="#888"
                        />
                        <View style={styles.labelWithHelperRow}>
                            <CustomText style={styles.label}>
                                Kilometers Driven <CustomText style={styles.optional}>(optional)</CustomText>
                            </CustomText>
                            <CustomText style={styles.helperTextInline}>Useful for technicians</CustomText>
                        </View>
                        <TextInput
                            placeholder="---"
                            style={styles.input}
                            placeholderTextColor="#888"
                        />                       
                        <View style={styles.privacyContainer}>
                            <View style={styles.privacyRow}>
                                <Checkbox
                                    value={privacyAccepted}
                                    onValueChange={setPrivacyAccepted}
                                />
                                <CustomText style={styles.privacyText}>I accept the Privacy Policy</CustomText>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <CustomText style={{ ...globalStyles.f12Bold, color: color.white }}>Submit</CustomText>
                        </TouchableOpacity>
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

    );
}
const styles = StyleSheet.create({
    modelImageContainer: {
        alignItems: 'center',
        position: 'relative'
    },
    modelImage: {
        width: 250,
        height: 220,
    },
    modelNameTag: {
        position: 'absolute',
        top: 20,
        backgroundColor: 'black',
        paddingHorizontal: 12,
        borderRadius: 20,
        paddingBottom: 4
    },
    modelNameText: {
        color: 'white',
        ...globalStyles.f16Bold,
        textAlign: 'center'
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
    },
    optional: {
        ...globalStyles.f10Bold,
        color: color.secondary,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        ...globalStyles.f10Bold,
        marginBottom: 10,
    },
    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 42,
        justifyContent: 'center',
    },
    itemTextStyle: {
        ...globalStyles.f10Bold,
    },

    itemContainerStyle: {
        paddingVertical: 10,
        paddingHorizontal: 12,
    },

    dropdownContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },

    helperText: {
        ...globalStyles.f10Regular,
        color: '#999',
        marginBottom: 10,
        marginLeft: 4,
        alignSelf: 'flex-end',
    },
    labelWithHelperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    helperTextInline: {
        ...globalStyles.f10Regular,
        color: '#999',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
    },

    picker: {
        height: 48,
        paddingVertical: 6,
        color: '#000',
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    privacyContainer: {
        alignItems: 'flex-start',
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

});
