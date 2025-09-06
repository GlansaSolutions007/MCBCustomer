import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
  Linking,
  ActivityIndicator,
  RefreshControl,
  PermissionsAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "../../components/CustomText";
import CustomAlert from "../../components/CustomAlert";
import axios from "axios";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import globalStyles from "../../styles/globalStyles";
import { color } from "../../styles/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function InvoiceListScreen() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertStatus, setAlertStatus] = useState("info");
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const navigation = useNavigation();

  // Function to save invoice to Downloads folder
  const saveInvoiceToDownloads = async (invoiceUrl, fileName) => {
    try {
      // First, download the file to cache
      const cacheFileUri = FileSystem.cacheDirectory + fileName;
      console.log("Downloading to cache:", cacheFileUri);
      
      const downloadResult = await FileSystem.downloadAsync(invoiceUrl, cacheFileUri);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }

      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(cacheFileUri);
      if (!fileInfo.exists) {
        throw new Error("File was not created");
      }

      console.log("File downloaded to cache successfully");

      if (Platform.OS === 'android') {
        // For Android, try to save to Downloads folder
        try {
          // Request storage permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs access to storage to save invoice files',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            // Try to copy to Downloads folder
            const downloadsPath = FileSystem.documentDirectory + '../Downloads/' + fileName;
            
            try {
              await FileSystem.copyAsync({
                from: cacheFileUri,
                to: downloadsPath
              });
              
              console.log("File saved to Downloads:", downloadsPath);
              return { success: true, message: "Invoice saved to Downloads folder" };
            } catch (copyError) {
              console.log("Could not copy to Downloads, using share dialog:", copyError);
              // Fallback to share dialog
              return await shareFile(cacheFileUri, fileName);
            }
          } else {
            console.log("Storage permission denied, using share dialog");
            // Fallback to share dialog
            return await shareFile(cacheFileUri, fileName);
          }
        } catch (permissionError) {
          console.log("Permission error, using share dialog:", permissionError);
          // Fallback to share dialog
          return await shareFile(cacheFileUri, fileName);
        }
      } else {
        // For iOS, use share dialog
        return await shareFile(cacheFileUri, fileName);
      }
    } catch (error) {
      console.error("Error in saveInvoiceToDownloads:", error);
      throw error;
    }
  };

  // Function to share file
  const shareFile = async (fileUri, fileName) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${fileName}`,
        });
        
        return { success: true, message: "Invoice ready to share" };
      } else {
        throw new Error("Sharing not available");
      }
    } catch (error) {
      console.error("Error in shareFile:", error);
      throw error;
    }
  };

  const fetchCustomerBookings = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      
      if (!userData) {
        console.warn("No userData found in AsyncStorage");
        return;
      }

      const parsedData = JSON.parse(userData);
      
      if (!parsedData || !parsedData.custID) {
        console.warn("Invalid userData or missing custID:", parsedData);
        return;
      }

      const custID = parsedData.custID;
      const response = await axios.get(`${API_URL}Bookings/${custID}`);
      
      if (response.data) {
        setCustomerBookings(response.data);
        console.log("Customer bookings:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch customer bookings:", error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Always fetch fresh customer bookings first
      await fetchCustomerBookings();
      
      // Get the latest customer bookings from state
      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        throw new Error("No user data found");
      }
      
      const parsedData = JSON.parse(userData);
      if (!parsedData || !parsedData.custID) {
        throw new Error("Invalid user data");
      }
      
      const custID = parsedData.custID;
      console.log("Fetching bookings for custID:", custID);
      
      // Fetch customer bookings
      const bookingsResponse = await axios.get(`${API_URL}Bookings/${custID}`);
      const customerBookingsData = bookingsResponse.data || [];
      console.log("Customer bookings fetched:", customerBookingsData);
      
      // Fetch payments from the API
      const paymentsResponse = await axios.get(`${API_URL}Payments`);
      const allPayments = paymentsResponse.data || [];
      
      console.log("All payments:", allPayments);
      console.log("Customer bookings for filtering:", customerBookingsData);
      
      // Filter payments that belong to the current customer
      const customerInvoices = allPayments.filter(payment => {
        return customerBookingsData.some(booking => 
          booking.BookingTrackID === payment.BookingTrackID
        );
      });
      
      console.log("Filtered customer invoices:", customerInvoices);
      setInvoices(customerInvoices);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setAlertTitle("Error");
      setAlertMessage("Failed to load invoices. Please try again.");
      setAlertStatus("error");
      setShowAlert(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCustomerBookings().then(() => {
      fetchInvoices();
    });
  }, [customerBookings]);

  useFocusEffect(
    useCallback(() => {
      fetchInvoices();
    }, [])
  );

  const downloadInvoice = async (invoice) => {
    if (!invoice.FolderPath) {
      setAlertTitle("Error");
      setAlertMessage("Invoice download link not available");
      setAlertStatus("error");
      setShowAlert(true);
      return;
    }

    try {
      setDownloadingInvoice(invoice.PaymentID);
      
      // Create filename with timestamp to avoid conflicts
      const timestamp = new Date().getTime();
      const fileName = `MyCarBuddy_Invoice_${invoice.InvoiceNumber || invoice.PaymentID}_${timestamp}.pdf`;
      
      console.log("Downloading invoice:", invoice.FolderPath);
      console.log("Filename:", fileName);
      
      // Use the new saveInvoiceToDownloads function
      const result = await saveInvoiceToDownloads(invoice.FolderPath, fileName);
      
      setAlertTitle("Success");
      setAlertMessage(result.message);
      setAlertStatus("success");
      setShowAlert(true);
      
    } catch (error) {
      console.error("Download error:", error);
      
      // Fallback: Try to open the URL directly in browser
      try {
        const canOpen = await Linking.canOpenURL(invoice.FolderPath);
        if (canOpen) {
          await Linking.openURL(invoice.FolderPath);
          setAlertTitle("Info");
          setAlertMessage("Opening invoice in browser for download");
          setAlertStatus("info");
          setShowAlert(true);
        } else {
          throw new Error("Cannot open download link");
        }
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        setAlertTitle("Error");
        setAlertMessage("Failed to download invoice. Please try again.");
        setAlertStatus("error");
        setShowAlert(true);
      }
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primary} />
          <CustomText style={styles.loadingText}>Loading invoices...</CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      


      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {invoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <CustomText style={styles.emptyTitle}>No Invoices Found</CustomText>
            <CustomText style={styles.emptySubtitle}>
              You don't have any invoices yet. Invoices will appear here after successful payments.
            </CustomText>
          </View>
        ) : (
          <View style={styles.invoiceList}>
            {invoices.map((invoice, index) => (
              <View key={invoice.PaymentID} style={styles.invoiceCard}>
                <View style={styles.invoiceHeader}>
                  <View style={styles.invoiceInfo}>
                    <CustomText style={styles.invoiceNumber}>
                      {invoice.InvoiceNumber || `Payment #${invoice.PaymentID}`}
                    </CustomText>
                    <CustomText style={styles.bookingTrackId}>
                      {invoice.BookingTrackID}
                    </CustomText>
                  </View>
                  <View style={styles.statusContainer}>
                    <Ionicons
                      name={getPaymentStatusIcon(invoice.PaymentStatus)}
                      size={20}
                      color={getPaymentStatusColor(invoice.PaymentStatus)}
                    />
                    <CustomText
                      style={[
                        styles.statusText,
                        { color: getPaymentStatusColor(invoice.PaymentStatus) }
                      ]}
                    >
                      {invoice.PaymentStatus}
                    </CustomText>
                  </View>
                </View>

                <View style={styles.invoiceDetails}>
                  <View style={styles.detailRow}>
                    <CustomText style={styles.detailLabel}>Amount:</CustomText>
                    <CustomText style={styles.detailValue}>
                      {formatAmount(invoice.AmountPaid)}
                    </CustomText>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <CustomText style={styles.detailLabel}>Payment Mode:</CustomText>
                    <CustomText style={styles.detailValue}>
                      {invoice.PaymentMode}
                    </CustomText>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <CustomText style={styles.detailLabel}>Date:</CustomText>
                    <CustomText style={styles.detailValue}>
                      {formatDate(invoice.PaymentDate)}
                    </CustomText>
                  </View>
                  
                  {invoice.TransactionID && (
                    <View style={styles.detailRow}>
                      <CustomText style={styles.detailLabel}>Transaction ID:</CustomText>
                      <CustomText style={styles.detailValue} numberOfLines={1}>
                        {invoice.TransactionID}
                      </CustomText>
                    </View>
                  )}
                </View>

                {invoice.FolderPath && (
                  <TouchableOpacity
                    style={[
                      styles.downloadButton,
                      downloadingInvoice === invoice.PaymentID && styles.downloadButtonDisabled
                    ]}
                    onPress={() => downloadInvoice(invoice)}
                    disabled={downloadingInvoice === invoice.PaymentID}
                  >
                    {downloadingInvoice === invoice.PaymentID ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="download" size={20} color="white" />
                    )}
                    <CustomText style={styles.downloadButtonText}>
                      {downloadingInvoice === invoice.PaymentID ? "Downloading..." : "Download Invoice"}
                    </CustomText>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={showAlert}
        status={alertStatus}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: color.primary,
  },
  // header: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   paddingHorizontal: 16,
  //   paddingVertical: 12,
  //   backgroundColor: color.primary,
  // },
  // backButton: {
  //   marginRight: 16,
  // },
  // headerTitle: {
  //   ...globalStyles.f18Bold,
  //   color: "white",
  // },
  content: {
    flex: 1,
    // backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    ...globalStyles.f14Medium,
    color: "#666",
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    ...globalStyles.f18Bold,
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...globalStyles.f14Regular,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
     invoiceList: {
     padding: 16,
   },
  invoiceCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    ...globalStyles.f16Bold,
    color: "#333",
    marginBottom: 4,
  },
  bookingTrackId: {
    ...globalStyles.f12Medium,
    color: "#666",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    ...globalStyles.f12Bold,
    marginLeft: 4,
    textTransform: "capitalize",
  },
  invoiceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    ...globalStyles.f14Medium,
    color: "#666",
  },
  detailValue: {
    ...globalStyles.f14Bold,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  downloadButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  downloadButtonText: {
    ...globalStyles.f14Bold,
    color: "white",
    marginLeft: 8,
  },
});
