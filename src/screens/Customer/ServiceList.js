import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import globalStyles from "../../styles/globalStyles";
import CustomText from "../../components/CustomText";
import { color } from "../../styles/theme";

export default function ServiceList() {
  const [selectedTab, setSelectedTab] = useState("New");

  const tabs = ["New", "Completed"];

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      {/* Tabs as full-width buttons */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.tabButtonActive
            ]}
          >
            <CustomText style={[
              styles.tabButtonText,
              selectedTab === tab && styles.tabButtonTextActive
            ]}>
              {tab}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <CustomText style={{ color: "#333" }}>
          Showing <CustomText style={{ fontWeight: "bold", color: "#007AFF" }}>{selectedTab}</CustomText> Services
        </CustomText>

        <View style={{ marginTop: 20, alignItems: "center" }}>
          <CustomText style={{ color: "#999" }}>
            No {selectedTab.toLowerCase()} services yet.
          </CustomText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#ddd",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },
  tabButtonActive: {
    backgroundColor: color.primary,
  },
  tabButtonText: {
    color: "#333",
    ...globalStyles.f12Bold
  },
  tabButtonTextActive: {
    color: "#fff",
  },
});
