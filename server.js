const express = require('express');
const bodyParser = require('body-parser');

const cors = require('cors');

const api = require('./routes/api/api');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.use(cors());

app.use('/api',api)

app.get('/', (req, res) => {
    res.send('Hello from server');
})

app.listen(PORT, () => {
    console.log('Server is running on localhost' + PORT)
})