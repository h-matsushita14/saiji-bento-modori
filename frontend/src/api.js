const GAS_API_URL = process.env.REACT_APP_GAS_API_URL;

/**
 * API呼び出しの共通処理
 * @param {string} url - APIエンドポイントのURL
 * @param {Object} options - fetchに渡すオプション
 * @param {string} errorMessagePrefix - エラーメッセージのプレフィックス
 * @returns {Promise<Object>} APIからのレスポンスデータ
 */
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

/**
 * 在庫一覧を取得します。
 * @returns {Promise<Array>} 在庫データの配列
 */
export const fetchInventory = async () => {
  const result = await apiCall(GAS_API_URL, {}, "Error fetching inventory");
  return result.data;
};

/**
 * 戻り記録を追加します。
 * @param {Object} data - 戻り記録のデータ
 * @returns {Promise<Object>} APIからのレスポンス
 */
export const addReturnRecord = async (data) => {
  const formData = new FormData();
  formData.append("type", "return");
  formData.append("data", JSON.stringify(data));

  return apiCall(GAS_API_URL, {
    method: "POST",
    body: formData, // ← Content-Type を指定しない
  }, "Error adding return record");
};

/**
 * 使用数を記録します。
 * @param {Object} data - 使用数のデータ
 * @returns {Promise<Object>} APIからのレスポンス
 */
export const addUsageRecord = async (data) => {
  const formData = new FormData();
  formData.append("type", "usage");
  formData.append("data", JSON.stringify(data));

  return apiCall(GAS_API_URL, {
    method: "POST",
    body: formData,
  }, "Error adding usage record");
};

/**
 * 商品一覧を取得します。
 * @returns {Promise<Array>} 商品データの配列
 */
export const fetchProducts = async () => {
  const result = await apiCall(`${GAS_API_URL}?action=getProducts`, {}, "Error fetching products");
  return result.data;
};

/**
 * 商品を追加します。
 * @param {Object} productData - 追加する商品データ
 * @returns {Promise<Object>} APIからのレスポンス
 */
export const addProduct = async (productData) => {
  const formData = new FormData();
  formData.append("type", "product");
  formData.append("action", "add");
  formData.append("data", JSON.stringify(productData));

  return apiCall(GAS_API_URL, {
    method: "POST",
    body: formData,
  }, "Error adding product");
};

/**
 * 商品を更新します。
 * @param {Object} productData - 更新する商品データ (idを含む)
 * @returns {Promise<Object>} APIからのレスポンス
 */
export const updateProduct = async (productData) => {
  const formData = new FormData();
  formData.append("type", "product");
  formData.append("action", "update");
  formData.append("data", JSON.stringify(productData));

  return apiCall(GAS_API_URL, {
    method: "POST",
    body: formData,
  }, "Error updating product");
};

/**
 * 商品を削除します。
 * @param {number} productId - 削除する商品のID
 * @returns {Promise<Object>} APIからのレスポンス
 */
export const deleteProduct = async (productId) => {
  const formData = new FormData();
  formData.append("type", "product");
  formData.append("action", "delete");
  formData.append("data", JSON.stringify({ id: productId }));

  return apiCall(GAS_API_URL, {
    method: "POST",
    body: formData,
  }, "Error deleting product");
};

/**
 * 使用履歴を取得します。
 * @returns {Promise<Array>} 使用履歴データの配列
 */
export const fetchUsageHistory = async () => {
  const result = await apiCall(`${GAS_API_URL}?action=getUsageHistory`, {}, "Error fetching usage history");
  return result.data;
};
