var express = require('express');
var router = express.Router();
let bcrypt = require('bcrypt');
let userController = require('../controllers/users');
let jwt = require('jsonwebtoken');
let { forgotPasswordValidator, changePasswordValidator, resetPasswordValidator, validateResult } = require('../utils/validatorHandler');
let sendMailHandler = require('../utils/sendMailHandler');
let { checkLogin, createResetPasswordToken, verifyResetPasswordToken } = require('../utils/authHandler');

router.post('/register', async function (req, res, next) {
    let newUser = await userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        '69a5462f086d74c9e772b804'
    );

    res.send({
        message: 'dang ki thanh cong',
        id: newUser._id
    });
});

router.post('/login', async function (req, res, next) {
    let result = await userController.QueryByUserNameAndPassword(
        req.body.username, req.body.password
    );
    if (result) {
        let token = jwt.sign({
            id: result.id
        }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '1h'
        });
        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true
        });
        res.send(token);
    } else {
        res.status(404).send({ message: 'sai THONG TIN DANG NHAP' });
    }

});

router.post('/forgot-password', forgotPasswordValidator, validateResult, async function (req, res, next) {
    try {
        let user = await userController.FindUserByEmail(req.body.email);
        let response = {
            message: 'neu email ton tai, link reset password da duoc gui',
            expiresInMinutes: 10
        };

        if (!user) {
            return res.send(response);
        }

        let token = createResetPasswordToken(user);
        let resetLink = req.protocol + '://' + req.get('host') + '/api/v1/auth/reset-password?id=' + user._id + '&token=' + encodeURIComponent(token);
        let mailResult = await sendMailHandler.sendResetPasswordMail(user.email, resetLink);
        response.resetLink = mailResult.resetLink;

        res.send(response);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.get('/me', checkLogin, async function (req, res, next) {
    let getUser = await userController.FindUserById(req.userId);
    res.send(getUser);
});

router.get('/reset-password', async function (req, res, next) {
    try {
        let userId = req.query.id || req.query.userId;
        let token = req.query.token;

        if (!userId || !token) {
            return res.status(400).send({ message: 'thieu id hoac token' });
        }

        let user = await userController.FindUserById(userId);
        if (!user) {
            return res.status(404).send({ message: 'khong tim thay user' });
        }

        verifyResetPasswordToken(user, token);
        res.send({
            message: 'link reset password hop le',
            userId: user._id,
            email: user.email,
            nextStep: 'gui POST /api/v1/auth/reset-password voi id, token, newPassword'
        });
    } catch (error) {
        res.status(400).send({ message: 'link reset password khong hop le hoac da het han' });
    }
});

router.post('/reset-password', resetPasswordValidator, validateResult, async function (req, res, next) {
    try {
        let userId = req.body.id || req.body.userId;
        let token = req.body.token;
        let newPassword = req.body.newPassword || req.body.newpassword;
        let user = await userController.FindUserById(userId);

        if (!user) {
            return res.status(404).send({ message: 'khong tim thay user' });
        }

        verifyResetPasswordToken(user, token);
        await userController.ChangePassword(userId, newPassword);

        res.send({ message: 'reset password thanh cong' });
    } catch (error) {
        res.status(400).send({ message: 'token khong hop le hoac da het han' });
    }
});

router.post('/change-password', checkLogin, changePasswordValidator, validateResult, async function (req, res, next) {
    try {
        let oldPassword = req.body.oldPassword || req.body.oldpassword;
        let newPassword = req.body.newPassword || req.body.newpassword;
        let user = await userController.FindUserById(req.userId);

        if (!user) {
            return res.status(404).send({ message: 'khong tim thay user' });
        }

        let isMatched = bcrypt.compareSync(oldPassword, user.password);
        if (!isMatched) {
            return res.status(400).send({ message: 'oldPassword khong dung' });
        }

        await userController.ChangePassword(req.userId, newPassword);
        res.send({ message: 'doi mat khau thanh cong' });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post('/logout', checkLogin, function (req, res, next) {
    res.cookie('token', null, {
        maxAge: 0,
        httpOnly: true
    });
    res.send('da logout ');
});

module.exports = router;
