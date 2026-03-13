(function initCoreUtils() {
    if (window.AppCore && window.AppCore.utils) return;

    function sanitizeText(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function sanitizeCsvField(value) {
        const raw = String(value == null ? '' : value).replace(/\r?\n/g, ' ').trim();
        const protectedValue = /^[=+\-@]/.test(raw) ? "'" + raw : raw;
        return protectedValue.replace(/"/g, '""');
    }

    function getCurrentDateTime() {
        return new Date().toLocaleDateString('ru-RU') + ', ' + new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function parseRuDate(value) {
        const raw = String(value == null ? '' : value).split(',')[0].trim();
        const m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (!m) return null;
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        const year = parseInt(m[3], 10);
        const dt = new Date(year, month, day);
        if (isNaN(dt.getTime())) return null;
        return dt;
    }

    function toIsoDate(value) {
        if (!value) return '';
        const dt = value instanceof Date ? value : new Date(value);
        if (isNaN(dt.getTime())) return '';
        return dt.toISOString().slice(0, 10);
    }

    function addMonths(dateLike, months) {
        const dt = dateLike instanceof Date ? new Date(dateLike.getTime()) : new Date(dateLike);
        if (isNaN(dt.getTime())) return null;
        dt.setMonth(dt.getMonth() + months);
        return dt;
    }

    function formatIsoDateRu(isoDate) {
        const dt = new Date(isoDate);
        if (isNaN(dt.getTime())) return '—';
        return dt.toLocaleDateString('ru-RU');
    }

    function getPostponedUntilIso(app) {
        if (!app) return '';
        if (app.postponedUntilISO) return app.postponedUntilISO;

        const start = app.postponedAtISO
            ? new Date(app.postponedAtISO)
            : parseRuDate(app.date);
        if (!start || isNaN(start.getTime())) return '';

        const until = addMonths(start, 3);
        return until ? toIsoDate(until) : '';
    }

    function isPostponedUnlockReady(app) {
        if (!app || app.status !== 'postponed') return false;
        const untilIso = getPostponedUntilIso(app);
        if (!untilIso) return false;

        const until = new Date(untilIso + 'T00:00:00');
        const now = new Date();
        return now.getTime() >= until.getTime();
    }

    function addLog(app, actor, action, actionRu, color, icon, comment) {
        if (!app.auditLog) app.auditLog = [];
        app.auditLog.push({
            date: getCurrentDateTime(),
            actor: sanitizeText(actor),
            action: sanitizeText(action),
            actionRu: sanitizeText(actionRu),
            color,
            icon,
            comment: sanitizeText(comment || '')
        });
    }

    window.AppCore = window.AppCore || {};
    window.AppCore.utils = {
        getCurrentDateTime,
        addLog,
        sanitizeText,
        sanitizeCsvField,
        parseRuDate,
        toIsoDate,
        addMonths,
        formatIsoDateRu,
        getPostponedUntilIso,
        isPostponedUnlockReady
    };

    // Legacy compatibility while migrating code out of grant.html
    window.getCurrentDateTime = getCurrentDateTime;
    window.addLog = addLog;
    window.sanitizeText = sanitizeText;
    window.sanitizeCsvField = sanitizeCsvField;
    window.parseRuDate = parseRuDate;
    window.toIsoDate = toIsoDate;
    window.addMonths = addMonths;
    window.formatIsoDateRu = formatIsoDateRu;
    window.getPostponedUntilIso = getPostponedUntilIso;
    window.isPostponedUnlockReady = isPostponedUnlockReady;
})();
