/**
 * Test script for Admin Settings API endpoints
 * 
 * This script tests:
 * 1. Login to get admin token
 * 2. Get current admin user info
 * 3. Update admin username (with token refresh)
 * 4. Update admin password
 * 
 * Usage: node test-settings-api.js
 */

const API_BASE_URL = process.env.API_URL || 'https://foneworldecom.onrender.com/api';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let authToken = null;

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error at ${endpoint}:`, error.message);
    throw error;
  }
}

// Test 1: Login
async function testLogin() {
  console.log('\n=== Test 1: Admin Login ===');
  try {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!response.token || !response.user) {
      throw new Error('Invalid login response: missing token or user');
    }

    authToken = response.token;
    console.log('✅ Login successful');
    console.log(`   User ID: ${response.user.id}`);
    console.log(`   Username: ${response.user.username}`);
    console.log(`   Token received: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
}

// Test 2: Get current admin info
async function testGetCurrentUser() {
  console.log('\n=== Test 2: Get Current Admin User Info ===');
  try {
    const user = await apiCall('/auth/me');
    
    if (!user || !user.username) {
      throw new Error('Invalid user data received');
    }

    console.log('✅ Get current user successful');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Created At: ${user.createdAt || 'N/A'}`);
    return user;
  } catch (error) {
    console.error('❌ Get current user failed:', error.message);
    return null;
  }
}

// Test 3: Update username
async function testUpdateUsername(originalUsername) {
  console.log('\n=== Test 3: Update Username ===');
  const newUsername = `admin_test_${Date.now()}`;
  
  try {
    const result = await apiCall('/auth/update', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: ADMIN_PASSWORD,
        newUsername: newUsername,
        newPassword: null,
      }),
    });

    if (!result.user || !result.user.username) {
      throw new Error('Invalid response: missing user data');
    }

    console.log('✅ Update username successful');
    console.log(`   Old Username: ${originalUsername}`);
    console.log(`   New Username: ${result.user.username}`);
    
    if (result.token) {
      authToken = result.token;
      console.log(`   New token received: ${authToken.substring(0, 20)}...`);
    }

    // Revert username back
    console.log('\n   Reverting username back...');
    const revertResult = await apiCall('/auth/update', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: ADMIN_PASSWORD,
        newUsername: originalUsername,
        newPassword: null,
      }),
    });
    
    if (revertResult.token) {
      authToken = revertResult.token;
    }
    console.log('✅ Username reverted successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Update username failed:', error.message);
    return false;
  }
}

// Test 4: Update password
async function testUpdatePassword() {
  console.log('\n=== Test 4: Update Password ===');
  const testPassword = 'test123';
  const originalPassword = ADMIN_PASSWORD;
  
  try {
    // Update password
    const result = await apiCall('/auth/update', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: originalPassword,
        newUsername: null,
        newPassword: testPassword,
      }),
    });

    if (!result.user) {
      throw new Error('Invalid response: missing user data');
    }

    console.log('✅ Update password successful');
    
    // Verify new password works by logging in again
    console.log('   Verifying new password by logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: testPassword,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error('New password login failed');
    }

    const loginData = await loginResponse.json();
    authToken = loginData.token;
    console.log('✅ New password verified - login successful');

    // Revert password back
    console.log('\n   Reverting password back...');
    await apiCall('/auth/update', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: testPassword,
        newUsername: null,
        newPassword: originalPassword,
      }),
    });
    
    // Update token back to original
    const revertLogin = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: originalPassword,
      }),
    });
    const revertData = await revertLogin.json();
    authToken = revertData.token;
    console.log('✅ Password reverted successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Update password failed:', error.message);
    // Try to revert password in case of error
    try {
      console.log('   Attempting to revert password...');
      await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: ADMIN_USERNAME,
          password: testPassword,
        }),
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          await fetch(`${API_BASE_URL}/auth/update`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}`,
            },
            body: JSON.stringify({
              currentPassword: testPassword,
              newUsername: null,
              newPassword: originalPassword,
            }),
          });
        }
      });
    } catch (revertError) {
      console.error('   Could not revert password automatically. Please reset manually.');
    }
    return false;
  }
}

// Test 5: Verify token
async function testVerifyToken() {
  console.log('\n=== Test 5: Verify Token ===');
  try {
    const result = await apiCall('/auth/verify');
    
    if (!result.valid || !result.user) {
      throw new Error('Invalid token verification response');
    }

    console.log('✅ Token verification successful');
    console.log(`   User ID: ${result.user.id}`);
    console.log(`   Username: ${result.user.username}`);
    return true;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('Admin Settings API Test Suite');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Admin Username: ${ADMIN_USERNAME}`);

  const results = {
    login: false,
    getCurrentUser: false,
    updateUsername: false,
    updatePassword: false,
    verifyToken: false,
  };

  // Test login
  results.login = await testLogin();
  if (!results.login) {
    console.log('\n❌ Cannot proceed without login. Please check your credentials and server.');
    process.exit(1);
  }

  // Test get current user
  const currentUser = await testGetCurrentUser();
  results.getCurrentUser = currentUser !== null;
  
  // Test verify token
  results.verifyToken = await testVerifyToken();

  // Test update username (only if we have current user)
  if (currentUser) {
    results.updateUsername = await testUpdateUsername(currentUser.username);
  }

  // Test update password
  results.updatePassword = await testUpdatePassword();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Login:                ${results.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Get Current User:     ${results.getCurrentUser ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Verify Token:         ${results.verifyToken ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Update Username:      ${results.updateUsername ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Update Password:      ${results.updatePassword ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log('='.repeat(60));
  console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(60));

  process.exit(allPassed ? 0 : 1);
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with native fetch support.');
  console.error('   Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});




