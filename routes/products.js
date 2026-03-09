var express = require('express');
let slugify = require('slugify');
var router = express.Router();
let modelProduct = require('../schemas/products');
let { checkLogin, checkRole } = require('../utils/authHandler');

router.get('/', async function (req, res, next) {
  let data = await modelProduct.find({});
  let queries = req.query;
  let titleQ = queries.title ? queries.title.toLowerCase() : '';
  let maxPrice = queries.maxPrice ? Number(queries.maxPrice) : 1E4;
  let minPrice = queries.minPrice ? Number(queries.minPrice) : 0;
  let limit = queries.limit ? Number(queries.limit) : 5;
  let page = queries.page ? Number(queries.page) : 1;
  let result = data.filter(
    function (e) {
      return (!e.isDeleted) && e.price >= minPrice
        && e.price <= maxPrice && e.title.toLowerCase().includes(titleQ);
    }
  );
  result = result.splice(limit * (page - 1), limit);
  res.send(result);
});

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await modelProduct.findById(id);
    if (result && (!result.isDeleted)) {
      res.send(result);
    } else {
      res.status(404).send({
        message: 'ID not found'
      });
    }
  } catch (error) {
    res.status(404).send({
      message: 'ID not found'
    });
  }
});

router.post('/', checkLogin, checkRole('admin', 'mod'), async function (req, res, next) {
  let newObj = new modelProduct({
    title: req.body.title,
    slug: slugify(req.body.title, {
      replacement: '-', remove: undefined,
      locale: 'vi', trim: true
    }),
    price: req.body.price,
    description: req.body.description,
    category: req.body.category,
    images: req.body.images
  });
  await newObj.save();
  res.send(newObj);
});

router.put('/:id', checkLogin, checkRole('admin', 'mod'), async function (req, res, next) {
  try {
    let result = await modelProduct.findByIdAndUpdate(
      req.params.id, req.body, {
      new: true
    }
    );

    if (!result || result.isDeleted) {
      return res.status(404).send({
        message: 'ID not found'
      });
    }

    res.send(result);
  } catch (error) {
    res.status(404).send({
      message: 'ID not found'
    });
  }
});

router.delete('/:id', checkLogin, checkRole('admin'), async function (req, res, next) {
  try {
    let result = await modelProduct.findByIdAndUpdate(
      req.params.id, {
        isDeleted: true
      }, {
      new: true
    }
    );

    if (!result) {
      return res.status(404).send({
        message: 'ID not found'
      });
    }

    res.send(result);
  } catch (error) {
    res.status(404).send({
      message: 'ID not found'
    });
  }
});

module.exports = router;
