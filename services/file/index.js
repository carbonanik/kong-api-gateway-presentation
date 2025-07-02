const express = require('express');
const app = express();
app.use(express.json());

app.post('/upload', (req, res) => {
  // TODO: Handle file upload
  res.json({ message: 'File uploaded' });
});

app.listen(3000, () => console.log('File Service running')); 