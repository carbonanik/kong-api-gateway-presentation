const express = require('express');
const app = express();
app.use(express.json());

// Get order by ID (protected by Kong JWT)
app.get('/:id', (req, res) => {
  const orderId = req.params.id;
  // Mock order data - in real app, this would come from database
  const order = {
    orderId: orderId,
    status: 'pending',
    customer: 'alice',
    items: [
      { name: 'Product 1', quantity: 2, price: 29.99 },
      { name: 'Product 2', quantity: 1, price: 49.99 }
    ],
    total: 109.97,
    createdAt: new Date().toISOString()
  };
  
  res.json(order);
});

// Get all orders (protected by Kong JWT)
app.get('/', (req, res) => {
  // Mock orders list
  const orders = [
    { orderId: '123', status: 'pending', customer: 'alice' },
    { orderId: '124', status: 'shipped', customer: 'bob' },
    { orderId: '125', status: 'delivered', customer: 'alice' }
  ];
  
  res.json({ orders });
});

app.listen(3000, () => console.log('Order Service running')); 