import React, { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "./button";

interface FormSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitting?: boolean;
  children: ReactNode;
}

export function FormSheet({
  visible,
  title,
  description,
  onClose,
  onSubmit,
  submitLabel = "Save",
  submitting,
  children
}: FormSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.backdrop}>
        <View className="bg-surface-alt rounded-t-3xl max-h-[88%]">
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1.5 rounded-full bg-surface-border" />
          </View>

          <View className="px-6 pt-3 pb-4">
            <Text className="text-lg font-rubik-bold text-foreground">{title}</Text>
            {description ? <Text className="text-xs text-ink-body mt-1">{description}</Text> : null}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-4">{children}</View>
          </ScrollView>

          <View className="flex-row gap-3 px-6 pt-4 pb-6 border-t border-surface-border">
            <Button label="Cancel" variant="secondary" flex onPress={onClose} />
            <Button label={submitLabel} variant="primary" flex loading={submitting} onPress={onSubmit} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 4
  }
});
