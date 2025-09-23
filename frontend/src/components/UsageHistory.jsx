import React from 'react';
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

function UsageHistory() {
  const { usageHistory, products } = useData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const productMap = new Map(products.map(p => [p['商品名'], p['単位']]));

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const correctedDate = new Date(date.getTime() - (offset * 60 * 1000));
    const [year, month, day] = correctedDate.toISOString().split('T')[0].split('-');
    return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        使用履歴
      </Typography>
      {usageHistory.length === 0 ? (
        <Alert severity="info">使用履歴がありません。</Alert>
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
              {usageHistory.map((row, index) => (
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
                <TableCell>使用日</TableCell>
                <TableCell>商品名</TableCell>
                <TableCell>使用数</TableCell>
                <TableCell>管理No.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usageHistory.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(row.使用日)}</TableCell>
                  <TableCell>{row.商品名}</TableCell>
                  <TableCell>{row.使用数} {productMap.get(row.商品名) || ''}</TableCell>
                  <TableCell>{row['管理No.']}</TableCell>
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
