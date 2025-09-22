import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import globalStyles from '../../styles/globalStyles';
import { color } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const RcVerification = () => {
  const navigation = useNavigation();
  const [rcNumber, setRcNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  const validateRcNumber = (rc) => {
    // Basic validation for Indian RC number format
    const rcPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
    return rcPattern.test(rc.toUpperCase());
  };

  const handleVerifyRc = async () => {
    if (!rcNumber.trim()) {
      setError('Please enter RC number');
      return;
    }

    if (!validateRcNumber(rcNumber)) {
      setError('Please enter a valid RC number (e.g., TS15FH4090)');
      return;
    }

    setError('');
    setLoading(true);
    setVerificationResult(null);

    try {
      const response = await axios.post(
        'https://api.attestr.com/api/v2/public/checkx/rc',
        {
          reg: rcNumber.toUpperCase(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic T1gwUzZJLWpyRUliT0FzU0phLmU5NzBjYzk5MjQ1ZmMzZTgyYjBlYTY2YzY0OGZiODFkOjg3ZTczYjk0OTNhMDg5MzBlM2ZhMDYxY2JiMDJlNTc2NGYwMjMwYThlMGQzYjQ4ZA==',
          },
        }
      );

      console.log('RC Verification Response:', response.data);
      if (response.data && response.data.valid) {
        setVerificationResult({
          status: "success",
          data: response.data,
        });
      } else {
        setVerificationResult({
          status: "failed",
          message: "Invalid RC number",
        });
      }
    } catch (error) {
      console.error('RC Verification Error:', error);
      setError('Failed to verify RC number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = () => {
    if (verificationResult && verificationResult.status === 'success') {
        navigation.navigate('MyCarDetails', {
          rcData: verificationResult.data,
          rcNumber: rcNumber.toUpperCase(),
        });
      }
  };

  const renderVerificationResult = () => {
    if (!verificationResult) return null;

    const { status, data, message } = verificationResult;

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Ionicons
            name={status === 'success' ? 'checkmark-circle' : 'close-circle'}
            size={24}
            color={status === 'success' ? color.alertSuccess : color.alertError}
          />
          <CustomText style={[globalStyles.f14Bold, { color: status === 'success' ? color.alertSuccess : color.alertError }]}>
            {status === 'success' ? 'RC Verified Successfully' : 'Verification Failed'}
          </CustomText>
        </View>

        {status === 'success' && data ? (
          <View style={styles.vehicleDetails}>
            <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack, styles.sectionTitle]}>
              Vehicle Details
            </CustomText>
            
            <View style={styles.detailRow}>
              <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Registration Number:</CustomText>
              <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.reg_no || rcNumber}</CustomText>
            </View>

            {data.owner && (
              <View style={styles.detailRow}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Owner Name:</CustomText>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.owner}</CustomText>
              </View>
            )}

            {data.engineNumber && (
              <View style={styles.detailRow}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Vehicle Class:</CustomText>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.engineNumber}</CustomText>
              </View>
            )}

            {data.manufacturer && (
              <View style={styles.detailRow}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Manufacturer:</CustomText>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.manufacturer}</CustomText>
              </View>
            )}

            {data.makerModel && (
              <View style={styles.detailRow}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Model:</CustomText>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.makerModel}</CustomText>
              </View>
            )}

            {data.fuel_type && (
              <View style={styles.detailRow}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Fuel Type:</CustomText>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.fuel_type}</CustomText>
              </View>
            )}

            {data.engine_no && (
              <View style={styles.detailRow}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Engine Number:</CustomText>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.engine_no}</CustomText>
              </View>
            )}

            {data.chassis_no && (
              <View style={styles.detailRow}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Chassis Number:</CustomText>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.chassis_no}</CustomText>
              </View>
            )}

            {data.registration_date && (
              <View style={styles.detailRow}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Registration Date:</CustomText>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.registration_date}</CustomText>
              </View>
            )}

            {data.fitness_upto && (
              <View style={styles.detailRow}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Fitness Valid Until:</CustomText>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.fitness_upto}</CustomText>
              </View>
            )}

            {data.insurance_upto && (
              <View style={styles.detailRow}>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>Insurance Valid Until:</CustomText>
                <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>{data.insurance_upto}</CustomText>
              </View>
            )}

            <TouchableOpacity
              style={[styles.addCarButton, { backgroundColor: color.primary }]}
              onPress={handleAddCar}
            >
              <CustomText style={[globalStyles.f14Bold, { color: color.white }]}>
                Add This Car
              </CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <CustomText style={[globalStyles.f12Bold, globalStyles.textGray]}>
              {message || 'Unable to verify RC number. Please check the number and try again.'}
            </CustomText>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={Platform.OS === 'android' ? color.white : undefined}
        barStyle="dark-content"
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={color.textDark} />
        </TouchableOpacity>
        <CustomText style={[globalStyles.f16Bold, globalStyles.textBlack]}>
          RC Verification
        </CustomText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color={color.primary} />
          <View style={styles.instructionText}>
            <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack]}>
              Verify Your Vehicle
            </CustomText>
            <CustomText style={[globalStyles.f10Bold, globalStyles.textGray]}>
              Enter your vehicle's registration number to automatically fetch vehicle details
            </CustomText>
          </View>
        </View>

        {/* RC Number Input */}
        <View style={styles.inputContainer}>
          <CustomText style={[globalStyles.f12Bold, globalStyles.textBlack, styles.label]}>
            Registration Number
          </CustomText>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={rcNumber}
            onChangeText={(text) => {
              setRcNumber(text.toUpperCase());
              setError('');
              setVerificationResult(null);
            }}
            placeholder="Enter RC number (e.g., TS15FH4090)"
            placeholderTextColor={color.textLight}
            autoCapitalize="characters"
            maxLength={10}
          />
          {error ? (
            <CustomText style={[globalStyles.f10Bold, { color: color.alertError }]}>
              {error}
            </CustomText>
          ) : null}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            { backgroundColor: loading ? color.neutral[300] : color.primary }
          ]}
          onPress={handleVerifyRc}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={color.white} size="small" />
          ) : (
            <>
              <Ionicons name="search" size={20} color={color.white} />
              <CustomText style={[globalStyles.f14Bold, { color: color.white, marginLeft: 8 }]}>
                Verify RC Number
              </CustomText>
            </>
          )}
        </TouchableOpacity>

        {/* Verification Result */}
        {renderVerificationResult()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: color.white,
    borderBottomWidth: 1,
    borderBottomColor: color.neutral[100],
  },
  backButton: {
    padding: 5,
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: color.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  instructionText: {
    flex: 1,
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: color.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: color.white,
    color: color.textDark,
  },
  inputError: {
    borderColor: color.alertError,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: color.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    marginBottom: 15,
    color: color.primary,
  },
  vehicleDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.neutral[100],
  },
  errorContainer: {
    padding: 15,
    backgroundColor: color.backgroundLight,
    borderRadius: 8,
    marginTop: 10,
  },
  addCarButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
});

export default RcVerification;
