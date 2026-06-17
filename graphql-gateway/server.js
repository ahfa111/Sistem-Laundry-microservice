const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();


const CUSTOMER_URL = 'http://customer-service:3002/customers';
const LAUNDRY_URL = 'http://laundry-service:3001/laundry';
const ORDER_URL = 'http://order-service:5002/orders';
const PAYMENT_URL = 'http://payment-service:5000/payments';
const VOUCHER_URL = 'http://voucher-service:3002/vouchers';


const typeDefs = `#graphql
  type Customer {
    id: ID!
    name: String
    email: String
    phone: String
    address: String
    reviews: [CustomerReview]
    orders: [Order]
  }

  type CustomerReview {
    id: ID!
    customer_id: Int
    rating: Int
    review_text: String
    customer: Customer
  }

  type LaundryPackage {
    id: ID!
    name: String
    description: String
    price: Float
  }

  type LaundryCategory {
    id: ID!
    name: String
    description: String
  }

  type OrderItem {
    id: ID!
    order_id: Int
    item_name: String
    quantity: Int
    notes: String
    order: Order
  }

  type Order {
    id: ID!
    customer_id: Int
    service_id: Int
    voucher_id: Int
    order_date: String
    weight: Float
    total_price: Float
    status: String
    
    # --- Integration Fields ---
    customer: Customer
    laundryPackage: LaundryPackage
    voucher: Voucher
    items: [OrderItem]
    payment: Payment
  }

  type PaymentMethod {
    id: ID!
    name: String
    description: String
    is_active: Boolean
  }

  type Payment {
    id: ID!
    order_id: Int
    amount: Float
    status: String
    payment_method: String
    
    # --- Integration Fields ---
    order: Order
    methodDetail: PaymentMethod
  }

  type VoucherUsage {
    id: ID!
    voucher_id: Int
    order_id: Int
    voucher: Voucher
    order: Order
  }

  type Voucher {
    id: ID!
    code: String
    discount: Float
    valid_until: String
    usages: [VoucherUsage]
  }

  type Query {
    customers: [Customer]
    customer(id: ID!): Customer
    customerReviews: [CustomerReview]
    customerReview(id: ID!): CustomerReview
    
    laundryPackages: [LaundryPackage]
    laundryPackage(id: ID!): LaundryPackage
    laundryCategories: [LaundryCategory]
    laundryCategory(id: ID!): LaundryCategory
    
    orders: [Order]
    order(id: ID!): Order
    orderItems: [OrderItem]
    orderItem(id: ID!): OrderItem
    
    payments: [Payment]
    payment(id: ID!): Payment
    paymentMethods: [PaymentMethod]
    paymentMethod(id: ID!): PaymentMethod
    
    vouchers: [Voucher]
    voucher(id: ID!): Voucher
    voucherUsages: [VoucherUsage]
    voucherUsage(id: ID!): VoucherUsage
  }
`;


