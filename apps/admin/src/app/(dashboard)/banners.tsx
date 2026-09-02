import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Switch, Text, TouchableOpacity, View } from "react-native";
import { PromoBanner } from "@astrokraft/db";
import { useSupabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/use-image-upload";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import {
  Button,
  EmptyState,
  FormSheet,
  LoadingState,
  RefreshableScrollView,
  Screen,
  ScreenHeader,
  StatusBadge,
  TextField
} from "@/components/ui";

const MAX_BANNERS = 5;

export default function BannersScreen() {
  const supabase = useSupabase();
  const { uploading, pickAndUploadImage } = useImageUpload();
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const atCapacity = banners.length >= MAX_BANNERS;

  const loadBanners = async () => {
    const { data, error } = await supabase.from("promo_banners").select("*").order("position", { ascending: true });
    if (error) throw error;
    setBanners(data || []);
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      await loadBanners();
    } catch (err) {
      console.error("Error fetching banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await loadBanners();
    } catch (err) {
      console.error("Error refreshing banners:", err);
    }
  });

  const resetForm = () => {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setImagePreviewFailed(false);
    setLinkUrl("");
    setPosition("0");
    setIsActive(true);
  };

  const openCreateModal = () => {
    if (atCapacity) {
      Alert.alert(
        "Banner Limit Reached",
        `You can have up to ${MAX_BANNERS} banners at a time. Delete one to add a new one.`
      );
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (banner: PromoBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle ?? "");
    setImageUrl(banner.image_url);
    setImagePreviewFailed(false);
    setLinkUrl(banner.link_url ?? "");
    setPosition(String(banner.position));
    setIsActive(banner.is_active);
    setIsModalOpen(true);
  };

  const handlePickImage = async () => {
    try {
      const publicUrl = await pickAndUploadImage("banners");
      if (publicUrl) {
        setImageUrl(publicUrl);
        setImagePreviewFailed(false);
      }
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not upload the selected image.");
    }
  };

  const handleSubmitBanner = async () => {
    if (!title.trim() || !imageUrl.trim()) {
      Alert.alert("Error", "Please provide a title and select an image.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        subtitle: subtitle || null,
        image_url: imageUrl,
        link_url: linkUrl || null,
        position: parseInt(position) || 0,
        is_active: isActive
      };

      const { error } = editingBanner
        ? await supabase.from("promo_banners").update(payload).eq("id", editingBanner.id)
        : await supabase.from("promo_banners").insert(payload);

      if (error) throw error;

      Alert.alert("Success", editingBanner ? "Banner updated!" : "Promo banner published!");
      setIsModalOpen(false);
      resetForm();
      fetchBanners();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save banner.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (banner: PromoBanner) => {
    try {
      const { error } = await supabase.from("promo_banners").update({ is_active: !banner.is_active }).eq("id", banner.id);
      if (error) throw error;
      fetchBanners();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDeleteBanner = (bannerId: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this promo banner?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("promo_banners").delete().eq("id", bannerId);
            if (error) throw error;
            fetchBanners();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        }
      }
    ]);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Promo Banners"
        subtitle={`Website & Mobile Carousel Banners · ${banners.length}/${MAX_BANNERS}`}
        action={<Button label="+ Add Banner" compact onPress={openCreateModal} />}
      />

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : banners.length === 0 ? (
          <EmptyState title="No Banners Created" description='Tap "+ Add Banner" to create campaign banners with optional target links.' />
        ) : (
          banners.map((item) => (
            <View
              key={item.id}
              className="bg-surface-card border border-surface-border rounded-xl shadow-sm overflow-hidden"
            >
              <View className="relative">
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: "100%", aspectRatio: 2, backgroundColor: "#F1ECFA" }}
                  resizeMode="contain"
                />
                <View className="absolute top-3 right-3">
                  <StatusBadge label={item.is_active ? "Active" : "Hidden"} tone={item.is_active ? "success" : "neutral"} />
                </View>
              </View>

              <View className="p-4 gap-3">
                <View>
                  <Text className="text-base font-rubik-bold text-foreground">{item.title}</Text>
                  {item.subtitle ? <Text className="text-xs text-ink-body mt-0.5">{item.subtitle}</Text> : null}
                </View>

                <View className="flex-row items-center justify-between gap-3">
                  {item.link_url ? (
                    <Text className="text-xs text-primary font-rubik-semibold flex-1" numberOfLines={1}>
                      🔗 {item.link_url}
                    </Text>
                  ) : (
                    <Text className="text-xs text-ink-muted italic flex-1">No destination link set</Text>
                  )}
                  <Text className="text-[10px] font-rubik-bold text-ink-muted">POS {item.position}</Text>
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-surface-border">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-ink-body">Active</Text>
                    <Switch
                      value={item.is_active}
                      onValueChange={() => handleToggleActive(item)}
                      trackColor={{ false: "#D1D5DB", true: "#5B21B6" }}
                    />
                  </View>

                  <View className="flex-row gap-2">
                    <Button label="Edit" variant="secondary" compact onPress={() => openEditModal(item)} />
                    <Button label="Delete" variant="dangerSoft" compact onPress={() => handleDeleteBanner(item.id)} />
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </RefreshableScrollView>

      <FormSheet
        visible={isModalOpen}
        title={editingBanner ? "Edit Promo Banner" : "Create Promo Banner"}
        description="Promote sales, features, or announcements across the storefront and app"
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmitBanner}
        submitLabel={editingBanner ? "Save Changes" : "Save Banner"}
        submitting={submitting}
      >
        <TextField label="Banner Title" placeholder="e.g. Navratri Festival 25% Off" value={title} onChangeText={setTitle} />
        <TextField
          label="Subtitle"
          placeholder="e.g. Free Kundli Consultation with Gemstones"
          value={subtitle}
          onChangeText={setSubtitle}
        />

        <View className="gap-2">
          <Text className="text-xs font-rubik-semibold text-ink-body">Banner Image</Text>
          <Text className="text-[11px] text-ink-muted leading-4">
            Best results: roughly 1200×600px (2:1 ratio), landscape. Photos are compressed automatically on
            upload.
          </Text>

          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploading}
            className="w-full h-36 rounded-xl border border-dashed border-surface-border bg-background items-center justify-center overflow-hidden"
          >
            {uploading ? (
              <View className="items-center gap-2">
                <ActivityIndicator color="#5B21B6" />
                <Text className="text-xs text-ink-muted">Uploading…</Text>
              </View>
            ) : imageUrl && !imagePreviewFailed ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
                onError={() => setImagePreviewFailed(true)}
              />
            ) : (
              <View className="items-center gap-1">
                <Text className="text-2xl">🖼️</Text>
                <Text className="text-xs font-rubik-semibold text-primary">Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>

          {imageUrl && !uploading ? (
            <Button label="Change Image" variant="secondary" compact onPress={handlePickImage} />
          ) : null}
        </View>

        <TextField
          label="Destination Link (optional)"
          placeholder="e.g. /en/gemstones/ruby"
          value={linkUrl}
          autoCapitalize="none"
          onChangeText={setLinkUrl}
        />

        <TextField
          label="Display Position"
          placeholder="0"
          value={position}
          keyboardType="numeric"
          onChangeText={setPosition}
        />

        <View className="flex-row justify-between items-center bg-background border border-surface-border rounded-xl px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-rubik-semibold text-foreground">Publish Immediately</Text>
            <Text className="text-[11px] text-ink-muted mt-0.5">
              {isActive ? "Visible to customers as soon as you save." : "Saved hidden — activate later from the list."}
            </Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: "#D1D5DB", true: "#5B21B6" }} />
        </View>
      </FormSheet>
    </Screen>
  );
}
