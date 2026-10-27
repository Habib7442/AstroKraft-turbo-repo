import React, { useCallback, useState } from "react";
import { Alert, Image, Linking, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { BlogPost } from "@astrokraft/db";
import { useSupabase } from "@/lib/supabase";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import {
  Button,
  EmptyState,
  FilterPills,
  LoadingState,
  RefreshableScrollView,
  Screen,
  ScreenHeader,
  StatusBadge
} from "@/components/ui";

const STOREFRONT_BLOG_URL = "https://www.astrokraft.online/en/blog";
const FILTERS = ["all", "published", "draft"] as const;
type Filter = (typeof FILTERS)[number];

type BlogListItem = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "cover_image_url" | "status" | "published_at" | "updated_at"
>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BlogsScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image_url, status, published_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    setPosts((data as BlogListItem[]) || []);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      await loadPosts();
    } catch (err) {
      console.error("Error fetching blog posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Focus, not mount - coming back from the editor must show the saved post.
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await loadPosts();
    } catch (err) {
      console.error("Error refreshing blog posts:", err);
    }
  });

  const handleDelete = (post: BlogListItem) => {
    Alert.alert(
      "Delete Post",
      `Delete "${post.title}"? ${post.status === "published" ? "It will disappear from the website and its link will stop working." : ""}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("blog_posts").delete().eq("id", post.id);
              if (error) throw error;
              fetchPosts();
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  const visiblePosts = filter === "all" ? posts : posts.filter((p) => p.status === filter);
  const publishedCount = posts.filter((p) => p.status === "published").length;

  return (
    <Screen>
      <ScreenHeader
        title="Blog"
        subtitle={`${publishedCount} published · ${posts.length - publishedCount} drafts`}
        action={<Button label="+ New Post" compact onPress={() => router.push("/blog-editor")} />}
      >
        <FilterPills options={FILTERS} value={filter} onChange={setFilter} />
      </ScreenHeader>

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : visiblePosts.length === 0 ? (
          <EmptyState
            title={filter === "all" ? "No Blog Posts Yet" : `No ${filter} posts`}
            description='Tap "+ New Post" to write an article with images, videos and FAQs.'
          />
        ) : (
          visiblePosts.map((post) => (
            <View key={post.id} className="bg-surface-card border border-surface-border rounded-xl shadow-sm overflow-hidden">
              <View className="relative">
                <Image
                  source={{ uri: post.cover_image_url }}
                  style={{ width: "100%", aspectRatio: 1.91, backgroundColor: "#F1ECFA" }}
                  resizeMode="cover"
                />
                <View className="absolute top-3 right-3">
                  <StatusBadge
                    label={post.status === "published" ? "Published" : "Draft"}
                    tone={post.status === "published" ? "success" : "saffron"}
                  />
                </View>
              </View>

              <View className="p-4 gap-2">
                <Text className="text-base font-rubik-bold text-foreground" numberOfLines={2}>
                  {post.title}
                </Text>
                <Text className="text-xs text-ink-body" numberOfLines={2}>
                  {post.excerpt}
                </Text>
                <Text className="text-[11px] text-ink-muted">
                  {post.status === "published" && post.published_at
                    ? `Published ${formatDate(post.published_at)}`
                    : `Last edited ${formatDate(post.updated_at)}`}
                  {"  ·  "}/blog/{post.slug}
                </Text>

                <View className="flex-row justify-end gap-2 pt-3 border-t border-surface-border">
                  {post.status === "published" ? (
                    <Button
                      label="View"
                      variant="secondary"
                      compact
                      onPress={() => Linking.openURL(`${STOREFRONT_BLOG_URL}/${post.slug}`)}
                    />
                  ) : null}
                  <Button
                    label="Edit"
                    variant="secondary"
                    compact
                    onPress={() => router.push({ pathname: "/blog-editor", params: { id: post.id } })}
                  />
                  <Button label="Delete" variant="dangerSoft" compact onPress={() => handleDelete(post)} />
                </View>
              </View>
            </View>
          ))
        )}
      </RefreshableScrollView>
    </Screen>
  );
}
