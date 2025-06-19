import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertTenantSchema,
  insertMenuCategorySchema,
  insertMenuItemSchema,
  insertCustomerSchema,
  insertOrderSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Tenant routes
  app.get("/api/tenants", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenants = await storage.getTenantsByUserId(userId);
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.get("/api/tenants/:slug", isAuthenticated, async (req, res) => {
    try {
      const { slug } = req.params;
      const tenant = await storage.getTenantBySlug(slug);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  app.post("/api/tenants", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantData = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(tenantData, userId);
      res.status(201).json(tenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({ message: "Failed to create tenant" });
    }
  });

  app.put("/api/tenants/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const tenantData = insertTenantSchema.partial().parse(req.body);
      const tenant = await storage.updateTenant(id, tenantData);
      res.json(tenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  // Menu routes
  app.get("/api/tenants/:tenantId/menu/categories", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const categories = await storage.getMenuCategories(tenantId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching menu categories:", error);
      res.status(500).json({ message: "Failed to fetch menu categories" });
    }
  });

  app.post("/api/tenants/:tenantId/menu/categories", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const categoryData = insertMenuCategorySchema.parse({ ...req.body, tenantId });
      const category = await storage.createMenuCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating menu category:", error);
      res.status(500).json({ message: "Failed to create menu category" });
    }
  });

  app.get("/api/tenants/:tenantId/menu/items", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { categoryId } = req.query;
      
      let items;
      if (categoryId) {
        items = await storage.getMenuItemsByCategory(tenantId, categoryId as string);
      } else {
        items = await storage.getMenuItems(tenantId);
      }
      
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post("/api/tenants/:tenantId/menu/items", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const itemData = insertMenuItemSchema.parse({ ...req.body, tenantId });
      const item = await storage.createMenuItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  app.put("/api/menu/items/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const itemData = insertMenuItemSchema.partial().parse(req.body);
      const item = await storage.updateMenuItem(id, itemData);
      res.json(item);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  app.delete("/api/menu/items/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMenuItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Customer routes
  app.get("/api/tenants/:tenantId/customers", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { search } = req.query;
      
      let customers;
      if (search) {
        customers = await storage.searchCustomers(tenantId, search as string);
      } else {
        customers = await storage.getCustomers(tenantId);
      }
      
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await storage.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/tenants/:tenantId/customers", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const customerData = insertCustomerSchema.parse({ ...req.body, tenantId });
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Order routes
  app.get("/api/tenants/:tenantId/orders", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { status, limit } = req.query;
      
      let orders;
      if (status) {
        orders = await storage.getOrdersByStatus(tenantId, status as string);
      } else if (limit) {
        orders = await storage.getRecentOrders(tenantId, parseInt(limit as string));
      } else {
        orders = await storage.getOrders(tenantId);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/tenants/:tenantId/orders", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      // Generate order number
      const orderNumber = `#${Date.now().toString().slice(-6)}`;
      
      const orderData = insertOrderSchema.parse({ 
        ...req.body, 
        tenantId,
        orderNumber
      });
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Analytics routes
  app.get("/api/tenants/:tenantId/analytics/stats", isAuthenticated, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const stats = await storage.getOrderStats(tenantId, start, end);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching analytics stats:", error);
      res.status(500).json({ message: "Failed to fetch analytics stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
