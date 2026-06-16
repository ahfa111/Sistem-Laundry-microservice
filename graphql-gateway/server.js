const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// internal service URLs
const CUSTOMER_URL = 'http://customer-service:3002/customers';
const LAUNDRY_URL = 'http://laundry-service:3001/laundry';
const ORDER_URL = 'http://order-service:5002/orders';
const PAYMENT_URL = 'http://payment-service:5000/payments';
const VOUCHER_URL = 'http://voucher-service:3002/vouchers';

// GraphQL Schema
const typeDefs = `#graphql
  type Customer {
    id: ID!
    name: String
    email: String
    phone: String
    address: String
  }

  type LaundryPackage {
    id: ID!
    name: String
    description: String
    price: Float
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
  }

  type Payment {
    id: ID!
    order_id: Int
    amount: Float
    status: String
    payment_method: String
    
    # --- Integration Fields ---
    order: Order
  }

  type Voucher {
    id: ID!
    code: String
    discount: Float
    valid_until: String
  }

  type Query {
    customers: [Customer]
    customer(id: ID!): Customer
    
    laundryPackages: [LaundryPackage]
    laundryPackage(id: ID!): LaundryPackage
    
    orders: [Order]
    order(id: ID!): Order
    
    payments: [Payment]
    payment(id: ID!): Payment
    
    vouchers: [Voucher]
    voucher(id: ID!): Voucher
  }
`;

// Resolvers
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
      return data.data || data; // python flask might wrap in {"status":"success", "data": ...}
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
    }
  },
  // Resolvers for integrating data on Order type
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
    }
  },
  // Resolvers for integrating data on Payment type
  Payment: {
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
    // (req, res, next) => {
    //   const apiKey = req.headers['x-api-key'];
    //   if (!apiKey || apiKey !== process.env.API_KEY) {
    //       return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    //   }
    //   next();
    // },
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
