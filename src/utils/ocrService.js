// OCR Service for RC (Registration Certificate) data extraction
import { API_URL,OCR_API_KEY,GOOGLE_MAPS_APIKEY } from '@env';


// Real OCR service using OCR.space API
export class OCRService {
  static async extractTextFromImage(imageUri, onProgress = null) {
    try {
      console.log('Processing image with real OCR API:', imageUri);
      
      // Use real OCR API for text extraction
      const extractedText = await this.extractTextWithOCRAPI(imageUri, onProgress);
      console.log('OCR Result:', extractedText);
      return extractedText;
        
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  // Real OCR implementation using free OCR API
  static async extractTextWithOCRAPI(imageUri, onProgress = null) {
    try {
      // Simulate progress updates
      if (onProgress) {
        onProgress(20);
        await new Promise(resolve => setTimeout(resolve, 500));
        onProgress(50);
        await new Promise(resolve => setTimeout(resolve, 500));
        onProgress(80);
      }
  
      // Build FormData
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'rc_image.jpg',
      });
      formData.append('apikey', OCR_API_KEY); // Your OCR.space API key
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('ocrengine', '2');  // ✅ correct param
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
  
      // API call
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });
  
      const result = await response.json();
      console.log('OCR API Response:', result);
  
      if (onProgress) {
        onProgress(100);
      }
  
