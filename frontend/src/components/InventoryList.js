import React, { useEffect, useState } from 'react';
import { fetchInventory } from '../api';

// MUI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid'; // 追加
import Card from '@mui/material/Card'; // 追加
import CardContent from '@mui/material/CardContent'; // 追加
import useMediaQuery from '@mui/material/useMediaQuery'; // 追加
import { useTheme } from '@mui/material/styles'; // 追加

function InventoryList() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const theme = useTheme(); // 追加
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // 追加

  useEffect(() => {
    const getInventory = async () => {
      try {
        const data = await fetchInventory();
        setInventory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getInventory();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>在庫を読み込み中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        エラー: {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        在庫一覧
      </Typography>
      {inventory.length === 0 ? (
        <Typography variant="body1">在庫データがありません。</Typography>
      ) : isMobile ? ( // モバイル表示の場合
        <Grid container spacing={2}>
          {inventory.map((item, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {item['商品名']}
                  </Typography>
                  <Typography color="text.secondary">
                    管理No.: {item['管理No.']}
                  </Typography>
                  <Typography variant="body1">
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
