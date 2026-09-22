import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSignIn } from "@clerk/expo";
import { Button, Screen, TextField } from "@/components/ui";

// Both "new device" (needs_client_trust) and real MFA (needs_second_factor)
// draw from the same signIn.supportedSecondFactors list and the same `mfa`
// API - Clerk's own docs describe needs_client_trust as "complete a second
// factor verification to establish Device Trust". Only the code-based
// strategies are handled: email_code/phone_code need a code sent first,
// totp/backup_code just need the code the user already has. email_link is a
// polling/magic-link flow with a different UI shape entirely, not a code
// input - deliberately left unsupported (rather than pretending it works)
// until it's actually needed.
const CODE_STRATEGIES = ["email_code", "phone_code", "totp", "backup_code"] as const;
type CodeStrategy = (typeof CODE_STRATEGIES)[number];
const NEEDS_SEND: Record<CodeStrategy, boolean> = { email_code: true, phone_code: true, totp: false, backup_code: false };
const STRATEGY_LABEL: Record<CodeStrategy, string> = {
  email_code: "the code we emailed you",
  phone_code: "the code we texted you",
  totp: "the code from your authenticator app",
  backup_code: "one of your backup codes"
};

export default function SignInScreen() {
  // Current (non-legacy) API: `signIn` is always defined here (never null),
  // and its `.status` updates reactively as the sign-in attempt progresses -
  // branching the UI directly off it (rather than mirroring it into local
  // state) keeps one source of truth instead of two that can drift apart.
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loading = fetchStatus === "fetching";
  const needsVerification = signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor";
  const factor = signIn.supportedSecondFactors?.find((f): f is typeof f & { strategy: CodeStrategy } =>
    (CODE_STRATEGIES as readonly string[]).includes(f.strategy)
  );

  const finalizeAndGo = async () => {
    await signIn.finalize({ navigate: () => router.replace("/") });
  };

  // Shared by both needs_client_trust and needs_second_factor: pick the
  // first strategy this screen actually knows how to render, send a code
  // for it if the strategy needs one, or fail clearly if nothing usable is
  // offered (e.g. only email_link is configured). Also used by the "Resend
  // code" button below - if the first send fails, the verification form is
  // already showing (it's driven by signIn.status, not by send succeeding),
  // so this needs to be re-triggerable from inside that form, not just once
  // right after the password step.
  const sendCode = async () => {
    if (!factor) {
      setErrorMessage(
        "Sign-in needs a verification method this app doesn't support yet. Please contact an admin."
      );
      return;
    }
    if (!NEEDS_SEND[factor.strategy]) return; // totp/backup_code: nothing to send, just show the code field

    setErrorMessage("");
    const { error: sendError } =
      factor.strategy === "phone_code" ? await signIn.mfa.sendPhoneCode() : await signIn.mfa.sendEmailCode();
    if (sendError) {
      setErrorMessage(sendError.message || "Could not send a verification code. Please try again.");
    }
  };

  // Escape hatch out of the verification form: signIn.status alone decides
  // which form renders, and there was previously no way back to it from
  // here - not after a failed send, and not to correct a wrong password
  // typo that only surfaces as a wrong OTP later.
  const onStartOver = async () => {
    setCode("");
    setErrorMessage("");
    await signIn.reset();
  };

  const onSignInPress = async () => {
    setErrorMessage("");
    const { error } = await signIn.password({ emailAddress, password });
    if (error) {
      setErrorMessage(error.message || "Invalid credentials or unauthorized access.");
      return;
    }

    if (signIn.status === "complete") {
      await finalizeAndGo();
    } else if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
      await sendCode();
    } else {
      setErrorMessage(`Sign-in requires an additional step (${signIn.status}) that isn't supported here.`);
    }
  };

  const onVerifyPress = async () => {
    setErrorMessage("");
    if (!factor) return;

    const { error } =
      factor.strategy === "phone_code"
        ? await signIn.mfa.verifyPhoneCode({ code })
        : factor.strategy === "totp"
          ? await signIn.mfa.verifyTOTP({ code })
          : factor.strategy === "backup_code"
            ? await signIn.mfa.verifyBackupCode({ code })
            : await signIn.mfa.verifyEmailCode({ code });

    if (error) {
      setErrorMessage(error.message || "Invalid or expired code.");
      return;
    }

    if (signIn.status === "complete") {
      await finalizeAndGo();
    } else {
      setErrorMessage(`Sign-in requires an additional step (${signIn.status}) that isn't supported here.`);
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

          {needsVerification && factor ? (
            <View className="gap-4">
              <Text className="text-xs text-ink-muted">
                {signIn.status === "needs_client_trust"
                  ? "New device detected. "
                  : "This account requires a second verification step. "}
                Enter {STRATEGY_LABEL[factor.strategy]} below to finish signing in.
              </Text>
              <TextField
                label="Verification Code"
                keyboardType={factor.strategy === "backup_code" ? "default" : "number-pad"}
                value={code}
                placeholder="123456"
                onChangeText={setCode}
              />
              <Button label="Verify & Sign In" onPress={onVerifyPress} loading={loading} className="mt-2" />
              {NEEDS_SEND[factor.strategy] ? (
                <Button label="Resend Code" onPress={sendCode} loading={loading} variant="secondary" compact />
              ) : null}
              <Button label="Use a Different Account" onPress={onStartOver} variant="secondary" compact />
            </View>
          ) : (
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
          )}
        </View>
      </View>
    </Screen>
  );
}
