let jwt = require('jsonwebtoken');
let userController = require('../controllers/users');

function getJwtSecret() {
    return process.env.JWT_SECRET || 'secret';
}

function normalizeRoleName(roleName) {
    if (!roleName) {
        return '';
    }

    let normalized = roleName.toString().trim().toLowerCase();
    if (normalized === 'moderator') {
        return 'mod';
    }

    return normalized;
}

module.exports = {
    checkLogin: async function (req, res, next) {
        try {
            let token;

            if (req.cookies.token) {
                token = req.cookies.token;
            } else {
                token = req.headers.authorization;
                if (!token || !token.startsWith('Bearer ')) {
                    return res.status(403).send({ message: 'ban chua dang nhap' });
                }

                token = token.split(' ')[1];
            }

            let result = jwt.verify(token, getJwtSecret());
            req.userId = result.id;
            next();
        } catch (error) {
            res.status(403).send({ message: 'ban chua dang nhap' });
        }
    },
    checkRole: function (...requiredRoles) {
        let normalizedRequiredRoles = requiredRoles.map(normalizeRoleName);

        return async function (req, res, next) {
            try {
                let user = await userController.FindUserById(req.userId);

                if (!user || !user.role) {
                    return res.status(403).send({ message: 'ban khong co quyen' });
                }

                let currentRole = normalizeRoleName(user.role.name);
                if (normalizedRequiredRoles.includes(currentRole)) {
                    req.currentUser = user;
                    return next();
                }

                res.status(403).send({ message: 'ban khong co quyen' });
            } catch (error) {
                res.status(403).send({ message: 'ban khong co quyen' });
            }
        };
    },
    createResetPasswordToken: function (user) {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                type: 'reset-password'
            },
            getJwtSecret() + user.password,
            {
                expiresIn: '10m'
            }
        );
    },
    verifyResetPasswordToken: function (user, token) {
        let payload = jwt.verify(token, getJwtSecret() + user.password);

        if (payload.type !== 'reset-password') {
            throw new Error('token khong hop le');
        }

        return payload;
    }
};
