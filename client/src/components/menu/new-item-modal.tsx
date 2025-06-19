import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
});

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  categories: any[];
}

interface PriceOption {
  size: string;
  price: number;
}

export default function NewItemModal({ isOpen, onClose, tenantId, categories }: NewItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [priceOptions, setPriceOptions] = useState<PriceOption[]>([
    { size: "Único", price: 0 }
  ]);

  const form = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      imageUrl: "",
      isAvailable: true,
    },
  });

  // Create menu item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: any) => {
      await apiRequest("POST", `/api/tenants/${tenantId}/menu/items`, itemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", tenantId, "menu", "items"] });
      toast({
        title: "Item criado",
        description: "O item foi adicionado ao cardápio com sucesso.",
      });
      onClose();
      form.reset();
      setPriceOptions([{ size: "Único", price: 0 }]);
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
        description: "Falha ao criar item do cardápio.",
        variant: "destructive",
      });
    },
  });

  const addPriceOption = () => {
    setPriceOptions(prev => [...prev, { size: "", price: 0 }]);
  };

  const removePriceOption = (index: number) => {
    if (priceOptions.length > 1) {
      setPriceOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updatePriceOption = (index: number, field: 'size' | 'price', value: string | number) => {
    setPriceOptions(prev => prev.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    ));
  };

  const onSubmit = (data: any) => {
    // Validate price options
    const validPrices = priceOptions.filter(option => 
      option.size.trim() !== "" && option.price > 0
    );

    if (validPrices.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma opção de preço válida.",
        variant: "destructive",
      });
      return;
    }

    // Convert price options to the expected format
    const prices = validPrices.reduce((acc, option) => {
      acc[option.size] = option.price;
      return acc;
    }, {} as Record<string, number>);

    const itemData = {
      ...data,
      prices,
      sortOrder: 0,
    };

    createItemMutation.mutate(itemData);
  };

  const getSuggestedSizes = (categoryName: string) => {
    const lowerCaseName = categoryName.toLowerCase();
    if (lowerCaseName.includes('pizza')) {
      return ['P', 'M', 'G', 'Família'];
    } else if (lowerCaseName.includes('bebida')) {
      return ['350ml', '600ml', '1L', '2L'];
    } else if (lowerCaseName.includes('acompanhamento')) {
      return ['P', 'M', 'G', 'Família'];
    }
    return ['Único'];
  };

  const selectedCategory = categories.find(cat => cat.id === form.watch('categoryId'));
  const suggestedSizes = selectedCategory ? getSuggestedSizes(selectedCategory.name) : ['Único'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Item do Cardápio</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Item</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Pizza Margherita" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os ingredientes ou características do item..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://exemplo.com/imagem.jpg"
                      type="url"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opções de Preço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {priceOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Select
                        value={option.size}
                        onValueChange={(value) => updatePriceOption(index, 'size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tamanho" />
                        </SelectTrigger>
                        <SelectContent>
                          {suggestedSizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Personalizado...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {option.size === "custom" && (
                      <div className="flex-1">
                        <Input
                          placeholder="Tamanho personalizado"
                          value={option.size}
                          onChange={(e) => updatePriceOption(index, 'size', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Preço"
                        value={option.price || ""}
                        onChange={(e) => updatePriceOption(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePriceOption(index)}
                      disabled={priceOptions.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addPriceOption}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção de Preço
                </Button>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Item disponível</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-red-600 hover:bg-red-700"
                disabled={createItemMutation.isPending}
              >
                {createItemMutation.isPending ? "Criando..." : "Criar Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
