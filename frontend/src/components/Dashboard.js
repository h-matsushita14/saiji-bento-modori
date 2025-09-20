import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';

function Dashboard() {
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
      name: '使用数記録',
      description: '商品の使用数を記録します。',
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
        ダッシュボード
      </Typography>
      <Grid container spacing={3} alignItems="stretch">
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.name}>
            <Card
              sx={{
                height: 200, // 固定の高さを設定
                width: "100%", // 幅を100%に固定
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardActionArea
                component={Link}
                to={feature.path}
                sx={{
                  height: "100%", // カード全体の高さに合わせる
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent
                  sx={{
                    height: "100%", // CardActionAreaの高さに合わせる
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 3,
                    textAlign: "center", // テキストを中央揃え
                  }}
                >
                  {feature.icon}
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      mt: 1,
                      mb: 1,
                      minHeight: "1.5em", // タイトルの最小高さを設定
                    }}
                  >
                    {feature.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ 
                      textAlign: "center",
                      lineHeight: 1.4,
                      overflow: "hidden", // テキストがはみ出た場合の対処
                      display: "-webkit-box",
                      WebkitLineClamp: 3, // 最大3行まで表示
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Dashboard;