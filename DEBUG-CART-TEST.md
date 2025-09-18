# 🔍 Cart Counter Debug Test

## Test Steps:

### 1. **Open Browser Console (F12)**
Look for these debug messages:

### 2. **Expected Console Output on Page Load:**
```
[Cart] Fetching cart for user: your-email@example.com
[Cart] Fetched data: {items: [...], count: X}
[Cart] Items found: 2
[Cart] Cart count calculated: 2 from items: 2
[Cart] Items detail: [{name: "Garba party Event in Gujarat", quantity: 2}]
[CartIcon] Rendering - cartCount: 2
```

### 3. **If No Debug Messages Appear:**
- Check if user is logged in
- Check if useCart hook is being called
- Check network tab for API calls

### 4. **If API Call Fails:**
- Check Network tab in browser dev tools
- Look for `/api/cart/[email]` call
- Check if it returns 200 status
- Check response data

### 5. **Manual Cart Count Test:**
Open browser console and run:
```javascript
// Test cart API directly
fetch('/api/cart/your-email@example.com')
  .then(r => r.json())
  .then(data => console.log('Manual API test:', data));
```

### 6. **If Cart Count is 0 but items exist:**
```javascript
// Check if items have quantity
console.log('Cart items:', window.cartItems);
console.log('Count calculation:', window.cartItems?.reduce((t, i) => t + i.quantity, 0));
```

## 🐛 **Common Issues to Check:**

### **A. User Authentication**
- Is user logged in?
- Is user.email available?

### **B. API Response Format**
- Does API return `{items: [...]}` format?
- Do items have `quantity` property?

### **C. React Hooks**
- Is useCart being called in CartIcon?
- Is cartCount being calculated correctly?

### **D. Component Rendering**
- Is CartIcon component mounted?
- Is it in the correct location in Navbar?

## 🔧 **Quick Fix Test:**

Add this temporarily to CartIcon to force display:
```jsx
// TEMPORARY DEBUG - Add this to CartIcon return
<div style={{position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: '10px', zIndex: 9999}}>
  Debug Cart Count: {cartCount}
</div>
```

This will show if cartCount is being calculated correctly, regardless of styling issues.