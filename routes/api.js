/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';


const express = require('express');
const axios = require('axios');
const app = express();

// GET request handler for /api/stock-prices
app.get('/api/stock-prices', async (req, res) => {
  const { stock } = req.query;

  try {
    // Make a request to retrieve stock data
    const response = await axios.get(`https://api.example.com/stocks/${stock}`);

    // Extract the stock data from the response
    const stockData = response.data.stockData;

    // Return the stock data as a JSON response
    res.json({ stockData });
  } catch (error) {
    // Handle errors, such as invalid stock symbols or network failures
    res.status(500).json({ error: 'Failed to retrieve stock data' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

const express = require("express");
const helmet = require("helmet");
const app = express();

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
  })
);

app.use(express.static("public"));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

var mongoose = require('mongoose')
var objectId = mongoose.Types.ObjectId
var request = require('request-promise-native')

var stockSchema = new mongoose.Schema({
  code: String,
  likes: { type: [String], default: [] }
})

var Stock = mongoose.model('stock', stockSchema)

function saveStock(code, like, ip) {
  return Stock.findOne({ code: code })
    .then(stock => {
      if (!stock) {
        let newStock = new Stock({ code: code, likes: like ? [ip] : [] })
        return newStock.save()
      } else {
        if (like && stock.likes.indexOf(ip) === -1) {
          stock.likes.push(ip)
        }
        return stock.save()
      }
    })
}

function parseData(data) {
  let i = 0
  let stockData = []
  let likes = []
  while (i < data.length) {
    let stock = { stock: data[i].code, price: parseFloat(data[i+1]) }
    likes.push(data[i].likes.length)
    stockData.push(stock)
    i += 2
  }

  if (likes.length > 1) {
    stockData[0].rel_likes = likes[0] - likes[1]
    stockData[1].rel_likes = likes[1] - likes[0]
  } else {
    stockData[0].likes = likes[0]
    stockData = stockData[0]
  }
  
  return stockData
}

module.exports = function (app) {
  
  app.get('/api/testing', (req, res) => {
    console.log(req.connection)
    
    res.json({ IP: req.ip })
  })
  
  app.route('/api/stock-prices')
    .get(function (req, res) {
      let code = req.query.stock || ''
      if (!Array.isArray(code)) {
        code = [code]
      }
    
      let promises = []
      code.forEach(code => {
        promises.push(saveStock(code.toUpperCase(), req.query.like, req.ip))
        
        let url = `https://api.iextrading.com/1.0/stock/${code.toUpperCase()}/price`
        promises.push(request(url))
      })
    
      Promise.all(promises)
        .then(data => {
          let stockData = parseData(data)
          res.json({ stockData })
        })
        .catch(err => {
          console.log(err)
          res.send(err)
        })
    })
}
