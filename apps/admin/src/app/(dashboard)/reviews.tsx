import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Review } from "@astrokraft/db";
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

const STATUS_TONE: Record<Review["status"], BadgeTone> = {
  pending: "saffron",
  approved: "success",
  rejected: "danger"
};

interface ReviewWithJoins extends Review {
  products: { title: string } | null;
  profiles: { full_name: string | null } | null;
}

interface ReviewAction {
  label: string;
  next: Review["status"];
  variant: ButtonVariant;
  confirmMessage?: string;
}

const STATUS_ACTIONS: Partial<Record<Review["status"], ReviewAction[]>> = {
  pending: [
    { label: "Approve", next: "approved", variant: "success" },
    { label: "Reject", next: "rejected", variant: "destructive", confirmMessage: "Reject this review?" }
  ],
  approved: [{ label: "Reject", next: "rejected", variant: "destructive", confirmMessage: "Reject this approved review?" }],
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

export default function ReviewsScreen() {
  const supabase = useSupabase();
  const [reviews, setReviews] = useState<ReviewWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewFilter>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadReviews = async () => {
    let query = supabase
      .from("reviews")
      .select("*, products(title), profiles(full_name)")
      .order("created_at", { ascending: false });
    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) throw error;
    setReviews((data as ReviewWithJoins[]) || []);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      await loadReviews();
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await loadReviews();
    } catch (err) {
      console.error("Error refreshing reviews:", err);
    }
  });

  const runTransition = async (review: ReviewWithJoins, nextStatus: Review["status"]) => {
    setActionLoading(review.id + nextStatus);
    try {
      const { error } = await supabase.from("reviews").update({ status: nextStatus }).eq("id", review.id);
      if (error) throw error;
      await loadReviews();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update review status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = (review: ReviewWithJoins, action: ReviewAction) => {
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
      <ScreenHeader title="Reviews" subtitle="Customer Review Moderation">
        <FilterPills options={REVIEW_FILTERS} value={filter} onChange={setFilter} scroll />
      </ScreenHeader>

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : reviews.length === 0 ? (
          <EmptyState title="No Reviews Found" description="Customer reviews submitted on the website will appear here." />
        ) : (
          reviews.map((item) => {
            const actions = STATUS_ACTIONS[item.status] ?? [];

            return (
              <Card key={item.id} className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-rubik-bold text-foreground flex-1" numberOfLines={1}>
                    {item.products?.title || "Unknown Product"}
                  </Text>
                  <StatusBadge label={item.status.toUpperCase()} tone={STATUS_TONE[item.status]} />
                </View>

                <View className="border-t border-surface-border pt-2 gap-1">
                  <View className="flex-row items-center gap-2">
                    <Stars rating={item.rating} />
                    {item.is_verified_buyer ? (
                      <Text className="text-[10px] font-rubik-bold uppercase text-primary">Verified Buyer</Text>
                    ) : null}
                  </View>
                  <Text className="text-xs text-ink-body">{item.comment}</Text>
                  <Text className="text-xs text-ink-muted">
                    {item.profiles?.full_name || "Anonymous"} · {formatDate(item.created_at)}
                  </Text>
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
