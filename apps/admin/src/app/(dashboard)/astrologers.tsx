import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Astrologer, ConsultationCategory } from "@astrokraft/db";
import { useSupabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/use-image-upload";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import {
  Button,
  EmptyState,
  FormSheet,
  LoadingState,
  RefreshableFlatList,
  Screen,
  ScreenHeader,
  SearchBar,
  StatusBadge,
  TextField
} from "@/components/ui";

interface AstrologerWithCategories extends Astrologer {
  astrologer_categories: { category_id: string }[];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AstrologersScreen() {
  const supabase = useSupabase();
  const { uploading, pickAndUploadImage } = useImageUpload();
  const [astrologers, setAstrologers] = useState<AstrologerWithCategories[]>([]);
  const [categories, setCategories] = useState<ConsultationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAstrologer, setEditingAstrologer] = useState<AstrologerWithCategories | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreviewFailed, setPhotoPreviewFailed] = useState(false);
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [languages, setLanguages] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadAstrologers = async () => {
    const { data, error } = await supabase
      .from("astrologers")
      .select("*, astrologer_categories(category_id)")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    setAstrologers((data as AstrologerWithCategories[]) || []);
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("consultation_categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    setCategories(data || []);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadAstrologers(), loadCategories()]);
    } catch (err) {
      console.error("Error fetching astrologers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await Promise.all([loadAstrologers(), loadCategories()]);
    } catch (err) {
      console.error("Error refreshing astrologers:", err);
    }
  });

  const isSearching = searchQuery.trim().length > 0;
  const filteredAstrologers = isSearching
    ? astrologers.filter((a) => a.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : astrologers;

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const resetForm = () => {
    setEditingAstrologer(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setPhotoUrl("");
    setPhotoPreviewFailed(false);
    setBio("");
    setExperienceYears("");
    setLanguages("");
    setPrice("");
    setSelectedCategoryIds([]);
    setIsActive(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (astrologer: AstrologerWithCategories) => {
    setEditingAstrologer(astrologer);
    setName(astrologer.name);
    setSlug(astrologer.slug);
    setSlugTouched(true);
    setPhotoUrl(astrologer.photo_url ?? "");
    setPhotoPreviewFailed(false);
    setBio(astrologer.bio ?? "");
    setExperienceYears(astrologer.experience_years != null ? String(astrologer.experience_years) : "");
    setLanguages((astrologer.languages ?? []).join(", "));
    setPrice(astrologer.price != null ? String(astrologer.price) : "");
    setSelectedCategoryIds(astrologer.astrologer_categories.map((c) => c.category_id));
    setIsActive(astrologer.is_active);
    setIsModalOpen(true);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handlePickPhoto = async () => {
    try {
      const publicUrl = await pickAndUploadImage("astrologers");
      if (publicUrl) {
        setPhotoUrl(publicUrl);
        setPhotoPreviewFailed(false);
      }
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not upload the selected photo.");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= astrologers.length) return;

    const current = astrologers[index];
    const target = astrologers[targetIndex];

    try {
      const [{ error: error1 }, { error: error2 }] = await Promise.all([
        supabase.from("astrologers").update({ sort_order: target.sort_order }).eq("id", current.id),
        supabase.from("astrologers").update({ sort_order: current.sort_order }).eq("id", target.id)
      ]);
      if (error1 || error2) throw error1 || error2;
      fetchAll();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reorder astrologers.");
    }
  };

  const handleToggleActive = async (astrologer: AstrologerWithCategories) => {
    try {
      const { error } = await supabase.from("astrologers").update({ is_active: !astrologer.is_active }).eq("id", astrologer.id);
      if (error) throw error;
      fetchAll();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update astrologer status.");
    }
  };

  const handleDeleteAstrologer = (astrologerId: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this astrologer?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("astrologers").delete().eq("id", astrologerId);
            if (error) throw error;
            fetchAll();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to delete astrologer.");
          }
        }
      }
    ]);
  };

  const handleSubmitAstrologer = async () => {
    const cleanSlug = slugify(slug);
    if (!name.trim() || !cleanSlug) {
      Alert.alert("Error", "Please provide an astrologer name.");
      return;
    }
    if (selectedCategoryIds.length === 0) {
      Alert.alert("Error", "Select at least one area of expertise.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        slug: cleanSlug,
        photo_url: photoUrl || null,
        bio: bio.trim() || null,
        experience_years: experienceYears ? parseInt(experienceYears, 10) : null,
        languages: languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        price: price ? parseFloat(price) : null,
        is_active: isActive
      };

      let astrologerId: string;

      if (editingAstrologer) {
        const { error } = await supabase.from("astrologers").update(payload).eq("id", editingAstrologer.id);
        if (error) throw error;
        astrologerId = editingAstrologer.id;

        const existingIds = editingAstrologer.astrologer_categories.map((c) => c.category_id);
        const toRemove = existingIds.filter((id) => !selectedCategoryIds.includes(id));
        const toAdd = selectedCategoryIds.filter((id) => !existingIds.includes(id));

        if (toRemove.length > 0) {
          const { error: removeError } = await supabase
            .from("astrologer_categories")
            .delete()
            .eq("astrologer_id", astrologerId)
            .in("category_id", toRemove);
          if (removeError) throw removeError;
        }
        if (toAdd.length > 0) {
          const { error: addError } = await supabase
            .from("astrologer_categories")
            .insert(toAdd.map((category_id) => ({ astrologer_id: astrologerId, category_id })));
          if (addError) throw addError;
        }

        Alert.alert("Success", "Astrologer updated!");
      } else {
        const { data: newAstrologer, error } = await supabase
          .from("astrologers")
          .insert({ ...payload, sort_order: astrologers.length })
          .select()
          .single();
        if (error) throw error;
        astrologerId = newAstrologer.id;

        const { error: linkError } = await supabase
          .from("astrologer_categories")
          .insert(selectedCategoryIds.map((category_id) => ({ astrologer_id: astrologerId, category_id })));
        if (linkError) throw linkError;

        Alert.alert("Success", "Astrologer created!");
      }

      setIsModalOpen(false);
      resetForm();
      fetchAll();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save astrologer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Astrologers"
        subtitle="Manage consultants & their areas of expertise"
        action={<Button label="+ Add Astrologer" compact onPress={openCreateModal} />}
      />

      <RefreshableFlatList
        data={filteredAstrologers}
        keyExtractor={(item) => item.id}
        numColumns={2}
        refreshing={refreshing}
        onRefresh={onRefresh}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={<SearchBar placeholder="Search astrologers…" onChangeQuery={setSearchQuery} className="mb-3" />}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : astrologers.length === 0 ? (
            <EmptyState title="No Astrologers Yet" description='Tap "+ Add Astrologer" to add your first consultant.' />
          ) : (
            <EmptyState title="No matches" description="Try a different search term." />
          )
        }
        renderItem={({ item }) => {
          const index = astrologers.findIndex((a) => a.id === item.id);
          return (
            <View style={{ width: "48%" }} className="bg-surface-card border border-surface-border rounded-xl shadow-sm overflow-hidden">
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={{ width: "100%", height: 100, backgroundColor: "#F1ECFA" }} resizeMode="cover" />
              ) : (
                <View className="w-full h-[100px] bg-surface-tint items-center justify-center">
                  <Text className="text-2xl">🔮</Text>
                </View>
              )}

              <View className="p-2.5 gap-1">
                <Text className="text-xs font-rubik-bold text-foreground" numberOfLines={1}>
                  {item.name}
                </Text>

                <View className="flex-row flex-wrap gap-1">
                  <StatusBadge label={item.is_active ? "Active" : "Hidden"} tone={item.is_active ? "success" : "neutral"} />
                  {item.experience_years != null ? <StatusBadge label={`${item.experience_years} yrs`} tone="gold" /> : null}
                </View>

                <View className="flex-row flex-wrap gap-1">
                  {item.astrologer_categories.slice(0, 2).map((c) => (
                    <StatusBadge key={c.category_id} label={categoryNameById.get(c.category_id) ?? "…"} tone="primary" />
                  ))}
                </View>

                {!isSearching ? (
                  <View className="flex-row items-center justify-between pt-1.5 mt-0.5 border-t border-surface-border">
                    <TouchableOpacity
                      onPress={() => handleMove(index, "up")}
                      disabled={index === 0}
                      className={`w-7 h-7 rounded-lg border border-surface-border items-center justify-center ${
                        index === 0 ? "opacity-30" : "bg-background"
                      }`}
                    >
                      <Ionicons name="chevron-up" size={14} color="#221A3D" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleMove(index, "down")}
                      disabled={index === astrologers.length - 1}
                      className={`w-7 h-7 rounded-lg border border-surface-border items-center justify-center ${
                        index === astrologers.length - 1 ? "opacity-30" : "bg-background"
                      }`}
                    >
                      <Ionicons name="chevron-down" size={14} color="#221A3D" />
                    </TouchableOpacity>
                    <Switch
                      value={item.is_active}
                      onValueChange={() => handleToggleActive(item)}
                      trackColor={{ false: "#D1D5DB", true: "#5B21B6" }}
                      style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                    />
                  </View>
                ) : null}

                <View className="flex-row gap-1.5 pt-1">
                  <Button label="Edit" variant="secondary" compact flex onPress={() => openEditModal(item)} />
                  <Button label="Del" variant="dangerSoft" compact flex onPress={() => handleDeleteAstrologer(item.id)} />
                </View>
              </View>
            </View>
          );
        }}
      />

      <FormSheet
        visible={isModalOpen}
        title={editingAstrologer ? "Edit Astrologer" : "Add Astrologer"}
        description="Consultants available for category-based bookings"
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmitAstrologer}
        submitLabel={editingAstrologer ? "Save Changes" : "Add Astrologer"}
        submitting={submitting}
      >
        <TextField label="Full Name" placeholder="e.g. Pandit Ravi Sharma" value={name} onChangeText={handleNameChange} />
        <TextField
          label="URL Slug"
          placeholder="e.g. pandit-ravi-sharma"
          value={slug}
          autoCapitalize="none"
          onChangeText={(value) => {
            setSlugTouched(true);
            setSlug(value);
          }}
        />

        <View className="gap-2">
          <Text className="text-xs font-rubik-semibold text-ink-body">Photo (optional)</Text>
          <TouchableOpacity
            onPress={handlePickPhoto}
            disabled={uploading}
            className="w-full h-32 rounded-xl border border-dashed border-surface-border bg-background items-center justify-center overflow-hidden"
          >
            {uploading ? (
              <View className="items-center gap-2">
                <ActivityIndicator color="#5B21B6" />
                <Text className="text-xs text-ink-muted">Uploading…</Text>
              </View>
            ) : photoUrl && !photoPreviewFailed ? (
              <Image
                source={{ uri: photoUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
                onError={() => setPhotoPreviewFailed(true)}
              />
            ) : (
              <View className="items-center gap-1">
                <Text className="text-2xl">🖼️</Text>
                <Text className="text-xs font-rubik-semibold text-primary">Tap to select photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {photoUrl && !uploading ? <Button label="Change Photo" variant="secondary" compact onPress={handlePickPhoto} /> : null}
        </View>

        <TextField
          label="Bio (optional)"
          placeholder="Short introduction shown on the profile"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
        />
        <TextField
          label="Experience (years)"
          placeholder="e.g. 12"
          value={experienceYears}
          keyboardType="numeric"
          onChangeText={setExperienceYears}
        />
        <TextField
          label="Languages (comma separated)"
          placeholder="e.g. Hindi, English, Bengali"
          value={languages}
          onChangeText={setLanguages}
        />
        <TextField
          label="Consultation Price (INR)"
          placeholder="e.g. 999"
          value={price}
          keyboardType="numeric"
          onChangeText={setPrice}
        />

        <View className="gap-2">
          <Text className="text-xs font-rubik-semibold text-ink-body">Areas of Expertise</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((category) => {
              const selected = selectedCategoryIds.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => toggleCategory(category.id)}
                  className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1 ${
                    selected ? "bg-primary border-primary" : "bg-background border-surface-border"
                  }`}
                >
                  {category.icon ? <Text className="text-xs">{category.icon}</Text> : null}
                  <Text className={`text-xs font-rubik-semibold ${selected ? "text-white" : "text-ink-body"}`}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {categories.length === 0 ? (
            <Text className="text-xs text-ink-muted">No consultation categories yet — create one from the Consultation Categories screen first.</Text>
          ) : null}
        </View>

        <View className="flex-row justify-between items-center bg-background border border-surface-border rounded-xl px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-rubik-semibold text-foreground">Enabled</Text>
            <Text className="text-[11px] text-ink-muted mt-0.5">
              {isActive ? "Visible for customer bookings." : "Hidden from customers until re-enabled."}
            </Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: "#D1D5DB", true: "#5B21B6" }} />
        </View>
      </FormSheet>
    </Screen>
  );
}
