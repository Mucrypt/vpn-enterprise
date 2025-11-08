import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  
  const { login, setBiometricEnabled } = useAuthStore();

  React.useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
        fallbackLabel: 'Use password',
      });
      
      if (result.success) {
        // In production, retrieve stored credentials securely
        await handleLogin('demo@example.com', 'stored_password');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleLogin = async (userEmail?: string, userPassword?: string) => {
    const loginEmail = userEmail || email;
    const loginPassword = userPassword || password;

    if (!loginEmail || !loginPassword) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol name="shield.fill" size={64} color="#10B981" />
          <Text style={styles.title}>VPN Enterprise</Text>
          <Text style={styles.subtitle}>Secure. Private. Fast.</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <IconSymbol name="envelope.fill" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <IconSymbol name="lock.fill" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity onPress={() => {
            // TODO: Create forgot password screen
            Alert.alert('Coming Soon', 'Password reset functionality will be available soon!');
          }}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={() => handleLogin()}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}>
                <Text style={styles.loginButtonText}>Sign In</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          {biometricAvailable && (
            <>
              <Text style={styles.orText}>OR</Text>
              <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
                <IconSymbol name="faceid" size={24} color="#10B981" />
                <Text style={styles.biometricText}>Sign in with Biometrics</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup' as any)}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Mode */}
        <TouchableOpacity
          style={styles.demoButton}
          onPress={() => handleLogin('demo@vpnenterprise.com', 'demo123')}>
          <Text style={styles.demoText}>Continue as Guest (Demo Mode)</Text>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#FFFFFF',
    fontSize: 16,
  },
  forgotPassword: {
    color: '#10B981',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 24,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  orText: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 24,
  },
  biometricText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  signupLink: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  demoText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
