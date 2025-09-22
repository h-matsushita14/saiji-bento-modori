import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { addUsageRecord } from '../api';

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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';


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
    const weight = Number(record['重さ']) || 0; // 重さを追加

    if (!inventoryMap.has(managementNo)) {
      inventoryMap.set(managementNo, {
        '商品名': productName,
        '在庫': 0,
        '管理No.': managementNo,
        '戻り記録日': returnDate,
        '催事名': eventName,
        '重さ': 0 // 初期値を0に設定
      });
    }
    inventoryMap.get(managementNo)['在庫'] += quantity;
    inventoryMap.get(managementNo)['重さ'] += weight; // 重さを合計
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

const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
};

function InventoryList() {
  const { returnRecords, usageHistory, reloadData } = useData(); // Contextからデータを取得
  const [inventory, setInventory] = useState([]);

  const [openUsageDialog, setOpenUsageDialog] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [usageDate, setUsageDate] = useState('');
  const [usageQuantity, setUsageQuantity] = useState(0);
  const [usageError, setUsageError] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Contextのデータが変更されたら在庫を再計算
    if (returnRecords.length > 0 || usageHistory.length > 0) {
      const calculatedInventory = calculateInventory(returnRecords, usageHistory);
      setInventory(calculatedInventory);
    }
  }, [returnRecords, usageHistory]);

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenUsageDialog = (item) => {
    setSelectedInventoryItem(item);
    setUsageDate(getTodayDateString()); // デフォルトで今日の日付を設定
    setUsageQuantity(0); // デフォルトで使用数を0に設定
    setOpenUsageDialog(true);
  };

  const handleCloseUsageDialog = () => {
    setOpenUsageDialog(false);
    setSelectedInventoryItem(null);
    setUsageDate('');
    setUsageQuantity(0);
    setUsageError(''); // エラーメッセージをクリア
  };

  const handleRegisterUsage = async () => {
    if (!selectedInventoryItem || usageQuantity === 0) {
      setUsageError('使用する在庫アイテムを選択し、使用数を入力してください。');
      return;
    }
    if (usageQuantity > selectedInventoryItem['在庫']) {
      setUsageError('使用数が在庫数を超えています。現在の在庫数: ' + selectedInventoryItem['在庫']);
      return;
    }

    setUsageError(''); // エラーメッセージをクリア

    try {
      const usageData = {
        '管理No.': selectedInventoryItem['管理No.'],
        '使用日': usageDate,
        '使用数': usageQuantity,
      };
      await addUsageRecord(usageData);
      handleCloseUsageDialog();
      await reloadData(); // 在庫データを再読み込み
      // 成功メッセージの表示など
    } catch (error) {
      setUsageError(`使用記録の登録に失敗しました: ${error.message}`);
    }
  };

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
                          戻り記録日: {formatDate(item['戻り記録日'])}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          催事名: {item['催事名']}
                        </Typography>
                        <Typography variant="body1">
                          在庫: {item['在庫']}
                        </Typography>
                        <Typography variant="body1">
                          重さ: {item['重さ'] ? `${item['重さ']}kg` : '-'}
                        </Typography>
                        <Box sx={{ mt: 1, width: '100%' }}>
                          <Button variant="contained" size="small" fullWidth onClick={() => handleOpenUsageDialog(item)}>この在庫を使用する</Button>
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
                <TableCell>重さ</TableCell> {/* 重さを追加 */}
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
                  <TableCell>{formatDate(item['戻り記録日'])}</TableCell>
                  <TableCell>{item['催事名']}</TableCell>
                  <TableCell>{item['商品名']}</TableCell>
                  <TableCell>{item['在庫']}</TableCell>
                  <TableCell>{item['重さ'] ? `${item['重さ']}kg` : '-'}</TableCell> {/* 重さを表示 */}
                  <TableCell>
                    <Button variant="contained" size="small" onClick={() => handleOpenUsageDialog(item)}>この在庫を使用する</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>

    <Dialog open={openUsageDialog} onClose={handleCloseUsageDialog}>
      <DialogTitle>在庫を使用する</DialogTitle>
      <DialogContent>
        {usageError && <Alert severity="error" sx={{ mb: 2 }}>{usageError}</Alert>}
        {selectedInventoryItem && (
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            商品名: {selectedInventoryItem['商品名']} (管理No.: {selectedInventoryItem['管理No.']})
          </Typography>
        )}
        <TextField
          label="使用日"
          type="date"
          fullWidth
          value={usageDate}
          onChange={(e) => setUsageDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>使用数</InputLabel>
          <Select
            value={usageQuantity}
            label="使用数"
            onChange={(e) => setUsageQuantity(Number(e.target.value))}
          >
            {selectedInventoryItem && Array.from({ length: selectedInventoryItem['在庫'] + 1 }, (_, i) => (
              <MenuItem key={i} value={i}>{i}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseUsageDialog}>キャンセル</Button>
        <Button onClick={handleRegisterUsage} variant="contained">登録</Button>
      </DialogActions>
    </Dialog>

  );
}

export default InventoryList;
