import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/Button';
import { Card, ErrorBox, FieldLabel, inputStyle, MutedText, NoticeBox, Screen } from '@/components/ui';
import { colors, space } from '@/theme';

/** Log in, or create an account (the same screen, like the website's AuthForm). */
export default function LoginScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already logged in: go to the dashboard.
  if (auth.user) {
    return <Redirect href="/" />;
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
      <View style={styles.brand}>
        <Text style={styles.title}>RESET</Text>
        <MutedText>Build better days. One habit at a time.</MutedText>
      </View>

      <Card>
        <Text style={styles.heading}>{isRegister ? 'Create your account' : 'Log in'}</Text>

        {!isRegister && auth.sessionEnded && (
          <NoticeBox message="Your session has ended. Please log in again." />
        )}

        <View style={styles.field}>
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

        <View style={styles.field}>
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
          <Text style={styles.switch}>
            {isRegister ? 'Already have an account? ' : 'New to RESET? '}
            <Text style={styles.switchLink}>{isRegister ? 'Log in' : 'Create an account'}</Text>
          </Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { gap: space[1], marginTop: space[3] },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: 3, color: colors.accent },
  heading: { fontSize: 20, fontWeight: '700', color: colors.text },
  field: { gap: space[1] },
  switch: { textAlign: 'center', color: colors.textMuted, paddingVertical: space[2] },
  switchLink: { color: colors.accent, fontWeight: '700' },
});
