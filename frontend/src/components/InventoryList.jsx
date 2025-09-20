import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext'; // 変更

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
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// 在庫計算ロジック
const calculateInventory = (returnRecords, usageHistory) => {
  const inventoryMap = new Map();

  // 戻り記録から在庫を積み上げ
  returnRecords.forEach(record => {
    const managementNo = record['管理No.'];
    if (!managementNo) return;

    const quantity = Number(record['数量']) || 0;
    const productName = record['商品名'];

    if (!inventoryMap.has(managementNo)) {
      inventoryMap.set(managementNo, { '商品名': productName, '在庫': 0, '管理No.': managementNo });
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
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md'));

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
      ) : isMobileOrTablet ? ( // スマホ・タブレット表示の場合
        <Grid container spacing={2} alignItems="stretch">
          {inventory.map((item, index) => (
            <Grid item xs={12} key={index}>
              <Card sx={{
                width: "100%",
                height: '100%',
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
              }}>
                <CardContent sx={{ flexGrow: 1, p: 2, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {item['商品名']}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    管理No.: {item['管理No.']}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    在庫: {item['在庫']}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : ( // PC表示の場合
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table aria-label="inventory table">
            <TableHead>
              <TableRow>
                <TableCell>管理No.</TableCell>
                <TableCell>商品名</TableCell>
                <TableCell>在庫</TableCell>
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
                  <TableCell>{item['商品名']}</TableCell>
                  <TableCell>{item['在庫']}</TableCell>
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
