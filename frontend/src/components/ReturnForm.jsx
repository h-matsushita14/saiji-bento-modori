import React, { useState, useEffect } from 'react';
import { addReturnRecord, addEventName } from '../api';
import useFormValidation from '../hooks/useFormValidation';
import { useData } from '../contexts/DataContext';

// MUI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import { TableBody } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

function ReturnForm() {
  const { products, eventList, reloadData } = useData();
  const [loading, setLoading] = useState(false);
  const [productFormValues, setProductFormValues] = useState({});

  // 新規催事名追加ダイアログ用のstate
  const [open, setOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getToday = () => {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  };

  const todayDate = getToday();

  const initialState = {
    年: todayDate.year.toString(),
    月: todayDate.month.toString(),
    日: todayDate.day.toString(),
    催事名: '',
  };

  const validationRules = {
    年: { required: true, label: '年' },
    月: { required: true, label: '月' },
    日: { required: true, label: '日' },
    催事名: { required: true, label: '催事名' },
  };

  const {
    formData,
    message,
    errors,
    handleChange,
    validate,
    setMessage,
    setErrors,
    resetForm,
  } = useFormValidation(initialState, validationRules);

  useEffect(() => {
    if (products.length > 0) {
      const initialProductValues = {};
      products.forEach(product => {
        initialProductValues[product.id] = [{ id: 1, 数量: '', 重さ整数: '0', 重さ小数: '0' }];
      });
      setProductFormValues(initialProductValues);
    }
  }, [products]);

  const handleProductValueChange = (productId, rowId, field, value) => {
    setProductFormValues(prev => ({
      ...prev,
      [productId]: prev[productId].map(row =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleAddRow = (productId) => {
    setProductFormValues(prev => ({
      ...prev,
      [productId]: [
        ...prev[productId],
        { id: prev[productId].length > 0 ? Math.max(...prev[productId].map(row => row.id)) + 1 : 1, 数量: '', 重さ整数: '', 重さ小数: '' }
      ],
    }));
  };

  const handleRemoveRow = (productId, rowId) => {
    setProductFormValues(prev => ({
      ...prev,
      [productId]: prev[productId].filter(row => row.id !== rowId),
    }));
  };

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setNewEventName('');
    setDialogError('');
  };

  const handleAddNewEvent = async () => {
    if (!newEventName.trim()) {
      setDialogError('催事名を入力してください。');
      return;
    }
    setDialogLoading(true);
    setDialogError('');
    try {
      await addEventName(newEventName);
      handleCloseDialog();
      await reloadData();
      handleChange({ target: { name: '催事名', value: newEventName } });
    } catch (err) {
      setDialogError(err.message || '登録に失敗しました。');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    if (!validate()) {
      return;
    }

    setLoading(true);
    const selectedDate = `${formData.年}-${String(formData.月).padStart(2, '0')}-${String(formData.日).padStart(2, '0')}`;

    try {
      const recordsToSubmit = [];
      products.forEach(product => {
        (productFormValues[product.id] || []).forEach(row => {
          const quantity = parseInt(row.数量);
          let weight = null;
          if (product['重さ入力'] === '有') {
            const integerPart = parseInt(row.重さ整数) || 0;
            const decimalPart = parseInt(row.重さ小数) || 0;
            weight = parseFloat(`${integerPart}.${decimalPart}`);
          }

          if (!isNaN(quantity) && quantity > 0) {
            const recordData = {
              '戻り記録日': selectedDate,
              '催事名': formData.催事名,
              '商品名': product['商品名'],
              '数量': quantity,
            };
            if (product['重さ入力'] === '有' && weight !== null && !isNaN(weight)) {
              recordData['重さ'] = weight;
            }
            recordsToSubmit.push(recordData);
          }
        });
      });

      if (recordsToSubmit.length === 0) {
        setErrors({ form: '少なくとも1つの商品の数量を入力してください。' });
        setLoading(false);
        return;
      }

      await addReturnRecords(recordsToSubmit);

      setMessage('戻り記録が正常に追加されました。');
      resetForm();
      const resetProductValues = {};
      products.forEach(product => {
        resetProductValues[product.id] = [{ id: 1, 数量: '', 重さ整数: '0', 重さ小数: '0' }];
      });
      setProductFormValues(resetProductValues);

      await reloadData();

    } catch (err) {
      setMessage('');
      setErrors({ api: `戻り記録の追加に失敗しました: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 4, pb: 15 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        戻り記録
      </Typography>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {errors.api && <Alert severity="error" sx={{ mb: 2 }}>{errors.api}</Alert>}
      {errors.form && <Alert severity="error" sx={{ mb: 2 }}>{errors.form}</Alert>}
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            戻り記録日
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} md={4}>
              <FormControl fullWidth error={!!errors.年} disabled={loading}>
                <InputLabel>年</InputLabel>
                <Select
                  name="年"
                  value={formData.年}
                  onChange={handleChange}
                  label="年"
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return (
                      <MenuItem key={year} value={year.toString()}>
                        {year}年
                      </MenuItem>
                    );
                  })}
                </Select>
                {errors.年 && <FormHelperText>{errors.年}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <FormControl fullWidth error={!!errors.月} disabled={loading}>
                <InputLabel>月</InputLabel>
                <Select
                  name="月"
                  value={formData.月}
                  onChange={handleChange}
                  label="月"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}月
                    </MenuItem>
                  ))}
                </Select>
                {errors.月 && <FormHelperText>{errors.月}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <FormControl fullWidth error={!!errors.日} disabled={loading}>
                <InputLabel>日</InputLabel>
                <Select
                  name="日"
                  value={formData.日}
                  onChange={handleChange}
                  label="日"
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <MenuItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}日
                    </MenuItem>
                  ))}
                </Select>
                {errors.日 && <FormHelperText>{errors.日}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Autocomplete
                options={eventList}
                value={formData.催事名}
                onChange={(event, newValue) => {
                  handleChange({ target: { name: '催事名', value: newValue || '' } });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="催事名"
                    name="催事名"
                    required
                    error={!!errors.催事名}
                    helperText={errors.催事名}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={handleOpenDialog} disabled={loading}>
                新規追加
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          商品一覧
        </Typography>
        {products.length === 0 ? (
          <Alert severity="info">登録されている商品がありません。取扱商品ページから商品を登録してください。</Alert>
        ) : isMobile ? (
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table aria-label="商品戻り記録テーブル">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>商品</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.flatMap(product => {
                  const rows = productFormValues[product.id] || [];
                  return rows.map((row, index) => (
                    <TableRow key={`${product.id}-${row.id}`}>
                      <TableCell>
                        <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
                          <CardContent sx={{ flexGrow: 1, p: 2, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                            <Typography variant="h6" component="div" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {product['商品名']}
                            </Typography>
                            {product['重さ入力'] === '有' && (
                              <Box sx={{ mt: 1, mb: 1, width: '100%' }}>
                                <Grid container spacing={1} alignItems="center">
                                  <Grid item xs={5}>
                                    <FormControl fullWidth size="small" disabled={loading}>
                                      <Select
                                        value={row.重さ整数 || ''}
                                        onChange={(e) => handleProductValueChange(product.id, row.id, '重さ整数', e.target.value)}
                                        displayEmpty
                                      >
                                        {Array.from({ length: 10 }, (_, i) => (
                                          <MenuItem key={i} value={i}>
                                            {i}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                  <Grid item xs={1} sx={{ textAlign: 'center' }}>
                                    <Typography variant="body1">.</Typography>
                                  </Grid>
                                  <Grid item xs={5}>
                                    <FormControl fullWidth size="small" disabled={loading}>
                                      <Select
                                        value={row.重さ小数 || ''}
                                        onChange={(e) => handleProductValueChange(product.id, row.id, '重さ小数', e.target.value)}
                                        displayEmpty
                                      >
                                        {Array.from({ length: 10 }, (_, i) => (
                                          <MenuItem key={i} value={i}>
                                            {i}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                  <Grid item xs={1}>
                                    <Typography variant="body1">kg</Typography>
                                  </Grid>
                                </Grid>
                              </Box>
                            )}
                            <FormControl fullWidth size="small" sx={{ mt: 1 }} disabled={loading}>
                              <InputLabel id="quantity-label-mobile">数量</InputLabel>
                              <Select
                                value={row.数量 || ''}
                                labelId="quantity-label-mobile"
                                label="数量"
                                onChange={(e) => handleProductValueChange(product.id, row.id, '数量', e.target.value)}
                              >
                                {Array.from({ length: 101 }, (_, i) => (
                                  <MenuItem key={i} value={i}>
                                    {i}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              単位: {product['単位']}
                            </Typography>
                            {product['重さ入力'] === '有' && (
                              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
                                <IconButton
                                  onClick={() => handleAddRow(product.id)}
                                  disabled={loading}
                                  size="small"
                                >
                                  <AddCircleOutlineIcon />
                                </IconButton>
                                <Typography variant="body2" sx={{ mr: 1 }}>他の重さを追加</Typography>
                                {rows.length > 1 && (
                                  <IconButton
                                    onClick={() => handleRemoveRow(product.id, row.id)}
                                    disabled={loading}
                                    size="small"
                                  >
                                    <RemoveCircleOutlineIcon />
                                  </IconButton>
                                )}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table aria-label="商品戻り記録テーブル">
              <TableHead>
                <TableRow>
                  <TableCell>商品名</TableCell>
                  <TableCell>重さ</TableCell>
                  <TableCell>数量</TableCell>
                  <TableCell>単位</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.flatMap(product => {
                  const rows = productFormValues[product.id] || [];
                  return rows.map((row, index) => (
                    <TableRow key={`${product.id}-${row.id}`}>
                      {index === 0 && (
                        <TableCell rowSpan={rows.length} sx={{ fontWeight: 'bold' }}>
                          {product['商品名']}
                        </TableCell>
                      )}
                      <TableCell>
                        {product['重さ入力'] === '有' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FormControl size="small" sx={{ width: 60 }} disabled={loading}>
                              <Select
                                value={row.重さ整数 || ''}
                                onChange={(e) => handleProductValueChange(product.id, row.id, '重さ整数', e.target.value)}
                                displayEmpty
                              >
                                {Array.from({ length: 10 }, (_, i) => (
                                  <MenuItem key={i} value={i}>
                                    {i}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Typography variant="body1">.</Typography>
                            <FormControl size="small" sx={{ width: 60 }} disabled={loading}>
                              <Select
                                value={row.重さ小数 || ''}
                                onChange={(e) => handleProductValueChange(product.id, row.id, '重さ小数', e.target.value)}
                                displayEmpty
                              >
                                {Array.from({ length: 10 }, (_, i) => (
                                  <MenuItem key={i} value={i}>
                                    {i}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Typography variant="body1">kg</Typography>
                          </Box>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ width: 100 }} disabled={loading}>
                          <InputLabel id="quantity-label-pc">数量</InputLabel>
                          <Select
                            value={row.数量 || ''}
                            labelId="quantity-label-pc"
                            label="数量"
                            onChange={(e) => handleProductValueChange(product.id, row.id, '数量', e.target.value)}
                            displayEmpty
                          >
                            {Array.from({ length: 101 }, (_, i) => (
                              <MenuItem key={i} value={i}>
                                {i}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {product['単位']}
                      </TableCell>
                      {product['重さ入力'] === '有' && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton
                              onClick={() => handleAddRow(product.id)}
                              disabled={loading}
                              size="small"
                            >
                              <AddCircleOutlineIcon />
                            </IconButton>
                            <Typography variant="body2" sx={{ mr: 1 }}>他の重さを追加</Typography>
                            {rows.length > 1 && (
                              <IconButton
                                onClick={() => handleRemoveRow(product.id, row.id)}
                                disabled={loading}
                                size="small"
                              >
                                <RemoveCircleOutlineIcon />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <Box sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          p: 2,
          bgcolor: 'background.paper',
          boxShadow: 3,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth={isMobile}>
            {loading ? <CircularProgress size={24} color="inherit" /> : '記録する'}
          </Button>
        </Box>
      </form>

      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>新しい催事名を追加</DialogTitle>
        <DialogContent>
          <DialogContentText>
            マスターリストに新しい催事名を追加します。
          </DialogContentText>
          {dialogError && <Alert severity="error" sx={{ mt: 2 }}>{dialogError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="催事名"
            type="text"
            fullWidth
            variant="standard"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
            disabled={dialogLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={dialogLoading}>キャンセル</Button>
          <Button onClick={handleAddNewEvent} disabled={dialogLoading}>
            {dialogLoading ? <CircularProgress size={24} /> : '登録'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default ReturnForm;