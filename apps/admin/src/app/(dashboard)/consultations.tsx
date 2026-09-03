import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Consultation } from "@astrokraft/db";
import { formatINR, CONSULTATION_TRANSITIONS, type ConsultationStatus } from "@astrokraft/core";
import { useSupabase } from "@/lib/supabase";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import {
  Button,
  Card,
  EmptyState,
  FilterPills,
  LoadingState,
  RefreshableScrollView,
  Screen,
  ScreenHeader,
  StatusBadge
} from "@/components/ui";
import type { BadgeTone, ButtonVariant } from "@/components/ui";

const CONSULTATION_FILTERS = ["all", "booked", "payment_pending", "completed", "cancelled", "no_show"] as const;
type ConsultationFilter = (typeof CONSULTATION_FILTERS)[number];

const STATUS_TONE: Record<ConsultationStatus, BadgeTone> = {
  payment_pending: "saffron",
  payment_failed: "danger",
  booked: "gold",
  completed: "success",
  cancelled: "danger",
  no_show: "neutral"
};

interface ConsultationAction {
  label: string;
  next: ConsultationStatus;
  variant: ButtonVariant;
  confirmMessage?: string;
}

const STATUS_ACTIONS: Partial<Record<ConsultationStatus, ConsultationAction[]>> = {
  payment_pending: [{ label: "Cancel", next: "cancelled", variant: "destructive" }],
  payment_failed: [{ label: "Cancel", next: "cancelled", variant: "destructive" }],
  booked: [
    { label: "Mark Completed", next: "completed", variant: "success" },
    { label: "Mark No-Show", next: "no_show", variant: "dangerSoft", confirmMessage: "Mark this client as a no-show?" },
    { label: "Cancel Booking", next: "cancelled", variant: "destructive", confirmMessage: "Cancel this consultation?" }
  ]
};

interface ConsultationWithJoins extends Consultation {
  consultation_categories: { name: string } | null;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

export default function ConsultationsScreen() {
  const supabase = useSupabase();
  const [consultations, setConsultations] = useState<ConsultationWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConsultationFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadConsultations = async () => {
    let query = supabase
      .from("consultations")
      .select("*, consultation_categories(name)")
      .order("created_at", { ascending: false });
    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) throw error;
    setConsultations((data as ConsultationWithJoins[]) || []);
  };

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      await loadConsultations();
    } catch (err) {
      console.error("Error fetching consultations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [filter]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await loadConsultations();
    } catch (err) {
      console.error("Error refreshing consultations:", err);
    }
  });

  const runTransition = async (consultation: ConsultationWithJoins, nextStatus: ConsultationStatus) => {
    const allowedNext = CONSULTATION_TRANSITIONS[consultation.status as ConsultationStatus];
    if (!allowedNext?.includes(nextStatus)) {
      Alert.alert("Transition Error", `Cannot transition from ${consultation.status} to ${nextStatus}.`);
      return;
    }

    setActionLoading(consultation.id + nextStatus);
    try {
      const { error } = await supabase.from("consultations").update({ status: nextStatus }).eq("id", consultation.id);
      if (error) throw error;
      await loadConsultations();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update consultation status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = (consultation: ConsultationWithJoins, action: ConsultationAction) => {
    const run = () => runTransition(consultation, action.next);
    if (action.confirmMessage) {
      Alert.alert("Confirm", action.confirmMessage, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", style: "destructive", onPress: run }
      ]);
    } else {
      run();
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Consultations" subtitle="Astrologer Bookings & Schedule">
        <FilterPills options={CONSULTATION_FILTERS} value={filter} onChange={setFilter} scroll />
      </ScreenHeader>

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : consultations.length === 0 ? (
          <EmptyState title="No Consultations Found" description="Consultation bookings from the website will appear here." />
        ) : (
          consultations.map((item) => {
            const kundli = item.kundli_details as { dob?: string; time_of_birth?: string; place_of_birth?: string };
            const actions = STATUS_ACTIONS[item.status as ConsultationStatus] ?? [];

            return (
              <Card key={item.id} className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-rubik-bold text-foreground flex-1" numberOfLines={1}>
                    {item.astrologer_name}
                  </Text>
                  <StatusBadge label={formatStatusLabel(item.status)} tone={STATUS_TONE[item.status as ConsultationStatus] ?? "neutral"} />
                </View>

                {item.consultation_categories?.name ? (
                  <Text className="text-[10px] font-rubik-bold uppercase text-gold">{item.consultation_categories.name}</Text>
                ) : null}

                <View className="border-t border-surface-border pt-2 gap-1">
                  <Text className="text-xs text-ink-body">
                    Client: <Text className="font-rubik-medium text-foreground">{item.customer_name || "—"}</Text>
                  </Text>
                  {item.customer_phone ? <Text className="text-xs text-ink-body">Phone: {item.customer_phone}</Text> : null}
                  {kundli?.dob ? (
                    <Text className="text-xs text-ink-muted">
                      DOB: {kundli.dob}
                      {kundli.time_of_birth ? ` · ${kundli.time_of_birth}` : ""}
                      {kundli.place_of_birth ? ` · ${kundli.place_of_birth}` : ""}
                    </Text>
                  ) : null}
                </View>

                <View className="flex-row justify-between items-center pt-1">
                  <Text className="text-[10px] text-ink-muted">{formatDateTime(item.created_at)}</Text>
                  <Text className="text-sm font-rubik-bold text-primary">{formatINR(item.amount)}</Text>
                </View>

                {actions.length > 0 ? (
                  <View className="pt-2 border-t border-surface-border gap-2">
                    {actions.map((action) => (
                      <Button
                        key={action.next}
                        label={action.label}
                        variant={action.variant}
                        loading={actionLoading === item.id + action.next}
                        onPress={() => handleAction(item, action)}
                      />
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </RefreshableScrollView>
    </Screen>
  );
}
