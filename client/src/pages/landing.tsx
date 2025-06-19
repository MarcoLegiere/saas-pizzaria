import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pizza, Users, BarChart3, Settings } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <Pizza className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">PizzaFlow</span>
            </div>
            <Button onClick={handleLogin} className="bg-red-600 hover:bg-red-700">
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Pizza className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Gerenciamento de Pedidos para Pizzarias
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Gerencie sua pizzaria com eficiência. Controle pedidos, cardápios, clientes e muito mais 
            em uma plataforma moderna e intuitiva.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="bg-red-600 hover:bg-red-700 text-lg px-8 py-3"
          >
            Começar Agora
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Gerenciamento de Pedidos
                </h3>
              </div>
              <p className="text-gray-600">
                Controle todos os pedidos em tempo real, desde a entrada até a entrega.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Pizza className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Cardápio Digital
                </h3>
              </div>
              <p className="text-gray-600">
                Gerencie pizzas, bebidas e acompanhamentos com facilidade.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Relatórios e Análises
                </h3>
              </div>
              <p className="text-gray-600">
                Visualize o desempenho da sua pizzaria com dashboards completos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Settings className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Multi-Tenant
                </h3>
              </div>
              <p className="text-gray-600">
                Múltiplas pizzarias podem usar o sistema com dados isolados.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Info */}
        <div className="mt-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Demo:</strong> Clique em "Entrar" para acessar o sistema de demonstração
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
