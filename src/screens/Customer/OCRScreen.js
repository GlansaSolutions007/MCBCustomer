import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import { color } from '../../styles/theme';
import globalStyles from '../../styles/globalStyles';
import CustomAlert from '../../components/CustomAlert';
import OCRService from '../../utils/ocrService';

export default function OCRScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageSize, setSelectedImageSize] = useState({ width: 0, height: 0 });
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageViewSize, setImageViewSize] = useState({ width: 0, height: 0 });
  // crop boundaries as percentages [0..1]
  const [crop, setCrop] = useState({ left: 0.05, top: 0.05, right: 0.95, bottom: 0.95 });
  const [editableData, setEditableData] = useState({});
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  useEffect(() => {
    // Initialize editable data as empty object - will be populated from OCR
    setEditableData({});
  }, []);

  const requestPermissions = async () => {
    // Request both camera and media library permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera and photo library permissions to use this feature. You can enable them in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      Alert.alert(
        'Select Image Source',
        'Choose how you want to add the RC image',
        [
          {
            text: 'Camera',
            onPress: () => openCamera(),
          },
          {
            text: 'Gallery',
            onPress: () => openGallery(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Pick Image Error:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };
  const getFileExtensionFromAsset = (asset) => {
    // prefer fileName if provided by ImagePicker
    const fileName = asset.fileName || (asset.uri && asset.uri.split('/').pop()) || '';
    if (fileName && fileName.includes('.')) {
      return fileName.split('.').pop().split('?')[0].toLowerCase();
    }

    // fallback: try to parse from uri directly (handles query params)
    if (asset.uri) {
      const m = asset.uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
      if (m && m[1]) return m[1].toLowerCase();
    }

    // no extension found
    return null;
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        console.log('Camera selected image:', asset.uri);
        setExtractedData(null);
        const ext = getFileExtensionFromAsset(asset);
        console.log('Camera selected file extension:', ext); // e.g. "jpg" or null
        Image.getSize(result.assets[0].uri, (w, h) => setSelectedImageSize({ width: w, height: h }), () => { });
      }
    } catch (error) {
      console.error('Camera Error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(result.assets[0].uri);
        setExtractedData(null);
        const ext = getFileExtensionFromAsset(asset);
        console.log('Gallery selected file extension:', ext); // e.g. "jpg" or null
        Image.getSize(result.assets[0].uri, (w, h) => setSelectedImageSize({ width: w, height: h }), () => { });
      }
    } catch (error) {
      console.error('Gallery Error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const processImageWithOCR = async () => {
    if (!selectedImage) {
      setAlertMessage('Please select an image first');
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    setLoading(true);
    setOcrProgress(0);
    try {
      console.log('Starting OCR processing for image:', selectedImage);

      // Extract text from image using OCR service
      const extractedText = await OCRService.extractTextFromImage(selectedImage, setOcrProgress);
      console.log('Extracted text:', extractedText);

      // Parse the extracted text to get structured RC data
      const parsedData = await OCRService.parseRCText(extractedText);
      console.log('Parsed RC data:', parsedData);

      setExtractedData(parsedData);
      setEditableData(parsedData);
      setAlertMessage('RC data extracted successfully! You can now edit or export the data.');
      setAlertType('success');
      setAlertVisible(true);
    } catch (error) {
      console.error('OCR Error:', error);
      setAlertMessage(`Failed to extract data: ${error.message}. Please try with a clearer image.`);
      setAlertType('error');
      setAlertVisible(true);
    } finally {
      setLoading(false);
      setOcrProgress(0);
    }
  };

  const openEditModal = () => {
    setShowEditModal(true);
  };

  const saveEditedData = () => {
    setExtractedData(editableData);
    setShowEditModal(false);
    setAlertMessage('Data updated successfully!');
    setAlertType('success');
    setAlertVisible(true);
  };

  const exportToJSON = () => {
    if (!extractedData) {
      setAlertMessage('No data to export');
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    const jsonData = JSON.stringify(extractedData, null, 2);
    console.log('RC Data JSON:', jsonData);

    // Here you can implement sharing functionality
    Alert.alert(
      'Export Successful',
      'RC data has been exported to JSON format. Check console for output.',
      [{ text: 'OK' }]
    );
  };

  const saveToCarList = () => {
    if (!extractedData) {
      setAlertMessage('No data to save');
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    Alert.alert(
      'Save to Car List',
      'Do you want to add this vehicle to your car list?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: () => {
            // Navigate to MyCarDetails with pre-filled data
            navigation.navigate('My Car Details', {
              preFilledData: extractedData,
              fromOCR: true,
            });
          },
        },
      ]
    );
  };

  const resetData = () => {
    setSelectedImage(null);
    setExtractedData(null);
    setEditableData({});
  };

  const renderDataField = (label, value, key) => (
    <View key={key} style={styles.dataField}>
      <CustomText style={styles.fieldLabel}>{label}</CustomText>
      <CustomText style={styles.fieldValue}>{value || 'Not found'}</CustomText>
    </View>
  );

  const renderEditField = (label, value, key) => (
    <View key={key} style={styles.editField}>
      <CustomText style={styles.fieldLabel}>{label}</CustomText>
      <TextInput
        style={styles.textInput}
        value={editableData[key] || ''}
        onChangeText={(text) => setEditableData(prev => ({ ...prev, [key]: text }))}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={color.textLight}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <StatusBar
          backgroundColor={Platform.OS === 'android' ? '#fff' : undefined}
          barStyle="dark-content"
        />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={color.textDark} />
              </TouchableOpacity>
              <CustomText style={styles.headerTitle}>RC OCR Scanner</CustomText>
              <View style={styles.placeholder} />
            </View>

            {/* Image Selection Section */}
            <View style={styles.section}>
              <CustomText style={styles.sectionTitle}>Select RC Image</CustomText>
              <CustomText style={styles.infoText}>
                📱 Scan your RC to extract exact vehicle data using real OCR API with your API key. Requires internet connection.
              </CustomText>

              {selectedImage ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                    onLayout={(e) => {
                      const { width, height } = e.nativeEvent.layout;
                      setImageViewSize({ width, height });
                    }}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color={color.alertError} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                  <Ionicons name="camera" size={48} color={color.primary} />
                  <CustomText style={styles.pickerText}>Tap to select RC image</CustomText>
                  <CustomText style={styles.pickerSubtext}>Camera or Gallery</CustomText>
                </TouchableOpacity>
              )}

              {selectedImage && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => {
                      if (selectedImage && selectedImageSize.width > 0 && selectedImageSize.height > 0) {
                        setShowCropModal(true);
                      } else {
                        Alert.alert('Error', 'Image not loaded properly. Please select an image first.');
                      }
                    }}
                  >
                    <Ionicons name="crop" size={18} color={color.white} />
                    <CustomText style={styles.buttonText}>Crop</CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.scanButton]}
                    onPress={processImageWithOCR}
                    disabled={loading}
                  >
                    {loading ? (
                      <View style={{ alignItems: 'center' }}>
                        <ActivityIndicator color={color.white} size="small" />
                        <CustomText style={[styles.buttonText, { marginTop: 4 }]}>
                          Processing... {ocrProgress > 0 ? `${Math.round(ocrProgress)}%` : ''}
                        </CustomText>
                      </View>
                    ) : (
                      <>
                        <Ionicons name="scan" size={20} color={color.white} />
                        <CustomText style={styles.buttonText}>Extract Data</CustomText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Extracted Data Section */}
            {extractedData && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CustomText style={styles.sectionTitle}>Extracted RC Data</CustomText>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={openEditModal}
                    >
                      <Ionicons name="create-outline" size={16} color={color.white} />
                      <CustomText style={styles.buttonText}>Edit</CustomText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.exportButton]}
                      onPress={exportToJSON}
                    >
                      <Ionicons name="download-outline" size={16} color={color.white} />
                      <CustomText style={styles.buttonText}>Export JSON</CustomText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.saveButton]}
                      onPress={saveToCarList}
                    >
                      <Ionicons name="car-outline" size={16} color={color.white} />
                      <CustomText style={styles.buttonText}>Add to Cars</CustomText>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.dataContainer}>
                  {renderDataField('Registration Number', extractedData.registrationNumber, 'reg')}
                  {renderDataField('Owner Name', extractedData.ownerName, 'owner')}
                  {renderDataField('Address', extractedData.address, 'address')}
                  {renderDataField('Vehicle Class', extractedData.vehicleClass, 'class')}
                  {renderDataField('Vehicle Type', extractedData.vehicleType, 'type')}
                  {renderDataField('Manufacturer/Model', extractedData.manufacturer, 'manufacturer')}
                  {renderDataField('Model', extractedData.model, 'model')}
                  {renderDataField('Fuel Type', extractedData.fuelType, 'fuel')}
                  {renderDataField('Engine Number', extractedData.engineNumber, 'engine')}
                  {renderDataField('Chassis Number', extractedData.chassisNumber, 'chassis')}
                  {renderDataField('Registration Date', extractedData.registrationDate, 'regDate')}
                  {renderDataField('Expiry Date', extractedData.expiryDate, 'expiry')}
                  {renderDataField('RTO', extractedData.rto, 'rto')}
                  {renderDataField('Color', extractedData.color, 'color')}
                  {renderDataField('Seating Capacity', extractedData.seatingCapacity, 'seating')}
                  {renderDataField('Cubic Capacity', extractedData.cubicCapacity, 'cubic')}
                  {renderDataField('Unladen Weight', extractedData.unladenWeight, 'unladen')}
                  {renderDataField('Gross Weight', extractedData.grossWeight, 'gross')}
                  {renderDataField('Wheel Base', extractedData.wheelBase, 'wheelBase')}
                  {renderDataField('Manufacturing Date', extractedData.manufacturingDate, 'manufacturingDate')}
                  {renderDataField('Tax Valid Upto', extractedData.taxValidUpto, 'taxValidUpto')}
                  {renderDataField('Hypothecated To', extractedData.hypothecatedTo, 'hypothecatedTo')}
                  {renderDataField('Maker Description', extractedData.makerDescription, 'maker')}
                  {renderDataField('Body Type', extractedData.bodyType, 'body')}
                  {renderDataField('Insurance Valid Upto', extractedData.insuranceValidUpto, 'insurance')}
                  {renderDataField('Insurance Company', extractedData.insuranceCompany, 'insuranceCompany')}
                  {renderDataField('PUC Valid Upto', extractedData.pucValidUpto, 'puc')}
                  {renderDataField('PUC Number', extractedData.pucNumber, 'pucNumber')}
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, styles.resetButton]}
                  onPress={resetData}
                >
                  <Ionicons name="refresh-outline" size={16} color={color.white} />
                  <CustomText style={styles.buttonText}>Reset</CustomText>
                </TouchableOpacity>
              </View>
            )}

            {/* Edit Modal */}
            <Modal
              visible={showEditModal}
              animationType="slide"
              presentationStyle="pageSheet"
            >
              <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Ionicons name="close" size={24} color={color.textDark} />
                  </TouchableOpacity>
                  <CustomText style={styles.modalTitle}>Edit RC Data</CustomText>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={saveEditedData}
                  >
                    <CustomText style={styles.saveButtonText}>Save</CustomText>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  {renderEditField('Registration Number', editableData.registrationNumber, 'registrationNumber')}
                  {renderEditField('Owner Name', editableData.ownerName, 'ownerName')}
                  {renderEditField('Address', editableData.address, 'address')}
                  {renderEditField('Vehicle Class', editableData.vehicleClass, 'vehicleClass')}
                  {renderEditField('Vehicle Type', editableData.vehicleType, 'vehicleType')}
                  {renderEditField('Manufacturer/Model', editableData.manufacturer, 'manufacturer')}
                  {renderEditField('Model', editableData.model, 'model')}
                  {renderEditField('Fuel Type', editableData.fuelType, 'fuelType')}
                  {renderEditField('Engine Number', editableData.engineNumber, 'engineNumber')}
                  {renderEditField('Chassis Number', editableData.chassisNumber, 'chassisNumber')}
                  {renderEditField('Registration Date', editableData.registrationDate, 'registrationDate')}
                  {renderEditField('Expiry Date', editableData.expiryDate, 'expiryDate')}
                  {renderEditField('RTO', editableData.rto, 'rto')}
                  {renderEditField('Color', editableData.color, 'color')}
                  {renderEditField('Seating Capacity', editableData.seatingCapacity, 'seatingCapacity')}
                  {renderEditField('Cubic Capacity', editableData.cubicCapacity, 'cubicCapacity')}
                  {renderEditField('Unladen Weight', editableData.unladenWeight, 'unladenWeight')}
                  {renderEditField('Gross Weight', editableData.grossWeight, 'grossWeight')}
                  {renderEditField('Wheel Base', editableData.wheelBase, 'wheelBase')}
                  {renderEditField('Manufacturing Date', editableData.manufacturingDate, 'manufacturingDate')}
                  {renderEditField('Tax Valid Upto', editableData.taxValidUpto, 'taxValidUpto')}
                  {renderEditField('Hypothecated To', editableData.hypothecatedTo, 'hypothecatedTo')}
                  {renderEditField('Maker Description', editableData.makerDescription, 'makerDescription')}
                  {renderEditField('Body Type', editableData.bodyType, 'bodyType')}
                  {renderEditField('Insurance Valid Upto', editableData.insuranceValidUpto, 'insuranceValidUpto')}
                  {renderEditField('Insurance Company', editableData.insuranceCompany, 'insuranceCompany')}
                  {renderEditField('PUC Valid Upto', editableData.pucValidUpto, 'pucValidUpto')}
                  {renderEditField('PUC Number', editableData.pucNumber, 'pucNumber')}
                </ScrollView>
              </SafeAreaView>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
              visible={alertVisible}
              message={alertMessage}
              type={alertType}
              onClose={() => setAlertVisible(false)}
            />

            {/* Crop Modal */}
            <Modal visible={showCropModal} animationType="slide" presentationStyle="pageSheet">
              <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCropModal(false)}>
                    <Ionicons name="close" size={24} color={color.textDark} />
                  </TouchableOpacity>
                  <CustomText style={styles.modalTitle}>Adjust Crop</CustomText>
                  <View style={{ width: 40 }} />
                </View>

                <View style={{ padding: 16 }}>
                  <View
                    style={{
                      width: '100%',
                      aspectRatio: (imageViewSize.width && imageViewSize.height) ? imageViewSize.width / imageViewSize.height : 16 / 9,
                      backgroundColor: '#000',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={{ uri: selectedImage }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                    />
                    {/* Crop overlay */}
                    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
                      {/* dark mask */}
                      <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />
                      {/* crop box */}
                      <View
                        style={{
                          position: 'absolute',
                          left: `${crop.left * 100}%`,
                          top: `${crop.top * 100}%`,
                          width: `${(crop.right - crop.left) * 100}%`,
                          height: `${(crop.bottom - crop.top) * 100}%`,
                          borderWidth: 2,
                          borderColor: '#fff',
                        }}
                      />
                    </View>
                  </View>

                  {/* Sliders */}
                  <View style={{ marginTop: 16 }}>
                    <CustomText style={{ marginBottom: 6 }}>Left: {(crop.left * 100).toFixed(0)}%</CustomText>
                    <View style={styles.sliderRow}>
                      <TouchableOpacity style={styles.sliderBtn} onPress={() => setCrop(c => ({ ...c, left: Math.max(0, c.left - 0.02) }))}><Text>-</Text></TouchableOpacity>
                      <View style={styles.sliderTrack} />
                      <TouchableOpacity style={styles.sliderBtn} onPress={() => setCrop(c => ({ ...c, left: Math.min(c.right - 0.05, c.left + 0.02) }))}><Text>+</Text></TouchableOpacity>
                    </View>

                    <CustomText style={{ marginVertical: 6 }}>Top: {(crop.top * 100).toFixed(0)}%</CustomText>
                    <View style={styles.sliderRow}>
                      <TouchableOpacity style={styles.sliderBtn} onPress={() => setCrop(c => ({ ...c, top: Math.max(0, c.top - 0.02) }))}><Text>-</Text></TouchableOpacity>
                      <View style={styles.sliderTrack} />
                      <TouchableOpacity style={styles.sliderBtn} onPress={() => setCrop(c => ({ ...c, top: Math.min(c.bottom - 0.05, c.top + 0.02) }))}><Text>+</Text></TouchableOpacity>
                    </View>

                    <CustomText style={{ marginVertical: 6 }}>Right: {(crop.right * 100).toFixed(0)}%</CustomText>
                    <View style={styles.sliderRow}>
                      <TouchableOpacity style={styles.sliderBtn} onPress={() => setCrop(c => ({ ...c, right: Math.max(c.left + 0.05, c.right - 0.02) }))}><Text>-</Text></TouchableOpacity>
                      <View style={styles.sliderTrack} />
                      <TouchableOpacity style={styles.sliderBtn} onPress={() => setCrop(c => ({ ...c, right: Math.min(1, c.right + 0.02) }))}><Text>+</Text></TouchableOpacity>
                    </View>

                    <CustomText style={{ marginVertical: 6 }}>Bottom: {(crop.bottom * 100).toFixed(0)}%</CustomText>
                    <View style={styles.sliderRow}>
                      <TouchableOpacity style={styles.sliderBtn} onPress={() => setCrop(c => ({ ...c, bottom: Math.max(c.top + 0.05, c.bottom - 0.02) }))}><Text>-</Text></TouchableOpacity>
                      <View style={styles.sliderTrack} />
                      <TouchableOpacity style={styles.sliderBtn} onPress={() => setCrop(c => ({ ...c, bottom: Math.min(1, c.bottom + 0.02) }))}><Text>+</Text></TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => setCrop({ left: 0, top: 0, right: 1, bottom: 1 })}>
                      <Ionicons name="image" size={18} color={color.white} />
                      <CustomText style={styles.buttonText}>Full Image</CustomText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.scanButton]}
                      onPress={async () => {
                        try {
                          if (!selectedImage || !selectedImageSize.width || !selectedImageSize.height) {
                            Alert.alert('Error', 'Image not loaded properly. Please try again.');
                            return;
                          }

                          // compute crop in pixels based on original image size
                          const originX = Math.round(crop.left * selectedImageSize.width);
                          const originY = Math.round(crop.top * selectedImageSize.height);
                          const width = Math.round((crop.right - crop.left) * selectedImageSize.width);
                          const height = Math.round((crop.bottom - crop.top) * selectedImageSize.height);

                          // Validate crop dimensions
                          if (width <= 0 || height <= 0) {
                            Alert.alert('Error', 'Invalid crop area. Please adjust the crop boundaries.');
                            return;
                          }

                          const result = await ImageManipulator.manipulateAsync(
                            selectedImage,
                            [{ crop: { originX, originY, width, height } }],
                            { compress: 1, format: ImageManipulator.SaveFormat.PNG }
                          );

                          setSelectedImage(result.uri);
                          Image.getSize(result.uri, (w, h) => setSelectedImageSize({ width: w, height: h }), () => { });
                          setShowCropModal(false);
                          setAlertMessage('Image cropped successfully!');
                          setAlertType('success');
                          setAlertVisible(true);
                        } catch (e) {
                          console.error('Crop Error:', e);
                          Alert.alert('Crop Failed', 'Unable to crop image. Please try again.');
                        }
                      }}
                    >
                      <Ionicons name="checkmark" size={18} color={color.white} />
                      <CustomText style={styles.buttonText}>Apply Crop</CustomText>
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>
            </Modal>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: color.textDark,
  },
  placeholder: {
    width: 40,
  },
  section: {
    backgroundColor: color.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: color.textDark,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: color.textGray,
    marginBottom: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: color.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.lightSecondary,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: color.primary,
    marginTop: 10,
  },
  pickerSubtext: {
    fontSize: 14,
    color: color.textGray,
    marginTop: 5,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: color.white,
    borderRadius: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  scanButton: {
    backgroundColor: color.primary,
    marginTop: 15,
  },
  secondaryButton: {
    backgroundColor: color.secondary,
    marginTop: 15,
  },
  editButton: {
    backgroundColor: color.secondary,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  exportButton: {
    backgroundColor: color.alertSuccess,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  saveButton: {
    backgroundColor: color.yellow,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  resetButton: {
    backgroundColor: color.alertError,
    marginTop: 15,
  },
  buttonText: {
    color: color.white,
    fontWeight: '600',
    fontSize: 14,
  },
  dataContainer: {
    gap: 12,
  },
  dataField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.neutral[200],
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: color.textGray,
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: color.textDark,
    flex: 1,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: color.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: color.white,
    borderBottomWidth: 1,
    borderBottomColor: color.neutral[200],
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: color.textDark,
  },
  modalSaveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: color.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  editField: {
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: color.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: color.textDark,
    backgroundColor: color.white,
    marginTop: 5,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sliderBtn: {
    width: 36,
    height: 32,
    borderWidth: 1,
    borderColor: color.neutral[300],
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.white,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    marginHorizontal: 10,
    borderRadius: 3,
    backgroundColor: color.neutral[200],
  },
});
