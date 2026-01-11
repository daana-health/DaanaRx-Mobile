import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { setAuth } from '../../store/authSlice';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { colors, fontSize, fontWeight, spacing, layout } from '../../lib/theme';

const SIGN_IN = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      user {
        userId
        username
        email
        userRole
        clinicId
        createdAt
        updatedAt
      }
      clinic {
        clinicId
        name
        primaryColor
        secondaryColor
        logoUrl
        createdAt
        updatedAt
      }
      token
    }
  }
`;

type SignInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const [signIn, { loading }] = useMutation(SIGN_IN);

  const handleSignIn = async () => {
    try {
      const { data } = await signIn({
        variables: { input: { email, password } },
      });

      if (data?.signIn) {
        dispatch(setAuth(data.signIn));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>DaanaRx Mobile</Text>
            <Text style={styles.subtitle}>HIPAA-Compliant Medication Tracking</Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />

              <Button
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
                style={styles.button}
              />

              <Button
                title="Create Account"
                onPress={() => {
                  console.log('Create Account button pressed');
                  console.log('Navigation object:', navigation);
                  navigation.navigate('SignUp');
                }}
                variant="outline"
                style={styles.button}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.muted,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing['2xl'],
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
    color: colors.mutedForeground,
    marginBottom: spacing['4xl'],
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: spacing.sm,
  },
});
