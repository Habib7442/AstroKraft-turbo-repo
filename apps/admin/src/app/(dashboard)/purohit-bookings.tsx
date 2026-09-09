import React, { useEffect, useRef, useState } from "react";
import { Alert, Linking, Text, TouchableOpacity, View } from "react-native";
import { PurohitBooking } from "@astrokraft/db";
import { PUROHIT_BOOKING_TRANSITIONS, type PurohitBookingStatus } from "@astrokraft/core";
import { useSupabase } from "@/lib/supabase";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useAttachmentDownload } from "@/hooks/use-attachment-download";
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
  // preferred_date is a plain DATE column ("YYYY-MM-DD", no time/zone) while
  // created_at is a real TIMESTAMPTZ — both get formatted here. A bare
  // "YYYY-MM-DD" string is parsed as UTC midnight per spec, which shifts to
  // the previous day once toLocaleDateString renders it in a negative-UTC
  // device timezone. Anchoring date-only values to local midnight avoids
  // that shift; a full timestamp already carries its own offset.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const value = dateOnly ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return value.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

export default function PurohitBookingsScreen() {
  const supabase = useSupabase();
  const { loading: attachmentLoading, getDownloadUrl } = useAttachmentDownload();
  const [bookings, setBookings] = useState<PurohitBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PurohitBookingFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Guards against an in-flight request resolving after a newer one (e.g.
  // rapidly tapping filter pills) — only the caller holding the latest
  // requestRef value is allowed to act on its result. requestId is minted
  // by the CALLER (fetchBookings/onRefresh/runTransition), not inside
  // loadBookings, so a superseded caller can recognize its own result as
  // stale even when the query throws, and skip touching `loading`/
  // `loadError` too, not just `bookings` — checking staleness only around
  // setBookings would still let a stale request's *error* propagate to a
  // newer request's caller, and still let a stale request's `finally`
  // clear the spinner while a newer request was still in flight.
  const requestRef = useRef(0);

  const loadBookings = async (requestId: number) => {
    let query = supabase.from("purohit_bookings").select("*").order("created_at", { ascending: false });
    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (requestId !== requestRef.current) return;
    if (error) throw error;
    setBookings((data as PurohitBooking[]) || []);
  };

  const fetchBookings = async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      await loadBookings(requestId);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      console.error("Error fetching purohit bookings:", err);
      setLoadError("Could not load bookings. Pull to refresh.");
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    const requestId = ++requestRef.current;
    try {
      await loadBookings(requestId);
      if (requestId === requestRef.current) setLoadError(null);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      console.error("Error refreshing purohit bookings:", err);
      setLoadError("Could not load bookings. Pull to refresh.");
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
    } catch (err: any) {
      setActionLoading(null);
      Alert.alert("Error", err.message || "Failed to update booking status.");
      return;
    }

    // The update itself already succeeded — a failure past this point is a
    // reload problem, not an update problem, and must never surface as
    // "Failed to update" (the admin would otherwise retry an action that
    // already went through, or worse, second-guess a status that's correct
    // in the database but stale on screen).
    try {
      await loadBookings(++requestRef.current);
    } catch (err) {
      console.error("Error reloading bookings after status update:", err);
      setLoadError("Status updated, but the list couldn't refresh. Pull to refresh.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewAttachment = async (key: string) => {
    try {
      const downloadUrl = await getDownloadUrl(key);
      await Linking.openURL(downloadUrl);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not open the attachment.");
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
        ) : loadError ? (
          <EmptyState title="Load Failed" description={loadError} />
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
                  {item.attachment_key ? (
                    <TouchableOpacity disabled={attachmentLoading} onPress={() => handleViewAttachment(item.attachment_key!)}>
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
