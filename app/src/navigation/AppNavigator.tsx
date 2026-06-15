import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

import { Colors } from '@constants/colors';
import type { RootStackParamList } from '@app-types/index';

import SplashScreen from '@screens/SplashScreen';
import OnboardingScreen from '@screens/OnboardingScreen';
import HomeScreen from '@screens/HomeScreen';
import FlashAskScreen from '@screens/FlashAskScreen';
import SnapReorderScreen from '@screens/SnapReorderScreen';
import CheckoutScreen from '@screens/CheckoutScreen';
import ConfirmedScreen from '@screens/ConfirmedScreen';
import SwapAIScreen from '@screens/SwapAIScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bgBase },
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="FlashAsk"
            component={FlashAskScreen}
            options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
          />
          <Stack.Screen
            name="SnapReorder"
            component={SnapReorderScreen}
            options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ animation: 'slide_from_right', gestureEnabled: true }}
          />
          <Stack.Screen
            name="Confirmed"
            component={ConfirmedScreen}
            options={{ animation: 'slide_from_right', gestureEnabled: false }}
          />
          <Stack.Screen
            name="SwapAI"
            component={SwapAIScreen}
            options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
