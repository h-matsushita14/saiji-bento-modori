import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';

// MUI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';

// 在庫計算ロジック
const calculateInventory = (returnRecords, usageHistory) => {
  const inventoryMap = new Map();

  // 戻り記録から在庫を積み上げ
  returnRecords.forEach(record => {
    const managementNo = record['管理No.'];
    if (!managementNo) return;

    const quantity = Number(record['数量']) || 0;
    const productName = record['商品名'];

    const returnDate = record['戻り記録日'];
    const eventName = record['催事名'];

    if (!inventoryMap.has(managementNo)) {
      inventoryMap.set(managementNo, {
        '商品名': productName,
        '在庫': 0,
        '管理No.': managementNo,
        '戻り記録日': returnDate,
        '催事名': eventName
      });
    }
    inventoryMap.get(managementNo)['在庫'] += quantity;
  });

  // 使用履歴から在庫を減算
  usageHistory.forEach(record => {
    const managementNo = record['管理No.'];
    if (!managementNo) return;

    const usageQuantity = Number(record['使用数']) || 0;

    if (inventoryMap.has(managementNo)) {
      inventoryMap.get(managementNo)['在庫'] -= usageQuantity;
    }
  });

  return Array.from(inventoryMap.values());
};

function InventoryList() {
  const { returnRecords, usageHistory } = useData(); // Contextからデータを取得
  const [inventory, setInventory] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Contextのデータが変更されたら在庫を再計算
    if (returnRecords.length > 0 || usageHistory.length > 0) {
      const calculatedInventory = calculateInventory(returnRecords, usageHistory);
      setInventory(calculatedInventory);
    }
  }, [returnRecords, usageHistory]);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        在庫一覧
      </Typography>
      {inventory.length === 0 ? (
        <Alert severity="info">在庫データがありません。</Alert>
      ) : isMobile ? (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table aria-label="inventory table">
            <TableHead>
              <TableRow>
                <TableCell>在庫情報</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
                      <CardContent sx={{ flexGrow: 1, p: 2, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <Typography variant="h6" component="div" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {item['商品名']}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          管理No.: {item['管理No.']}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          戻り記録日: {item['戻り記録日']}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          催事名: {item['催事名']}
                        </Typography>
                        <Typography variant="body1">
                          在庫: {item['在庫']}
                        </Typography>
                        <Box sx={{ mt: 1, width: '100%' }}>
                          <Button variant="contained" size="small" fullWidth>この在庫を使用する</Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table aria-label="inventory table">
            <TableHead>
              <TableRow>
                <TableCell>管理No.</TableCell>
                <TableCell>戻り記録日</TableCell>
                <TableCell>催事名</TableCell>
                <TableCell>商品名</TableCell>
                <TableCell>在庫</TableCell>
                <TableCell></TableCell> {/* ボタン用のセル */}
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map((item, index) => (
                <TableRow
                  key={index}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {item['管理No.']}
                  </TableCell>
                  <TableCell>{item['戻り記録日']}</TableCell>
                  <TableCell>{item['催事名']}</TableCell>
                  <TableCell>{item['商品名']}</TableCell>
                  <TableCell>{item['在庫']}</TableCell>
                  <TableCell>
                    <Button variant="contained" size="small">この在庫を使用する</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default InventoryList;
