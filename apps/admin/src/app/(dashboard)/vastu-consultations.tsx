import React, { useEffect, useRef, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { VastuFollowUpStatus, VastuLead, VastuLeadStatus } from "@astrokraft/db";
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
import type { BadgeTone } from "@/components/ui";

// VASTU by Biprangshu — 1:1 Business Vastu Consultations booked from
// consultation.astrokraft.online (apps/vastu). Rows live in vastu_leads,
// written by that app's API routes and Cal.com/Razorpay webhooks; admins
// read and update them here under the table's is_admin() RLS policies.

const FILTERS = ["upcoming", "unpaid", "past", "all"] as const;
type Filter = (typeof FILTERS)[number];

// A call stays under "upcoming" until 2 hours after its start, so a
// consultation that's running (or just ended) is still easy to find.
const UPCOMING_GRACE_MS = 2 * 60 * 60 * 1000;

const FOLLOW_UPS: { value: VastuFollowUpStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "interested_premium", label: "Premium interest" },
  { value: "converted", label: "Converted" },
  { value: "not_interested", label: "Not interested" }
];

const STATUS_TONE: Record<VastuLeadStatus, BadgeTone> = {
  lead: "neutral",
  booked: "primary",
  rescheduled: "gold",
  cancelled: "danger",
  completed: "success",
  no_show: "saffron"
};

function formatSlot(iso?: string | null) {
  if (!iso) return "Slot not set";
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata"
  });
}

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

