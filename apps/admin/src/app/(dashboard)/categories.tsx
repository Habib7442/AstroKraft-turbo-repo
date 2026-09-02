import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category } from "@astrokraft/db";
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesScreen() {
  const supabase = useSupabase();
  const { uploading, pickAndUploadImage } = useImageUpload();
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    setCategories(data || []);
  };

  const loadProductCounts = async () => {
    const { data, error } = await supabase.from("products").select("category_id");
    if (error) throw error;
    const counts: Record<string, number> = {};
    (data || []).forEach((row) => {
      if (row.category_id) {
        counts[row.category_id] = (counts[row.category_id] || 0) + 1;
      }
    });
    setProductCounts(counts);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCategories(), loadProductCounts()]);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await Promise.all([loadCategories(), loadProductCounts()]);
    } catch (err) {
      console.error("Error refreshing categories:", err);
    }
  });

  const resetForm = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setDescription("");
    setImageUrl("");
    setImagePreviewFailed(false);
    setIsActive(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setSlugTouched(true);
    setDescription(category.description ?? "");
    setImageUrl(category.image_url ?? "");
    setImagePreviewFailed(false);
    setIsActive(category.is_active);
    setIsModalOpen(true);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handlePickImage = async () => {
    try {
      const publicUrl = await pickAndUploadImage("categories");
      if (publicUrl) {
        setImageUrl(publicUrl);
        setImagePreviewFailed(false);
      }
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not upload the selected image.");
    }
  };

  const handleSubmitCategory = async () => {
    const cleanSlug = slugify(slug);
    if (!name.trim() || !cleanSlug) {
      Alert.alert("Error", "Please provide a category name.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        slug: cleanSlug,
        description: description || null,
        image_url: imageUrl || null,
        is_active: isActive
      };

      const { error } = editingCategory
        ? await supabase.from("categories").update(payload).eq("id", editingCategory.id)
        : await supabase.from("categories").insert({ ...payload, sort_order: categories.length });

      if (error) throw error;

      Alert.alert("Success", editingCategory ? "Category updated!" : "Category created!");
      setIsModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const current = categories[index];
    const target = categories[targetIndex];

    try {
      const [{ error: error1 }, { error: error2 }] = await Promise.all([
        supabase.from("categories").update({ sort_order: target.sort_order }).eq("id", current.id),
        supabase.from("categories").update({ sort_order: current.sort_order }).eq("id", target.id)
      ]);
      if (error1 || error2) throw error1 || error2;
      fetchCategories();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reorder categories.");
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const { error } = await supabase.from("categories").update({ is_active: !category.is_active }).eq("id", category.id);
      if (error) throw error;
      fetchCategories();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this category?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("categories").delete().eq("id", categoryId);
            if (error) throw error;
            fetchCategories();
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
        title="Categories"
        subtitle="Gemstones, Rudraksha, Bracelets & Vastu"
        action={<Button label="+ Add Category" compact onPress={openCreateModal} />}
      />

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : categories.length === 0 ? (
          <EmptyState title="No Categories Yet" description='Tap "+ Add Category" to create your first product category.' />
        ) : (
          categories.map((item, index) => (
            <View key={item.id} className="bg-surface-card border border-surface-border rounded-xl shadow-sm overflow-hidden">
              <View className="flex-row">
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={{ width: 88, height: 88, backgroundColor: "#F1ECFA" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-[88px] h-[88px] bg-surface-tint items-center justify-center">
                    <Text className="text-2xl">🗂️</Text>
                  </View>
                )}

                <View className="flex-1 p-3 justify-center gap-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-rubik-bold text-foreground">{item.name}</Text>
                    <StatusBadge label={item.is_active ? "Active" : "Hidden"} tone={item.is_active ? "success" : "neutral"} />
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-primary font-rubik-semibold">/{item.slug}</Text>
                    <Text className="text-xs text-ink-muted">
                      · {productCounts[item.id] || 0} {productCounts[item.id] === 1 ? "item" : "items"}
                    </Text>
                  </View>
                  {item.description ? (
                    <Text className="text-xs text-ink-body mt-0.5" numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>

                <View className="justify-center gap-1 pr-2">
                  <TouchableOpacity
                    onPress={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className={`w-8 h-8 rounded-lg border border-surface-border items-center justify-center ${
                      index === 0 ? "opacity-30" : "bg-background"
                    }`}
                  >
                    <Ionicons name="chevron-up" size={16} color="#221A3D" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleMove(index, "down")}
                    disabled={index === categories.length - 1}
                    className={`w-8 h-8 rounded-lg border border-surface-border items-center justify-center ${
                      index === categories.length - 1 ? "opacity-30" : "bg-background"
                    }`}
                  >
                    <Ionicons name="chevron-down" size={16} color="#221A3D" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center justify-between px-3 py-2 border-t border-surface-border">
                <Text className="text-xs text-ink-body">Active</Text>
                <Switch
                  value={item.is_active}
                  onValueChange={() => handleToggleActive(item)}
                  trackColor={{ false: "#D1D5DB", true: "#5B21B6" }}
                />
              </View>

              <View className="flex-row gap-2 px-3 py-2.5 border-t border-surface-border">
                <Button label="Edit" variant="secondary" compact flex onPress={() => openEditModal(item)} />
                <Button label="Delete" variant="dangerSoft" compact flex onPress={() => handleDeleteCategory(item.id)} />
              </View>
            </View>
          ))
        )}
      </RefreshableScrollView>

      <FormSheet
        visible={isModalOpen}
        title={editingCategory ? "Edit Category" : "Create Category"}
        description="Group products so customers can browse by type"
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmitCategory}
        submitLabel={editingCategory ? "Save Changes" : "Create Category"}
        submitting={submitting}
      >
        <TextField label="Category Name" placeholder="e.g. Gemstones" value={name} onChangeText={handleNameChange} />
        <TextField
          label="URL Slug"
          placeholder="e.g. gemstones"
          value={slug}
          autoCapitalize="none"
          onChangeText={(value) => {
            setSlugTouched(true);
            setSlug(value);
          }}
        />
        <TextField
          label="Description (optional)"
          placeholder="e.g. Lab-certified natural gemstones for every rashi"
          value={description}
          onChangeText={setDescription}
        />

        <View className="gap-2">
          <Text className="text-xs font-rubik-semibold text-ink-body">Category Image (optional)</Text>

          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploading}
            className="w-full h-32 rounded-xl border border-dashed border-surface-border bg-background items-center justify-center overflow-hidden"
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
                resizeMode="cover"
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

        <View className="flex-row justify-between items-center bg-background border border-surface-border rounded-xl px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-rubik-semibold text-foreground">Enabled</Text>
            <Text className="text-[11px] text-ink-muted mt-0.5">
              {isActive ? "Visible to customers browsing the storefront." : "Hidden from customers until re-enabled."}
            </Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: "#D1D5DB", true: "#5B21B6" }} />
        </View>
      </FormSheet>
    </Screen>
  );
}
