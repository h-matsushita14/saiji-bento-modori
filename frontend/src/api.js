const API_ENDPOINT = '/.netlify/functions/gas-proxy';

const apiCall = async (url, options, errorMessagePrefix) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.status === 'error') {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    console.error(`${errorMessagePrefix}:`, error);
    throw error;
  }
};

export const fetchInventory = async () => {
  const result = await apiCall(API_ENDPOINT, {}, "Error fetching inventory");
  return result.data;
};

const postData = async (data, errorMessagePrefix) => {
  return apiCall(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }, errorMessagePrefix);
};

export const addReturnRecord = async (data) => {
  return postData({ type: 'return', data }, "Error adding return record");
};

export const addUsageRecord = async (data) => {
  return postData({ type: 'usage', data }, "Error adding usage record");
};

export const fetchProducts = async () => {
  const result = await apiCall(`${API_ENDPOINT}?action=getProducts`, {}, "Error fetching products");
  return result.data;
};

export const addProduct = async (productData) => {
  return postData({ type: 'product', action: 'add', data: productData }, "Error adding product");
};

export const updateProduct = async (productData) => {
  return postData({ type: 'product', action: 'update', data: productData }, "Error updating product");
};

export const deleteProduct = async (productId) => {
  return postData({ type: 'product', action: 'delete', data: { id: productId } }, "Error deleting product");
};

export const fetchUsageHistory = async () => {
  const result = await apiCall(`${API_ENDPOINT}?action=getUsageHistory`, {}, "Error fetching usage history");
  return result.data;
};

export const fetchEventList = async () => {
  const result = await apiCall(`${API_ENDPOINT}?action=getEventList`, {}, "Error fetching event list");
  return result.data;
};

export const fetchReturnRecords = async () => {
  const result = await apiCall(`${API_ENDPOINT}?action=getReturnRecords`, {}, "Error fetching return records");
  return result.data;
};