import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchProducts,
  fetchEventList,
  fetchUsageHistory,
  fetchReturnRecords,
  addUsageRecord, // API呼び出しのためにインポート
} from '../api';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

// 在庫計算ロジックをここに移動
const calculateInventory = (returnRecords, usageHistory, pendingUsages) => {
  const inventoryMap = new Map();

  // 戻り記録から在庫を積み上げ
  returnRecords.forEach(record => {
    const managementNo = record['管理No.'];
    if (!managementNo) return;

    const quantity = Number(record['数量']) || 0;
    const productName = record['商品名'];
    const returnDate = record['戻り記録日'];
    const eventName = record['催事名'];
    const weight = Number(record['重さ']) || 0;

    if (!inventoryMap.has(managementNo)) {
      inventoryMap.set(managementNo, {
        '商品名': productName,
        '在庫': 0,
        '管理No.': managementNo,
        '戻り記録日': returnDate,
        '催事名': eventName,
        '重さ': 0
      });
    }
    inventoryMap.get(managementNo)['在庫'] += quantity;
    inventoryMap.get(managementNo)['重さ'] += weight;
  });

  // DB保存済みの使用履歴から在庫を減算
  usageHistory.forEach(record => {
    const managementNo = record['管理No.'];
    if (!managementNo) return;
    const usageQuantity = Number(record['使用数']) || 0;
    if (inventoryMap.has(managementNo)) {
      inventoryMap.get(managementNo)['在庫'] -= usageQuantity;
    }
  });

  // フロントで一時保存している未送信の使用履歴から在庫を減算
  pendingUsages.forEach(record => {
    const managementNo = record['管理No.'];
    if (!managementNo) return;
    const usageQuantity = Number(record['使用数']) || 0;
    if (inventoryMap.has(managementNo)) {
      inventoryMap.get(managementNo)['在庫'] -= usageQuantity;
    }
  });

  return Array.from(inventoryMap.values());
};


export const DataProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [eventList, setEventList] = useState([]);
  const [returnRecords, setReturnRecords] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [pendingUsages, setPendingUsages] = useState([]); // 未送信の使用記録

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const totalSteps = 4;
      let completedSteps = 0;
      setProgress(0);

      const productsData = await fetchProducts();
      setProducts(productsData);
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

      const eventListData = await fetchEventList();
      setEventList(eventListData);
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

      const returnRecordsData = await fetchReturnRecords();
      setReturnRecords(returnRecordsData);
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

      const usageHistoryData = await fetchUsageHistory();
      setUsageHistory(usageHistoryData);
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

    } catch (error) {
      console.error("Failed to load initial data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // 在庫計算をuseMemoで行う
  const inventory = useMemo(
    () => calculateInventory(returnRecords, usageHistory, pendingUsages),
    [returnRecords, usageHistory, pendingUsages]
  );

  // 未送信の使用記録を追加する関数
  const addPendingUsage = useCallback((usageRecord) => {
    setPendingUsages(prev => [...prev, usageRecord]);
  }, []);

  // 未送信の使用記録をサーバーに送信する関数
  const submitPendingUsages = useCallback(async () => {
    if (pendingUsages.length === 0) {
      alert("送信する使用記録がありません。");
      return;
    }
    
    setIsLoading(true); // 送信中にローディング表示
    try {
      // バックエンドが一括登録に対応していないため、一件ずつ登録
      for (const usage of pendingUsages) {
        await addUsageRecord(usage);
      }
      
      setPendingUsages([]); // 送信成功したらクリア
      alert("使用記録を送信しました。");
      await loadAllData(); // 最新のデータを再読み込み
      
    } catch (error) {
      console.error("Failed to submit pending usages", error);
      alert(`使用記録の送信に失敗しました: ${error.message}`);
      // エラーが起きてもpendingUsagesはクリアしないでおく
    } finally {
      setIsLoading(false);
    }
  }, [pendingUsages, loadAllData]);


  const value = {
    products,
    eventList,
    returnRecords,
    usageHistory,
    inventory, // 計算済みの在庫
    pendingUsages,
    isLoading,
    progress,
    reloadData: loadAllData,
    addPendingUsage,
    submitPendingUsages,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};