(function initSeedData() {
    if (window.__grantSeedDataLoaded) return;

    if (!window.__grantSeedDictionariesLoaded) return;
    if (!window.__grantSeedApplicationsLoaded) return;
    if (!window.__grantSeedMonitoringLoaded) return;

    window.__grantSeedDataLoaded = true;

    if (!window.state || !Array.isArray(window.state.applications) || window.state.applications.length === 0) {
        window.state = {
            protocols: Array.isArray(window.seedProtocols) ? window.seedProtocols : [],
            applications: Array.isArray(window.seedApplications) ? window.seedApplications : [],
            monitoring: window.seedMonitoring || {}
        };
    }

    if (typeof window.currentOpenedAppId === 'undefined') window.currentOpenedAppId = null;
    if (typeof window.currentApprovedAppId === 'undefined') window.currentApprovedAppId = null;
})();
