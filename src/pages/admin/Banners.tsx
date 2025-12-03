import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, ExternalLink, Image, Upload, Link as LinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

interface Banner {
  id: string;
  image_url: string;
  link: string | null;
  is_active: boolean;
  order: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function AdminBanners() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    image_url: "",
    link: "",
    order: 0,
  });

  // Fetch banners
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("order", { ascending: true });
      
      if (error) throw error;
      return data as Banner[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("banners").insert([{
        image_url: data.image_url,
        link: data.link || null,
        order: data.order,
        is_active: true,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success(t("admin.bannerCreated"));
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(t("admin.errorCreating") + ": " + error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("banners")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success(t("admin.statusUpdated"));
    },
    onError: (error: any) => {
      toast.error(t("admin.errorUpdating") + ": " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success(t("admin.bannerDeleted"));
    },
    onError: (error: any) => {
      toast.error(t("admin.errorDeleting") + ": " + error.message);
    },
  });

  const uploadFile = async (file: File): Promise<string> => {
    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `banners/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const resetForm = () => {
    setFormData({
      image_url: "",
      link: "",
      order: banners.length,
    });
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("admin.fileTooLarge"));
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(t("admin.selectImageOnly"));
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFormData({ ...formData, image_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile && !formData.image_url) {
      toast.error(t("admin.selectImageOrUrl"));
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl = formData.image_url;

      if (selectedFile) {
        imageUrl = await uploadFile(selectedFile);
      }

      await createMutation.mutateAsync({
        image_url: imageUrl,
        link: formData.link,
        order: formData.order,
      });
    } catch (error: any) {
      toast.error(t("admin.errorUploading") + ": " + error.message);
    } finally {
      setIsUploading(false);
    }
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
            <h1 className="text-2xl font-bold">{t("admin.manageBannersTitle")}</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("admin.homepageBanners")}</CardTitle>
              <CardDescription>
                {t("admin.bannersDescription")}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("admin.newBanner")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("admin.addBanner")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">
                        <Upload className="h-4 w-4 mr-2" />
                        {t("admin.upload")}
                      </TabsTrigger>
                      <TabsTrigger value="url">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        {t("admin.externalUrl")}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                        <p className="text-sm font-medium text-blue-800">📐 {t("admin.recommendedSize")}</p>
                        <p className="text-xs text-blue-700">{t("admin.bannerSize")}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("admin.bannerImage")}</Label>
                        <div 
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {previewUrl && selectedFile ? (
                            <div className="space-y-2">
                              <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="max-h-40 mx-auto rounded"
                              />
                              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                {t("admin.selectImage")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t("admin.maxFileSize")}
                              </p>
                            </div>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                        <p className="text-sm font-medium text-blue-800">📐 {t("admin.recommendedSize")}</p>
                        <p className="text-xs text-blue-700">{t("admin.bannerSize")}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image_url">{t("admin.imageUrl")}</Label>
                        <Input
                          id="image_url"
                          placeholder="https://exemplo.com/imagem.jpg"
                          value={formData.image_url}
                          onChange={(e) => {
                            setFormData({ ...formData, image_url: e.target.value });
                            setSelectedFile(null);
                            setPreviewUrl(e.target.value);
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("admin.pasteImageUrl")}
                        </p>
                      </div>
                      
                      {formData.image_url && (
                        <div className="space-y-2">
                          <Label>{t("admin.preview")}</Label>
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={formData.image_url} 
                              alt="Preview" 
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x100?text=URL+Inválida";
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-2">
                    <Label htmlFor="link">{t("admin.link")} ({t("common.optional")})</Label>
                    <Input
                      id="link"
                      placeholder="https://exemplo.com/promocao"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order">{t("admin.displayOrder")}</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isUploading || createMutation.isPending}
                  >
                    {isUploading || createMutation.isPending ? t("common.loading") : t("admin.addBanner")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">{t("common.loading")}</p>
            ) : banners.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("admin.noBanners")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">{t("admin.preview")}</TableHead>
                    <TableHead>{t("admin.imageUrl")}</TableHead>
                    <TableHead>{t("admin.link")}</TableHead>
                    <TableHead className="w-20">{t("common.order")}</TableHead>
                    <TableHead className="w-24">{t("common.active")}</TableHead>
                    <TableHead className="w-20">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <img 
                          src={banner.image_url} 
                          alt="Banner" 
                          className="w-16 h-10 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/64x40?text=Erro";
                          }}
                        />
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <span className="text-xs">{banner.image_url}</span>
                      </TableCell>
                      <TableCell>
                        {banner.link ? (
                          <a 
                            href={banner.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t("admin.link")}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{banner.order}</TableCell>
                      <TableCell>
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={(checked) => 
                            toggleMutation.mutate({ id: banner.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Remover este banner?")) {
                              deleteMutation.mutate(banner.id);
                            }
                          }}
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
