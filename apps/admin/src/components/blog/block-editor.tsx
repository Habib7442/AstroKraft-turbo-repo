import React from "react";
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BlogBlock, BlogImage } from "@astrokraft/db";
import { parseVideoEmbed } from "@astrokraft/validators";
import { Button, StatusBadge, TextField } from "@/components/ui";

/** A block plus a client-only React key, stripped before saving. */
export type EditorBlock = BlogBlock & { key: string };
export type BlogBlockType = BlogBlock["type"];

export const BLOCK_TYPES: { type: BlogBlockType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: "heading", label: "Heading", icon: "text-outline" },
  { type: "paragraph", label: "Paragraph", icon: "reader-outline" },
  { type: "images", label: "Images", icon: "images-outline" },
  { type: "embed", label: "Video", icon: "logo-youtube" },
  { type: "list", label: "List", icon: "list-outline" },
  { type: "quote", label: "Quote", icon: "chatbox-ellipses-outline" }
];

export function newKey() {
  return Math.random().toString(36).slice(2, 10);
}

export function createBlock(type: BlogBlockType): EditorBlock {
  const key = newKey();
  switch (type) {
    case "heading":
      return { key, type, level: 2, text: "" };
    case "paragraph":
      return { key, type, text: "" };
    case "list":
      return { key, type, style: "bullet", items: [""] };
    case "quote":
      return { key, type, text: "" };
    case "images":
      return { key, type, images: [] };
    case "embed":
      return { key, type, provider: "youtube", url: "" };
  }
}

const PROVIDER_LABEL = { youtube: "YouTube", facebook: "Facebook", instagram: "Instagram" } as const;

const multilineStyle = { minHeight: 96, textAlignVertical: "top" as const };

interface BlockEditorProps {
  block: EditorBlock;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  uploading: boolean;
  onChange: (block: EditorBlock) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onPickImages: () => Promise<string[]>;
}

export function BlockEditor({
  block,
  index,
  isFirst,
  isLast,
  uploading,
  onChange,
  onMove,
  onRemove,
  onPickImages
}: BlockEditorProps) {
  const meta = BLOCK_TYPES.find((t) => t.type === block.type)!;

  return (
    <View className="bg-surface-card border border-surface-border rounded-xl p-3 gap-3 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name={meta.icon} size={16} color="#5B21B6" />
          <Text className="text-xs font-rubik-bold text-primary uppercase">
            {index + 1}. {meta.label}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => onMove(-1)} disabled={isFirst} hitSlop={8} className={isFirst ? "opacity-30" : ""}>
            <Ionicons name="arrow-up" size={18} color="#4A4566" />
          </Pressable>
          <Pressable onPress={() => onMove(1)} disabled={isLast} hitSlop={8} className={isLast ? "opacity-30" : ""}>
            <Ionicons name="arrow-down" size={18} color="#4A4566" />
          </Pressable>
          <Pressable onPress={onRemove} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color="#B91C1C" />
          </Pressable>
        </View>
      </View>

      {block.type === "heading" ? (
        <>
          <View className="flex-row gap-2">
            {([2, 3] as const).map((level) => (
              <Button
                key={level}
                label={level === 2 ? "H2 · Section" : "H3 · Sub-section"}
                variant={block.level === level ? "primary" : "secondary"}
                compact
                onPress={() => onChange({ ...block, level })}
              />
            ))}
          </View>
          <TextField
            placeholder="e.g. Which finger should you wear Blue Sapphire on?"
            value={block.text}
            onChangeText={(text) => onChange({ ...block, text })}
          />
        </>
      ) : null}

      {block.type === "paragraph" ? (
        <>
          <TextField
            placeholder="Write the paragraph…"
            value={block.text}
            multiline
            style={multilineStyle}
            onChangeText={(text) => onChange({ ...block, text })}
          />
          <Text className="text-[10px] text-ink-muted">
            **bold** · *italic* · [link text](/en/vedic-gemstones) · blank line = new paragraph
          </Text>
        </>
      ) : null}

      {block.type === "list" ? (
        <>
          <View className="flex-row gap-2">
            {(["bullet", "number"] as const).map((style) => (
              <Button
                key={style}
                label={style === "bullet" ? "• Bullets" : "1. Numbered"}
                variant={block.style === style ? "primary" : "secondary"}
                compact
                onPress={() => onChange({ ...block, style })}
              />
            ))}
          </View>
          <TextField
            placeholder={"One item per line\nSecond item\nThird item"}
            value={block.items.join("\n")}
            multiline
            style={multilineStyle}
            onChangeText={(text) => onChange({ ...block, items: text.split("\n") })}
          />
        </>
      ) : null}

      {block.type === "quote" ? (
        <>
          <TextField
            placeholder="Quote text"
            value={block.text}
            multiline
            style={{ minHeight: 64, textAlignVertical: "top" }}
            onChangeText={(text) => onChange({ ...block, text })}
          />
          <TextField
            placeholder="Who said it? (optional)"
            value={block.cite ?? ""}
            onChangeText={(cite) => onChange({ ...block, cite })}
          />
        </>
      ) : null}

      {block.type === "images" ? (
        <ImagesBlockEditor
          images={block.images}
          uploading={uploading}
          onChange={(images) => onChange({ ...block, images })}
          onPickImages={onPickImages}
        />
      ) : null}

      {block.type === "embed" ? <EmbedBlockEditor block={block} onChange={onChange} /> : null}
    </View>
  );
}

