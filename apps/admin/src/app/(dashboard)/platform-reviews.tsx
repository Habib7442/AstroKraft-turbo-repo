import React, { useEffect, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { PlatformReview } from "@astrokraft/db";
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

const REVIEW_FILTERS = ["all", "pending", "approved", "rejected"] as const;
type ReviewFilter = (typeof REVIEW_FILTERS)[number];

const STATUS_TONE: Record<PlatformReview["status"], BadgeTone> = {
  pending: "saffron",
  approved: "success",
  rejected: "danger"
};

interface ReviewAction {
  label: string;
  next: PlatformReview["status"];
  variant: ButtonVariant;
  confirmMessage?: string;
}

const STATUS_ACTIONS: Partial<Record<PlatformReview["status"], ReviewAction[]>> = {
  pending: [
    { label: "Approve", next: "approved", variant: "success" },
    { label: "Reject", next: "rejected", variant: "destructive", confirmMessage: "Reject this testimonial?" }
  ],
  approved: [{ label: "Reject", next: "rejected", variant: "destructive", confirmMessage: "Reject this approved testimonial?" }],
  rejected: [{ label: "Approve", next: "approved", variant: "success" }]
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Stars({ rating }: { rating: number }) {
  return (
    <Text className="text-sm text-gold">
      {"★".repeat(rating)}
      <Text className="text-surface-border">{"★".repeat(5 - rating)}</Text>
    </Text>
  );
}

// Same load/refresh/transition structure as reviews.tsx (product review
// moderation) - platform_reviews has no user_id or product to join (a
// submitter isn't signed in), so this is the simpler of the two screens.
export default function PlatformReviewsScreen() {
  const supabase = useSupabase();
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewFilter>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const transitioningReviewIds = useRef(new Set<string>());
  const requestIdRef = useRef(0);
  // runTransition's post-update reload runs asynchronously, well after the
  // button tap that started it — if the admin switches filter tabs while
  // that update is in flight, runTransition's own closure still has the
  // OLD filter, and the requestId counter alone doesn't know that: it would
  // happily overwrite the newer, correctly-filtered list with results for a
  // filter the admin isn't even looking at anymore. Reading the filter from
  // a ref instead of the closed-over state value means every call to
  // loadReviews - no matter which render's closure invoked it - always
  // queries whatever filter is actually on screen right now.
  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const loadReviews = async (requestId: number) => {
    let query = supabase.from("platform_reviews").select("*").order("created_at", { ascending: false });
    if (filterRef.current !== "all") {
      query = query.eq("status", filterRef.current);
    }

    const { data, error } = await query;
    if (requestId !== requestIdRef.current) return;
    if (error) throw error;
    setReviews((data as PlatformReview[]) || []);
  };

  const fetchReviews = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      await loadReviews(requestId);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Error fetching platform reviews:", err);
      setLoadError("Could not load testimonials. Pull to refresh.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    const requestId = ++requestIdRef.current;
    try {
      await loadReviews(requestId);
      if (requestId === requestIdRef.current) setLoadError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Error refreshing platform reviews:", err);
      setLoadError("Could not load testimonials. Pull to refresh.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  });

  const runTransition = async (review: PlatformReview, nextStatus: PlatformReview["status"]) => {
    if (transitioningReviewIds.current.has(review.id)) return;
    transitioningReviewIds.current.add(review.id);
    setActionLoading(review.id);

    try {
      const { error } = await supabase.from("platform_reviews").update({ status: nextStatus }).eq("id", review.id);
      if (error) throw error;
    } catch (err: any) {
      transitioningReviewIds.current.delete(review.id);
      setActionLoading(null);
      Alert.alert("Error", err.message || "Failed to update testimonial status.");
      return;
    }

    const requestId = ++requestIdRef.current;
    try {
      await loadReviews(requestId);
    } catch (err) {
      console.error("Error reloading platform reviews after status update:", err);
      setLoadError("Status updated, but the list couldn't refresh. Pull to refresh.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
      transitioningReviewIds.current.delete(review.id);
      setActionLoading(null);
    }
  };

  const handleAction = (review: PlatformReview, action: ReviewAction) => {
    const run = () => runTransition(review, action.next);
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
      <ScreenHeader title="Testimonials" subtitle="Public Platform Review Moderation">
        <FilterPills options={REVIEW_FILTERS} value={filter} onChange={setFilter} scroll />
      </ScreenHeader>

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : loadError && reviews.length === 0 ? (
          <EmptyState title="Load Failed" description={loadError} />
        ) : reviews.length === 0 ? (
          <EmptyState title="No Testimonials Found" description="Public testimonials submitted on the website will appear here." />
        ) : (
          <>
            {loadError ? (
              <View className="rounded-xl border border-saffron bg-saffron/10 px-4 py-3">
                <Text className="text-xs font-rubik-medium text-saffron">{loadError}</Text>
              </View>
            ) : null}
            {reviews.map((item) => {
              const actions = STATUS_ACTIONS[item.status] ?? [];

              return (
                <Card key={item.id} className="gap-2">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-rubik-bold text-foreground flex-1" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <StatusBadge label={item.status.toUpperCase()} tone={STATUS_TONE[item.status]} />
                  </View>

                  <View className="border-t border-surface-border pt-2 gap-1">
                    <Stars rating={item.rating} />
                    <Text className="text-xs text-ink-body">{item.comment}</Text>
                    <Text className="text-xs text-ink-muted">
                      {formatDate(item.created_at)}
                      {item.submitter_ip ? ` · ${item.submitter_ip}` : ""}
                    </Text>
                  </View>

                  {actions.length > 0 ? (
                    <View className="pt-2 border-t border-surface-border gap-2">
                      {actions.map((action) => (
                        <Button
                          key={action.next}
                          label={action.label}
                          variant={action.variant}
                          loading={actionLoading === item.id}
                          onPress={() => handleAction(item, action)}
                        />
                      ))}
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
