const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is running' });
});

// Proxy routes
app.use('/customers', createProxyMiddleware({ 
    target: 'http://customer-service:3002', 
    changeOrigin: true,
    pathRewrite: {
        '^/customers': '/customers' // Keep the base path
    }
}));

app.use('/laundry', createProxyMiddleware({ 
    target: 'http://laundry-service:3001', 
    changeOrigin: true,
    pathRewrite: {
        '^/laundry': '/laundry'
    }
}));

app.use('/orders', createProxyMiddleware({ 
    target: 'http://order-service:5002', 
    changeOrigin: true,
    pathRewrite: {
        '^/orders': '/orders'
    }
}));

app.use('/payments', createProxyMiddleware({ 
    target: 'http://payment-service:5000', 
    changeOrigin: true,
    pathRewrite: {
        '^/payments': '/payments'
    }
}));

app.use('/vouchers', createProxyMiddleware({ 
    target: 'http://voucher-service:3002', 
    changeOrigin: true,
    pathRewrite: {
        '^/vouchers': '/vouchers'
    }
}));

// Fallback route
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found on API Gateway' });
});

app.listen(PORT, () => {
    console.log(`API Gateway is listening on port ${PORT}`);
});
