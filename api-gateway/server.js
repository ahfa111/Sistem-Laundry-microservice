const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is running' });
});

app.use('/customers', createProxyMiddleware({ 
    target: 'http://customer-service:3002', 
    changeOrigin: true,
    pathRewrite: {
        '^/customers': '/customers' 
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



app.use('/customer-reviews', createProxyMiddleware({ 
    target: 'http://customer-service:3002', 
    changeOrigin: true,
    pathRewrite: {
        '^/customer-reviews': '/customer-reviews'
    }
}));

app.use('/laundry-categories', createProxyMiddleware({ 
    target: 'http://laundry-service:3001', 
    changeOrigin: true,
    pathRewrite: {
        '^/laundry-categories': '/laundry-categories'
    }
}));

app.use('/order-items', createProxyMiddleware({ 
    target: 'http://order-service:5002', 
    changeOrigin: true,
    pathRewrite: {
        '^/order-items': '/order-items'
    }
}));

app.use('/payment-methods', createProxyMiddleware({ 
    target: 'http://payment-service:5000', 
    changeOrigin: true,
    pathRewrite: {
        '^/payment-methods': '/payment-methods'
    }
}));

app.use('/voucher-usages', createProxyMiddleware({ 
    target: 'http://voucher-service:3002', 
    changeOrigin: true,
    pathRewrite: {
        '^/voucher-usages': '/voucher-usages'
    }
}));


app.use((req, res) => {
    res.status(404).json({ error: 'Route not found on API Gateway' });
});

app.listen(PORT, () => {
    console.log(`API Gateway is listening on port ${PORT}`);
});
