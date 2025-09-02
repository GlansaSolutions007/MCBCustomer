import "dotenv/config";

export default {
  expo: {
    name: "My Car Buddy",
    slug: "my-car-buddy",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.itglansa.mcbc", // ✅ keep consistent
      buildNumber: "1.0.0",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#136D6E",
      },
      googleServicesFile: "google-services.json",
      edgeToEdgeEnabled: true,
      package: "com.itglansa.mcbc", // ✅ match iOS
      googleServicesFile: "./google-services.json",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "SYSTEM_ALERT_WINDOW",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_APIKEY,
        },
      },
      usesCleartextTraffic: true,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
      API_IMAGE_URL: process.env.API_IMAGE_URL,
      RAZORPAY_KEY: process.env.RAZORPAY_KEY,
      GOOGLE_MAPS_APIKEY: process.env.GOOGLE_MAPS_APIKEY,
      eas: {
        projectId: "6850b1f3-7aec-4d07-8b8b-1802366d658a",
      },
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/icons/active.png",
          color: "#017F77",
          sounds: ["./assets/notificationtone.wav"],
        },
      ],
      [
        "expo-background-fetch",
        {
          minimumInterval: 15 * 60, // 15 minutes
        },
      ],
    ],
    owner: "itglansa",
  },
};
