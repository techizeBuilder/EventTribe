// Quick authentication script for testing
// Open browser console and run this script

async function quickLogin() {
  console.log('Creating test organizer account...');
  
  try {
    const response = await fetch('/api/auth/test-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (response.ok) {
      // Store the token in localStorage
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('✓ Success! Test organizer created and logged in');
      console.log('User:', data.user.firstName, data.user.lastName, `(${data.user.email})`);
      console.log('Role:', data.user.role);
      console.log('Token saved to localStorage');
      console.log('You can now create events!');
      
      return {
        success: true,
        user: data.user,
        token: data.accessToken
      };
    } else {
      console.error('❌ Error:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the function automatically
quickLogin();