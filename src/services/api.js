import { API_BASE_URL, SERVER_BASE_URL } from '../config.js';

// Helper function to get auth token (admin or branch)
const getToken = () => {
  return localStorage.getItem('admin_token') || localStorage.getItem('branch_token');
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response is JSON
    let data;
    const contentType = response.headers.get('content-type');
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
    console.error('API Error:', error);
    
    // Provide more helpful error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to server. Please make sure the backend server is running on ${SERVER_BASE_URL}`);
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Network error. Please check your connection and ensure the server is running.');
  }
};

// Auth API
export const authAPI = {
  login: async (username, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  verify: async () => {
    return apiCall('/auth/verify');
  },
  getCurrentUser: async () => {
    return apiCall('/auth/me');
  },
  getPasswordInfo: async () => {
    return apiCall('/auth/password-info');
  },
  updateCredentials: async (currentPassword, newUsername, newPassword) => {
    return apiCall('/auth/update', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newUsername, newPassword }),
    });
  },
};

// Branch Auth API
export const branchAuthAPI = {
  login: async (username, password) => {
    // For login, don't send any token
    const headers = {
      'Content-Type': 'application/json',
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/branch-auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username, password }),
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
      console.error('Branch login API Error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to server. Please make sure the backend server is running on ${SERVER_BASE_URL}`);
      }
      
      if (error.message) {
        throw error;
      }
      
      throw new Error('Network error. Please check your connection and ensure the server is running.');
    }
  },
  verify: async () => {
    // For verify, use branch_token specifically - DO NOT use admin token
    const token = localStorage.getItem('branch_token');
    if (!token) {
      console.error('[branchAuthAPI.verify] No branch token found in localStorage');
      throw new Error('No branch token found - authentication required');
    }

    // Verify it's not an admin token (admin tokens don't have 'type: branch')
    // We can't decode JWT here, but we can ensure we're using the right token
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    try {
      console.log('[branchAuthAPI.verify] Calling verify endpoint...');
      const response = await fetch(`${API_BASE_URL}/branch-auth/verify`, {
        method: 'GET',
        headers,
      });

      console.log('[branchAuthAPI.verify] Response status:', response.status);

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('[branchAuthAPI.verify] Non-JSON response:', text);
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        console.error('[branchAuthAPI.verify] Response not OK:', data);
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[branchAuthAPI.verify] Verification successful:', data);
      return data;
    } catch (error) {
      console.error('[branchAuthAPI.verify] Verification error:', error);
      throw error;
    }
  },
};

// Products API
export const productsAPI = {
  getAll: async () => {
    return apiCall('/products');
  },
  getById: async (id) => {
    return apiCall(`/products/${id}`);
  },
  checkImei: async (imeiOrSerial) => {
    if (!imeiOrSerial || imeiOrSerial.trim() === '') {
      return { exists: false };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/products/check-imei/${encodeURIComponent(imeiOrSerial.trim())}`);
      if (!response.ok) {
        return { exists: false };
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking IMEI/Serial:', error);
      return { exists: false };
    }
  },
  create: async (product, imageFile = null) => {
    const token = getToken();
    const formData = new FormData();
    
    // Append all product fields EXCEPT image (we'll handle image separately)
    Object.keys(product).forEach(key => {
      if (key !== 'image') {
        const value = product[key];
        formData.append(key, value !== null && value !== undefined ? value : '');
      }
    });
    
    // Handle image: file takes priority, then URL, then nothing
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (product.image && product.image.trim() !== '') {
      // Only append image URL if it's a valid URL (not empty)
      formData.append('image', product.image.trim());
    }
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData, browser will set it with boundary
    
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
      throw new Error(errorData.error || 'Failed to create product');
    }
    
    const data = await response.json();
    return data;
  },
  update: async (id, product, imageFile = null) => {
    const token = getToken();
    const formData = new FormData();
    
    // Append all product fields EXCEPT image (we'll handle image separately)
    Object.keys(product).forEach(key => {
      if (key !== 'image') {
        const value = product[key];
        formData.append(key, value !== null && value !== undefined ? value : '');
      }
    });
    
    // Handle image: file takes priority, then URL, then nothing
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (product.image && product.image.trim() !== '') {
      // Only append image URL if it's a valid URL (not empty)
      formData.append('image', product.image.trim());
    }
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
      throw new Error(errorData.error || 'Failed to update product');
    }
    
    const data = await response.json();
    return data;
  },
  delete: async (id) => {
    return apiCall(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Branches API
export const branchesAPI = {
  getAll: async () => {
    return apiCall('/branches');
  },
  getById: async (id) => {
    return apiCall(`/branches/${id}`);
  },
  create: async (branch) => {
    return apiCall('/branches', {
      method: 'POST',
      body: JSON.stringify(branch),
    });
  },
  update: async (id, branch) => {
    return apiCall(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(branch),
    });
  },
  delete: async (id) => {
    return apiCall(`/branches/${id}`, {
      method: 'DELETE',
    });
  },
};

// Branch Users API
export const branchUsersAPI = {
  getAll: async () => {
    return apiCall('/branch-users');
  },
  getByBranchId: async (branchId) => {
    return apiCall(`/branch-users/branch/${branchId}`);
  },
  getById: async (id) => {
    return apiCall(`/branch-users/${id}`);
  },
  create: async (branchUser) => {
    return apiCall('/branch-users', {
      method: 'POST',
      body: JSON.stringify(branchUser),
    });
  },
  update: async (id, branchUser) => {
    return apiCall(`/branch-users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(branchUser),
    });
  },
  delete: async (id) => {
    return apiCall(`/branch-users/${id}`, {
      method: 'DELETE',
    });
  },
};