      // Handle result
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        const extractedText = result.ParsedResults[0].ParsedText.trim();
        console.log('Extracted Text from API:', extractedText);
        return extractedText;
      } else if (result.ErrorMessage) {
        console.error('OCR API Error:', result.ErrorMessage);
        throw new Error(`OCR API Error: ${result.ErrorMessage}`);
      } else {
        console.error('No text detected in image. Full response:', result);
        throw new Error('No text detected in image');
      }
    } catch (error) {
      console.error('OCR API Error:', error);
      throw error;
    }
  }
  



  static async parseRCText(text) {
    try {
      console.log('Parsing OCR text:', text);
      
      // Parse the extracted text to extract RC fields
      // Updated to handle various RC formats with more flexible regex patterns
      const rcData = {
        registrationNumber: this.extractField(text, /Regn\.?\s*Number[:\s]*([A-Z0-9]+)/i) || 
                          this.extractField(text, /Registration\s*No[:\s]*([A-Z0-9]+)/i) ||
                          this.extractField(text, /Vehicle\s*Number[:\s]*([A-Z0-9]+)/i),
        ownerName: this.extractField(text, /Regd\.?\s*Owner[:\s]*([A-Za-z\s]+)/i) || 
                  this.extractField(text, /Owner\s*Name[:\s]*([A-Za-z\s]+)/i) ||
                  this.extractField(text, /Registered\s*Owner[:\s]*([A-Za-z\s]+)/i),
        address: this.extractField(text, /Address[:\s]*([A-Za-z0-9\s,.-]+)/i),
        vehicleClass: this.extractField(text, /Vehicle\s*Class[:\s]*([A-Z\s]+)/i) ||
                     this.extractField(text, /Class[:\s]*([A-Z\s]+)/i),
        vehicleType: this.extractField(text, /Vehicle\s*Type[:\s]*([A-Za-z\s]+)/i) ||
                    this.extractField(text, /Type[:\s]*([A-Za-z\s]+)/i),
        manufacturer: this.extractField(text, /Maker'?s?\s*Class[:\s]*([A-Za-z0-9\s]+)/i) || 
                     this.extractField(text, /Manufacturer[:\s]*([A-Za-z\s]+)/i) ||
                     this.extractField(text, /Maker[:\s]*([A-Za-z\s]+)/i),
        model: this.extractField(text, /Model[:\s]*([A-Za-z0-9\s]+)/i),
        fuelType: this.extractField(text, /Fuel\s*Used[:\s]*([A-Za-z]+)/i) || 
                 this.extractField(text, /Fuel\s*Type[:\s]*([A-Za-z]+)/i) ||
                 this.extractField(text, /Fuel[:\s]*([A-Za-z]+)/i),
        engineNumber: this.extractField(text, /Engine\s*Number[:\s]*([A-Z0-9]+)/i) || 
                     this.extractField(text, /Engine\s*No[:\s]*([A-Z0-9]+)/i),
        chassisNumber: this.extractField(text, /Chassis\s*Number[:\s]*([A-Z0-9]+)/i) || 
                      this.extractField(text, /Chassis\s*No[:\s]*([A-Z0-9]+)/i),
        registrationDate: this.extractField(text, /Date\s*of\s*Registration[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i) || 
                         this.extractField(text, /Registration\s*Date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                         this.extractField(text, /Regn\.?\s*Date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i),
        expiryDate: this.extractField(text, /Regn\.?\s*Valid\s*Upto[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i) || 
                   this.extractField(text, /Expiry\s*Date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                   this.extractField(text, /Valid\s*Upto[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i),
        rto: this.extractField(text, /RTO[:\s]*([A-Za-z\s]+)/i) || 
             this.extractField(text, /Registering\s*Authority[:\s]*([A-Za-z\s-]+)/i) ||
             this.extractField(text, /Regional\s*Transport\s*Office[:\s]*([A-Za-z\s-]+)/i),
        color: this.extractField(text, /Color[:\s]*([A-Za-z\s()]+)/i),
        seatingCapacity: this.extractField(text, /Seating\s*Capacity[:\s]*(\d+)/i),
        cubicCapacity: this.extractField(text, /Cubuic\s*Capacity[:\s]*([0-9.]+)/i) || 
                      this.extractField(text, /Cubic\s*Capacity[:\s]*([0-9.]+)/i) ||
                      this.extractField(text, /Engine\s*Capacity[:\s]*([0-9.]+)/i),
        unladenWeight: this.extractField(text, /Unladen\s*Weight[:\s]*([0-9.]+)/i),
        grossWeight: this.extractField(text, /Gross\s*Weight[:\s]*([0-9.]+)/i),
        wheelBase: this.extractField(text, /Wheel\s*Base[:\s]*(\d+)/i),
        manufacturingDate: this.extractField(text, /Mth\.?\s*Yr\.?\s*of\s*Mfg[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                          this.extractField(text, /Manufacturing\s*Date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i),
        taxValidUpto: this.extractField(text, /Tax[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i),
        hypothecatedTo: this.extractField(text, /Hypothecated\s*To[:\s]*([A-Za-z\s]+)/i),
        makerDescription: this.extractField(text, /Maker\s*Description[:\s]*([A-Za-z\s\.]+)/i),
        bodyType: this.extractField(text, /Body\s*Type[:\s]*([A-Za-z]+)/i),
        insuranceValidUpto: this.extractField(text, /Insurance\s*Valid\s*Upto[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i),
        insuranceCompany: this.extractField(text, /Insurance\s*Company[:\s]*([A-Za-z\s]+)/i),
        pucValidUpto: this.extractField(text, /PUC\s*Valid\s*Upto[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i),
        pucNumber: this.extractField(text, /PUC\s*Number[:\s]*([A-Z0-9]+)/i),
      };

      console.log('Parsed RC data:', rcData);
      return rcData;
    } catch (error) {
      console.error('Text parsing error:', error);
      throw new Error('Failed to parse RC data');
    }
  }

  static extractField(text, regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  // Real OCR implementation using Google Vision API
  static async extractTextWithGoogleVision(imageUri) {
    try {
      // This would be the actual implementation using Google Vision API
      // You would need to:
      // 1. Set up Google Cloud Vision API
      // 2. Add the API key to your environment variables
      // 3. Convert image to base64
      // 4. Make API call to Google Vision
      
      // const API_KEY = 'YOUR_GOOGLE_VISION_API_KEY'; // Add to .env file
      
      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_MAPS_APIKEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      );

      const result = await response.json();
      
      if (result.responses && result.responses[0] && result.responses[0].fullTextAnnotation) {
        return result.responses[0].fullTextAnnotation.text;
      } else {
        throw new Error('No text detected in image');
      }
    } catch (error) {
      console.error('Google Vision API Error:', error);
      throw error;
    }
  }

  // Convert image URI to base64 for React Native
  static async convertImageToBase64(imageUri) {
    try {
      console.log('Converting image to base64:', imageUri);
      
      // Check if it's already a base64 data URI
      if (imageUri.startsWith('data:')) {
        return imageUri.split(',')[1];
      }
      
      // For file URIs, try to read the file
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Image blob size:', blob.size, 'type:', blob.type);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          console.log('Base64 conversion successful, length:', base64.length);
          resolve(base64);
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw error;
    }
  }

  // Alternative OCR using AWS Textract
  static async extractTextWithAWS(imageUri) {
    try {
      // AWS Textract implementation
      // You would need to:
      // 1. Set up AWS Textract
      // 2. Configure AWS credentials
      // 3. Use AWS SDK for React Native
      
      console.log('AWS Textract implementation would go here');
      throw new Error('AWS Textract not implemented yet');
    } catch (error) {
      console.error('AWS Textract Error:', error);
      throw error;
    }
  }

  // Alternative OCR using Azure Computer Vision
  static async extractTextWithAzure(imageUri) {
    try {
      // Azure Computer Vision implementation
      // You would need to:
      // 1. Set up Azure Computer Vision service
      // 2. Add the endpoint and subscription key
      // 3. Make API call to Azure
      
      console.log('Azure Computer Vision implementation would go here');
      throw new Error('Azure Computer Vision not implemented yet');
    } catch (error) {
      console.error('Azure Computer Vision Error:', error);
      throw error;
    }
  }
}

// Export default instance
export default OCRService;
