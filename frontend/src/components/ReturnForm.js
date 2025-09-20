import React, { useState, useEffect } from 'react';
import { addReturnRecord, fetchProducts } from '../api';
import useFormValidation from '../hooks/useFormValidation';

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
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

function ReturnForm() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]); // 商品マスタデータ
  const [productFormValues, setProductFormValues] = useState({}); // 各商品の数量と重さ

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 今日の日付を取得
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

  // 商品マスタの取得
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts();
        setProducts(data);
        // 各商品のフォーム値を初期化
        const initialProductValues = {};
        data.forEach(product => {
          initialProductValues[product.id] = [{ id: 1, 数量: '', 重さ整数: '', 重さ小数: '' }];
        });
        setProductFormValues(initialProductValues);
      } catch (err) {
        setErrors({ api: `商品マスタの取得に失敗しました: ${err.message}` });
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [setErrors]);

  // 各商品の数量・重さ変更時のハンドラ
  const handleProductValueChange = (productId, rowId, field, value) => {
    setProductFormValues(prev => ({
      ...prev,
      [productId]: prev[productId].map(row =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };

  // 行追加ハンドラ
  const handleAddRow = (productId) => {
    setProductFormValues(prev => ({
      ...prev,
      [productId]: [
        ...prev[productId],
        { id: prev[productId].length > 0 ? Math.max(...prev[productId].map(row => row.id)) + 1 : 1, 数量: '', 重さ整数: '', 重さ小数: '' }
      ],
    }));
  };

  // 行削除ハンドラ
  const handleRemoveRow = (productId, rowId) => {
    setProductFormValues(prev => ({
      ...prev,
      [productId]: prev[productId].filter(row => row.id !== rowId),
    }));
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

      // 各商品を個別に登録
      for (const record of recordsToSubmit) {
        await addReturnRecord(record);
      }

      setMessage('戻り記録が正常に追加されました。');
      resetForm();
      // 各商品のフォーム値をリセット
      const resetProductValues = {};
      products.forEach(product => {
        resetProductValues[product.id] = [{ id: 1, 数量: '', 重さ整数: '', 重さ小数: '' }];
      });
      setProductFormValues(resetProductValues);

    } catch (err) {
      setMessage('');
      setErrors({ api: `戻り記録の追加に失敗しました: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 4, pb: 10 }}>
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
          <TextField
            fullWidth
            label="催事名"
            type="text"
            name="催事名"
            value={formData.催事名}
            onChange={handleChange}
            required
            error={!!errors.催事名}
            helperText={errors.催事名}
            disabled={loading}
          />
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          商品一覧
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>商品データを読み込み中...</Typography>
          </Box>
        ) : products.length === 0 ? (
          <Alert severity="info">登録されている商品がありません。取扱商品ページから商品を登録してください。</Alert>
        ) : isMobile ? ( // モバイル表示の場合
          <Grid container spacing={2}>
            {products.flatMap(product => {
              const rows = productFormValues[product.id] || [];
              return rows.map((row, index) => (
                <Grid item xs={12} key={`${product.id}-${row.id}`}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {product['商品名']}
                      </Typography>
                      {product['重さ入力'] === '有' && (
                        <Grid container spacing={1} alignItems="center" sx={{ mt: 1 }}>
                          <Grid item xs={5}>
                            {/* 整数部のドロップダウン */}
                            <FormControl fullWidth size="small" disabled={loading}>
                              <InputLabel>重さ (整数)</InputLabel>
                              <Select
                                value={row.重さ整数 || ''}
                                onChange={(e) => handleProductValueChange(product.id, row.id, '重さ整数', e.target.value)}
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
                            {/* 小数部のドロップダウン */}
                            <FormControl fullWidth size="small" disabled={loading}>
                              <InputLabel>小数</InputLabel>
                              <Select
                                value={row.重さ小数 || ''}
                                onChange={(e) => handleProductValueChange(product.id, row.id, '重さ小数', e.target.value)}
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
                      )}
                      <FormControl fullWidth size="small" sx={{ mt: 1 }} disabled={loading}>
                        <InputLabel>数量</InputLabel>
                        <Select
                          value={row.数量 || ''}
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
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        単位: {product['単位']}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
                    </CardContent>
                  </Card>
                </Grid>
              ));
            })}
          </Grid>
        ) : ( // PC表示の場合
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
                            {/* 整数部のドロップダウン */}
                            <FormControl size="small" sx={{ width: 60 }} disabled={loading}>
                              <InputLabel>整数</InputLabel>
                              <Select
                                value={row.重さ整数 || ''}
                                onChange={(e) => handleProductValueChange(product.id, row.id, '重さ整数', e.target.value)}
                              >
                                {Array.from({ length: 10 }, (_, i) => (
                                  <MenuItem key={i} value={i}>
                                    {i}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Typography variant="body1">.</Typography>
                            {/* 小数部のドロップダウン */}
                            <FormControl size="small" sx={{ width: 40 }} disabled={loading}>
                              <InputLabel>小数</InputLabel>
                              <Select
                                value={row.重さ小数 || ''}
                                onChange={(e) => handleProductValueChange(product.id, row.id, '重さ小数', e.target.value)}
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
                          <Select
                            value={row.数量 || ''}
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
        
        {/* 固定フッターの記録ボタン */}
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
    </Box>
  );
}

export default ReturnForm;