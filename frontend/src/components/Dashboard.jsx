import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, CardActionArea, useMediaQuery, useTheme,
  TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Grid
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';

function Dashboard() {
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      name: '在庫一覧',
      description: '現在の在庫状況を確認します。',
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      path: '/inventory',
    },
    {
      name: '戻り記録',
      description: '催事からの戻り商品を記録します。',
      icon: <AssignmentReturnIcon sx={{ fontSize: 40 }} />,
      path: '/return',
    },
    {
      name: '使用履歴',
      description: '商品の使用履歴を参照します。',
      icon: <BarChartIcon sx={{ fontSize: 40 }} />,
      path: '/usage',
    },
    {
      name: '取扱商品',
      description: '取扱商品の登録、編集、削除を行います。',
      icon: <ShoppingBasketIcon sx={{ fontSize: 40 }} />,
      path: '/products',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        機能一覧
      </Typography>

      {isMobileOrTablet && (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table aria-label="機能一覧テーブル">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>機能</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {features.map((feature) => (
                <TableRow key={feature.name}>
                  <TableCell>
                    <Card
                      sx={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        flexGrow: 1,
                      }}
                    >
                      <CardActionArea
                        component={Link}
                        to={feature.path}
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          p: 2,
                        }}
                      >
                        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>{feature.icon}</Box>
                        <CardContent
                          sx={{
                            flexGrow: 1,
                            p: 0,
                            "&:last-child": { pb: 0 },
                          }}
                        >
                          <Typography
                            variant="h6"
                            component="div"
                            sx={{
                              mb: 0.5,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                            }}
                          >
                            {feature.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              lineHeight: 1.4,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                            }}
                          >
                            {feature.description}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!isMobileOrTablet && (
        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid item xs={12} md={6} key={feature.name}>
              <Card sx={{ height: '100%', width: '100%', display: 'flex' }}>
                <CardActionArea
                  component={Link}
                  to={feature.path}
                  sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', p: 3, textAlign: 'center' }}
                >
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {feature.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default Dashboard;

