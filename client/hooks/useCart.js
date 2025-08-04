import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';

// Global cache to prevent duplicate requests across multiple components
let globalCartData = { items: [], count: 0, lastFetch: 0 };
let pendingFetchPromise = null;
const THROTTLE_DELAY = 2000; // Increase throttle delay to 2 seconds

export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [lastToastTime, setLastToastTime] = useState(0);
  const { user } = useSelector(state => state.auth);

  // Load cart from API on mount
  useEffect(() => {
    if (user?.email) {
      fetchCart();
      fetchCartCount();
    } else {
      setIsLoading(false);
    }
  }, [user?.email]);

  const fetchCart = async () => {
    if (!user?.email) return;
    
    // Throttle requests - only allow one request per 2 seconds
    const now = Date.now();
    if (now - globalCartData.lastFetch < THROTTLE_DELAY && globalCartData.items.length >= 0) {
      console.log('[Cart] Using cached data to prevent excessive requests');
      setCartItems(globalCartData.items);
      setCartCount(globalCartData.count);
      setIsLoading(false);
      return;
    }
    
    // If there's already a pending request, wait for it
    if (pendingFetchPromise) {
      try {
        await pendingFetchPromise;
        setCartItems(globalCartData.items);
        setCartCount(globalCartData.count);
        setIsLoading(false);
        return;
      } catch (error) {
        // Continue with new request if pending one failed
      }
    }
    
    try {
      pendingFetchPromise = (async () => {
        // Add aggressive cache busting to prevent stale data
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const response = await fetch(`/api/cart/${encodeURIComponent(user.email)}?t=${timestamp}&r=${random}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const data = await response.json();
        
        console.log('[Cart] Fetched cart data:', data);
        
        if (response.ok) {
          globalCartData = {
            items: data.items || [],
            count: data.count || (data.items || []).length,
            lastFetch: Date.now()
          };
          setCartItems(globalCartData.items);
          setCartCount(globalCartData.count);
        } else {
          console.error('Failed to fetch cart:', data.error);
        }
      })();
      
      await pendingFetchPromise;
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      pendingFetchPromise = null;
      setIsLoading(false);
    }
  };

  const fetchCartCount = async () => {
    if (!user?.email) return;
    
    // Use cached count if available and recent
    const now = Date.now();
    if (now - globalCartData.lastFetch < THROTTLE_DELAY && globalCartData.count !== undefined) {
      console.log('[Cart] Using cached count to prevent excessive requests');
      setCartCount(globalCartData.count);
      return;
    }
    
    try {
      // Add aggressive cache busting to prevent stale data
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const response = await fetch(`/api/cart/count/${encodeURIComponent(user.email)}?t=${timestamp}&r=${random}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      
      console.log('[Cart] Fetched cart count:', data);
      
      if (response.ok) {
        globalCartData.count = data.count || 0;
        globalCartData.lastFetch = Date.now();
        setCartCount(globalCartData.count);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const addToCart = async (eventId, eventTitle, ticketType, quantity = 1) => {
    if (!user?.email) {
      toast.error('Please login to add items to cart');
      return;
    }

    console.log('[Cart] Adding to cart:', {
      userEmail: user.email,
      eventId,
      eventTitle,
      ticketType,
      quantity
    });

    try {
      // Immediately update the cart count for instant feedback
      setCartCount(prev => prev + quantity);

      const requestBody = {
        userEmail: user.email,
        eventId,
        eventTitle,
        ticketType,
        quantity
      };

      console.log('[Cart] Request body:', requestBody);

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('[Cart] Add response:', { status: response.status, data });
      
      if (response.ok && data.success) {
        // Clear cache to force fresh data
        globalCartData = { items: [], count: 0, lastFetch: 0 };
        
        // Fetch updated cart data
        await Promise.all([fetchCart(), fetchCartCount()]);
        
        // Dispatch custom event to notify other components
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        }, 100);
        
        // Prevent duplicate toasts within 2 seconds
        const now = Date.now();
        if (now - lastToastTime > 2000) {
          toast.success(`Added ${quantity} ${ticketType.name} ticket(s) to cart`);
          setLastToastTime(now);
        }
      } else {
        // Revert the optimistic update if the request fails
        setCartCount(prev => Math.max(0, prev - quantity));
        toast.error(data.error || 'Failed to add item to cart');
        console.error('[Cart] Add failed:', data);
      }
    } catch (error) {
      console.error('[Cart] Error adding to cart:', error);
      // Revert the optimistic update if the request fails
      setCartCount(prev => Math.max(0, prev - quantity));
      toast.error('Failed to add item to cart');
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user?.email) {
      toast.error('Please log in to manage cart items');
      return;
    }

    if (!itemId) {
      toast.error('Invalid item ID');
      return;
    }

    try {
      // Store original state for rollback
      const originalCartItems = [...cartItems];
      const originalCartCount = cartCount;
      
      // Optimistically update UI first
      const itemToRemove = cartItems.find(item => item._id === itemId);
      if (itemToRemove) {
        setCartItems(prev => prev.filter(item => item._id !== itemId));
        setCartCount(prev => Math.max(0, prev - itemToRemove.quantity));
      }

      console.log(`[Cart] Removing item ${itemId} for user ${user.email}`);

      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          itemId: itemId.toString() // Ensure it's a string
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Force refresh from server to ensure sync
        console.log('[Cart] Item removed successfully, refreshing cart state');
        
        // Clear cache and force fresh data after successful removal
        globalCartData = { items: [], count: 0, lastFetch: 0 };
        
        // Immediately fetch fresh data to ensure UI is in sync
        await Promise.all([fetchCart(), fetchCartCount()]);
        
        // Dispatch custom event to notify other components with delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        }, 100);
        
        // Check if enough time has passed since last toast
        const now = Date.now();
        if (now - lastToastTime > 2000) {
          toast.success('Item removed from cart');
          setLastToastTime(now);
        }
      } else {
        // Revert optimistic update on failure
        console.error('[Cart] Failed to remove item:', data);
        setCartItems(originalCartItems);
        setCartCount(originalCartCount);
        toast.error(data.error || 'Failed to remove item from cart');
      }
    } catch (error) {
      console.error('[Cart] Error removing from cart:', error);
      // Force refresh from server to get accurate state
      await Promise.all([fetchCart(), fetchCartCount()]);
      toast.error('Failed to remove item from cart');
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (!user?.email) return;

    try {
      // Optimistically update UI first
      const itemToUpdate = cartItems.find(item => item._id === itemId);
      if (itemToUpdate) {
        const quantityDiff = newQuantity - itemToUpdate.quantity;
        setCartItems(prev => 
          prev.map(item => 
            item._id === itemId 
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
        setCartCount(prev => Math.max(0, prev + quantityDiff));
      }

      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          itemId,
          quantity: newQuantity
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Verify with server state
        await fetchCart();
        await fetchCartCount();
      } else {
        // Revert optimistic update on failure
        await fetchCart();
        await fetchCartCount();
        toast.error(data.error || 'Failed to update item quantity');
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      // Revert optimistic update on error
      await fetchCart();
      await fetchCartCount();
      toast.error('Failed to update item quantity');
    }
  };

  const clearCart = async () => {
    if (!user?.email) return;

    try {
      // Optimistically update UI first
      setCartItems([]);
      setCartCount(0);

      const response = await fetch(`/api/cart/clear/${encodeURIComponent(user.email)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        // Check if enough time has passed since last toast
        const now = Date.now();
        if (now - lastToastTime > 2000) {
          toast.success('Cart cleared');
          setLastToastTime(now);
        }
      } else {
        // Revert optimistic update on failure
        await fetchCart();
        await fetchCartCount();
        toast.error(data.error || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Revert optimistic update on error
      await fetchCart();
      await fetchCartCount();
      toast.error('Failed to clear cart');
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.ticketType.price * item.quantity);
    }, 0);
  };

  const getCartSummary = () => {
    return cartItems.map(item => ({
      eventId: item.eventId,
      eventTitle: item.eventTitle,
      name: item.ticketType.name,
      price: item.ticketType.price,
      quantity: item.quantity,
      total: item.ticketType.price * item.quantity
    }));
  };

  return {
    cartItems,
    cartCount,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getCartSummary,
    fetchCart,
    fetchCartCount
  };
};