function ImagesBlockEditor({
  images,
  uploading,
  onChange,
  onPickImages
}: {
  images: BlogImage[];
  uploading: boolean;
  onChange: (images: BlogImage[]) => void;
  onPickImages: () => Promise<string[]>;
}) {
  const updateImage = (i: number, patch: Partial<BlogImage>) =>
    onChange(images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)));

  const handleAdd = async () => {
    const urls = await onPickImages();
    if (urls.length > 0) {
      onChange([...images, ...urls.map((url) => ({ url, alt: "" }))]);
    }
  };

  return (
    <View className="gap-3">
      {images.length > 1 ? (
        <Text className="text-[11px] text-ink-muted">Shown as a {images.length}-image gallery on the website.</Text>
      ) : null}

      {images.map((image, i) => (
        <View key={`${image.url}-${i}`} className="flex-row gap-3 bg-background border border-surface-border rounded-xl p-2">
          <Image
            source={{ uri: image.url }}
            style={{ width: 84, height: 84, borderRadius: 8, backgroundColor: "#F1ECFA" }}
            resizeMode="cover"
          />
          <View className="flex-1 gap-2">
            <TextInput
              placeholder="Alt text (required) — what's in the photo?"
              placeholderTextColor="#6E698A"
              value={image.alt}
              onChangeText={(alt) => updateImage(i, { alt })}
              className="bg-surface-card border border-surface-border px-3 py-2 rounded-lg text-ink text-xs"
            />
            <TextInput
              placeholder="Caption (optional)"
              placeholderTextColor="#6E698A"
              value={image.caption ?? ""}
              onChangeText={(caption) => updateImage(i, { caption })}
              className="bg-surface-card border border-surface-border px-3 py-2 rounded-lg text-ink text-xs"
            />
          </View>
          <Pressable onPress={() => onChange(images.filter((_, idx) => idx !== i))} hitSlop={8} className="pt-1">
            <Ionicons name="close-circle" size={20} color="#B91C1C" />
          </Pressable>
        </View>
      ))}

      {uploading ? (
        <View className="flex-row items-center justify-center gap-2 py-3">
          <ActivityIndicator color="#5B21B6" />
          <Text className="text-xs text-ink-muted">Uploading…</Text>
        </View>
      ) : images.length < 12 ? (
        <Button
          label={images.length === 0 ? "Select images" : "Add more images"}
          variant="secondary"
          compact
          icon={<Ionicons name="add" size={14} color="#5B21B6" />}
          onPress={handleAdd}
        />
      ) : null}
    </View>
  );
}

function EmbedBlockEditor({
  block,
  onChange
}: {
  block: Extract<EditorBlock, { type: "embed" }>;
  onChange: (block: EditorBlock) => void;
}) {
  const parsed = block.url.trim() ? parseVideoEmbed(block.url) : null;

  return (
    <>
      <TextField
        placeholder="Paste a YouTube, Facebook or Instagram link"
        value={block.url}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onChangeText={(url) => {
          const detected = parseVideoEmbed(url);
          onChange({ ...block, url, provider: detected?.provider ?? block.provider });
        }}
      />
      {block.url.trim() ? (
        parsed ? (
          <View className="flex-row items-center gap-2">
            <StatusBadge label={PROVIDER_LABEL[parsed.provider]} tone="success" />
            <Text className="text-[11px] text-ink-muted">
              {parsed.orientation === "portrait" ? "Vertical video / post" : "Widescreen video"}
            </Text>
          </View>
        ) : (
          <Text className="text-[11px] text-red-700">
            Not a recognised link. Use a YouTube video/Short, a Facebook video/reel, or an Instagram post/reel URL.
          </Text>
        )
      ) : null}
      <TextField
        placeholder="Caption (optional)"
        value={block.caption ?? ""}
        onChangeText={(caption) => onChange({ ...block, caption })}
      />
    </>
  );
}
