import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import MenuItemCard from "@/components/menu/menu-item-card";
import NewItemModal from "@/components/menu/new-item-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pizza, GlassWater, Cookie } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Menu() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [showNewItemModal, setShowNewItemModal] = useState(false);

  // Get user's tenants
  const { data: tenants } = useQuery({
    queryKey: ["/api/tenants"],
    enabled: isAuthenticated && !isLoading,
  });

  // Set first tenant as default
  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenant) {
      setSelectedTenant(tenants[0].id);
    }
  }, [tenants, selectedTenant]);

  // Get menu categories
  const { data: categories } = useQuery({
    queryKey: ["/api/tenants", selectedTenant, "menu", "categories"],
    enabled: !!selectedTenant,
  });

  // Get menu items
  const { data: menuItems } = useQuery({
    queryKey: ["/api/tenants", selectedTenant, "menu", "items"],
    enabled: !!selectedTenant,
  });

  // Create default categories if none exist
  const createDefaultCategories = useMutation({
    mutationFn: async () => {
      const defaultCategories = [
        { name: "Pizzas", description: "Nossas deliciosas pizzas", sortOrder: 0 },
        { name: "Bebidas", description: "Bebidas geladas", sortOrder: 1 },
        { name: "Acompanhamentos", description: "Deliciosos acompanhamentos", sortOrder: 2 },
      ];

      for (const category of defaultCategories) {
        await apiRequest("POST", `/api/tenants/${selectedTenant}/menu/categories`, category);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", selectedTenant, "menu", "categories"] });
    },
  });

  // Create sample items if none exist
  const createSampleItems = useMutation({
    mutationFn: async () => {
      if (!categories || categories.length === 0) return;

      const pizzaCategoryId = categories.find((c: any) => c.name === "Pizzas")?.id;
      const bebidaCategoryId = categories.find((c: any) => c.name === "Bebidas")?.id;
      const acompCategoryId = categories.find((c: any) => c.name === "Acompanhamentos")?.id;

      const sampleItems = [
        {
          categoryId: pizzaCategoryId,
          name: "Margherita",
          description: "Molho de tomate, mussarela, manjericão e azeite",
          prices: { "P": 25.00, "M": 30.00, "G": 35.00 },
          imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop",
          sortOrder: 0
        },
        {
          categoryId: pizzaCategoryId,
          name: "Calabresa",
          description: "Molho de tomate, mussarela, calabresa e cebola",
          prices: { "P": 28.00, "M": 33.00, "G": 38.00 },
          imageUrl: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=200&h=200&fit=crop",
          sortOrder: 1
        },
        {
          categoryId: bebidaCategoryId,
          name: "Coca-Cola",
          description: "Refrigerante gelado",
          prices: { "350ml": 4.00, "600ml": 6.00, "2L": 9.00 },
          sortOrder: 0
        },
        {
          categoryId: acompCategoryId,
          name: "Batata Frita",
          description: "Batatas fritas crocantes",
          prices: { "P": 12.00, "G": 18.00 },
          sortOrder: 0
        }
      ];

      for (const item of sampleItems) {
        if (item.categoryId) {
          await apiRequest("POST", `/api/tenants/${selectedTenant}/menu/items`, item);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", selectedTenant, "menu", "items"] });
    },
  });

  // Initialize sample data if needed
  useEffect(() => {
    if (selectedTenant && categories?.length === 0) {
      createDefaultCategories.mutate();
    }
  }, [selectedTenant, categories]);

  useEffect(() => {
    if (selectedTenant && categories?.length > 0 && menuItems?.length === 0) {
      createSampleItems.mutate();
    }
  }, [selectedTenant, categories, menuItems]);

  // Delete menu item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/menu/items/${itemId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", selectedTenant, "menu", "items"] });
      toast({
        title: "Item removido",
        description: "Item do cardápio removido com sucesso.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao remover item do cardápio.",
        variant: "destructive",
      });
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "pizzas":
        return Pizza;
      case "bebidas":
        return GlassWater;
      case "acompanhamentos":
        return Cookie;
      default:
        return Pizza;
    }
  };

  const getItemsByCategory = (categoryId: string) => {
    return menuItems?.filter((item: any) => item.categoryId === categoryId) || [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        tenants={tenants || []} 
        selectedTenant={selectedTenant} 
        onTenantChange={setSelectedTenant} 
      />
      
      <div className="flex">
        <Sidebar currentSection="menu" />
        
        <div className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Cardápio</h1>
                <p className="text-gray-600">Gerencie pizzas, bebidas e acompanhamentos</p>
              </div>
              <Button
                onClick={() => setShowNewItemModal(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            </div>

            {/* Menu Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {categories?.map((category: any) => {
                const Icon = getCategoryIcon(category.name);
                const items = getItemsByCategory(category.id);
                
                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Icon className="h-5 w-5 text-red-600 mr-2" />
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {items.length > 0 ? (
                        items.map((item: any) => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            onEdit={() => {/* TODO: Implement edit */}}
                            onDelete={() => handleDeleteItem(item.id)}
                          />
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">Nenhum item nesta categoria</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!categories || categories.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando cardápio...</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* New Item Modal */}
      <NewItemModal
        isOpen={showNewItemModal}
        onClose={() => setShowNewItemModal(false)}
        tenantId={selectedTenant}
        categories={categories || []}
      />
    </div>
  );
}
