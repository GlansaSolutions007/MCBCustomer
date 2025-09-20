# OCR Screen Setup Guide

This guide explains how to set up and use the OCR (Optical Character Recognition) functionality for extracting RC (Registration Certificate) data from images.

## Features

- **Image Selection**: Choose images from camera or gallery
- **OCR Processing**: Extract text from RC images
- **Data Parsing**: Convert extracted text to structured JSON format
- **Data Editing**: Edit extracted data before saving
- **Export Options**: Export data as JSON or save to car list
- **Error Handling**: Comprehensive error handling and user feedback

## Setup Instructions

### 1. Dependencies

The OCR screen uses the following dependencies that are already included in the project:

```json
{
  "expo-image-picker": "~17.0.8",
  "react-native-safe-area-context": "~5.6.0",
  "@expo/vector-icons": "^15.0.2"
}
```

### 2. Real OCR Service Integration

Currently, the OCR service uses mock data. To implement real OCR functionality, you have several options:

#### Option A: Google Vision API (Recommended)

1. **Set up Google Cloud Vision API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Vision API
   - Create credentials (API Key)

2. **Add API Key to Environment**:
   ```bash
   # Add to your .env file
   GOOGLE_VISION_API_KEY=your_api_key_here
   ```

3. **Update OCR Service**:
   ```javascript
   // In src/utils/ocrService.js
   const API_KEY = process.env.GOOGLE_VISION_API_KEY;
   ```

#### Option B: AWS Textract

1. **Set up AWS Textract**:
   - Create AWS account
   - Set up Textract service
   - Configure IAM permissions

2. **Install AWS SDK**:
   ```bash
   npm install aws-sdk
   ```

#### Option C: Azure Computer Vision

1. **Set up Azure Computer Vision**:
   - Create Azure account
   - Set up Computer Vision service
   - Get endpoint and subscription key

2. **Install Azure SDK**:
   ```bash
   npm install @azure/cognitiveservices-computervision
   ```

### 3. Navigation Setup

The OCR screen is already integrated into the navigation:

- **Root Navigator**: Accessible from anywhere in the app
- **My Cars Stack**: Accessible from the My Cars section
- **Quick Access**: OCR button added to My Cars List screen

## Usage

### 1. Accessing the OCR Screen

- **From My Cars**: Tap the scan icon (📱) in the My Cars list header
- **From Navigation**: Navigate to `OCRScreen` from anywhere in the app

### 2. Using the OCR Functionality

1. **Select Image**:
   - Tap "Tap to select RC image"
   - Choose "Camera" to take a new photo
   - Choose "Gallery" to select from existing photos

2. **Extract Data**:
   - Tap "Extract Data" button
   - Wait for OCR processing to complete
   - Review extracted data

3. **Edit Data** (Optional):
   - Tap "Edit" button to modify extracted data
   - Make necessary corrections
   - Tap "Save" to confirm changes

4. **Export Options**:
   - **Export JSON**: Save data as JSON format
   - **Add to Cars**: Add vehicle to your car list
   - **Reset**: Clear all data and start over

## Data Structure

The OCR service extracts the following RC fields:

```javascript
{
  registrationNumber: "KA01AB1234",
  ownerName: "John Doe",
  vehicleClass: "LMV",
  vehicleType: "Motor Car",
  manufacturer: "Maruti Suzuki",
  model: "Swift",
  fuelType: "Petrol",
  engineNumber: "K12B1234567",
  chassisNumber: "MA3FHBG1S00123456",
  registrationDate: "15/01/2020",
  expiryDate: "14/01/2030",
  rto: "Bangalore Central",
  color: "White",
  seatingCapacity: "5",
  cubicCapacity: "1197",
  unladenWeight: "875",
  grossWeight: "1320",
  makerDescription: "Maruti Suzuki India Ltd",
  bodyType: "Hatchback",
  insuranceValidUpto: "14/01/2025",
  insuranceCompany: "Bajaj Allianz",
  pucValidUpto: "14/07/2024",
  pucNumber: "PUC123456789"
}
```

## File Structure

```
src/
├── screens/Customer/
│   └── OCRScreen.js          # Main OCR screen component
├── utils/
│   └── ocrService.js         # OCR processing service
└── navigation/
    ├── RootNavigator.js      # Root navigation with OCR screen
    └── MyCarsStack.js        # My Cars navigation with OCR access
```

## Customization

### 1. Adding New Fields

To add new RC fields:

1. **Update OCR Service**:
   ```javascript
   // In src/utils/ocrService.js
   const rcData = {
     // ... existing fields
     newField: this.extractField(text, /New Field[:\s]*([A-Za-z0-9\s]+)/i),
   };
   ```

2. **Update Screen Component**:
   ```javascript
   // In src/screens/Customer/OCRScreen.js
   const rcFields = {
     // ... existing fields
     newField: '',
   };
   ```

### 2. Styling

The OCR screen uses the app's existing design system:

- **Colors**: Defined in `src/styles/theme.js`
- **Styles**: Uses `globalStyles` and custom styles
- **Components**: Uses existing `CustomText`, `CustomAlert` components

### 3. Error Handling

The OCR service includes comprehensive error handling:

- **Image Selection Errors**: Permission and file access issues
- **OCR Processing Errors**: API failures and parsing errors
- **User Feedback**: Alert messages for all error states

## Testing

### 1. Mock Data Testing

The current implementation uses mock data for testing:

```javascript
// Mock extracted text in ocrService.js
const mockExtractedText = `
  REGISTRATION CERTIFICATE
  Registration No: KA01AB1234
  // ... more mock data
`;
```

### 2. Real OCR Testing

To test with real OCR:

1. Set up your chosen OCR service (Google Vision, AWS, or Azure)
2. Replace mock data with real API calls
3. Test with actual RC images
4. Verify data extraction accuracy

## Troubleshooting

### Common Issues

1. **Permission Errors**:
   - Ensure camera and gallery permissions are granted
   - Check device settings for app permissions

2. **OCR Accuracy Issues**:
   - Use high-quality, well-lit images
   - Ensure RC is clearly visible and not blurry
   - Try different image orientations

3. **API Errors**:
   - Verify API keys and credentials
   - Check network connectivity
   - Review API quotas and limits

### Debug Mode

Enable debug logging:

```javascript
// In ocrService.js
console.log('Processing image:', imageUri);
console.log('Extracted text:', extractedText);
console.log('Parsed data:', parsedData);
```

## Future Enhancements

1. **Batch Processing**: Process multiple images at once
2. **Data Validation**: Validate extracted data against known formats
3. **Cloud Storage**: Save processed images and data to cloud
4. **Offline Support**: Local OCR processing for offline use
5. **Multi-language Support**: Support for different RC formats
6. **Data Sync**: Sync extracted data with backend services

## Support

For issues or questions:

1. Check the console logs for error messages
2. Verify all dependencies are properly installed
3. Ensure proper API configuration
4. Test with different image qualities and formats

## License

This OCR functionality is part of the MCB Customer app and follows the same licensing terms.
