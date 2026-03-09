let { body, validationResult } = require('express-validator');
let util = require('util');
let options = {
    password: {
        minLength: 8,
        minLowercase: 1,
        minSymbols: 1,
        minUppercase: 1,
        minNumbers: 1
    }
};

let passwordMessage = util.format(
    'password dai it nhat %d, co it nhat %d so,%d chu viet hoa, %d chu viet thuong va %d ki tu',
    options.password.minLength,
    options.password.minNumbers,
    options.password.minUppercase,
    options.password.minLowercase,
    options.password.minSymbols,
);

module.exports = {
    postUserValidator: [
        body('email').isEmail().withMessage('email khong dung dinh dang'),
        body('password').isStrongPassword(options.password).withMessage(passwordMessage)
    ],
    forgotPasswordValidator: [
        body('email').notEmpty().withMessage('email la bat buoc'),
        body('email').isEmail().withMessage('email khong dung dinh dang')
    ],
    changePasswordValidator: [
        body().custom(function (value, { req }) {
            let oldPassword = req.body.oldPassword || req.body.oldpassword;
            if (!oldPassword) {
                throw new Error('oldPassword la bat buoc');
            }

            return true;
        }),
        body().custom(function (value, { req }) {
            let newPassword = req.body.newPassword || req.body.newpassword;
            if (!newPassword) {
                throw new Error('newPassword la bat buoc');
            }

            return true;
        }),
        body().custom(function (value, { req }) {
            let oldPassword = req.body.oldPassword || req.body.oldpassword;
            let newPassword = req.body.newPassword || req.body.newpassword;

            if (oldPassword && newPassword && oldPassword === newPassword) {
                throw new Error('newPassword phai khac oldPassword');
            }

            return true;
        }),
        body('newPassword').optional().isStrongPassword(options.password).withMessage(passwordMessage),
        body('newpassword').optional().isStrongPassword(options.password).withMessage(passwordMessage)
    ],
    resetPasswordValidator: [
        body().custom(function (value, { req }) {
            let token = req.body.token;
            if (!token) {
                throw new Error('token la bat buoc');
            }

            return true;
        }),
        body().custom(function (value, { req }) {
            let userId = req.body.id || req.body.userId;
            if (!userId) {
                throw new Error('id la bat buoc');
            }

            return true;
        }),
        body().custom(function (value, { req }) {
            let newPassword = req.body.newPassword || req.body.newpassword;
            if (!newPassword) {
                throw new Error('newPassword la bat buoc');
            }

            return true;
        }),
        body('newPassword').optional().isStrongPassword(options.password).withMessage(passwordMessage),
        body('newpassword').optional().isStrongPassword(options.password).withMessage(passwordMessage)
    ],
    validateResult: function (req, res, next) {
        let result = validationResult(req);
        if (result.errors.length > 0) {
            res.send(result.errors.map(
                function (e) {
                    return {
                        field: e.path,
                        message: e.msg
                    };
                }
            ));
        } else {
            next();
        }
    }
};
