(function initCoreUtils() {
    if (window.AppCore && window.AppCore.utils) return;

    function getCurrentDateTime() {
        return new Date().toLocaleDateString('ru-RU') + ', ' + new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function addLog(app, actor, action, actionRu, color, icon, comment) {
        if (!app.auditLog) app.auditLog = [];
        app.auditLog.push({
            date: getCurrentDateTime(),
            actor,
            action,
            actionRu,
            color,
            icon,
            comment: comment || ''
        });
    }

    window.AppCore = window.AppCore || {};
    window.AppCore.utils = { getCurrentDateTime, addLog };

    // Legacy compatibility while migrating code out of grant.html
    window.getCurrentDateTime = getCurrentDateTime;
    window.addLog = addLog;
})();
