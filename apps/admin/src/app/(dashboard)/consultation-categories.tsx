import React, { useEffect, useState } from "react";
import { Alert, Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ConsultationCategory } from "@astrokraft/db";
import { useSupabase } from "@/lib/supabase";
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

const COLOR_SWATCHES = ["#FCE7B0", "#E4DBFA", "#FBD5CC", "#D3F3DE", "#FCEE9E", "#D6ECFB", "#F5C6D6", "#C9E4F6"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ConsultationCategoriesScreen() {
  const supabase = useSupabase();
  const [categories, setCategories] = useState<ConsultationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ConsultationCategory | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("consultation_categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    setCategories(data || []);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      await loadCategories();
    } catch (err) {
      console.error("Error fetching consultation categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await loadCategories();
    } catch (err) {
      console.error("Error refreshing consultation categories:", err);
    }
  });

  const resetForm = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setIcon("");
    setColor(COLOR_SWATCHES[0]);
    setIsActive(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category: ConsultationCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setSlugTouched(true);
    setIcon(category.icon ?? "");
    setColor(category.color ?? COLOR_SWATCHES[0]);
    setIsActive(category.is_active);
    setIsModalOpen(true);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
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
        icon: icon.trim() || null,
        color,
        is_active: isActive
      };

      const { error } = editingCategory
        ? await supabase.from("consultation_categories").update(payload).eq("id", editingCategory.id)
        : await supabase.from("consultation_categories").insert({ ...payload, sort_order: categories.length });

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
        supabase.from("consultation_categories").update({ sort_order: target.sort_order }).eq("id", current.id),
        supabase.from("consultation_categories").update({ sort_order: current.sort_order }).eq("id", target.id)
      ]);
      if (error1 || error2) throw error1 || error2;
      fetchCategories();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reorder categories.");
    }
  };

  const handleToggleActive = async (category: ConsultationCategory) => {
    try {
      const { error } = await supabase
        .from("consultation_categories")
        .update({ is_active: !category.is_active })
        .eq("id", category.id);
      if (error) throw error;
      fetchCategories();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this consultation category?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("consultation_categories").delete().eq("id", categoryId);
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
        title="Consultation Categories"
        subtitle="Career, Love, Finance, Health, Kundli & Education"
        action={<Button label="+ Add Category" compact onPress={openCreateModal} />}
      />

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No Consultation Categories Yet"
            description='Tap "+ Add Category" to create your first consultation category.'
          />
        ) : (
          categories.map((item, index) => (
            <View key={item.id} className="bg-surface-card border border-surface-border rounded-xl shadow-sm overflow-hidden">
              <View className="flex-row">
                <View
                  className="w-[88px] h-[88px] items-center justify-center"
                  style={{ backgroundColor: item.color ?? "#F1ECFA" }}
                >
                  <View className="w-14 h-14 rounded-full bg-white items-center justify-center">
                    <Text className="text-2xl">{item.icon || "✨"}</Text>
                  </View>
                </View>

                <View className="flex-1 p-3 justify-center gap-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-rubik-bold text-foreground">{item.name}</Text>
                    <StatusBadge label={item.is_active ? "Active" : "Hidden"} tone={item.is_active ? "success" : "neutral"} />
                  </View>
                  <Text className="text-xs text-primary font-rubik-semibold">/{item.slug}</Text>
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
        title={editingCategory ? "Edit Category" : "Create Consultation Category"}
        description="Shown as a colored card on the storefront's consultation booking flow"
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmitCategory}
        submitLabel={editingCategory ? "Save Changes" : "Create Category"}
        submitting={submitting}
      >
        <TextField label="Category Name" placeholder="e.g. Career & Business" value={name} onChangeText={handleNameChange} />
        <TextField
          label="URL Slug"
          placeholder="e.g. career-business"
          value={slug}
          autoCapitalize="none"
          onChangeText={(value) => {
            setSlugTouched(true);
            setSlug(value);
          }}
        />
        <TextField label="Icon (emoji)" placeholder="e.g. 💼" value={icon} onChangeText={setIcon} />

        <View className="gap-2">
          <Text className="text-xs font-rubik-semibold text-ink-body">Card Color</Text>
          <View className="flex-row flex-wrap gap-2">
            {COLOR_SWATCHES.map((swatch) => (
              <TouchableOpacity
                key={swatch}
                onPress={() => setColor(swatch)}
                style={{ backgroundColor: swatch }}
                className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                  color === swatch ? "border-primary" : "border-transparent"
                }`}
              >
                {color === swatch ? <Ionicons name="checkmark" size={18} color="#221A3D" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="flex-row justify-between items-center bg-background border border-surface-border rounded-xl px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-rubik-semibold text-foreground">Enabled</Text>
            <Text className="text-[11px] text-ink-muted mt-0.5">
              {isActive ? "Visible to customers browsing consultations." : "Hidden from customers until re-enabled."}
            </Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: "#D1D5DB", true: "#5B21B6" }} />
        </View>
      </FormSheet>
    </Screen>
  );
}
