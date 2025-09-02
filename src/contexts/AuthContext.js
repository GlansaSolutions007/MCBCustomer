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
    setUser(userData);

    await AsyncStorage.setItem("authToken", userData.token);
    await AsyncStorage.setItem("userData", JSON.stringify(userData));

    const response1 = await axios.get(
      `${API_URL}CustomerVehicles/CustId?CustId=${userData.custID}`
    );

    const primaryCar = response1.data.find((car) => car.IsPrimary);

    const primaryCarId = primaryCar?.VehicleID || null;

    // console.log(response1, "Carrrrr Data");
    await AsyncStorage.setItem("primaryVehicleId", primaryCarId ? String(primaryCarId) : "");
    setUser((prev) => ({ ...prev, primaryVehicleId: primaryCarId }));
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
