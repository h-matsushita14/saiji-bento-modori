import React, { useState } from 'react';
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
import IconButton from '@mui/material/IconButton'; // 追加
import MenuIcon from '@mui/icons-material/Menu'; // 追加
import Drawer from '@mui/material/Drawer'; // 追加
import List from '@mui/material/List'; // 追加
import ListItem from '@mui/material/ListItem'; // 追加
import ListItemButton from '@mui/material/ListItemButton'; // 追加
import ListItemText from '@mui/material/ListItemText'; // 追加
import useMediaQuery from '@mui/material/useMediaQuery'; // 追加
import { useTheme } from '@mui/material/styles'; // 追加


function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/inventory">
            <ListItemText primary="在庫一覧" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/return">
            <ListItemText primary="戻り記録" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/usage">
            <ListItemText primary="使用履歴" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/products">
            <ListItemText primary="取扱商品" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
  return (
    <BrowserRouter>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography
              variant="h6"
              component="div"
              noWrap
              sx={{ flexGrow: 1, display: { xs: 'block', sm: 'block' } }}
            >
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                弁当催事戻り管理
              </Link>
            </Typography>
            {!isMobile && (
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Button color="inherit" component={Link} to="/inventory">在庫一覧</Button>
                <Button color="inherit" component={Link} to="/return">戻り記録</Button>
                <Button color="inherit" component={Link} to="/usage">使用履歴</Button>
                <Button color="inherit" component={Link} to="/products">取扱商品</Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>
        <nav>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
            }}
          >
            {drawer}
          </Drawer>
        </nav>

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