const resolvers = {
  Query: {
    customers: async () => {
      const { data } = await axios.get(CUSTOMER_URL);
      return data;
    },
    customer: async (_, { id }) => {
      const { data } = await axios.get(`${CUSTOMER_URL}/${id}`);
      return data;
    },
    laundryPackages: async () => {
      const { data } = await axios.get(LAUNDRY_URL);
      return data;
    },
    laundryPackage: async (_, { id }) => {
      const { data } = await axios.get(`${LAUNDRY_URL}/${id}`);
      return data;
    },
    orders: async () => {
      const { data } = await axios.get(ORDER_URL);
      return data.data || data;
    },
    order: async (_, { id }) => {
      const { data } = await axios.get(`${ORDER_URL}/${id}`);
      return data.data || data;
    },
    payments: async () => {
      const { data } = await axios.get(PAYMENT_URL);
      return data;
    },
    payment: async (_, { id }) => {
      const { data } = await axios.get(`${PAYMENT_URL}/${id}`);
      return data;
    },
    vouchers: async () => {
      const { data } = await axios.get(VOUCHER_URL);
      return data;
    },
    voucher: async (_, { id }) => {
      const { data } = await axios.get(`${VOUCHER_URL}/${id}`);
      return data;
    },
    customerReviews: async () => {
      const { data } = await axios.get('http://customer-service:3002/customer-reviews');
      return data;
    },
    customerReview: async (_, { id }) => {
      const { data } = await axios.get(`http://customer-service:3002/customer-reviews/${id}`);
      return data;
    },
    laundryCategories: async () => {
      const { data } = await axios.get('http://laundry-service:3001/laundry-categories');
      return data;
    },
    laundryCategory: async (_, { id }) => {
      const { data } = await axios.get(`http://laundry-service:3001/laundry-categories/${id}`);
      return data;
    },
    orderItems: async () => {
      const { data } = await axios.get('http://order-service:5002/order-items');
      return data.data || data;
    },
    orderItem: async (_, { id }) => {
      const { data } = await axios.get(`http://order-service:5002/order-items/${id}`);
      return data.data || data;
    },
    paymentMethods: async () => {
      const { data } = await axios.get('http://payment-service:5000/payment-methods');
      return data;
    },
    paymentMethod: async (_, { id }) => {
      const { data } = await axios.get(`http://payment-service:5000/payment-methods/${id}`);
      return data;
    },
    voucherUsages: async () => {
      const { data } = await axios.get('http://voucher-service:3002/voucher-usages');
      return data;
    },
    voucherUsage: async (_, { id }) => {
      const { data } = await axios.get(`http://voucher-service:3002/voucher-usages/${id}`);
      return data;
    }
  },
  
  
  
  Order: {
    customer: async (parent) => {
      if (!parent.customer_id) return null;
      try {
        const { data } = await axios.get(`${CUSTOMER_URL}/${parent.customer_id}`);
        return data;
      } catch (err) {
        return null;
      }
    },
    laundryPackage: async (parent) => {
      if (!parent.service_id) return null;
      try {
        const { data } = await axios.get(`${LAUNDRY_URL}/${parent.service_id}`);
        return data;
      } catch (err) {
        return null;
      }
    },
    voucher: async (parent) => {
      if (!parent.voucher_id) return null;
      try {
        const { data } = await axios.get(`${VOUCHER_URL}/${parent.voucher_id}`);
        return data;
      } catch (err) {
        return null;
      }
    },
    items: async (parent) => {
      try {
        const { data } = await axios.get('http://order-service:5002/order-items');
        const items = data.data || data;
        return items.filter(item => item.order_id === parent.id);
      } catch (err) {
        return [];
      }
    },
    payment: async (parent) => {
      try {
        const { data } = await axios.get(PAYMENT_URL);
        return data.find(p => p.order_id === parent.id) || null;
      } catch (err) {
        return null;
      }
    }
  },
  
  OrderItem: {
    order: async (parent) => {
      if (!parent.order_id) return null;
      try {
        const { data } = await axios.get(`${ORDER_URL}/${parent.order_id}`);
        return data.data || data;
      } catch (err) {
        return null;
      }
    }
  },
  
  Customer: {
    reviews: async (parent) => {
      try {
        const { data } = await axios.get('http://customer-service:3002/customer-reviews');
        return data.filter(review => review.customer_id === parent.id);
      } catch (err) {
        return [];
      }
    },
    orders: async (parent) => {
      try {
        const { data } = await axios.get(ORDER_URL);
        const orders = data.data || data;
        return orders.filter(order => order.customer_id === parent.id);
      } catch (err) {
        return [];
      }
    }
  },
  
  CustomerReview: {
    customer: async (parent) => {
      if (!parent.customer_id) return null;
      try {
        const { data } = await axios.get(`${CUSTOMER_URL}/${parent.customer_id}`);
        return data;
      } catch (err) {
        return null;
      }
    }
  },
  
  Payment: {
    order: async (parent) => {
      if (!parent.order_id) return null;
      try {
        const { data } = await axios.get(`${ORDER_URL}/${parent.order_id}`);
        return data.data || data;
      } catch (err) {
        return null;
      }
    },
    methodDetail: async (parent) => {
      if (!parent.payment_method) return null;
      try {
        const { data } = await axios.get('http://payment-service:5000/payment-methods');
        return data.find(m => m.name.toLowerCase().includes(parent.payment_method.toLowerCase())) || null;
      } catch (err) {
        return null;
      }
    }
  },
  
  Voucher: {
    usages: async (parent) => {
      try {
        const { data } = await axios.get('http://voucher-service:3002/voucher-usages');
        return data.filter(usage => usage.voucher_id === parent.id);
      } catch (err) {
        return [];
      }
    }
  },
  
  VoucherUsage: {
    voucher: async (parent) => {
      if (!parent.voucher_id) return null;
      try {
        const { data } = await axios.get(`${VOUCHER_URL}/${parent.voucher_id}`);
        return data;
      } catch (err) {
        return null;
      }
    },
    order: async (parent) => {
      if (!parent.order_id) return null;
      try {
        const { data } = await axios.get(`${ORDER_URL}/${parent.order_id}`);
        return data.data || data;
      } catch (err) {
        return null;
      }
    }
  }
};

async function startApolloServer() {
  const app = express();
  const PORT = process.env.PORT || 4000;

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server)
  );

  app.get('/health', (req, res) => {
      res.status(200).json({ status: 'GraphQL Gateway is running' });
  });

  app.listen(PORT, () => {
    console.log(`GraphQL Gateway is listening on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

startApolloServer().catch(err => {
    console.error('Failed to start server', err);
});
