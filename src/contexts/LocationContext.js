import React, { createContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [locationText, setLocationText] = useState('Detecting location...');
  const [locationStatus, setLocationStatus] = useState('idle'); // granted, denied, error

  return (
    <LocationContext.Provider
      value={{
        locationText,
        locationStatus,
        setLocationText,
        setLocationStatus,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
