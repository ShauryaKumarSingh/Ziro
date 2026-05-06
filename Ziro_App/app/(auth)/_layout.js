import { Stack } from 'expo-router';

export default function AuthLayout() {
  // This layout component wraps the login and signup screens.
  // We use a Stack navigator here, but hide the header for a cleaner look.
  return <Stack screenOptions={{ headerShown: false }} />;
}