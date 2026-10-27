import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, Image, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BlogBlock, BlogFaq, BlogPost } from "@astrokraft/db";
import { blogPostSchema, slugify } from "@astrokraft/validators";
import { useSupabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/use-image-upload";
import { BLOCK_TYPES, BlockEditor, createBlock, newKey, type BlogBlockType, type EditorBlock } from "@/components/blog/block-editor";
import { Button, Card, LoadingState, Screen, ScreenHeader, StatusBadge, TextField } from "@/components/ui";

const UPLOAD_FOLDER = "blog";
const SITE_BLOG_PATH = "astrokraft.online/en/blog/";

type EditorFaq = BlogFaq & { key: string };

interface Draft {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  blocks: EditorBlock[];
  faqs: EditorFaq[];
  tags: string;
  authorName: string;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY_DRAFT: Draft = {
  title: "",
  slug: "",
  excerpt: "",
  coverImageUrl: "",
  coverImageAlt: "",
  blocks: [createBlock("paragraph")],
  faqs: [],
  tags: "",
  authorName: "AstroKraft",
  seoTitle: "",
  seoDescription: ""
};

function draftFromPost(post: BlogPost): Draft {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImageUrl: post.cover_image_url,
    coverImageAlt: post.cover_image_alt,
    blocks: (post.content ?? []).map((block) => ({ ...block, key: newKey() })),
    faqs: (post.faqs ?? []).map((faq) => ({ ...faq, key: newKey() })),
    tags: (post.tags ?? []).join(", "),
    authorName: post.author_name,
    seoTitle: post.seo_title ?? "",
    seoDescription: post.seo_description ?? ""
  };
}

// Drops the editor-only key, blank list lines and empty optional captions so
// what's stored is exactly what the storefront renders.
function cleanBlock({ key: _key, ...block }: EditorBlock): BlogBlock {
  const optional = (value?: string) => (value?.trim() ? value.trim() : undefined);
  switch (block.type) {
    case "list":
      return { ...block, items: block.items.map((i) => i.trim()).filter(Boolean) };
    case "quote":
      return { ...block, cite: optional(block.cite) };
    case "embed":
      return { ...block, url: block.url.trim(), caption: optional(block.caption) };
    case "images":
      return { ...block, images: block.images.map((img) => ({ ...img, caption: optional(img.caption) })) };
    default:
      return block;
  }
}

const FIELD_LABELS: Record<string, string> = {
  slug: "URL slug",
  title: "Title",
  excerpt: "Summary",
  cover_image_url: "Cover image",
  cover_image_alt: "Cover image alt text",
  content: "Sections",
  faqs: "FAQs",
  tags: "Tags",
  author_name: "Author",
  seo_title: "SEO title",
  seo_description: "SEO description"
};

// ["content", 3, "images", 0, "alt"] -> "Section 4 › image 1 › alt"
function describeIssuePath(path: (string | number)[]): string {
  const [field, index, ...rest] = path;
  if (field === "content" && typeof index === "number") {
    const tail = rest.map((p) => (typeof p === "number" ? `#${p + 1}` : p)).join(" › ");
    return `Section ${index + 1}${tail ? ` › ${tail}` : ""}`;
  }
  if (field === "faqs" && typeof index === "number") return `FAQ ${index + 1}`;
  return FIELD_LABELS[String(field)] ?? String(field);
}

function CharCount({ value, max, min }: { value: string; max: number; min?: number }) {
  const length = value.trim().length;
  const bad = length > max || (min !== undefined && length > 0 && length < min);
  return (
    <Text className={`text-[10px] text-right ${bad ? "text-red-700" : "text-ink-muted"}`}>
      {length}/{max}
      {min ? ` · min ${min}` : ""}
    </Text>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="gap-0.5">
      <Text className="text-sm font-rubik-bold text-foreground">{title}</Text>
      {hint ? <Text className="text-[11px] text-ink-muted leading-4">{hint}</Text> : null}
    </View>
  );
}

export default function BlogEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const supabase = useSupabase();
  const { uploading, pickAndUploadImage, pickAndUploadImages } = useImageUpload();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<"draft" | "published" | null>(null);
  const [existing, setExisting] = useState<BlogPost | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [slugEdited, setSlugEdited] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploadingBlockKey, setUploadingBlockKey] = useState<string | null>(null);

  const patch = (changes: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...changes }));
    setDirty(true);
  };

  // Hidden tab screens stay mounted between visits, so (re)load on every
  // focus: an existing post by id, or a blank form for "+ New Post".
  useFocusEffect(
    useCallback(() => {
      setDirty(false);
      setSlugEdited(false);
      if (!id) {
        setExisting(null);
        setDraft({ ...EMPTY_DRAFT, blocks: [createBlock("paragraph")] });
        return;
      }
      let cancelled = false;
      setLoading(true);
      supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error || !data) {
            Alert.alert("Error", error?.message ?? "Post not found.");
          } else {
            setExisting(data as BlogPost);
            setDraft(draftFromPost(data as BlogPost));
            setSlugEdited(true);
          }
          setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [id])
  );

  const leave = () => {
    if (!dirty) {
      router.navigate("/blogs");
      return;
    }
    Alert.alert("Discard changes?", "You have unsaved changes to this post.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          setDirty(false);
          router.navigate("/blogs");
        }
      }
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        leave();
        return true;
      });
      return () => sub.remove();
    }, [dirty])
  );

  const isPublished = existing?.status === "published";

  const handleTitleChange = (title: string) => {
    // Auto-derive the slug until it's edited by hand - but never silently
    // change a live post's URL.
    patch(slugEdited || isPublished ? { title } : { title, slug: slugify(title) });
  };

  const handlePickCover = async () => {
    try {
      const url = await pickAndUploadImage(UPLOAD_FOLDER);
      if (url) patch({ coverImageUrl: url });
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not upload the selected image.");
    }
  };

  const pickImagesForBlock = (key: string) => async () => {
    setUploadingBlockKey(key);
    try {
      return await pickAndUploadImages(UPLOAD_FOLDER, 10);
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not upload the selected images.");
      return [];
    } finally {
      setUploadingBlockKey(null);
    }
  };

  const updateBlock = (key: string, block: EditorBlock) =>
    patch({ blocks: draft.blocks.map((b) => (b.key === key ? block : b)) });

  const moveBlock = (index: number, direction: -1 | 1) => {
    const blocks = [...draft.blocks];
    const [moved] = blocks.splice(index, 1);
    blocks.splice(index + direction, 0, moved);
    patch({ blocks });
  };

  const removeBlock = (key: string) => {
    const block = draft.blocks.find((b) => b.key === key);
    const isEmpty =
      !block ||
      (block.type === "heading" || block.type === "paragraph" || block.type === "quote"
        ? !block.text.trim()
        : block.type === "list"
          ? !block.items.join("").trim()
          : block.type === "images"
            ? block.images.length === 0
            : !block.url.trim());
    const remove = () => patch({ blocks: draft.blocks.filter((b) => b.key !== key) });
    if (isEmpty) {
      remove();
      return;
    }
    Alert.alert("Remove section?", "Its content will be removed from the post.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: remove }
    ]);
  };

  const addBlock = (type: BlogBlockType) => patch({ blocks: [...draft.blocks, createBlock(type)] });

  const updateFaq = (key: string, changes: Partial<BlogFaq>) =>
    patch({ faqs: draft.faqs.map((f) => (f.key === key ? { ...f, ...changes } : f)) });

  const save = async (status: "draft" | "published") => {
    const candidate = {
      status,
      slug: draft.slug.trim(),
      title: draft.title,
      excerpt: draft.excerpt,
      cover_image_url: draft.coverImageUrl,
      cover_image_alt: draft.coverImageAlt,
      content: draft.blocks.map(cleanBlock),
      faqs: draft.faqs.map(({ key: _key, ...faq }) => faq),
      tags: draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      author_name: draft.authorName.trim() || "AstroKraft",
      seo_title: draft.seoTitle.trim() || null,
      seo_description: draft.seoDescription.trim() || null
    };

    const parsed = blogPostSchema.safeParse(candidate);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      Alert.alert(
        status === "published" ? "Can't publish yet" : "Can't save draft",
        `${describeIssuePath(issue.path)}: ${issue.message}`
      );
      return;
    }

    // Keep the original publish date on later edits/re-publishes - Google
    // reads it as the article's datePublished.
    const payload: Record<string, unknown> & { slug: string } = {
      ...parsed.data,
      published_at: status === "published" ? (existing?.published_at ?? new Date().toISOString()) : (existing?.published_at ?? null)
    };

    setSaving(status);
    try {
      const { data, error } = existing
        ? await supabase.from("blog_posts").update(payload).eq("id", existing.id).select("*").single()
        : await supabase.from("blog_posts").insert(payload).select("*").single();

      if (error) {
        if (error.code === "23505") {
          throw new Error(`Another post already uses the URL "/blog/${payload.slug}". Change the slug.`);
        }
        throw error;
      }

      setExisting(data as BlogPost);
      setSlugEdited(true);
      setDirty(false);
      Alert.alert(
        status === "published" ? "Published" : "Draft saved",
        status === "published"
          ? "The post will be live on the website within about 5 minutes."
          : "Saved as a draft. It isn't visible on the website."
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save post.");
    } finally {
      setSaving(null);
    }
  };

  const confirmUnpublish = () =>
    Alert.alert("Unpublish post?", "It will be hidden from the website until you publish it again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Unpublish", style: "destructive", onPress: () => save("draft") }
    ]);

  const previewTitle = draft.seoTitle.trim() || draft.title.trim() || "Post title";
  const previewDescription = draft.seoDescription.trim() || draft.excerpt.trim() || "The summary shows here in Google results.";

  return (
    <Screen>
      <ScreenHeader
        title={existing ? "Edit Post" : "New Post"}
        subtitle={existing ? (isPublished ? "Live on the website" : "Draft — not visible") : "Draft — not visible"}
        action={<Ionicons name="chevron-back" size={24} color="#FFFFFF" onPress={leave} suppressHighlighting />}
      />

      {loading ? (
        <LoadingState />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---------- Cover ---------- */}
          <View className="gap-2">
            <SectionTitle
              title="Cover Image"
              hint="Shown at the top of the post and as the share preview on WhatsApp, Facebook and Google. Best: landscape, ~1200×630."
            />
            <TouchableOpacity
              onPress={handlePickCover}
              disabled={uploading}
              className="w-full rounded-xl border border-dashed border-surface-border bg-surface-card items-center justify-center overflow-hidden"
              style={{ aspectRatio: 1.91 }}
            >
              {uploading && !uploadingBlockKey ? (
                <View className="items-center gap-2">
                  <ActivityIndicator color="#5B21B6" />
                  <Text className="text-xs text-ink-muted">Uploading…</Text>
                </View>
              ) : draft.coverImageUrl ? (
                <Image source={{ uri: draft.coverImageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <View className="items-center gap-1">
                  <Ionicons name="image-outline" size={28} color="#5B21B6" />
                  <Text className="text-xs font-rubik-semibold text-primary">Tap to select cover image</Text>
                </View>
              )}
            </TouchableOpacity>
            {draft.coverImageUrl && !uploading ? (
              <Button label="Change Cover" variant="secondary" compact onPress={handlePickCover} />
            ) : null}
            <TextField
              label="Cover alt text"
              placeholder="e.g. Natural blue sapphire ring on a silver tray"
              value={draft.coverImageAlt}
              onChangeText={(coverImageAlt) => patch({ coverImageAlt })}
            />
          </View>

          {/* ---------- Basics ---------- */}
          <View className="gap-3">
            <SectionTitle title="Post Details" />
            <TextField
              label="Title (the H1)"
              placeholder="e.g. Which Finger to Wear Blue Sapphire (Neelam)?"
              value={draft.title}
              onChangeText={handleTitleChange}
            />
            <View>
              <TextField
                label="URL slug"
                placeholder="which-finger-to-wear-blue-sapphire"
                value={draft.slug}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(slug) => {
                  setSlugEdited(true);
                  patch({ slug: slug.toLowerCase().replace(/\s+/g, "-") });
                }}
              />
              <Text className="text-[10px] text-ink-muted mt-1" numberOfLines={1}>
                {SITE_BLOG_PATH}
                {draft.slug || "…"}
              </Text>
              {isPublished && existing && draft.slug !== existing.slug ? (
                <Text className="text-[11px] text-red-700 mt-1">
                  Changing a live post's URL breaks existing links and its Google ranking.
                </Text>
              ) : null}
            </View>
            <View>
              <TextField
                label="Summary"
                placeholder="2–3 sentences that answer the question directly. Used as the Google snippet and on the blog list."
                value={draft.excerpt}
                multiline
                style={{ minHeight: 80, textAlignVertical: "top" }}
                onChangeText={(excerpt) => patch({ excerpt })}
              />
              <CharCount value={draft.excerpt} max={300} min={50} />
            </View>
          </View>

          {/* ---------- Content ---------- */}
          <View className="gap-3">
            <SectionTitle
              title="Sections"
              hint="Build the article from sections. Use H2 headings phrased as questions people search for — it helps Google and AI answers quote you."
            />
            {draft.blocks.map((block, index) => (
              <BlockEditor
                key={block.key}
                block={block}
                index={index}
                isFirst={index === 0}
                isLast={index === draft.blocks.length - 1}
                uploading={uploadingBlockKey === block.key}
                onChange={(b) => updateBlock(block.key, b)}
                onMove={(direction) => moveBlock(index, direction)}
                onRemove={() => removeBlock(block.key)}
                onPickImages={pickImagesForBlock(block.key)}
              />
            ))}
            <Card className="gap-2">
              <Text className="text-xs font-rubik-semibold text-ink-body">Add section</Text>
              <View className="flex-row flex-wrap gap-2">
                {BLOCK_TYPES.map(({ type, label, icon }) => (
                  <Button
                    key={type}
                    label={label}
                    variant="secondary"
                    compact
                    icon={<Ionicons name={icon} size={14} color="#5B21B6" />}
                    onPress={() => addBlock(type)}
                  />
                ))}
              </View>
            </Card>
          </View>

          {/* ---------- FAQs ---------- */}
          <View className="gap-3">
            <SectionTitle
              title="FAQs (optional)"
              hint="Shown at the end of the post and marked up for Google & AI search. Short, direct answers work best."
            />
            {draft.faqs.map((faq, index) => (
              <Card key={faq.key} className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-rubik-bold text-primary">FAQ {index + 1}</Text>
                  <Pressable onPress={() => patch({ faqs: draft.faqs.filter((f) => f.key !== faq.key) })} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                  </Pressable>
                </View>
                <TextField placeholder="Question" value={faq.question} onChangeText={(question) => updateFaq(faq.key, { question })} />
                <TextField
                  placeholder="Answer"
                  value={faq.answer}
                  multiline
                  style={{ minHeight: 64, textAlignVertical: "top" }}
                  onChangeText={(answer) => updateFaq(faq.key, { answer })}
                />
              </Card>
            ))}
            <Button
              label="+ Add FAQ"
              variant="secondary"
              compact
              onPress={() => patch({ faqs: [...draft.faqs, { key: newKey(), question: "", answer: "" }] })}
            />
          </View>

          {/* ---------- SEO ---------- */}
          <View className="gap-3">
            <SectionTitle title="SEO & Sharing" hint="Optional overrides. Leave blank to use the title and summary." />
            <View>
              <TextField
                label="SEO title"
                placeholder={draft.title || "Defaults to the post title"}
                value={draft.seoTitle}
                onChangeText={(seoTitle) => patch({ seoTitle })}
              />
              <CharCount value={draft.seoTitle} max={70} />
            </View>
            <View>
              <TextField
                label="SEO description"
                placeholder="Defaults to the summary"
                value={draft.seoDescription}
                multiline
                style={{ minHeight: 64, textAlignVertical: "top" }}
                onChangeText={(seoDescription) => patch({ seoDescription })}
              />
              <CharCount value={draft.seoDescription} max={170} />
            </View>
            <TextField
              label="Tags (comma separated)"
              placeholder="blue sapphire, saturn, gemstones"
              value={draft.tags}
              autoCapitalize="none"
              onChangeText={(tags) => patch({ tags })}
            />
            <TextField
              label="Author"
              placeholder="AstroKraft"
              value={draft.authorName}
              onChangeText={(authorName) => patch({ authorName })}
            />

            <View className="bg-white border border-surface-border rounded-xl p-3 gap-0.5">
              <Text className="text-[10px] text-ink-muted uppercase font-rubik-semibold mb-1">Google preview</Text>
              <Text className="text-[11px] text-green-800" numberOfLines={1}>
                {SITE_BLOG_PATH}
                {draft.slug || "…"}
              </Text>
              <Text className="text-base text-[#1a0dab]" numberOfLines={1}>
                {previewTitle} • AstroKraft
              </Text>
              <Text className="text-xs text-ink-body" numberOfLines={2}>
                {previewDescription}
              </Text>
            </View>
          </View>

          {/* ---------- Actions ---------- */}
          <View className="gap-2 pt-2">
            {existing ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-ink-muted">Status:</Text>
                <StatusBadge label={isPublished ? "Published" : "Draft"} tone={isPublished ? "success" : "saffron"} />
              </View>
            ) : null}
            <Button
              label={isPublished ? "Update Live Post" : "Publish"}
              loading={saving === "published"}
              disabled={saving !== null || uploading}
              onPress={() => save("published")}
            />
            {isPublished ? (
              <Button
                label="Unpublish (back to draft)"
                variant="dangerSoft"
                loading={saving === "draft"}
                disabled={saving !== null || uploading}
                onPress={confirmUnpublish}
              />
            ) : (
              <Button
                label="Save Draft"
                variant="secondary"
                loading={saving === "draft"}
                disabled={saving !== null || uploading}
                onPress={() => save("draft")}
              />
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