export default function VastuConsultationsScreen() {
  const supabase = useSupabase();
  const [leads, setLeads] = useState<VastuLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Same latest-request-wins guard as purohit-bookings.tsx: a slow query for
  // a previous filter must not overwrite the list for the current one.
  const requestRef = useRef(0);

  const loadLeads = async (requestId: number) => {
    const cutoff = new Date(Date.now() - UPCOMING_GRACE_MS).toISOString();
    let query = supabase.from("vastu_leads").select("*");

    if (filter === "upcoming") {
      query = query
        .eq("payment_status", "paid")
        .in("status", ["booked", "rescheduled"])
        .gte("scheduled_start", cutoff)
        .order("scheduled_start", { ascending: true });
    } else if (filter === "unpaid") {
      // Booked a slot in Cal.com but haven't paid — the team's follow-up list.
      query = query
        .neq("payment_status", "paid")
        .not("cal_booking_uid", "is", null)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
    } else if (filter === "past") {
      query = query.eq("payment_status", "paid").lt("scheduled_start", cutoff).order("scheduled_start", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false }).limit(200);
    }

    const { data, error } = await query;
    if (requestId !== requestRef.current) return;
    if (error) throw error;
    setLeads((data as VastuLead[]) || []);
  };

  const fetchLeads = async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      await loadLeads(requestId);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      console.error("Error fetching vastu consultations:", err);
      setLoadError("Could not load consultations. Pull to refresh.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    const requestId = ++requestRef.current;
    try {
      await loadLeads(requestId);
      if (requestId === requestRef.current) setLoadError(null);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      console.error("Error refreshing vastu consultations:", err);
      setLoadError("Could not load consultations. Pull to refresh.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  });

  const save = async (lead: VastuLead, patch: Partial<Pick<VastuLead, "follow_up_status" | "status">>, key: string) => {
    setSavingId(lead.id + key);
    try {
      const { error } = await supabase.from("vastu_leads").update(patch).eq("id", lead.id);
      if (error) throw error;
      // Patch locally instead of reloading, so the card doesn't jump around.
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...patch } : l)));
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not save the change.");
    } finally {
      setSavingId(null);
    }
  };

  const openUrl = async (url: string, what: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", `Could not open ${what}.`);
    }
  };

  const markOutcome = (lead: VastuLead, next: "completed" | "no_show") => {
    const label = next === "completed" ? "completed" : "a no-show";
    Alert.alert("Confirm", `Mark this consultation as ${label}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => save(lead, { status: next }, next) }
    ]);
  };

  return (
    <Screen>
      <ScreenHeader title="1:1 Consultations" subtitle="VASTU by Biprangshu">
        <FilterPills options={FILTERS} value={filter} onChange={setFilter} scroll />
      </ScreenHeader>

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : loadError && leads.length === 0 ? (
          <EmptyState title="Load Failed" description={loadError} />
        ) : leads.length === 0 ? (
          <EmptyState
            title={filter === "upcoming" ? "No upcoming consultations" : "Nothing here"}
            description="Paid bookings from consultation.astrokraft.online appear here."
          />
        ) : (
          <>
            {loadError ? (
              <View className="rounded-xl border border-saffron bg-saffron/10 px-4 py-3">
                <Text className="text-xs font-rubik-medium text-saffron">{loadError}</Text>
              </View>
            ) : null}

            {leads.map((lead) => {
              const paid = lead.payment_status === "paid";
              const phoneDigits = digitsOnly(lead.whatsapp || "");
              const isPast = lead.scheduled_start ? new Date(lead.scheduled_start).getTime() < Date.now() : false;

              return (
                <Card key={lead.id} className="gap-3">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text className="text-base font-rubik-bold text-foreground" numberOfLines={1}>
                        {lead.full_name}
                      </Text>
                      <Text className="text-sm font-rubik-semibold text-primary mt-0.5">{formatSlot(lead.scheduled_start)} IST</Text>
                    </View>
                    <View className="items-end gap-1">
                      <StatusBadge label={paid ? "PAID" : lead.payment_status.toUpperCase()} tone={paid ? "success" : "saffron"} />
                      <StatusBadge label={lead.status.replace(/_/g, " ").toUpperCase()} tone={STATUS_TONE[lead.status]} />
                    </View>
                  </View>

                  {paid && lead.meeting_url && lead.status !== "cancelled" ? (
                    <Button
                      label="Join call"
                      variant="primary"
                      icon={<Ionicons name="videocam" size={16} color="#FFFFFF" />}
                      onPress={() => openUrl(lead.meeting_url!, "the meeting link")}
                    />
                  ) : null}

                  {phoneDigits ? (
                    <View className="flex-row gap-2">
                      <Button
                        label="Call"
                        variant="secondary"
                        compact
                        className="flex-1"
                        icon={<Ionicons name="call-outline" size={14} color="#5B21B6" />}
                        onPress={() => openUrl(`tel:+${phoneDigits}`, "the dialler")}
                      />
                      <Button
                        label="WhatsApp"
                        variant="secondary"
                        compact
                        className="flex-1"
                        icon={<Ionicons name="logo-whatsapp" size={14} color="#5B21B6" />}
                        onPress={() => openUrl(`https://wa.me/${phoneDigits}`, "WhatsApp")}
                      />
                    </View>
                  ) : null}

                  <View className="border-t border-surface-border pt-2 gap-1">
                    <Text className="text-xs text-ink-body">
                      Phone: <Text className="font-rubik-medium text-foreground">{lead.whatsapp || "—"}</Text>
                    </Text>
                    <Text className="text-xs text-ink-body">
                      Business:{" "}
                      <Text className="font-rubik-medium text-foreground">
                        {lead.business_category} ({lead.business_stage})
                      </Text>
                    </Text>
                    <Text className="text-xs text-ink-body">Location: {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}</Text>
                    <Text className="text-xs text-ink-body">Problems: {lead.problems?.length ? lead.problems.join(", ") : "—"}</Text>
                    <Text className="text-xs text-ink-body">
                      Floor plan:{" "}
                      {lead.floor_plan_available === null
                        ? "Not answered — ask on WhatsApp"
                        : lead.floor_plan_available
                          ? "Yes — ask them to share it on WhatsApp"
                          : "No"}
                    </Text>
                    {lead.utm_campaign || lead.utm_source ? (
                      <Text className="text-xs text-ink-muted">
                        Source: {[lead.utm_source, lead.utm_campaign].filter(Boolean).join(" · ")}
                      </Text>
                    ) : null}
                    {lead.admin_notes ? <Text className="text-xs text-ink-body">Note: {lead.admin_notes}</Text> : null}
                  </View>

                  <View className="border-t border-surface-border pt-2 gap-2">
                    <Text className="text-[11px] font-rubik-semibold text-ink-muted">FOLLOW-UP</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {FOLLOW_UPS.map((f) => {
                        const active = lead.follow_up_status === f.value;
                        return (
                          <Button
                            key={f.value}
                            label={f.label}
                            compact
                            variant={active ? "primary" : "secondary"}
                            loading={savingId === lead.id + f.value}
                            onPress={() => !active && save(lead, { follow_up_status: f.value }, f.value)}
                          />
                        );
                      })}
                    </View>
                  </View>

                  {paid && isPast && (lead.status === "booked" || lead.status === "rescheduled") ? (
                    <View className="flex-row gap-2 border-t border-surface-border pt-2">
                      <Button
                        label="Mark completed"
                        variant="success"
                        compact
                        className="flex-1"
                        loading={savingId === lead.id + "completed"}
                        onPress={() => markOutcome(lead, "completed")}
                      />
                      <Button
                        label="No-show"
                        variant="dangerSoft"
                        compact
                        className="flex-1"
                        loading={savingId === lead.id + "no_show"}
                        onPress={() => markOutcome(lead, "no_show")}
                      />
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </>
        )}
      </RefreshableScrollView>
    </Screen>
  );
}
