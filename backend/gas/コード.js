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

    if (type === 'return') {
      addReturnRecord(data);
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
    
    response = { status: 'success', message: message };

  } catch (error) {
    response = { status: 'error', message: error.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function addReturnRecord(data) {
  const masterSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(MASTER_SHEET_NAME);
  if (!masterSheet) throw new Error('「催事戻り管理マスター」シートが見つかりません。');
  const { '戻り記録日': returnDate, '催事名': eventName, '商品名': productName, '数量': quantity, '重さ': weight } = data;
  masterSheet.appendRow([returnDate, eventName, productName, quantity, '', weight]);
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
      record[header] = row[i];
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
  
  const records = data.map(row => {
    const record = {};
    headers.forEach((header, i) => {
      record[header] = row[i];
    });
    return record;
  });
  
  return records;
}
