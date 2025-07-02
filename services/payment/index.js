const express = require('express');
const app = express();
app.use(express.json());

app.post('/charge', (req, res) => {
  // TODO: Process payment
  res.json({ message: 'Payment processed' });
});

app.listen(3000, () => console.log('Payment Service running')); 