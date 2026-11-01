import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/Button';
import {
  Card,
  ErrorBox,
  FieldLabel,
  MutedText,
  NoticeBox,
  Screen,
  useInputStyle,
} from '@/components/ui';
import { space, useTheme } from '@/theme';

/** Log in, or create an account (the same screen, like the website's AuthForm). */
export default function LoginScreen() {
  const auth = useAuth();
  const c = useTheme();
  const inputStyle = useInputStyle();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logged in: go to the dashboard, or, just after registering, to pick a first climb.
  // (All hooks above run first, as React requires.)
  if (auth.user) {
    return <Redirect href={mode === 'register' ? '/welcome' : '/'} />;
  }

  const isRegister = mode === 'register';

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      if (isRegister) {
        await auth.register(email.trim(), password);
      } else {
        await auth.login(email.trim(), password);
      }
      // auth.user is now set, so this screen redraws and <Redirect> above takes over.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: space[1], marginTop: space[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
          <Ionicons name="sync" size={32} color={c.accent} />
          <Text style={{ fontSize: 32, fontWeight: '800', letterSpacing: 3, color: c.text }}>
            RESET
          </Text>
        </View>
        <MutedText>Build better days. One habit at a time.</MutedText>
      </View>

      <Card>
        <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>
          {isRegister ? 'Create your account' : 'Log in'}
        </Text>

        {!isRegister && auth.sessionEnded && (
          <NoticeBox message="Your session has ended. Please log in again." />
        )}

        <View style={{ gap: space[1] }}>
          <FieldLabel>Email</FieldLabel>
          <TextInput
            style={inputStyle}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
        </View>

        <View style={{ gap: space[1] }}>
          <FieldLabel>Password</FieldLabel>
          <TextInput
            style={inputStyle}
            value={password}
            onChangeText={setPassword}
            secureTextEntry // shows dots instead of letters
            textContentType={isRegister ? 'newPassword' : 'password'}
            maxLength={72}
            onSubmitEditing={() => void handleSubmit()}
          />
          {isRegister && <MutedText>At least 8 characters.</MutedText>}
        </View>

        {error && <ErrorBox message={error} />}

        <Button
          title={isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
        />

        <Pressable
          onPress={() => {
            setMode(isRegister ? 'login' : 'register');
            setError(null);
          }}
          accessibilityRole="button"
        >
          <Text style={{ textAlign: 'center', color: c.textMuted, paddingVertical: space[2] }}>
            {isRegister ? 'Already have an account? ' : 'New to RESET? '}
            <Text style={{ color: c.accent, fontWeight: '700' }}>
              {isRegister ? 'Log in' : 'Create an account'}
            </Text>
          </Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
