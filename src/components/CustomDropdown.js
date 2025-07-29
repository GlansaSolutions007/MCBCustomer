import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
    StyleSheet,
} from 'react-native';
import globalStyles from '../styles/globalStyles';
import CustomText from './CustomText';
import Entypo from '@expo/vector-icons/Entypo';
import { color } from '../styles/theme';

const CustomDropdown = ({ label, value, onSelect, options, placeholder = 'Select an option', error = false, disabled = false }) => {
    const [visible, setVisible] = useState(false);

    const handleSelect = (item) => {
        onSelect(item.value);
        setVisible(false);
    };

    return (
        <View style={{ marginBottom: 16 }}>
            {label && <CustomText style={styles.label}>{label}</CustomText>}

            <TouchableOpacity
                style={[
                    styles.dropdownButton,
                    error && styles.dropdownError,
                    disabled && { backgroundColor: '#f8f6f6ff' }
                ]}
                onPress={() => setVisible(true)}
            >
                <View style={styles.dropdownContent}>
                    <CustomText style={styles.dropdownText}>
                        {value || placeholder}
                    </CustomText>
                    <Entypo name="chevron-with-circle-down" size={24} style={styles.icon} />
                </View>
            </TouchableOpacity>

            <Modal
                transparent
                animationType="fade"
                visible={visible}
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.option}
                                    onPress={() => handleSelect(item)}
                                >
                                    <CustomText style={styles.optionText}>{item.label}</CustomText>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default CustomDropdown;

const styles = StyleSheet.create({
    label: {
        marginBottom: 6,
        ...globalStyles.f12Bold,

    },
    dropdownButton: {
        borderColor: '#ccc',
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    dropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    icon: {
        marginLeft: 8,
        color: color.secondary
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContainer: {
        marginHorizontal: 40,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        maxHeight: 200,
    },
    option: {
        padding: 12,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
    },
    optionText: {
        ...globalStyles.f12Bold,
    },
    dropdownError: {
        borderColor: '#f16b6bff',
        borderWidth: 1,
    },
});
