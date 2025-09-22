const SPREADSHEET_ID = '1TvPA6MZBluP8a9AaATKbHJdHd8X_OIfgKi8e0Ga6MQ8';
const MASTER_SHEET_NAME = '催事戻り管理マスター';
const USAGE_SHEET_NAME = '使用数';
const PRODUCT_SHEET_NAME = '商品'; // 追加
const EVENT_LIST_SHEET_NAME = '催事一覧';

/**
 * CORSプリフライトリクエスト (OPTIONS) に対応します。
 */
function doOptions() {
  return ContentService.createTextOutput();
}

/**
 * WebアプリケーションとしてGETリクエストを受け取った際に実行されます。
 * 主に在庫一覧の取得に使用します。
 */
function doGet(e) {
  let response;
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    let data;
    const action = e.parameter && e.parameter.action;

    if (action === 'getProducts') {
      data = getProductsData();
    } else if (action === 'getUsageHistory') {
      data = getUsageHistoryData();
    } else if (action === 'getEventList') {
      data = getEventListData();
    } else if (action === 'getReturnRecords') {
      data = getReturnRecordsData();
    } else {
      const masterSheet = spreadsheet.getSheetByName(MASTER_SHEET_NAME);
      const usageSheet = spreadsheet.getSheetByName(USAGE_SHEET_NAME);
      if (!masterSheet || !usageSheet) {
        throw new Error('必要なシートが見つかりません。');
      }
      const masterData = masterSheet.getDataRange().getValues();
      const usageData = usageSheet.getDataRange().getValues();
      const masterHeaders = masterData.shift();
      const usageHeaders = usageData.shift();
      const masterRecords = masterData.map(row => {
        const record = {};
        masterHeaders.forEach((header, i) => {
          record[header] = row[i];
        });
        return record;
      });
      const usageRecords = usageData.map(row => {
        const record = {};
        usageHeaders.forEach((header, i) => {
          record[header] = row[i];
        });
        return record;
      });
      data = calculateInventory(masterRecords, usageRecords);
    }
    
    response = { status: 'success', data: data };

  } catch (error) {
    response = { status: 'error', message: error.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * WebアプリケーションとしてPOSTリクエストを受け取った際に実行されます。
 * 戻り記録や使用数の記録に使用します。
 */
function doPost(e) {
  let response;
  try {
    // JSON形式のリクエストボディをパース
    const requestData = JSON.parse(e.postData.contents);
    const type = requestData.type;
    const action = requestData.action;
    const data = requestData.data;

    let message = '';

    if (type === 'returns') {
      addReturnRecords(data);
      message = '戻り記録が追加されました。';
    } else if (type === 'usage') {
      addUsageRecord(data);
      message = '使用数が記録されました。';
    } else if (type === 'product') {
      if (action === 'add') {
        addProductData(data);
        message = '商品が追加されました。';
      } else if (action === 'update') {
        updateProductData(data.id, data);
        message = '商品が更新されました。';
      } else if (action === 'delete') {
        deleteProductData(data.id);
        message = '商品が削除されました。';
      } else {
        throw new Error('無効な商品リクエストアクションです。');
      }
    } else if (type === 'event' && action === 'add') {
      addEventName(data);
      message = '新しい催事名が追加されました。';
    } else {
      throw new Error('無効なリクエストタイプです。');
    }
    
    // データ更新後、在庫列を再計算して更新
    updateInventoryOnSheet();

    response = { status: 'success', message: message };

  } catch (error) {
    response = { status: 'error', message: error.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function addReturnRecords(records) { // records は配列
  if (!records || records.length === 0) {
    return;
  }

  const masterSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(MASTER_SHEET_NAME);
  if (!masterSheet) throw new Error('「催事戻り管理マスター」シートが見つかりません。');

  // --- 共通の管理No.プレフィックスと現在の最大通し番号を取得 ---
  const firstRecord = records[0];
  const returnDate = firstRecord['戻り記録日'];
  const date = new Date(returnDate);
  const year = date.getFullYear().toString().slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const datePrefix = year + month + day;

  const allData = masterSheet.getDataRange().getValues();
  const headers = allData.length > 0 ? allData.shift() : [];
  const managementNoIndex = headers.indexOf('管理No.');

  if (managementNoIndex === -1) {
    throw new Error('「管理No.」列が見つかりません。');
  }

  const serials = allData
    .map(row => row[managementNoIndex])
    .filter(managementNo => managementNo && typeof managementNo.startsWith === 'function' && managementNo.startsWith(datePrefix))
    .map(managementNo => parseInt(managementNo.slice(-2), 10));
  
  let currentMaxSerial = serials.length > 0 ? Math.max(...serials) : 0;
  // --- 取得ここまで ---

  const newRows = records.map(record => {
    currentMaxSerial++; // 通し番号をインクリメント
    const newSerial = ('0' + currentMaxSerial).slice(-2);
    const newManagementNo = datePrefix + newSerial;

    const { '戻り記録日': rec_returnDate, '催事名': eventName, '商品名': productName, '数量': quantity, '重さ': weight } = record;
    
    // 戻り記録日, 催事名, 商品名, 重さ, 数量, 管理No., 在庫
    return [rec_returnDate, eventName, productName, weight || '', quantity, newManagementNo, ''];
  });

  if (newRows.length > 0) {
    masterSheet.getRange(masterSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
}

function addUsageRecord(data) {
  const usageSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(USAGE_SHEET_NAME);
  if (!usageSheet) throw new Error('「使用数」シートが見つかりません。');
  const { '管理No.': managementNo, '使用日': usageDate, '使用数': usageQuantity } = data;
  usageSheet.appendRow([managementNo, usageDate, usageQuantity]);
}

function addEventName(data) {
  const eventListSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EVENT_LIST_SHEET_NAME);
  if (!eventListSheet) throw new Error(`「${EVENT_LIST_SHEET_NAME}」シートが見つかりません。`);
  
  const { eventName } = data;
  if (!eventName || eventName.trim() === '') {
    throw new Error('催事名が空です。');
  }
  
  const trimmedEventName = eventName.trim();

  // 既存の催事名と重複チェック
  const lastRow = eventListSheet.getLastRow();
  if (lastRow > 1) {
    const existingNames = eventListSheet.getRange(`A2:A${lastRow}`).getValues().flat();
    if (existingNames.includes(trimmedEventName)) {
      throw new Error('その催事名は既に追加されています。');
    }
  }

  eventListSheet.appendRow([trimmedEventName]);
}

/**
 * 催事戻り管理マスターと使用数シートのデータから在庫を計算します。
 */
function calculateInventory(masterRecords, usageRecords) {
  const inventoryMap = new Map(); // 管理No. -> { 商品名, 在庫 }

  masterRecords.forEach(record => {
    const 管理No = record['管理No.'];
    const 数量 = typeof record['数量'] === 'number' ? record['数量'] : parseInt(record['数量']) || 0;
    const 商品名 = record['商品名'];

    if (!inventoryMap.has(管理No)) {
      inventoryMap.set(管理No, { '商品名': 商品名, '在庫': 0 });
    }
    inventoryMap.get(管理No)['在庫'] += 数量;
  });

  usageRecords.forEach(record => {
    const 管理No = record['管理No.'];
    const 使用数 = typeof record['使用数'] === 'number' ? record['使用数'] : parseInt(record['使用数']) || 0;

    if (inventoryMap.has(管理No)) {
      inventoryMap.get(管理No)['在庫'] -= 使用数;
    }
  });

  return Array.from(inventoryMap, ([管理No, data]) => ({
    '管理No.': 管理No,
    '商品名': data['商品名'],
    '在庫': data['在庫']
  }));
}

/**
 * 商品関連
 */
function addProductData(productData) {
  const productSheet = getProductSheet();
  const { '商品名': productName, '単位': unit, '重さ入力': weightInput } = productData;
  productSheet.appendRow([productName, unit, weightInput]);
}

function updateProductData(productId, productData) {
  const productSheet = getProductSheet();
  const { '商品名': productName, '単位': unit, '重さ入力': weightInput } = productData;
  productSheet.getRange(productId, 1, 1, 3).setValues([[productName, unit, weightInput]]);
}

function deleteProductData(productId) {
  const productSheet = getProductSheet();
  productSheet.deleteRow(productId);
}

function getProductsData() {
  const productSheet = getProductSheet();
  const data = productSheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data.shift();
  const products = data.map((row, index) => {
    const product = {};
    headers.forEach((header, i) => {
      product[header] = row[i];
    });
    product.id = index + 2;
    return product;
  });
  return products;
}

function getProductSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let productSheet = spreadsheet.getSheetByName(PRODUCT_SHEET_NAME);

  if (!productSheet) {
    productSheet = spreadsheet.insertSheet(PRODUCT_SHEET_NAME);
    const headers = ['商品名', '単位', '重さ入力'];
    productSheet.appendRow(headers);
  }
  return productSheet;
}

/**
 * 使用履歴取得
 */
function getUsageHistoryData() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usageSheet = spreadsheet.getSheetByName(USAGE_SHEET_NAME);
  if (!usageSheet) return [];
  
  const usageData = usageSheet.getDataRange().getValues();
  if (usageData.length <= 1) return [];
  const usageHeaders = usageData.shift();
  const usageDateIndex = usageHeaders.indexOf('使用日');

  const masterSheet = spreadsheet.getSheetByName(MASTER_SHEET_NAME);
  if (!masterSheet) return [];
  const masterData = masterSheet.getDataRange().getValues();
  const masterHeaders = masterData.shift();
  const productMap = new Map();
  
  const managementNoIndex = masterHeaders.indexOf('管理No.');
  const productNameIndex = masterHeaders.indexOf('商品名');

  if (managementNoIndex !== -1 && productNameIndex !== -1) {
    masterData.forEach(row => {
      const managementNo = row[managementNoIndex];
      const productName = row[productNameIndex];
      if (managementNo && productName && !productMap.has(managementNo)) {
        productMap.set(managementNo, productName);
      }
    });
  }

  const history = usageData.map(row => {
    const record = {};
    usageHeaders.forEach((header, i) => {
      if (i === usageDateIndex && row[i] instanceof Date) {
        record[header] = Utilities.formatDate(row[i], "Asia/Tokyo", "yyyy-MM-dd");
      } else {
        record[header] = row[i];
      }
    });
    record['商品名'] = productMap.get(record['管理No.']) || '不明';
    return record;
  });
  
  return history.sort((a, b) => new Date(b['使用日']) - new Date(a['使用日']));
}

function getEventListData() {
  const eventListSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('催事一覧');
  if (!eventListSheet) return [];
  
  const data = eventListSheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data.shift();
  const eventNameIndex = headers.indexOf('催事名');
  
  if (eventNameIndex === -1) return [];

  const eventNames = data.map(row => row[eventNameIndex]);
  const uniqueEventNames = [...new Set(eventNames)].filter(name => name); // 空の名前を除外
  
  return uniqueEventNames;
}

function getReturnRecordsData() {
  const masterSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(MASTER_SHEET_NAME);
  if (!masterSheet) return [];
  
  const data = masterSheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data.shift();
  const returnDateIndex = headers.indexOf('戻り記録日');

  const records = data.map(row => {
    const record = {};
    headers.forEach((header, i) => {
      if (i === returnDateIndex && row[i] instanceof Date) {
        record[header] = Utilities.formatDate(row[i], "Asia/Tokyo", "yyyy-MM-dd");
      } else {
        record[header] = row[i];
      }
    });
    return record;
  });
  
  return records;
}

/**
 * '催事戻り管理マスター'シートの在庫列を計算し更新します。
 */
function updateInventoryOnSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const masterSheet = spreadsheet.getSheetByName(MASTER_SHEET_NAME);
  const usageSheet = spreadsheet.getSheetByName(USAGE_SHEET_NAME);

  if (!masterSheet || !usageSheet) {
    throw new Error('必要なシートが見つかりません。');
  }

  // 1. 使用数シートから管理No.ごとの使用数合計を計算
  const usageData = usageSheet.getDataRange().getValues();
  const usageHeaders = usageData.shift(); // ヘッダー行
  const usageManagementNoIndex = usageHeaders.indexOf('管理No.');
  const usageQuantityIndex = usageHeaders.indexOf('使用数');

  const usageMap = new Map();
  if (usageManagementNoIndex !== -1 && usageQuantityIndex !== -1) {
    usageData.forEach(row => {
      const managementNo = row[usageManagementNoIndex];
      const usageQuantity = Number(row[usageQuantityIndex]) || 0;
      if (managementNo) {
        usageMap.set(managementNo, (usageMap.get(managementNo) || 0) + usageQuantity);
      }
    });
  }

  // 2. マスターシートの在庫を更新
  const masterDataRange = masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, masterSheet.getLastColumn());
  const masterData = masterDataRange.getValues();
  
  const masterHeaders = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];
  const masterManagementNoIndex = masterHeaders.indexOf('管理No.');
  const masterQuantityIndex = masterHeaders.indexOf('数量');
  const masterInventoryIndex = masterHeaders.indexOf('在庫');

  if (masterManagementNoIndex === -1 || masterQuantityIndex === -1 || masterInventoryIndex === -1) {
    throw new Error('マスターシートに必要な列（管理No., 数量, 在庫）が見つかりません。');
  }
  
  const inventoryColumnUpdates = masterData.map(row => {
    const managementNo = row[masterManagementNoIndex];
    const initialQuantity = Number(row[masterQuantityIndex]) || 0;
    const totalUsage = usageMap.get(managementNo) || 0;
    const currentInventory = initialQuantity - totalUsage;
    return [currentInventory]; // 在庫列の値のみを配列として返す
  });

  // 3. 在庫列のみを更新
  if (inventoryColumnUpdates.length > 0) {
    masterSheet.getRange(2, masterInventoryIndex + 1, inventoryColumnUpdates.length, 1).setValues(inventoryColumnUpdates);
  }
}
