// src/screens/auth/ForgotPasswordScreen.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/auth-context';
import { COLORS, FONTS, SIZES } from '../../styles/theme';

const ForgotPasswordScreen = ({ navigation }) => {
    const { resetPassword, error, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleResetPassword = async () => {
        // Clear any previous errors
        clearError();

        // Form validation
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            await resetPassword(email);
            setResetSent(true);
        } catch (error) {
            console.error('Password reset error:', error);
            Alert.alert('Error', error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <View style={styles.content}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← Back to Sign In</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>
                            Enter your email address and we'll send you instructions to reset your password.
                        </Text>
                    </View>

                    {resetSent ? (
                        <View style={styles.successContainer}>
                            <Text style={styles.successTitle}>Email Sent!</Text>
                            <Text style={styles.successMessage}>
                                Please check your email for instructions on how to reset your password.
                            </Text>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => navigation.navigate('SignIn')}
                            >
                                <Text style={styles.buttonText}>Return to Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    placeholderTextColor={COLORS.gray}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    autoCompleteType="email"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleResetPassword}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.buttonText}>Send Reset Email</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: SIZES.padding * 2,
    },
    backButton: {
        marginBottom: SIZES.padding * 2,
    },
    backButtonText: {
        ...FONTS.body3,
        color: COLORS.primary,
    },
    header: {
        marginBottom: SIZES.padding * 3,
    },
    title: {
        ...FONTS.h1,
        color: COLORS.black,
        marginBottom: SIZES.base,
    },
    subtitle: {
        ...FONTS.body2,
        color: COLORS.gray,
    },
    form: {
        marginBottom: SIZES.padding * 3,
    },
    inputContainer: {
        marginBottom: SIZES.padding,
    },
    label: {
        ...FONTS.body3,
        color: COLORS.black,
        marginBottom: SIZES.base,
    },
    input: {
        height: 50,
        backgroundColor: COLORS.lightGray,
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.padding,
        ...FONTS.body2,
        color: COLORS.black,
    },
    button: {
        height: 50,
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SIZES.padding,
    },
    buttonText: {
        ...FONTS.h3,
        color: COLORS.white,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
    },
    successTitle: {
        ...FONTS.h2,
        color: COLORS.primary,
        marginBottom: SIZES.padding,
    },
    successMessage: {
        ...FONTS.body2,
        color: COLORS.gray,
        textAlign: 'center',
        marginBottom: SIZES.padding * 2,
    },
});

export default ForgotPasswordScreen;