var express = require('express');
var router = express.Router();
let { postUserValidator, validateResult } = require('../utils/validatorHandler');
let userController = require('../controllers/users');

let { checkLogin, checkRole } = require('../utils/authHandler');

let userModel = require('../schemas/users');

router.get('/', checkLogin, checkRole('admin', 'mod'), async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
    .populate({
      path: 'role',
      select: 'name'
    });
  res.send(users);
});

router.get('/:id', checkLogin, checkRole('admin', 'mod'), async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
      .populate({
        path: 'role',
        select: 'name'
      });
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: 'id not found' });
    }
  } catch (error) {
    res.status(404).send({ message: 'id not found' });
  }
});

router.post('/', checkLogin, checkRole('admin'), postUserValidator, validateResult,
  async function (req, res, next) {
    try {
      let newItem = await userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        req.body.role
      );
      let saved = await userModel
        .findById(newItem._id)
        .populate({
          path: 'role',
          select: 'name'
        });
      res.send(saved);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  });

router.put('/:id', checkLogin, checkRole('admin'), async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findById(id);
    if (!updatedItem || updatedItem.isDeleted) {
      return res.status(404).send({ message: 'id not found' });
    }

    for (const key of Object.keys(req.body)) {
      updatedItem[key] = req.body[key];
    }
    await updatedItem.save();

    let populated = await userModel
      .findById(updatedItem._id)
      .populate({
        path: 'role',
        select: 'name'
      });
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete('/:id', checkLogin, checkRole('admin'), async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: 'id not found' });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
