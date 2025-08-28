import toast from "react-hot-toast";

// Centralized admin API call handler with retry logic
let isTokenCleared = false;
let tokenClearTimeout = null;

export async function makeAdminApiCall(url, options = {}) {
  try {
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
      if (!isTokenCleared) {
        toast.error("Admin authentication required");
        redirectToLogin();
      }
      return null;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    });

    // If we get a 401, try one more time after a short delay
    if (response.status === 401 && !options._isRetry) {
      // Wait a moment and retry once
      await new Promise(resolve => setTimeout(resolve, 100));
      return makeAdminApiCall(url, { ...options, _isRetry: true });
    }

    // If still 401 after retry, clear token
    if (response.status === 401 && options._isRetry) {
      handleTokenExpiry();
      return null;
    }

    return response;
  } catch (error) {
    console.error("Admin API call error:", error);
    throw error;
  }
}

function handleTokenExpiry() {
  if (isTokenCleared) return; // Prevent multiple clearings
  
  isTokenCleared = true;
  
  // Clear the flag after a short delay to allow for page redirect
  if (tokenClearTimeout) clearTimeout(tokenClearTimeout);
  tokenClearTimeout = setTimeout(() => {
    isTokenCleared = false;
  }, 5000);
  
  toast.error("Session expired. Please login again.");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  redirectToLogin();
}

function redirectToLogin() {
  // Use window.location to ensure clean redirect
  window.location.href = "/admin-login";
}