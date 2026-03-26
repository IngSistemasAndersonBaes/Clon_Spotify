function formatDate(date) {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function parseDateOnly(value) {
    if (!value || typeof value !== 'string') return null;
    const parts = value.split('-');
    if (parts.length !== 3) return null;

    const anio = Number(parts[0]);
    const mes = Number(parts[1]);
    const dia = Number(parts[2]);
    if (!anio || !mes || !dia) return null;

    const date = new Date(anio, mes - 1, dia);
    if (Number.isNaN(date.getTime())) return null;

    return date;
}

module.exports = { formatDate, parseDateOnly };
