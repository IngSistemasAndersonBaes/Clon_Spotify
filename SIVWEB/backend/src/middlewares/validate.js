function formatDetails(details) {
    return details.map((d) => d.message);
}

function validateBody(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                details: formatDetails(error.details)
            });
        }
        req.body = value;
        return next();
    };
}

function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros inválidos',
                details: formatDetails(error.details)
            });
        }
        req.query = value;
        return next();
    };
}

module.exports = { validateBody, validateQuery };
