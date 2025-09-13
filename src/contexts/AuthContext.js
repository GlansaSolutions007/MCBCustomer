// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const userData = await AsyncStorage.getItem("userData");
        const primaryVehicleId = await AsyncStorage.getItem("primaryVehicleId");
        if (token && userData) {
          setUser({ token, ...JSON.parse(userData), primaryVehicleId: primaryVehicleId ? Number(primaryVehicleId) : null });
        }
      } catch (e) {
        console.log("Error loading user data:", e);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  const login = async (userData) => {
    try {
      console.log("🔐 AuthContext: Starting login process...");
      console.log("📊 UserData received:", userData);
      
      setUser(userData);

      // Save auth token
      await AsyncStorage.setItem("authToken", userData.token);
      console.log("✅ Auth token saved to AsyncStorage");

      // Save user data
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      console.log("✅ User data saved to AsyncStorage");

      // Verify userData was saved
      const savedUserData = await AsyncStorage.getItem("userData");
      if (!savedUserData) {
        throw new Error("Failed to save userData to AsyncStorage");
      }
      console.log("✅ UserData verification successful");

      // Fetch customer vehicles
      const response1 = await axios.get(
        `${API_URL}CustomerVehicles/CustId?CustId=${userData.custID}`
      );

      const primaryCar = response1.data.find((car) => car.IsPrimary);
      const primaryCarId = primaryCar?.VehicleID || null;

      // Save primary vehicle ID
      await AsyncStorage.setItem("primaryVehicleId", primaryCarId ? String(primaryCarId) : "");
      setUser((prev) => ({ ...prev, primaryVehicleId: primaryCarId }));
      
      console.log("✅ Login process completed successfully");
    } catch (error) {
      console.error("❌ Error in AuthContext login:", error);
      throw error; // Re-throw to be caught by LoginScreen
    }
  };

  const logout = async () => {
    const storedToken = await AsyncStorage.getItem("pushToken");
    const userDataRaw = await AsyncStorage.getItem("userData");
    let custID = null;
    try {
      if (userDataRaw) {
        const parsed = JSON.parse(userDataRaw);
        custID = parsed?.custID ?? null;
      }
    } catch (_) {}

    setUser(null);

    try {
      if (custID && storedToken) {
        await axios.post(`${API_URL}Push/unregister`, {
          userType: "customer",
          id: Number(custID),
          token: storedToken,
        });
      }
    } catch (e) {}

    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("userData");
    await AsyncStorage.removeItem("primaryVehicleId");
    await AsyncStorage.removeItem("pushToken");
    await AsyncStorage.removeItem("pushTokenType");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
