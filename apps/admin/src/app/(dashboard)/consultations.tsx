import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Consultation } from "@astrokraft/db";
import { formatINR, CONSULTATION_TRANSITIONS, type ConsultationStatus } from "@astrokraft/core";
import { useSupabase } from "@/lib/supabase";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import {
  Button,
  Card,
  CategoryPicker,
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

interface AstrologerOption {
  id: string;
  name: string;
  astrologer_categories: { category_id: string }[];
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
  const [astrologers, setAstrologers] = useState<AstrologerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConsultationFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // Which consultation's astrologer picker is currently expanded — customers
  // no longer choose an astrologer at booking time, so this is where that
  // choice actually gets made now.
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState<string | null>(null);

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

  const loadAstrologers = async () => {
    const { data, error } = await supabase
      .from("astrologers")
      .select("id, name, astrologer_categories(category_id)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    setAstrologers((data as AstrologerOption[]) || []);
  };

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      await Promise.all([loadConsultations(), loadAstrologers()]);
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
      await Promise.all([loadConsultations(), loadAstrologers()]);
    } catch (err) {
      console.error("Error refreshing consultations:", err);
    }
  });

  const astrologerOptionsFor = (categoryId: string | undefined) => {
    // Astrologers who cover this consultation's category are listed first
    // (the common case), with everyone else still available below in case
    // an admin needs to assign outside the usual category match.
    const inCategory = categoryId
      ? astrologers.filter((a) => a.astrologer_categories.some((c) => c.category_id === categoryId))
      : [];
    const rest = astrologers.filter((a) => !inCategory.includes(a));
    return [...inCategory, ...rest].map((a) => ({ id: a.id, label: a.name }));
  };

  const handleAssignAstrologer = async (consultation: ConsultationWithJoins, astrologerId: string) => {
    const astrologer = astrologers.find((a) => a.id === astrologerId);
    if (!astrologer) return;

    setAssignLoading(consultation.id);
    try {
      const { error } = await supabase
        .from("consultations")
        .update({ astrologer_id: astrologer.id, astrologer_name: astrologer.name })
        .eq("id", consultation.id);
      if (error) throw error;
      setAssigningId(null);
      await loadConsultations();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to assign astrologer.");
    } finally {
      setAssignLoading(null);
    }
  };

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
                  <Text
                    className={`text-sm font-rubik-bold flex-1 ${item.astrologer_name ? "text-foreground" : "text-destructive"}`}
                    numberOfLines={1}
                  >
                    {item.astrologer_name || "Not yet assigned"}
                  </Text>
                  <StatusBadge label={formatStatusLabel(item.status)} tone={STATUS_TONE[item.status as ConsultationStatus] ?? "neutral"} />
                </View>

                {item.consultation_categories?.name ? (
                  <Text className="text-[10px] font-rubik-bold uppercase text-gold">{item.consultation_categories.name}</Text>
                ) : null}

                {item.status === "booked" ? (
                  <>
                    <TouchableOpacity onPress={() => setAssigningId(assigningId === item.id ? null : item.id)}>
                      <Text className="text-xs font-rubik-semibold text-primary">
                        {assigningId === item.id ? "Cancel" : item.astrologer_name ? "Reassign Astrologer" : "Assign Astrologer"}
                      </Text>
                    </TouchableOpacity>

                    {assigningId === item.id ? (
                      <View className="gap-2 rounded-lg bg-background border border-surface-border p-2">
                        <CategoryPicker
                          options={astrologerOptionsFor(item.category_id)}
                          value={item.astrologer_id ?? null}
                          onChange={(astrologerId) => handleAssignAstrologer(item, astrologerId)}
                        />
                        {assignLoading === item.id ? <Text className="text-[10px] text-ink-muted">Saving…</Text> : null}
                      </View>
                    ) : null}
                  </>
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
