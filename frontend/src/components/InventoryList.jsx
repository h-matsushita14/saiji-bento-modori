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
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

function InventoryList() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md')); // md未満がスマホ・タブレット

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
      ) : isMobileOrTablet ? ( // スマホ・タブレット表示の場合
        <Grid container spacing={2} alignItems="stretch">
          {inventory.map((item, index) => (
            <Grid item xs={12} key={index}>
              <Card sx={{
                width: "100%",
                height: '100%',
                display: "flex",
                flexDirection: "column",
                flexGrow: 1, // Gridアイテム内で高さを最大限に利用
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
                      WebkitLineClamp: 1, // 最大1行まで表示
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
