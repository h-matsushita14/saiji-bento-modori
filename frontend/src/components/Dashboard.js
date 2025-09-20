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
        機能一覧
      </Typography>
      <Grid container spacing={3} alignItems="stretch">
        {features.map((feature) => (
          <Grid item xs={12} sm={12} md={6} key={feature.name}>
            <Card
              sx={{
                height: 150, // 高さを調整
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardActionArea
                component={Link}
                to={feature.path}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "row", // アイコンとテキストを横並びにする
                  alignItems: "center", // 垂直方向中央揃え
                  p: 2, // パディングを調整
                }}
              >
                <Box sx={{ mr: 2 }}>{feature.icon}</Box> {/* アイコンを左に寄せる */}
                <CardContent
                  sx={{
                    flexGrow: 1, // 残りのスペースを埋める
                    p: 0, // CardContentのデフォルトパディングをリセット
                    "&:last-child": { pb: 0 }, // 最後の要素のパディングもリセット
                  }}
                >
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      mb: 0.5, // タイトルと説明の間のスペース
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
                      WebkitLineClamp: 2, // 最大2行まで表示
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
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Dashboard;