import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import InventoryList from './components/InventoryList';
import ReturnForm from './components/ReturnForm';
import UsageHistory from './components/UsageHistory';
import Dashboard from './components/Dashboard'; // Dashboardをインポート
import ProductList from './components/ProductList'; // ProductListをインポート

// MUI Components
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                弁当催事戻り管理
              </Link>
            </Typography>
            <Button color="inherit" component={Link} to="/inventory">在庫一覧</Button>
            <Button color="inherit" component={Link} to="/return">戻り記録</Button>
            <Button color="inherit" component={Link} to="/usage">使用履歴</Button>
            <Button color="inherit" component={Link} to="/products">取扱商品</Button> {/* 追加 */}
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} /> {/* HomeをDashboardに変更 */}
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/return" element={<ReturnForm />} />
            <Route path="/usage" element={<UsageHistory />} />
            <Route path="/products" element={<ProductList />} /> {/* 追加 */}
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  );
}

export default App;