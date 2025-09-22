import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { styled } from '@mui/material/styles';

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
import Badge from '@mui/material/Badge';

// ヘッダーのスタイル
const StickyHeader = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  zIndex: 1100, // AppBarより手前に来るように
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // タイムゾーンオフセットを考慮して日付を補正
  const offset = date.getTimezoneOffset();
  const correctedDate = new Date(date.getTime() - (offset * 60 * 1000));
  const [year, month, day] = correctedDate.toISOString().split('T')[0].split('-');
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
};

function InventoryList() {
  // DataContextから状態と関数を取得
  const { 
    inventory,
    pendingUsages,
    addPendingUsage,
    submitPendingUsages
  } = useData();

  const [openUsageDialog, setOpenUsageDialog] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [usageDate, setUsageDate] = useState('');
  const [usageQuantity, setUsageQuantity] = useState(0);
  const [usageError, setUsageError] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 離脱防止機能
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingUsages.length > 0) {
        e.preventDefault();
        e.returnValue = '使用数の登録はまだ完了していません。送信ボタンを押してください。';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pendingUsages.length]);


  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenUsageDialog = (item) => {
    setSelectedInventoryItem(item);
    setUsageDate(getTodayDateString());
    setUsageQuantity(0);
    setUsageError('');
    setOpenUsageDialog(true);
  };

  const handleCloseUsageDialog = () => {
    setOpenUsageDialog(false);
    setSelectedInventoryItem(null);
    setUsageDate('');
    setUsageQuantity(0);
    setUsageError('');
  };

  // 「登録」ボタンの処理を一時保存に変更
  const handleRegisterUsage = () => {
    if (!selectedInventoryItem || usageQuantity === 0) {
      setUsageError('使用する在庫アイテムを選択し、使用数を入力してください。');
      return;
    }
    if (usageQuantity > selectedInventoryItem['在庫']) {
      setUsageError('使用数が在庫数を超えています。現在の在庫数: ' + selectedInventoryItem['在庫']);
      return;
    }

    const usageData = {
      '管理No.': selectedInventoryItem['管理No.'],
      '使用日': usageDate,
      '使用数': usageQuantity,
    };
    
    addPendingUsage(usageData); // API送信の代わりに一時保存用の関数を呼び出す
    handleCloseUsageDialog();
  };

  return (
    <>
      <StickyHeader>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h2">
            在庫一覧
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={submitPendingUsages}
            disabled={pendingUsages.length === 0}
          >
            <Badge badgeContent={pendingUsages.length} color="error" sx={{ mr: 2 }}>
              登録した使用数の送信
            </Badge>
          </Button>
        </Box>
      </StickyHeader>

      <Box sx={{ p: 2 }}>
        {inventory.length === 0 ? (
          <Alert severity="info">在庫データがありません。</Alert>
        ) : isMobile ? (
          // モバイル表示
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table aria-label="inventory table">
              <TableHead>
                <TableRow>
                  <TableCell>在庫情報</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.filter(item => item['在庫'] > 0).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Card sx={{ width: "100%" }}>
                        <CardContent>
                          <Typography variant="h6" component="div">{item['商品名']}</Typography>
                          <Typography variant="body2" color="text.secondary">管理No.: {item['管理No.']}</Typography>
                          <Typography variant="body2" color="text.secondary">戻り記録日: {formatDate(item['戻り記録日'])}</Typography>
                          <Typography variant="body2" color="text.secondary">催事名: {item['催事名']}</Typography>
                          <Typography variant="body1">在庫: {item['在庫']}</Typography>
                          <Typography variant="body1">重さ: {item['重さ'] ? `${item['重さ']}kg` : '-'}</Typography>
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
          // PC表示
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table aria-label="inventory table">
              <TableHead>
                <TableRow>
                  <TableCell>管理No.</TableCell>
                  <TableCell>戻り記録日</TableCell>
                  <TableCell>催事名</TableCell>
                  <TableCell>商品名</TableCell>
                  <TableCell>在庫</TableCell>
                  <TableCell>重さ</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.filter(item => item['在庫'] > 0).map((item, index) => (
                  <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">{item['管理No.']}</TableCell>
                    <TableCell>{formatDate(item['戻り記録日'])}</TableCell>
                    <TableCell>{item['催事名']}</TableCell>
                    <TableCell>{item['商品名']}</TableCell>
                    <TableCell>{item['在庫']}</TableCell>
                    <TableCell>{item['重さ'] ? `${item['重さ']}kg` : '-'}</TableCell>
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
            InputLabelProps={{ shrink: true }}
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => setUsageQuantity(selectedInventoryItem ? selectedInventoryItem['在庫'] : 0)}
              disabled={!selectedInventoryItem}
            >
              全て使用
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUsageDialog}>キャンセル</Button>
          <Button onClick={handleRegisterUsage} variant="contained">登録</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default InventoryList;