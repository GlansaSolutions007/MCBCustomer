// components/PackageSkeleton.js

import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonContent from 'react-native-skeleton-content';

const PackageSkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((_, index) => (
        <SkeletonContent
          key={index}
          isLoading={true}
          containerStyle={styles.skeletonContainer}
          layout={[
            {
              key: 'image',
              width: 80,
              height: 80,
              borderRadius: 8,
              marginRight: 10,
            },
            {
              key: 'textBlock',
              flexDirection: 'column',
              children: [
                { key: 'title', width: 180, height: 20, marginBottom: 6 },
                { key: 'subtitle', width: 140, height: 20, marginBottom: 6 },
                { key: 'desc', width: 100, height: 20 },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  skeletonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
});

export default PackageSkeleton;
