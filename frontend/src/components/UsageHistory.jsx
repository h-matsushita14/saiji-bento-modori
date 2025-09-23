import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';

// MUI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

function UsageHistory() {
  const { usageHistory, products } = useData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedProduct, setSelectedProduct] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const getMonthRange = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth(); // 0-indexed

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0); // Day 0 of next month is last day of current month

      const format = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      setStartDate(format(firstDay));
      setEndDate(format(lastDay));
    };
    getMonthRange();
  }, []); // Run only once on mount

  const productMap = new Map(products.map(p => [p['商品名'], p['単位']]));

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const correctedDate = new Date(date.getTime() - (offset * 60 * 1000));
    const [year, month, day] = correctedDate.toISOString().split('T')[0].split('-');
    return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
  };

  const filteredUsageHistory = usageHistory.filter(usage => {
    // Filter by product name
    if (selectedProduct && usage.商品名 !== selectedProduct) {
      return false;
    }

    // Filter by date range
    const usageDate = new Date(usage.使用日);
    if (startDate) {
      const start = new Date(startDate);
      if (usageDate < start) {
        return false;
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      // Set end date to end of day to include records on the end date
      end.setHours(23, 59, 59, 999);
      if (usageDate > end) {
        return false;
      }
    }
    return true;
  });

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        使用履歴
      </Typography>

      {/* Filter UI */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
        <Typography variant="h6" gutterBottom>
          絞り込み
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}> {/* Product filter row */}
          <Grid item xs={12} sm={8}> {/* Changed sm={6} to sm={8} */}
            <Autocomplete
              options={[...new Set(usageHistory.map(item => item.商品名))]} // Unique product names
              value={selectedProduct}
              onChange={(event, newValue) => {
                setSelectedProduct(newValue || '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="商品名で絞り込み"
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}> {/* Date range filter row */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="期間開始日"
              type="date"
              fullWidth
              value={startDate}
              onChange={(e) => {
                const newStartDate = e.target.value;
                if (endDate && newStartDate > endDate) {
                  setEndDate(newStartDate);
                  setStartDate(endDate);
                } else {
                  setStartDate(newStartDate);
                }
              }}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="期間終了日"
              type="date"
              fullWidth
              value={endDate}
              onChange={(e) => {
                const newEndDate = e.target.value;
                if (startDate && newEndDate < startDate) {
                  setStartDate(newEndDate);
                  setEndDate(startDate);
                } else {
                  setEndDate(newEndDate);
                }
              }}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      {filteredUsageHistory.length === 0 ? (
        <Alert severity="info">表示する使用履歴がありません。</Alert>
      ) : isMobile ? (
        // Mobile view (Card layout)
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table aria-label="usage history table mobile">
            <TableHead>
              <TableRow>
                <TableCell>使用履歴</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsageHistory.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Card sx={{ width: "100%" }}>
                      <CardContent>
                        <Typography variant="h6" component="div">{row.商品名}</Typography>
                        <Typography variant="body2" color="text.secondary">管理No.: {row['管理No.']}</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          使用日: {formatDate(row.使用日)}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          使用数: {row.使用数} {productMap.get(row.商品名) || ''}
                        </Typography>
                      </CardContent>
                    </Card>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // PC view (Table layout)
        <TableContainer component={Paper}>
          <Table aria-label="usage history table pc">
            <TableHead>
              <TableRow>
                <TableCell>管理No.</TableCell>
                <TableCell>使用日</TableCell>
                <TableCell>商品名</TableCell>
                <TableCell>使用数</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsageHistory.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row['管理No.']}</TableCell>
                  <TableCell>{formatDate(row.使用日)}</TableCell>
                  <TableCell>{row.商品名}</TableCell>
                  <TableCell>{row.使用数} {productMap.get(row.商品名) || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default UsageHistory;
