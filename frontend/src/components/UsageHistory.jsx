import React, { useState, useEffect } from 'react';
import { fetchUsageHistory } from '../api';

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
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid'; // 追加
import Card from '@mui/material/Card'; // 追加
import CardContent from '@mui/material/CardContent'; // 追加
import useMediaQuery from '@mui/material/useMediaQuery'; // 追加
import { useTheme } from '@mui/material/styles'; // 追加

function UsageHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const theme = useTheme(); // 追加
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // 追加

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await fetchUsageHistory();
        setHistory(data);
      } catch (err) {
        setError(`履歴の読み込みに失敗しました: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        使用履歴
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : history.length === 0 ? (
        <Alert severity="info">使用履歴がありません。</Alert>
      ) : isMobile ? ( // モバイル表示の場合
        <Grid container spacing={2}>
          {history.map((row, index) => (
            <Grid item xs={12} sm={12} md={6} key={index}>
              <Card sx={{ width: "100%", height: 150, display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ flexGrow: 1, p: 2, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <Typography variant="h6" component="div" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {row.商品名}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    管理No.: {row.管理No}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    使用日: {new Date(row.使用日).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    使用数: {row.使用数}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : ( // PC表示の場合
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table aria-label="usage history table">
            <TableHead>
              <TableRow>
                <TableCell>管理No.</TableCell>
                <TableCell>商品名</TableCell>
                <TableCell>使用日</TableCell>
                <TableCell align="right">使用数</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row) => (
                <TableRow
                  key={`${row.管理No}-${row.使用日}`}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.管理No}
                  </TableCell>
                  <TableCell>{row.商品名}</TableCell>
                  <TableCell>{new Date(row.使用日).toLocaleDateString()}</TableCell>
                  <TableCell align="right">{row.使用数}</TableCell>
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
