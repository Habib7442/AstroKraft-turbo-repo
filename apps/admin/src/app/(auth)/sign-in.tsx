import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSignIn } from "@clerk/expo/legacy";
import { Button, Screen, TextField } from "@/components/ui";

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSignInPress = async () => {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        setErrorMessage(`Sign-in requires an additional step (${result.status}) that isn't supported here.`);
      }
    } catch (err: any) {
      setErrorMessage(err.errors?.[0]?.message || "Invalid credentials or unauthorized access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center px-6">
        <View className="bg-surface-alt border border-surface-border p-6 rounded-2xl shadow-md">
          <View className="items-center mb-6">
            <Image
              source={require("../../../assets/logo.png")}
              style={{ width: 200, height: 56, resizeMode: "contain" }}
            />
            <Text className="text-gold text-xs font-rubik-bold tracking-widest uppercase mt-3">
              ASTROKRAFT MOBILE ADMIN
            </Text>
            <Text className="text-xl font-rubik-bold text-foreground mt-1">Admin Sign In</Text>
          </View>

          {errorMessage ? (
            <View className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
              <Text className="text-red-700 text-xs font-rubik-medium">{errorMessage}</Text>
            </View>
          ) : null}

          <View className="gap-4">
            <TextField
              label="Email Address"
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailAddress}
              placeholder="admin@astrokraft.online"
              onChangeText={setEmailAddress}
            />
            <TextField
              label="Password"
              isPassword
              value={password}
              placeholder="••••••••"
              onChangeText={setPassword}
            />
            <Button label="Sign In to Admin" onPress={onSignInPress} loading={loading} className="mt-2" />
          </View>
        </View>
      </View>
    </Screen>
  );
}
