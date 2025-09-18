import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';

export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSelector(state => state.auth);

  // Calculate cart count from items
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Debug the cart count calculation
  useEffect(() => {
    console.log('[Cart] Cart count calculated:', cartCount, 'from items:', cartItems.length);
    console.log('[Cart] Items detail:', cartItems.map(item => ({ name: item.eventTitle, quantity: item.quantity })));
  }, [cartCount, cartItems]);

  // Load cart from API on mount
  useEffect(() => {
    if (user?.email) {
      fetchCart();
    } else {
      setCartItems([]);
      setIsLoading(false);
    }
  }, [user?.email]);

  const fetchCart = useCallback(async () => {
    if (!user?.email) {
      console.log('[Cart] No user email, clearing cart');
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Cart] Fetching cart for user:', user.email);

      const response = await fetch(`/api/cart/${encodeURIComponent(user.email)}?t=${Date.now()}`, {
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Cart] Fetched data:', data);
        console.log('[Cart] Items found:', data.items?.length || 0);
        setCartItems(data.items || []);
      } else {
        console.error('Failed to fetch cart, status:', response.status);
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  const addToCart = async (eventId, eventTitle, ticketType, quantity = 1) => {
    if (!user?.email) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      console.log('[Cart] Adding to cart:', { eventId, eventTitle, ticketType, quantity });

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          eventId,
          eventTitle,
          ticketType,
          quantity
        })
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart data
        toast.success(`Added ${quantity} ticket(s) to cart`);
        // Notify other components
        console.log('[Cart] Dispatching cartUpdated event');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user?.email || !itemId) return;

    try {
      console.log('[Cart] Removing item:', itemId);

      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          itemId
        })
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart data
        toast.success('Item removed from cart');
        // Notify other components
        console.log('[Cart] Dispatching cartUpdated event');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item');
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (!user?.email || newQuantity < 1) return;

    try {
      console.log('[Cart] Updating quantity:', itemId, newQuantity);

      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          itemId,
          quantity: newQuantity
        })
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart data
        // Notify other components
        console.log('[Cart] Dispatching cartUpdated event');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const clearCart = async () => {
    if (!user?.email) return;

    try {
      console.log('[Cart] Clearing cart...');

      const response = await fetch(`/api/cart/clear/${encodeURIComponent(user.email)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Immediately clear UI
        setCartItems([]);
        console.log('[Cart] Cart cleared successfully');

        // Notify other components
        console.log('[Cart] Dispatching cartCleared event');
        window.dispatchEvent(new CustomEvent('cartCleared'));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.ticketType.price || 0;
      return total + (price * item.quantity);
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
    cartCount, // This is calculated dynamically
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getCartSummary,
    fetchCart
  };
};