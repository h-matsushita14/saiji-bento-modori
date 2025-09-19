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

function UsageHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="usage history table">
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
