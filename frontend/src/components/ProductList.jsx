import React, { useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogActions,
  DialogContent, DialogTitle, TextField, Snackbar, Alert,
  RadioGroup, FormControlLabel, Radio, FormControl, FormLabel,
  Card, CardContent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { useData } from '../contexts/DataContext';
import { addProduct, updateProduct, deleteProduct } from '../api';

function ProductList() {
  const { products, reloadData } = useData(); // reloadData を取得
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formValues, setFormValues] = useState({
    '商品名': '',
    '単位': '',
    '重さ入力': ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpenDialog = (product = null) => {
    setEditingProduct(product);
    if (product) {
      setFormValues({
        '商品名': product['商品名'],
        '単位': product['単位'],
        '重さ入力': product['重さ入力']
      });
    } else {
      setFormValues({
        '商品名': '',
        '単位': '',
        '重さ入力': ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormValues({
      '商品名': '',
      '単位': '',
      '重さ入力': ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let response;
      if (editingProduct) {
        response = await updateProduct({ ...formValues, id: editingProduct.id });
      } else {
        response = await addProduct(formValues);
      }
      setSnackbar({ open: true, message: response.message, severity: 'success' });
      await reloadData(); // データ再取得
      handleCloseDialog();
    } catch (error) {
      console.error('商品の保存に失敗しました:', error);
      setSnackbar({ open: true, message: `商品の保存に失敗しました: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('本当にこの商品を削除しますか？')) {
      return;
    }
    setLoading(true);
    try {
      const response = await deleteProduct(productId);
      setSnackbar({ open: true, message: response.message, severity: 'success' });
      await reloadData(); // データ再取得
    } catch (error) {
      console.error('商品の削除に失敗しました:', error);
      setSnackbar({ open: true, message: `商品の削除に失敗しました: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        取扱商品一覧
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        sx={{ mb: 2 }}
        disabled={loading}
      >
        商品を追加
      </Button>

      {products.length === 0 ? (
        <Alert severity="info">商品が登録されていません。</Alert>
      ) : isMobile ? ( // モバイル表示の場合
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table aria-label="商品一覧テーブル">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>商品</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
                      <CardContent sx={{ flexGrow: 1, p: 2, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <Typography variant="h6" component="div" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {product['商品名']}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          単位: {product['単位']}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          重さ入力: {product['重さ入力']}
                        </Typography>
                        <Box sx={{ mt: 1, alignSelf: 'flex-end' }}>
                          <IconButton aria-label="edit" onClick={() => handleOpenDialog(product)} disabled={loading} size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton aria-label="delete" onClick={() => handleDelete(product.id)} disabled={loading} size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : ( // PC表示の場合
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table aria-label="product table">
            <TableHead>
              <TableRow>
                <TableCell>商品名</TableCell>
                <TableCell>単位</TableCell>
                <TableCell>重さ入力</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {product['商品名']}
                  </TableCell>
                  <TableCell>{product['単位']}</TableCell>
                  <TableCell>{product['重さ入力']}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="edit" onClick={() => handleOpenDialog(product)} disabled={loading}>
                      <EditIcon />
                    </IconButton>
                    <IconButton aria-label="delete" onClick={() => handleDelete(product.id)} disabled={loading}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingProduct ? '商品を編集' : '商品を追加'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="商品名"
            label="商品名"
            type="text"
            fullWidth
            variant="standard"
            value={formValues['商品名']}
            onChange={handleChange}
            disabled={loading}
          />
          <TextField
            margin="dense"
            name="単位"
            label="単位"
            type="text"
            fullWidth
            variant="standard"
            value={formValues['単位']}
            onChange={handleChange}
            disabled={loading}
          />
          <FormControl component="fieldset" margin="dense" fullWidth disabled={loading}>
            <FormLabel component="legend">重さ入力</FormLabel>
            <RadioGroup
              row
              name="重さ入力"
              value={formValues['重さ入力']}
              onChange={handleChange}
            >
              <FormControlLabel value="有" control={<Radio />} label="有" />
              <FormControlLabel value="無" control={<Radio />} label="無" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={loading}>{editingProduct ? '更新' : '追加'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ProductList;

