import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { changePassword } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { space, useTheme } from '../theme';
import { Button } from './Button';
import { Card, ErrorBox, FieldLabel, MutedText, NoticeBox, useInputStyle } from './ui';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** "Change password": closed at first; opens into a small form. */
export function ChangePasswordCard() {
  const c = useTheme();
  const inputStyle = useInputStyle();
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function close() {
    setIsOpen(false);
    setCurrent('');
    setNext('');
    setRepeat('');
    setError(null);
  }

  async function handleSave() {
    setError(null);
    // Typing it twice catches a typo before it locks you out.
    if (next !== repeat) {
      setError('The two new passwords are not the same.');
      return;
    }
    if (next.length < 8) {
      setError('The new password needs at least 8 characters.');
      return;
    }
    setIsSaving(true);
    try {
      await changePassword(current, next);
      close();
      setDone(true);
    } catch (err) {
      setError(errorMessage(err, 'Could not change the password.'));
    } finally {
      setIsSaving(false);
    }
  }

  const passwordInput = (
    value: string,
    onChange: (text: string) => void,
    kind: 'password' | 'newPassword',
  ) => (
    <TextInput
      style={inputStyle}
      value={value}
      onChangeText={onChange}
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      textContentType={kind} // lets iPhone suggest and save passwords
      maxLength={72}
      placeholderTextColor={c.textMuted}
    />
  );

  return (
    <Card>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>Password</Text>
      {done && !isOpen && (
        <NoticeBox message="Password changed. Your other devices have been logged out." />
      )}

      {!isOpen ? (
        <Button
          title="Change password"
          variant="secondary"
          onPress={() => {
            setIsOpen(true);
            setDone(false);
          }}
        />
      ) : (
        <View style={{ gap: space[3] }}>
          <View style={{ gap: space[1] }}>
            <FieldLabel>Current password</FieldLabel>
            {passwordInput(current, setCurrent, 'password')}
          </View>
          <View style={{ gap: space[1] }}>
            <FieldLabel>New password (at least 8 characters)</FieldLabel>
            {passwordInput(next, setNext, 'newPassword')}
          </View>
          <View style={{ gap: space[1] }}>
            <FieldLabel>New password again</FieldLabel>
            {passwordInput(repeat, setRepeat, 'newPassword')}
          </View>
          {error && <ErrorBox message={error} />}
          <Button
            title={isSaving ? 'Saving…' : 'Change password'}
            onPress={() => void handleSave()}
            disabled={isSaving}
          />
          <Button title="Cancel" variant="secondary" onPress={close} disabled={isSaving} />
        </View>
      )}
    </Card>
  );
}

/**
 * "Delete account": step 1 is a button, step 2 asks for the password, and the
 * iPhone's own "Are you sure?" popup comes last. Only then is everything deleted.
 */
export function DeleteAccountCard() {
  const c = useTheme();
  const inputStyle = useInputStyle();
  const { deleteAccount } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function reallyDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      // On success you are logged out and taken to the login screen.
      await deleteAccount(password);
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the account.'));
      setIsDeleting(false);
    }
  }

  function confirm() {
    if (!password) {
      setError('Type your password to confirm.');
      return;
    }
    Alert.alert(
      'Delete your account?',
      'Your habits, ticks and streaks will be deleted for good. This can’t be undone.',
      [
        { text: 'Keep my account', style: 'cancel' },
        { text: 'Delete forever', style: 'destructive', onPress: () => void reallyDelete() },
      ],
    );
  }

  return (
    <Card danger>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.danger }}>Delete account</Text>
      <MutedText>
        This deletes your account and everything in it: habits, ticks and streaks. It can’t be
        undone.
      </MutedText>

      {!isConfirming ? (
        <Button title="Delete account…" variant="danger" onPress={() => setIsConfirming(true)} />
      ) : (
        <View style={{ gap: space[3] }}>
          <View style={{ gap: space[1] }}>
            <FieldLabel>Type your password to confirm</FieldLabel>
            <TextInput
              style={inputStyle}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              maxLength={72}
            />
          </View>
          {error && <ErrorBox message={error} />}
          <Button
            title={isDeleting ? 'Deleting…' : 'Delete forever'}
            variant="danger"
            onPress={confirm}
            disabled={isDeleting}
          />
          <Button
            title="Keep my account"
            variant="secondary"
            onPress={() => {
              setIsConfirming(false);
              setPassword('');
              setError(null);
            }}
            disabled={isDeleting}
          />
        </View>
      )}
    </Card>
  );
}
