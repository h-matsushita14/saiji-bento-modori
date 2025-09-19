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
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

function ReturnForm() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]); // 商品マスタデータ
  const [productFormValues, setProductFormValues] = useState({}); // 各商品の数量と重さ

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
          initialProductValues[product.id] = [{ id: 1, 数量: '', 重さ: '' }]; // 各商品に初期の1行を設定
        });
        setProductFormValues(initialProductValues);
      } catch (err) {
        setErrors({ api: `商品マスタの取得に失敗しました: ${err.message}` });
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

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
        { id: prev[productId].length > 0 ? Math.max(...prev[productId].map(row => row.id)) + 1 : 1, 数量: '', 重さ: '' }
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
        (productFormValues[product.id] || []).forEach(row => { // ここを修正
          const quantity = parseInt(row.数量);
          const weight = parseFloat(row.重さ);

          if (!isNaN(quantity) && quantity > 0) {
            const recordData = {
              '戻り記録日': selectedDate,
              '催事名': formData.催事名,
              '商品名': product['商品名'],
              '数量': quantity,
            };
            if (product['重さ入力'] === '有' && !isNaN(weight)) {
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
        resetProductValues[product.id] = [{ id: 1, 数量: '', 重さ: '' }];
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
    <Box sx={{ mt: 4 }}>
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
            <Grid xs={4}>
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
            <Grid xs={4}>
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
            <Grid xs={4}>
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
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="商品戻り記録テーブル">
              <TableHead>
                <TableRow>
                  <TableCell>商品名</TableCell>
                  <TableCell>重さ</TableCell>
                  <TableCell>数量</TableCell>
                  <TableCell>単位</TableCell>
                  <TableCell></TableCell> {/* 行追加・削除ボタン用 */}
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
                          <TextField
                            size="small"
                            type="number"
                            value={row.重さ || ''}
                            onChange={(e) => handleProductValueChange(product.id, row.id, '重さ', e.target.value)}
                            inputProps={{ min: 0, step: "0.01" }}
                            helperText="kg"
                            disabled={loading}
                            sx={{ width: 80 }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.数量 || ''}
                          onChange={(e) => handleProductValueChange(product.id, row.id, '数量', e.target.value)}
                          inputProps={{ min: 0 }}
                          disabled={loading}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        {product['単位']}
                      </TableCell>
                      {product['重さ入力'] === '有' && (
                        <TableCell>
                          <IconButton
                            onClick={() => handleAddRow(product.id)}
                            disabled={loading}
                            size="small"
                          >
                            <AddCircleOutlineIcon />
                          </IconButton>
                          {rows.length > 1 && (
                            <IconButton
                              onClick={() => handleRemoveRow(product.id, row.id)}
                              disabled={loading}
                              size="small"
                            >
                              <RemoveCircleOutlineIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 3 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : '記録する'}
        </Button>
      </form>
    </Box>
  );
}

export default ReturnForm;