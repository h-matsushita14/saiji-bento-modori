import React, { Fragment } from 'react';
import { useData } from '../contexts/DataContext'; // 変更

// MUI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

function UsageHistory() {
  const { usageHistory } = useData(); // 変更

  // useEffect, useState(loading, error) は削除

  return (
    <Box sx={{ mt: 4 }}>
      <Fragment>
        <Typography variant="h4" component="h2" gutterBottom>
          使用履歴
        </Typography>
        {usageHistory.length === 0 ? (
          <Alert severity="info">使用履歴がありません。</Alert>
        ) : ( // 常にカード表示
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table aria-label="usage history table">
              <TableHead>
                <TableRow>
                  <TableCell>使用履歴</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usageHistory.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Card sx={{ width: "100%" }}>
                        <CardContent>
                          <Typography variant="h6" component="div">{row.商品名}</Typography>
                          <Typography variant="body2" color="text.secondary">管理No.: {row['管理No.']}</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            使用日: {new Date(row.使用日).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            使用数: {row.使用数}
                          </Typography>
                        </CardContent>
                      </Card>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Fragment>
    </Box>
  );
}

export default UsageHistory;