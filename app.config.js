import "dotenv/config";
export default {
  expo: {
    name: "My Car Buddy",
    slug: "my-car-buddy",
    projectId:"6850b1f3-7aec-4d07-8b8b-1802366d658a",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#136D6E",
      },
      edgeToEdgeEnabled: true,
      package: "com.itglansa.mcbc",
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
      config: {
        googleMaps: {
          apiKey: "AIzaSyB1e_nM-v-G5EYZSrXjElyHo61I4qb5rNc",
        },
      },
      usesCleartextTraffic: true, // optional, for HTTP URLs
    },
    ios: {
      bundleIdentifier: "com.itglansa.mcbc",
      buildNumber: "1.0.0",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
      API_IMAGE_URL: process.env.API_IMAGE_URL,
      RAZORPAY_KEY: process.env.RAZORPAY_KEY,
      GOOGLE_MAPS_APIKEY: "AIzaSyB1e_nM-v-G5EYZSrXjElyHo61I4qb5rNc",
      eas: {
        projectId: "6850b1f3-7aec-4d07-8b8b-1802366d658a",
      },
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/icons/active.png",
          color: "#ffffff",
          sounds: ["./assets/notificationtone.wav"],
        },
      ],
    ],
    owner: "itglansa",
  },
};
