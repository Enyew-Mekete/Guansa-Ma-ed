import React, { createContext, useContext, useEffect, useState } from 'react';
import { MenuItem, MenuCategory, ServiceItem, Order, Review } from '../types';
import { useAuth } from './AuthContext';
import { apiRequest } from '../utils/api';

interface MenuContextType {
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  services: ServiceItem[];
  orders: Order[];
  error: string | null;
  clearError: () => void;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'rating' | 'reviewCount' | 'reviews'>) => Promise<boolean>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;
  addMenuCategory: (category: Omit<MenuCategory, 'id'>) => Promise<boolean>;
  updateMenuCategory: (id: string, category: Omit<MenuCategory, 'id'>) => Promise<boolean>;
  deleteMenuCategory: (id: string) => Promise<boolean>;
  addService: (service: Omit<ServiceItem, 'id'>) => Promise<boolean>;
  updateService: (id: string, updates: Partial<ServiceItem>) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;
  addReview: (productId: string, review: Omit<Review, 'id' | 'date'>) => Promise<boolean>;
  addOrder: (order: Order) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiRequest<{ items: MenuItem[] }>('/api/menu'),
      apiRequest<{ categories: MenuCategory[] }>('/api/menu/categories'),
      apiRequest<{ services: ServiceItem[] }>('/api/services'),
    ])
      .then(([menuResult, categoryResult, serviceResult]) => {
        if (!mounted) return;
        setMenuItems(menuResult.items);
        setMenuCategories(categoryResult.categories);
        setServices(serviceResult.services);
      })
      .catch((loadError: unknown) => {
        console.error('[Menu] Unable to load menu and services from the database.', loadError);
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load the menu.');
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!currentUser) {
      setOrders([]);
      return () => { mounted = false; };
    }
    apiRequest<{ orders: Order[] }>('/api/orders')
      .then(({ orders: savedOrders }) => {
        if (mounted) setOrders(savedOrders.map((order) => ({ ...order, totalAmount: Number(order.totalAmount) })));
      })
      .catch((loadError: unknown) => {
        console.error('[Orders] Unable to load order history.', loadError);
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load order history.');
      });
    return () => { mounted = false; };
  }, [currentUser]);

  const addMenuItem: MenuContextType['addMenuItem'] = async (itemData) => {
    try {
      const result = await apiRequest<{ item: MenuItem }>('/api/menu', { method: 'POST', body: JSON.stringify(itemData) });
      setMenuItems((previous) => [result.item, ...previous]);
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add menu item.');
      return false;
    }
  };

  const updateMenuItem: MenuContextType['updateMenuItem'] = async (id, updates) => {
    try {
      const result = await apiRequest<{ item: MenuItem }>(`/api/menu/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setMenuItems((previous) => previous.map((item) => item.id === id ? result.item : item));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update menu item.');
      return false;
    }
  };

  const deleteMenuItem: MenuContextType['deleteMenuItem'] = async (id) => {
    try {
      await apiRequest(`/api/menu/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setMenuItems((previous) => previous.filter((item) => item.id !== id));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete menu item.');
      return false;
    }
  };

  const addMenuCategory: MenuContextType['addMenuCategory'] = async (category) => {
    try {
      const result = await apiRequest<{ category: MenuCategory }>('/api/menu/categories', {
        method: 'POST',
        body: JSON.stringify(category),
      });
      setMenuCategories((previous) => [...previous, result.category].sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add menu category.');
      return false;
    }
  };

  const updateMenuCategory: MenuContextType['updateMenuCategory'] = async (id, category) => {
    try {
      const result = await apiRequest<{ category: MenuCategory }>(`/api/menu/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(category),
      });
      setMenuCategories((previous) => previous
        .map((existing) => existing.id === id ? result.category : existing)
        .sort((a, b) => a.name.localeCompare(b.name)));
      setMenuItems((previous) => previous.map((item) => item.category === id
        ? {
          ...item,
          menuType: result.category.menuType,
          categoryName: result.category.name,
          categoryNameAmharic: result.category.nameAmharic,
        }
        : item));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update menu category.');
      return false;
    }
  };

  const deleteMenuCategory: MenuContextType['deleteMenuCategory'] = async (id) => {
    try {
      await apiRequest(`/api/menu/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setMenuCategories((previous) => previous.filter((category) => category.id !== id));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete menu category.');
      return false;
    }
  };

  const addService: MenuContextType['addService'] = async (serviceData) => {
    try {
      const result = await apiRequest<{ service: ServiceItem }>('/api/services', { method: 'POST', body: JSON.stringify(serviceData) });
      setServices((previous) => [...previous, result.service]);
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add service.');
      return false;
    }
  };

  const updateService: MenuContextType['updateService'] = async (id, updates) => {
    try {
      const result = await apiRequest<{ service: ServiceItem }>(`/api/services/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setServices((previous) => previous.map((service) => service.id === id ? result.service : service));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update service.');
      return false;
    }
  };

  const deleteService: MenuContextType['deleteService'] = async (id) => {
    try {
      await apiRequest(`/api/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setServices((previous) => previous.filter((service) => service.id !== id));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete service.');
      return false;
    }
  };

  const addReview: MenuContextType['addReview'] = async (productId, review) => {
    try {
      const result = await apiRequest<{ item: MenuItem }>(`/api/menu/${encodeURIComponent(productId)}/reviews`, {
        method: 'POST',
        body: JSON.stringify(review),
      });
      setMenuItems((previous) => previous.map((item) => item.id === productId
        ? { ...item, ...result.item, categoryName: item.categoryName, categoryNameAmharic: item.categoryNameAmharic }
        : item));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit review.');
      return false;
    }
  };

  const addOrder: MenuContextType['addOrder'] = async (order) => {
    try {
      const result = await apiRequest<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      });
      const savedOrder = { ...result.order, totalAmount: Number(result.order.totalAmount) };
      setOrders((previous) => [savedOrder, ...previous]);
      setError(null);
      return savedOrder;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save order.');
      return null;
    }
  };

  const updateOrderStatus: MenuContextType['updateOrderStatus'] = async (orderId, status) => {
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrders((previous) => previous.map((order) => order.orderId === orderId ? { ...order, status } : order));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update order status.');
      return false;
    }
  };

  const resetToDefaults = async () => {
    try {
      await apiRequest('/api/menu/reset', { method: 'POST' });
      const [menuResult, serviceResult] = await Promise.all([
        apiRequest<{ items: MenuItem[] }>('/api/menu'),
        apiRequest<{ services: ServiceItem[] }>('/api/services'),
      ]);
      setMenuItems(menuResult.items);
      setServices(serviceResult.services);
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to restore defaults.');
      return false;
    }
  };

  const clearError = () => setError(null);

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        menuCategories,
        services,
        orders,
        error,
        clearError,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        addMenuCategory,
        updateMenuCategory,
        deleteMenuCategory,
        addService,
        updateService,
        deleteService,
        addReview,
        addOrder,
        updateOrderStatus,
        resetToDefaults,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
