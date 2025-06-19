import {
  users,
  tenants,
  tenantUsers,
  menuCategories,
  menuItems,
  customers,
  orders,
  type User,
  type UpsertUser,
  type Tenant,
  type InsertTenant,
  type TenantUser,
  type MenuCategory,
  type InsertMenuCategory,
  type MenuItem,
  type InsertMenuItem,
  type Customer,
  type InsertCustomer,
  type Order,
  type InsertOrder,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Tenant operations
  getTenantsByUserId(userId: string): Promise<Tenant[]>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant, userId: string): Promise<Tenant>;
  updateTenant(id: string, tenant: Partial<InsertTenant>): Promise<Tenant>;
  
  // Menu operations
  getMenuCategories(tenantId: string): Promise<MenuCategory[]>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;
  updateMenuCategory(id: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory>;
  deleteMenuCategory(id: string): Promise<void>;
  
  getMenuItems(tenantId: string): Promise<MenuItem[]>;
  getMenuItemsByCategory(tenantId: string, categoryId: string): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem>;
  deleteMenuItem(id: string): Promise<void>;
  
  // Customer operations
  getCustomers(tenantId: string): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  searchCustomers(tenantId: string, query: string): Promise<Customer[]>;
  
  // Order operations
  getOrders(tenantId: string): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  getOrdersByStatus(tenantId: string, status: string): Promise<Order[]>;
  getRecentOrders(tenantId: string, limit: number): Promise<Order[]>;
  
  // Analytics operations
  getOrderStats(tenantId: string, startDate?: Date, endDate?: Date): Promise<{
    totalOrders: number;
    totalRevenue: string;
    averageOrderValue: string;
    averageDeliveryTime: number;
  }>;
  getPopularItems(tenantId: string, limit: number): Promise<{
    name: string;
    sales: number;
  }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Tenant operations
  async getTenantsByUserId(userId: string): Promise<Tenant[]> {
    const result = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        phone: tenants.phone,
        address: tenants.address,
        deliveryFee: tenants.deliveryFee,
        deliveryRadius: tenants.deliveryRadius,
        minOrderValue: tenants.minOrderValue,
        avgDeliveryTime: tenants.avgDeliveryTime,
        openTime: tenants.openTime,
        closeTime: tenants.closeTime,
        operatingDays: tenants.operatingDays,
        paymentMethods: tenants.paymentMethods,
        isActive: tenants.isActive,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .innerJoin(tenantUsers, eq(tenants.id, tenantUsers.tenantId))
      .where(eq(tenantUsers.userId, userId));
    
    return result;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant;
  }

  async createTenant(tenantData: InsertTenant, userId: string): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(tenantData).returning();
    
    // Add user as admin of the tenant
    await db.insert(tenantUsers).values({
      tenantId: tenant.id,
      userId,
      role: 'admin',
    });
    
    return tenant;
  }

  async updateTenant(id: string, tenantData: Partial<InsertTenant>): Promise<Tenant> {
    const [tenant] = await db
      .update(tenants)
      .set({ ...tenantData, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  // Menu operations
  async getMenuCategories(tenantId: string): Promise<MenuCategory[]> {
    return await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.tenantId, tenantId))
      .orderBy(menuCategories.sortOrder);
  }

  async createMenuCategory(categoryData: InsertMenuCategory): Promise<MenuCategory> {
    const [category] = await db.insert(menuCategories).values(categoryData).returning();
    return category;
  }

  async updateMenuCategory(id: string, categoryData: Partial<InsertMenuCategory>): Promise<MenuCategory> {
    const [category] = await db
      .update(menuCategories)
      .set(categoryData)
      .where(eq(menuCategories.id, id))
      .returning();
    return category;
  }

  async deleteMenuCategory(id: string): Promise<void> {
    await db.delete(menuCategories).where(eq(menuCategories.id, id));
  }

  async getMenuItems(tenantId: string): Promise<MenuItem[]> {
    return await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.tenantId, tenantId))
      .orderBy(menuItems.sortOrder);
  }

  async getMenuItemsByCategory(tenantId: string, categoryId: string): Promise<MenuItem[]> {
    return await db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.tenantId, tenantId), eq(menuItems.categoryId, categoryId)))
      .orderBy(menuItems.sortOrder);
  }

  async createMenuItem(itemData: InsertMenuItem): Promise<MenuItem> {
    const [item] = await db.insert(menuItems).values(itemData).returning();
    return item;
  }

  async updateMenuItem(id: string, itemData: Partial<InsertMenuItem>): Promise<MenuItem> {
    const [item] = await db
      .update(menuItems)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();
    return item;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  // Customer operations
  async getCustomers(tenantId: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async searchCustomers(tenantId: string, query: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantId),
          sql`${customers.name} ILIKE ${`%${query}%`} OR ${customers.phone} ILIKE ${`%${query}%`} OR ${customers.email} ILIKE ${`%${query}%`}`
        )
      )
      .orderBy(desc(customers.createdAt));
  }

  // Order operations
  async getOrders(tenantId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    
    // Update customer's total orders and spent
    await db
      .update(customers)
      .set({
        totalOrders: sql`${customers.totalOrders} + 1`,
        totalSpent: sql`${customers.totalSpent} + ${orderData.total}`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, orderData.customerId));
    
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'ready') {
      updateData.preparedAt = new Date();
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }
    
    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getOrdersByStatus(tenantId: string, status: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.status, status)))
      .orderBy(desc(orders.createdAt));
  }

  async getRecentOrders(tenantId: string, limit: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  // Analytics operations
  async getOrderStats(tenantId: string, startDate?: Date, endDate?: Date): Promise<{
    totalOrders: number;
    totalRevenue: string;
    averageOrderValue: string;
    averageDeliveryTime: number;
  }> {
    let whereCondition = eq(orders.tenantId, tenantId);
    
    if (startDate && endDate) {
      whereCondition = and(
        whereCondition,
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`
      ) as any;
    } else if (startDate) {
      whereCondition = and(
        whereCondition,
        sql`${orders.createdAt} >= ${startDate}`
      ) as any;
    }

    const [stats] = await db
      .select({
        totalOrders: count(),
        totalRevenue: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
        averageOrderValue: sql<string>`COALESCE(AVG(${orders.total}), 0)`,
        averageDeliveryTime: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${orders.deliveredAt} - ${orders.createdAt}))/60), 0)`,
      })
      .from(orders)
      .where(whereCondition);

    return stats;
  }

  async getPopularItems(tenantId: string, limit: number): Promise<{
    name: string;
    sales: number;
  }[]> {
    // This would require JSON aggregation to count items from order items
    // For now, return mock data structure - in real implementation would need complex JSON query
    return [];
  }
}

export const storage = new DatabaseStorage();
