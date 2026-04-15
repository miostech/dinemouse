/** Remove senha em cópia profunda para persistir só hash no servidor. */
function cloneUserDataWithoutPassword(userData) {
    if (!userData || typeof userData !== 'object') {
        return {};
    }
    try {
        const c = JSON.parse(JSON.stringify(userData));
        delete c.password;
        return c;
    } catch {
        return {};
    }
}

module.exports = { cloneUserDataWithoutPassword };
