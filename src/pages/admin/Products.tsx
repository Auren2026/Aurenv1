import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default function AdminProducts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    subcategory_id: "",
    price_per_unit: 0,
    old_price: null as number | null,
    units_per_box: 1,
    is_new: false,
    is_promotion: false,
    is_active: true,
    expiry_date: null as string | null,
    min_order_quantity: 1,
    stock_quantity: 0,
    image_url: "",
  });

  const { data: subcategories } = useQuery({
    queryKey: ["admin-subcategories-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, categories(name)")
        .eq("is_active", true);
      if (error) throw error;
      
      return data?.sort((a: any, b: any) => {
        const categoryA = a.categories?.name || "";
        const categoryB = b.categories?.name || "";
        const subcategoryA = a.name || "";
        const subcategoryB = b.name || "";
        
        const categoryComparison = categoryA.localeCompare(categoryB, 'pt-PT');
        if (categoryComparison !== 0) {
          return categoryComparison;
        }
        
        return subcategoryA.localeCompare(subcategoryB, 'pt-PT');
      });
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, subcategories(name, categories(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("products").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(t("products.createSuccess"));
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || t("products.createError"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(t("products.updateSuccess"));
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || t("products.updateError"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(t("products.deleteSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("products.deleteError"));
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      subcategory_id: "",
      price_per_unit: 0,
      old_price: null,
      units_per_box: 1,
      is_new: false,
      is_promotion: false,
      is_active: true,
      expiry_date: null,
      min_order_quantity: 1,
      stock_quantity: 0,
      image_url: "",
    });
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      description: product.description || "",
      subcategory_id: product.subcategory_id,
      price_per_unit: product.price_per_unit,
      old_price: product.old_price,
      units_per_box: product.units_per_box,
      is_new: product.is_new,
      is_promotion: product.is_promotion,
      is_active: product.is_active,
      expiry_date: product.expiry_date,
      min_order_quantity: product.min_order_quantity || 1,
      stock_quantity: product.stock_quantity || 0,
      image_url: product.image_url || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/50 pb-6">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-50 safe-area-inset-top">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t("products.title")}</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("products.products")}</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("products.newProduct")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? t("products.editProduct") : t("products.newProduct")}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("products.name")} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">{t("products.code")} *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t("products.description")}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">{t("products.subcategory")} *</Label>
                    <Select
                      value={formData.subcategory_id}
                      onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("products.selectSubcategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories?.map((sub: any) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.categories?.name} - {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">{t("products.pricePerUnit")} *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price_per_unit}
                        onChange={(e) =>
                          setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="old_price">{t("products.oldPrice")}</Label>
                      <Input
                        id="old_price"
                        type="number"
                        step="0.01"
                        value={formData.old_price || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            old_price: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="units">{t("products.unitsPerBoxLabel")} *</Label>
                      <Input
                        id="units"
                        type="number"
                        value={formData.units_per_box}
                        onChange={(e) =>
                          setFormData({ ...formData, units_per_box: parseInt(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min_order">{t("products.minOrderLabel")}</Label>
                      <Input
                        id="min_order"
                        type="number"
                        value={formData.min_order_quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, min_order_quantity: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">{t("products.stock")}</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ImageUpload
                      value={formData.image_url}
                      onChange={(url) => setFormData({ ...formData, image_url: url })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry">{t("products.expiryDate")}</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={formData.expiry_date || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, expiry_date: e.target.value || null })
                      }
                    />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_new"
                        checked={formData.is_new}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_new: checked })
                        }
                      />
                      <Label htmlFor="is_new">{t("products.new")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_promotion"
                        checked={formData.is_promotion}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_promotion: checked })
                        }
                      />
                      <Label htmlFor="is_promotion">{t("products.promotion")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <Label htmlFor="is_active">{t("products.active")}</Label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    {editingProduct ? t("common.update") : t("common.create")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>{t("common.loading")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("products.code")}</TableHead>
                    <TableHead>{t("products.name")}</TableHead>
                    <TableHead>{t("products.category")}</TableHead>
                    <TableHead>{t("products.price")}</TableHead>
                    <TableHead>{t("products.stock")}</TableHead>
                    <TableHead>{t("products.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.code}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-sm">
                        {product.subcategories?.categories?.name} - {product.subcategories?.name}
                      </TableCell>
                      <TableCell>CHF {product.price_per_unit.toFixed(2)}</TableCell>
                      <TableCell>{product.stock_quantity || 0}</TableCell>
                      <TableCell>
                        {product.is_active ? (
                          <span className="text-success">{t("products.active")}</span>
                        ) : (
                          <span className="text-muted-foreground">{t("products.inactive")}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
