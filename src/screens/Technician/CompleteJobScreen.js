import React from 'react';
import { View, Text } from 'react-native';
import CustomText from '../../components/CustomText';

export default function CompleteJobScreen() {
  return (
     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <CustomText>Completed Job screen</CustomText>
    </View>
  );
}