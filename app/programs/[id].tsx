// app/programs/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { COLORS } from '../../styles/theme';

export default function ProgramDetailsScreen() {
  const { id } = useLocalSearchParams();
  interface Program {
    id: string;
    title: string;
    // Add other properties of the program object here if needed
  }

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const programDoc = await getDoc(doc(db, 'programs', id as string));
        if (programDoc.exists()) {
          const programData = programDoc.data();
          if (programData && programData.title) {
            setProgram({ id: programDoc.id, title: programData.title });
          } else {
            console.error('Program data is missing required fields');
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching program:', error);
        setLoading(false);
      }
    };

    if (id) {
      fetchProgram();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!program) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text>Program not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Text>Program Details for: {program.title}</Text>
      {/* Rest of your program details UI */}
    </View>
  );
}