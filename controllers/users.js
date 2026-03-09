let bcrypt = require('bcrypt');
let userModel = require('../schemas/users');

module.exports = {
    CreateAnUser: async function (username, password, email, role,
        avatarUrl, fullName, status, loginCount
    ) {
        let newUser = new userModel({
            username: username,
            password: password,
            email: email,
            role: role,
            avatarUrl: avatarUrl,
            fullName: fullName,
            status: status,
            loginCount: loginCount
        });
        await newUser.save();
        return newUser;
    },
    QueryByUserNameAndPassword: async function (username, password) {
        let getUser = await userModel.findOne({
            username: username,
            isDeleted: false
        });

        if (!getUser) {
            return false;
        }

        let isMatched = bcrypt.compareSync(password, getUser.password);
        if (!isMatched) {
            return false;
        }

        return getUser;
    },
    FindUserById: async function (id) {
        return await userModel.findOne({
            _id: id,
            isDeleted: false
        }).populate('role');
    },
    FindUserByEmail: async function (email) {
        return await userModel.findOne({
            email: email,
            isDeleted: false
        }).populate('role');
    },
    ChangePassword: async function (id, newPassword) {
        let user = await userModel.findOne({
            _id: id,
            isDeleted: false
        });

        if (!user) {
            return null;
        }

        user.password = newPassword;
        await user.save();
        return user;
    }
};
