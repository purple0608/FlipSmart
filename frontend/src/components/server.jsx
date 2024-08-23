const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/stop-recording', (req, res) => {
  const outputData = req.body.outputData;
  fs.writeFile('output.txt', outputData, (err) => {
    if (err) {
      console.error('Failed to save output data:', err);
      res.status(500).send('Failed to save output data');
    } else {
      res.send('Output data saved successfully');
    }
  });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
