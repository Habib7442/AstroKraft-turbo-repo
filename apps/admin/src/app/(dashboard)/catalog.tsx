import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category, Product, ProductQuality } from "@astrokraft/db";
import { useSupabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/use-image-upload";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import {
  Button,
  CategoryPicker,
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

interface ProductVariantRow {
  id: string;
  quality: ProductQuality | null;
  price: number;
}

interface ProductWithRelations extends Product {
  categories: { name: string } | null;
  product_variants: ProductVariantRow[];
}

const TIERS: { quality: ProductQuality; label: string }[] = [
  { quality: "basic", label: "Basic" },
  { quality: "semi_prem", label: "Semi-Premium" },
  { quality: "premium", label: "Premium" }
];

function formatTierPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

function PositionInput({
  position,
  disabled,
  onSubmitPosition
}: {
  position: number;
  disabled?: boolean;
  onSubmitPosition: (position: number) => Promise<void>;
}) {
  const [value, setValue] = useState(String(position));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(String(position));
  }, [position]);

  const parsed = parseInt(value, 10);
  const hasChange = !isNaN(parsed) && parsed !== position;

  const commit = async () => {
    if (!hasChange) {
      setValue(String(position));
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      await onSubmitPosition(parsed);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // error already surfaced via Alert by the caller
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-1">
      <Text className="text-[10px] font-rubik-semibold text-ink-body">
        Sort Position{saving ? " · Saving…" : saved ? " · Saved" : ""}
      </Text>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={value}
          onChangeText={setValue}
          onBlur={commit}
          onSubmitEditing={commit}
          editable={!disabled && !saving}
          keyboardType="number-pad"
          selectTextOnFocus
          returnKeyType="done"
          style={{
            textAlignVertical: "center",
            includeFontPadding: false,
            paddingVertical: 0,
            lineHeight: 18
          }}
          className={`flex-1 h-10 rounded-lg border border-primary/40 text-center text-base font-rubik-bold text-primary ${
            disabled || saving ? "opacity-40 bg-surface-tint" : "bg-primary/5"
          }`}
        />
        <TouchableOpacity
          onPress={commit}
          disabled={disabled || saving || !hasChange}
          className={`w-10 h-10 rounded-lg items-center justify-center ${
            disabled || saving || !hasChange ? "bg-surface-tint opacity-50" : saved ? "bg-green-600" : "bg-primary"
          }`}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#5B21B6" />
          ) : (
            <Ionicons
              name={saved ? "checkmark-done" : "checkmark"}
              size={18}
              color={disabled || !hasChange ? "#6E698A" : "#FFFFFF"}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CatalogScreen() {
  const supabase = useSupabase();
  const { uploading, pickAndUploadImage } = useImageUpload();
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sku, setSku] = useState("");
  const [caratWeight, setCaratWeight] = useState("");
  const [origin, setOrigin] = useState("Ceylon (Sri Lanka)");
  const [basicPrice, setBasicPrice] = useState("");
  const [semiPremPrice, setSemiPremPrice] = useState("");
  const [premiumPrice, setPremiumPrice] = useState("");
  const [emiAvailable, setEmiAvailable] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name), product_variants(id, quality, price)")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    setProducts((data as ProductWithRelations[]) || []);
  };

  const loadCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      await Promise.all([loadProducts(), loadCategories()]);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await Promise.all([loadProducts(), loadCategories()]);
    } catch (err) {
      console.error("Error refreshing products:", err);
    }
  });

  const isSearching = searchQuery.trim().length > 0;
  const isFiltering = isSearching || categoryFilter !== "all";

  const filteredProducts = useMemo(() => {
    let result = products;

    if (categoryFilter !== "all") {
      result = result.filter((item) => item.category_id === categoryFilter);
    }

    if (isSearching) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.subtitle ?? "").toLowerCase().includes(q) ||
          (item.categories?.name ?? "").toLowerCase().includes(q) ||
          item.slug.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, searchQuery, isSearching, categoryFilter]);

  const handleReorderByPosition = async (productId: string, newPosition: number) => {
    const oldIndex = products.findIndex((p) => p.id === productId);
    if (oldIndex === -1) return;

    const newIndex = Math.min(Math.max(newPosition, 1), products.length) - 1;
    if (newIndex === oldIndex) return;

    const reordered = [...products];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    try {
      const results = await Promise.all(
        reordered.map((p, idx) =>
          p.sort_order === idx ? Promise.resolve({ error: null }) : supabase.from("products").update({ sort_order: idx }).eq("id", p.id)
        )
      );
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;
      await fetchProducts();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reorder product.");
      throw err;
    }
  };

  const handleToggleActive = async (product: ProductWithRelations) => {
    try {
      const { error } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
      if (error) throw error;
      fetchProducts();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update product status.");
    }
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this product? This also removes its quality tiers.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("products").delete().eq("id", productId);
            if (error) throw error;
            fetchProducts();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to delete product.");
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setTitle("");
    setSubtitle("");
    setCategoryId(null);
    setSku("");
    setCaratWeight("");
    setOrigin("Ceylon (Sri Lanka)");
    setBasicPrice("");
    setSemiPremPrice("");
    setPremiumPrice("");
    setEmiAvailable(false);
    setIsFeatured(false);
    setIsActive(true);
    setImageUrl("");
    setImagePreviewFailed(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductWithRelations) => {
    setEditingProduct(product);
    setTitle(product.title);
    setSubtitle(product.subtitle ?? "");
    setCategoryId(product.category_id ?? null);
    setSku("");
    setCaratWeight("");
    setOrigin("Ceylon (Sri Lanka)");
    setEmiAvailable(product.emi_available);
    setIsFeatured(product.is_featured);
    setIsActive(product.is_active);
    setImageUrl(product.images?.[0] ?? "");
    setImagePreviewFailed(false);

    const tierPriceByQuality = new Map(
      product.product_variants.filter((v) => v.quality).map((v) => [v.quality as ProductQuality, v.price])
    );
    setBasicPrice(tierPriceByQuality.has("basic") ? String(tierPriceByQuality.get("basic")) : "");
    setSemiPremPrice(tierPriceByQuality.has("semi_prem") ? String(tierPriceByQuality.get("semi_prem")) : "");
    setPremiumPrice(tierPriceByQuality.has("premium") ? String(tierPriceByQuality.get("premium")) : "");

    setIsModalOpen(true);
  };

  const handlePickImage = async () => {
    try {
      const publicUrl = await pickAndUploadImage("products");
      if (publicUrl) {
        setImageUrl(publicUrl);
        setImagePreviewFailed(false);
      }
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not upload the selected image.");
    }
  };

  const handleSubmitProduct = async () => {
    const tierPrices: Record<ProductQuality, string> = {
      basic: basicPrice,
      semi_prem: semiPremPrice,
      premium: premiumPrice
    };
    const filledTiers = TIERS.filter((tier) => tierPrices[tier.quality].trim() !== "");

    if (!title.trim() || filledTiers.length === 0) {
      Alert.alert("Error", "Please provide a title and at least one tier price (Basic, Semi-Premium, or Premium).");
      return;
    }

    setSubmitting(true);
    try {
      const numCarat = caratWeight ? parseFloat(caratWeight) : undefined;

      if (editingProduct) {
        const { error: productError } = await supabase
          .from("products")
          .update({
            title: title.trim(),
            subtitle: subtitle || null,
            category_id: categoryId,
            emi_available: emiAvailable,
            is_featured: isFeatured,
            is_active: isActive,
            images: imageUrl ? [imageUrl] : []
          })
          .eq("id", editingProduct.id);
        if (productError) throw productError;

        const existingByQuality = new Map(
          editingProduct.product_variants.filter((v) => v.quality).map((v) => [v.quality as ProductQuality, v])
        );

        for (const tier of TIERS) {
          const priceText = tierPrices[tier.quality];
          const existing = existingByQuality.get(tier.quality);

          if (priceText.trim() === "") {
            if (existing) {
              const { error } = await supabase.from("product_variants").delete().eq("id", existing.id);
              if (error) throw error;
            }
            continue;
          }

          if (existing) {
            const { error } = await supabase
              .from("product_variants")
              .update({ price: parseFloat(priceText) })
              .eq("id", existing.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("product_variants").insert({
              product_id: editingProduct.id,
              title: `${tier.label}${caratWeight ? ` · ${caratWeight} Ratti` : ""}`,
              sku: sku.trim() ? `${sku.trim()}-${tier.quality}` : `${editingProduct.slug}-${tier.quality}`,
              quality: tier.quality,
              carat_weight: numCarat,
              origin: origin || undefined,
              price: parseFloat(priceText),
              stock: 1
            });
            if (error) throw error;
          }
        }

        Alert.alert("Success", "Product updated!");
      } else {
        const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const productSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

        const { data: newProduct, error: productError } = await supabase
          .from("products")
          .insert({
            title: title.trim(),
            slug: productSlug,
            subtitle: subtitle || null,
            category_id: categoryId,
            emi_available: emiAvailable,
            is_featured: isFeatured,
            is_active: isActive,
            images: imageUrl ? [imageUrl] : [],
            sort_order: products.length,
            rating: 5.0,
            review_count: 0
          })
          .select()
          .single();

        if (productError) throw productError;

        const variantRows = filledTiers.map((tier) => ({
          product_id: newProduct.id,
          title: `${tier.label}${caratWeight ? ` · ${caratWeight} Ratti` : ""}`,
          sku: sku.trim() ? `${sku.trim()}-${tier.quality}` : `${productSlug}-${tier.quality}`,
          quality: tier.quality,
          carat_weight: numCarat,
          origin: origin || undefined,
          price: parseFloat(tierPrices[tier.quality]),
          stock: 1
        }));

        const { error: variantError } = await supabase.from("product_variants").insert(variantRows);
        if (variantError) throw variantError;

        Alert.alert("Success", `Product created with ${filledTiers.length} quality tier${filledTiers.length > 1 ? "s" : ""}!`);
      }

      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Catalog & Inventory"
        subtitle="Lab-certified gemstones & Vastu items"
        action={<Button label="+ Add Product" compact onPress={openCreateModal} />}
      />

      <RefreshableFlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        refreshing={refreshing}
        onRefresh={onRefresh}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 12 }} className="w-full">
            <SearchBar placeholder="Search products, categories…" onChangeQuery={setSearchQuery} />

            {!loading && categories.length > 0 ? (
              <CategoryPicker
                options={[{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c.id, label: c.name }))]}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            ) : null}

            {!loading && products.length > 0 ? (
              <Text className="text-[10px] text-ink-muted -mt-1">
                Edit the <Text className="font-rubik-bold text-primary">Pos.</Text> number on a card to move it to that position.
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : products.length === 0 ? (
            <EmptyState title="No products found" description='Tap "+ Add Product" to publish your first gemstone or Rudraksha.' />
          ) : (
            <EmptyState title="No matches" description="Try a different search term or category filter." />
          )
        }
        renderItem={({ item }) => {
          const index = products.findIndex((p) => p.id === item.id);
          return (
            <View
              style={{ width: "48%" }}
              className="bg-surface-card border border-surface-border rounded-xl shadow-sm overflow-hidden gap-0"
            >
              {item.images?.[0] ? (
                <Image
                  source={{ uri: item.images[0] }}
                  style={{ width: "100%", height: 84, backgroundColor: "#F1ECFA" }}
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-[84px] bg-surface-tint items-center justify-center">
                  <Text className="text-2xl">💎</Text>
                </View>
              )}

              <View className="p-2.5 gap-1">
                <Text className="text-xs font-rubik-bold text-foreground" numberOfLines={1}>
                  {item.title}
                </Text>

                <View className="flex-row flex-wrap gap-1">
                  <StatusBadge label={item.is_active ? "Active" : "Hidden"} tone={item.is_active ? "success" : "neutral"} />
                  {item.is_featured ? <StatusBadge label="Bestseller" tone="saffron" /> : null}
                  {item.categories?.name ? <StatusBadge label={item.categories.name} tone="primary" /> : null}
                  {item.emi_available ? <StatusBadge label="EMI" tone="gold" /> : null}
                </View>

                {item.product_variants.length > 0 ? (
                  <View className="flex-row flex-wrap gap-1">
                    {item.product_variants
                      .filter((v) => v.quality)
                      .map((variant) => (
                        <View key={variant.quality} className="bg-background border border-surface-border rounded-lg px-2 py-0.5">
                          <Text className="text-[9px] font-rubik-bold text-ink-muted uppercase">
                            {TIERS.find((t) => t.quality === variant.quality)?.label ?? variant.quality}
                          </Text>
                          <Text className="text-[11px] font-rubik-bold text-primary">{formatTierPrice(variant.price)}</Text>
                        </View>
                      ))}
                  </View>
                ) : null}

                <View className="pt-1.5 mt-0.5 border-t border-surface-border">
                  <PositionInput
                    position={index + 1}
                    disabled={isFiltering}
                    onSubmitPosition={(pos) => handleReorderByPosition(item.id, pos)}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Switch
                    value={item.is_active}
                    onValueChange={() => handleToggleActive(item)}
                    trackColor={{ false: "#D1D5DB", true: "#5B21B6" }}
                    style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                  />
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    className="w-7 h-7 rounded-lg border border-surface-border bg-background items-center justify-center"
                  >
                    <Ionicons name="pencil-outline" size={13} color="#5B21B6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteProduct(item.id)}
                    className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={13} color="#B91C1C" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <FormSheet
        visible={isModalOpen}
        title={editingProduct ? "Edit Product" : "Add Gemstone / Product"}
        description={
          editingProduct
            ? "Update product details, pricing tiers, or availability"
            : "Publish a new lab-certified gemstone, Rudraksha, or Vastu item"
        }
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmitProduct}
        submitLabel={editingProduct ? "Save Changes" : "Publish"}
        submitting={submitting}
      >
        <TextField label="Product Title" placeholder="e.g. Ceylon Blue Sapphire - Yellow" value={title} onChangeText={setTitle} />
        <TextField
          label="Subtitle"
          placeholder="e.g. Unheated & Untreated Natural Gemstone"
          value={subtitle}
          onChangeText={setSubtitle}
        />

        <View className="gap-2">
          <Text className="text-xs font-rubik-semibold text-ink-body">Category</Text>
          <CategoryPicker
            options={categories.map((c) => ({ id: c.id, label: c.name }))}
            value={categoryId}
            onChange={setCategoryId}
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs font-rubik-semibold text-ink-body">Product Image (optional)</Text>
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

        <TextField label="SKU (optional)" placeholder="e.g. GEM-SAP-001" value={sku} onChangeText={setSku} />
        <TextField
          label="Carat / Ratti Weight (optional)"
          placeholder="e.g. 4.25"
          value={caratWeight}
          keyboardType="numeric"
          onChangeText={setCaratWeight}
        />
        <TextField label="Origin" placeholder="e.g. Ceylon (Sri Lanka)" value={origin} onChangeText={setOrigin} />
        {editingProduct ? (
          <Text className="text-[11px] text-ink-muted -mt-2">
            SKU, Carat/Ratti & Origin above apply only to new tiers you add during this edit — existing tier prices update in place.
          </Text>
        ) : null}

        <View className="gap-2">
          <Text className="text-xs font-rubik-semibold text-ink-body">
            Quality Tier Pricing (fill in at least one)
          </Text>
          <TextField
            label="Basic Price (INR)"
            placeholder="e.g. 12000"
            value={basicPrice}
            keyboardType="numeric"
            onChangeText={setBasicPrice}
          />
          <TextField
            label="Semi-Premium Price (INR)"
            placeholder="e.g. 25000"
            value={semiPremPrice}
            keyboardType="numeric"
            onChangeText={setSemiPremPrice}
          />
          <TextField
            label="Premium Price (INR)"
            placeholder="e.g. 45000"
            value={premiumPrice}
            keyboardType="numeric"
            onChangeText={setPremiumPrice}
          />
        </View>

        <View className="flex-row justify-between items-center bg-background border border-surface-border rounded-xl px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-rubik-semibold text-foreground">EMI Available</Text>
            <Text className="text-[11px] text-ink-muted mt-0.5">
              {emiAvailable
                ? "Customers can pay via Bajaj Finserv Cardless EMI."
                : "EMI option hidden for this product."}
            </Text>
          </View>
          <Switch value={emiAvailable} onValueChange={setEmiAvailable} trackColor={{ false: "#D1D5DB", true: "#5B21B6" }} />
        </View>

        <View className="flex-row justify-between items-center bg-background border border-surface-border rounded-xl px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-rubik-semibold text-foreground">Bestseller</Text>
            <Text className="text-[11px] text-ink-muted mt-0.5">
              {isFeatured ? "Highlighted with a Bestseller badge to customers." : "Shown as a regular product."}
            </Text>
          </View>
          <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ false: "#D1D5DB", true: "#E8973A" }} />
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
