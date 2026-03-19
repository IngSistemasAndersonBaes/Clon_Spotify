function authorizeRoles(...allowed) {
    const allowedSet = new Set(allowed.map((role) => String(role).toLowerCase()));

    return (req, res, next) => {
        const rol = req.user && req.user.rol ? String(req.user.rol).toLowerCase() : null;

        if (!rol || !allowedSet.has(rol)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        return next();
    };
}

module.exports = authorizeRoles;
