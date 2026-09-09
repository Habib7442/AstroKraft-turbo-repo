import React, { useEffect, useState } from "react";
import { Alert, Linking, Text, TouchableOpacity, View } from "react-native";
import { PurohitBooking } from "@astrokraft/db";
import { PUROHIT_BOOKING_TRANSITIONS, type PurohitBookingStatus } from "@astrokraft/core";
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

const PUROHIT_BOOKING_FILTERS = ["all", "new", "contacted", "confirmed", "completed", "cancelled"] as const;
type PurohitBookingFilter = (typeof PUROHIT_BOOKING_FILTERS)[number];

const STATUS_TONE: Record<PurohitBookingStatus, BadgeTone> = {
  new: "saffron",
  contacted: "gold",
  confirmed: "primary",
  completed: "success",
  cancelled: "danger"
};

const MATERIALS_LABEL: Record<PurohitBooking["materials_option"], string> = {
  purohit_only: "Purohit only",
  purohit_and_samagri: "Purohit + Samagri"
};

interface PurohitBookingAction {
  label: string;
  next: PurohitBookingStatus;
  variant: ButtonVariant;
  confirmMessage?: string;
}

const STATUS_ACTIONS: Partial<Record<PurohitBookingStatus, PurohitBookingAction[]>> = {
  new: [
    { label: "Mark Contacted", next: "contacted", variant: "primary" },
    { label: "Cancel", next: "cancelled", variant: "destructive", confirmMessage: "Cancel this booking request?" }
  ],
  contacted: [
    { label: "Mark Confirmed", next: "confirmed", variant: "success" },
    { label: "Cancel", next: "cancelled", variant: "destructive", confirmMessage: "Cancel this booking request?" }
  ],
  confirmed: [
    { label: "Mark Completed", next: "completed", variant: "success" },
    { label: "Cancel Booking", next: "cancelled", variant: "destructive", confirmMessage: "Cancel this booking?" }
  ]
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

export default function PurohitBookingsScreen() {
  const supabase = useSupabase();
  const [bookings, setBookings] = useState<PurohitBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PurohitBookingFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadBookings = async () => {
    let query = supabase.from("purohit_bookings").select("*").order("created_at", { ascending: false });
    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) throw error;
    setBookings((data as PurohitBooking[]) || []);
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      await loadBookings();
    } catch (err) {
      console.error("Error fetching purohit bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await loadBookings();
    } catch (err) {
      console.error("Error refreshing purohit bookings:", err);
    }
  });

  const runTransition = async (booking: PurohitBooking, nextStatus: PurohitBookingStatus) => {
    const allowedNext = PUROHIT_BOOKING_TRANSITIONS[booking.status];
    if (!allowedNext?.includes(nextStatus)) {
      Alert.alert("Transition Error", `Cannot transition from ${booking.status} to ${nextStatus}.`);
      return;
    }

    setActionLoading(booking.id + nextStatus);
    try {
      const { error } = await supabase.from("purohit_bookings").update({ status: nextStatus }).eq("id", booking.id);
      if (error) throw error;
      await loadBookings();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update booking status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = (booking: PurohitBooking, action: PurohitBookingAction) => {
    const run = () => runTransition(booking, action.next);
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
      <ScreenHeader title="Purohit Bookings" subtitle="Puja Lead Requests">
        <FilterPills options={PUROHIT_BOOKING_FILTERS} value={filter} onChange={setFilter} scroll />
      </ScreenHeader>

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : bookings.length === 0 ? (
          <EmptyState title="No Requests Found" description="Purohit booking requests from the website will appear here." />
        ) : (
          bookings.map((item) => {
            const actions = STATUS_ACTIONS[item.status] ?? [];

            return (
              <Card key={item.id} className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-rubik-bold text-foreground flex-1" numberOfLines={1}>
                    {item.ritual_type}
                  </Text>
                  <StatusBadge label={formatStatusLabel(item.status)} tone={STATUS_TONE[item.status]} />
                </View>

                <View className="border-t border-surface-border pt-2 gap-1">
                  <Text className="text-xs text-ink-body">
                    Client: <Text className="font-rubik-medium text-foreground">{item.name}</Text>
                  </Text>
                  <Text className="text-xs text-ink-body">Phone: {item.phone}</Text>
                  <Text className="text-xs text-ink-body">Location: {item.location}</Text>
                  <Text className="text-xs text-ink-muted">
                    Preferred: {formatDate(item.preferred_date)}
                    {item.preferred_time ? ` · ${item.preferred_time}` : ""} · {item.language_preference}
                  </Text>
                  <Text className="text-xs text-ink-muted">{MATERIALS_LABEL[item.materials_option]}</Text>
                  {item.message ? <Text className="text-xs text-ink-body">Note: {item.message}</Text> : null}
                  {item.attachment_url ? (
                    <TouchableOpacity onPress={() => Linking.openURL(item.attachment_url!)}>
                      <Text className="text-xs font-rubik-semibold text-primary underline">View Attachment</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View className="flex-row justify-between items-center pt-1">
                  <Text className="text-[10px] text-ink-muted">{formatDate(item.created_at)}</Text>
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
