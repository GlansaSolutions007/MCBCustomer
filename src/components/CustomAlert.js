// src/components/CustomAlert.js
import React, { useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { color } from "../styles/theme";
import { Ionicons } from '@expo/vector-icons';
import CustomText from "./CustomText";
import globalStyles from "../styles/globalStyles";

export default function CustomAlert({
  visible,
  status = "info", // 'info', 'success', 'error'
  onClose,
  title,
  message,
  buttonText = "OK",
  children,
  showButton = true,
  onConfirm,
  showCancelReasons = false,
  reasons = [],
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const alertColor = useMemo(() => {
    switch (status) {
      case "success":
        return color.alertSuccess;
      case "error":
        return color.alertError;
      default:
        return color.alertInfo;
    }
  }, [status]);

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    onConfirm?.(reason);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.alertBox}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Ionicons name="close" size={20} style={{ color: color.primary }} />
          </TouchableOpacity>
          <CustomText style={[styles.alertTitle, { color: alertColor }]}>
            {title}
          </CustomText>
          {message ? (
            <CustomText style={styles.alertMessage}>{message}</CustomText>
          ) : null}
          {showCancelReasons && (
            <View style={styles.reasonsContainer}>
              {(reasons.length > 0 ? reasons : ['Other']).map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.radioContainer}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      selectedReason === reason && styles.selectedRadio,
                    ]}
                  >
                    {selectedReason === reason && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <CustomText style={styles.radioText}>{reason}</CustomText>
                </TouchableOpacity>
              ))}
              {selectedReason === 'Other' && (
                <TextInput
                  style={styles.textArea}
                  placeholder="Please specify your reason"
                  placeholderTextColor={color.placeholder || '#999'}
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  numberOfLines={4}
                />
              )}
            </View>
          )}
          {children}
          <View
            style={[
              styles.buttonContainer,
              !showCancelReasons && styles.singleButtonContainer,
            ]}
          >
            {showButton && !showCancelReasons && (
              <TouchableOpacity
                style={[styles.alertButton, { backgroundColor: alertColor }]}
                onPress={onClose}
              >
                <CustomText style={styles.alertButtonText}>{buttonText}</CustomText>
              </TouchableOpacity>
            )}
            {showCancelReasons && (
              <>
                <TouchableOpacity
                  style={[
                    styles.alertButton,
                    styles.cancelButton,
                    { backgroundColor: color.gray || '#999' },
                  ]}
                  onPress={onClose}
                >
                  <CustomText style={styles.alertButtonText}>Close</CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.alertButton,
                    styles.confirmButton,
                    { backgroundColor: alertColor },
                    (!selectedReason || (selectedReason === 'Other' && !customReason)) &&
                    styles.disabledButton,
                  ]}
                  onPress={handleConfirm}
                  disabled={!selectedReason || (selectedReason === 'Other' && !customReason)}
                >
                  <CustomText style={styles.alertButtonText}>Confirm Cancel</CustomText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  alertTitle: {
    ...globalStyles.f16Bold,
    marginBottom: 12,
    textAlign: "center",
  },
  alertMessage: {
    ...globalStyles.f12Bold,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  alertButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  alertButtonText: {
    color: "#fff",
    ...globalStyles.f12Bold,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 4,
    borderRadius: 20,
  },
  reasonsContainer: {
    marginBottom: 15,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRadio: {
    borderColor: color.alertError || '#FF3B30',
  },
  radioDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: color.alertError || '#FF3B30',
  },
  radioText: {
    ...globalStyles.f10Bold,
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: color.border || '#CCC',
    borderRadius: 8,
    padding: 10,
    marginTop: 15,
    color: '#333',
    textAlignVertical: 'top',
    ...globalStyles.f10Medium
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  singleButtonContainer: {
    justifyContent: 'center',
  },
  cancelButton: {
     marginRight: 8,
  },
  confirmButton: {
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
});
