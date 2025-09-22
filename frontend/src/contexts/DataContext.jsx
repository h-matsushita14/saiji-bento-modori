import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchProducts,
  fetchEventList,
  fetchUsageHistory,
  fetchReturnRecords,
} from '../api';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [eventList, setEventList] = useState([]);
  const [returnRecords, setReturnRecords] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

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
      // Optionally, set an error state here
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const value = {
    products,
    eventList,
    returnRecords,
    usageHistory,
    isLoading,
    progress,
    reloadData: loadAllData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
