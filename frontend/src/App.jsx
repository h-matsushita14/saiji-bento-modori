import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import InventoryList from './components/InventoryList.jsx';
import ReturnForm from './components/ReturnForm.jsx';
import UsageHistory from './components/UsageHistory.jsx';
import Dashboard from './components/Dashboard.jsx';
import ProductList from './components/ProductList.jsx';
import LoadingScreen from './components/LoadingScreen.jsx'; // 追加
import { useData } from './contexts/DataContext'; // 追加

// MUI Components
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

function App() {
  const { isLoading, progress, reloadData } = useData(); // 追加
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

  // 読み込み中の表示
  if (isLoading) {
    return <LoadingScreen progress={progress} />;
  }

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
            <IconButton
              color="inherit"
              aria-label="refresh data"
              onClick={reloadData}
            >
              <RefreshIcon />
            </IconButton>
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/return" element={<ReturnForm />} />
            <Route path="/usage" element={<UsageHistory />} />
            <Route path="/products" element={<ProductList />} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  );
}

export default App;
