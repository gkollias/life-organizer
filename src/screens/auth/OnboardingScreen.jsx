// src/screens/auth/OnboardingScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../styles/theme';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const onboardingData = [
    {
      title: 'Welcome to LifeOrganizer',
      description: 'Your personal assistant for structuring your daily routine and building better habits.',
      image: '🎯'
    },
    {
      title: 'Follow Daily Programs',
      description: 'Create custom routines or use templates designed by experts to optimize your day.',
      image: '📋'
    },
    {
      title: 'Stay on Track',
      description: 'Get timely notifications and track your progress to maintain consistency.',
      image: '⏰'
    },
    {
      title: 'Achieve Your Goals',
      description: 'Transform your life one day at a time by following structured programs.',
      image: '🏆'
    }
  ];
  
  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      navigation.replace('Main');
    }
  };
  
  const handleSkip = () => {
    navigation.replace('Main');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newPage = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentPage(newPage);
        }}
        scrollEventThrottle={16}
      >
        {onboardingData.map((item, index) => (
          <View key={index} style={styles.page}>
            <View style={styles.imageContainer}>
              <Text style={styles.imageText}>{item.image}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.paginationContainer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentPage && styles.activePaginationDot
              ]}
            />
          ))}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentPage < onboardingData.length - 1 ? 'Next' : 'Get Started'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  skipContainer: {
    alignItems: 'flex-end',
    padding: SIZES.padding,
  },
  skipText: {
    ...FONTS.body3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  page: {
    width,
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  imageContainer: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding * 3,
  },
  imageText: {
    fontSize: 80,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  description: {
    ...FONTS.body2,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  pagination: {
    flexDirection: 'row',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 4,
  },
  activePaginationDot: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  buttonContainer: {
    paddingHorizontal: SIZES.padding * 2,
    paddingBottom: SIZES.padding * 2,
  },
  button: {
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
});

export default OnboardingScreen;