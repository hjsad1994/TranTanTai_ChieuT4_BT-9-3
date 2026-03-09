module.exports = {
    sendResetPasswordMail: async function (to, resetLink) {
        console.log('Reset password link for ' + to + ': ' + resetLink);
        return {
            mode: 'simple',
            resetLink: resetLink
        };
    }
};
