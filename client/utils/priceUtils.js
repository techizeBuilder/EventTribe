// Utility functions for price formatting

/**
 * Format price with proper handling for free items
 * @param {number} price - The price to format
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {string} Formatted price string
 */
export function formatPrice(price, currency = '$') {
  const numPrice = parseFloat(price) || 0;
  
  // Show "Free" for zero prices
  if (numPrice === 0) {
    return 'Free';
  }
  
  // Format non-zero prices with currency symbol
  return `${currency}${numPrice.toFixed(2)}`;
}

/**
 * Format price for display in components
 * @param {number} price - The price to format
 * @returns {string} Formatted price string
 */
export function displayPrice(price) {
  return formatPrice(price);
}