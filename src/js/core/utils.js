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

    function ensureDocumentBundle(app) {
        if (!app) return null;
        if (!app.documents) {
            app.documents = {
                wordVersions: [],
                currentWordVersion: 0,
                basePdf: null,
                basePhotos: []
            };
        }
        if (!Array.isArray(app.documents.wordVersions)) app.documents.wordVersions = [];
        if (!Array.isArray(app.documents.basePhotos)) app.documents.basePhotos = [];
        if (!app.documents.currentWordVersion) app.documents.currentWordVersion = app.documents.wordVersions.length || 0;
        return app.documents;
    }

    function registerBaseDocuments(app, payload) {
        var docs = ensureDocumentBundle(app);
        if (!docs || !payload) return;
        var now = getCurrentDateTime();

        if (payload.pdfName) {
            docs.basePdf = {
                name: sanitizeText(payload.pdfName),
                uploadedAt: now,
                uploadedByRole: sanitizeText(payload.uploadedByRole || 'Фасилитатор'),
                uploadedByName: sanitizeText(payload.uploadedByName || 'Фасилитатор')
            };
        }

        if (Array.isArray(payload.photoNames) && payload.photoNames.length > 0) {
            docs.basePhotos = payload.photoNames.map(function (name, index) {
                return {
                    slot: index + 1,
                    name: sanitizeText(name),
                    uploadedAt: now,
                    uploadedByRole: sanitizeText(payload.uploadedByRole || 'Фасилитатор'),
                    uploadedByName: sanitizeText(payload.uploadedByName || 'Фасилитатор')
                };
            });
        }
    }

    function registerWordVersion(app, payload) {
        var docs = ensureDocumentBundle(app);
        if (!docs || !payload || !payload.fileName) return 0;

        var nextVersion = (docs.currentWordVersion || 0) + 1;
        var entry = {
            version: nextVersion,
            name: sanitizeText(payload.fileName),
            uploadedAt: getCurrentDateTime(),
            uploadedByRole: sanitizeText(payload.uploadedByRole || ''),
            uploadedByName: sanitizeText(payload.uploadedByName || ''),
            sourceStage: sanitizeText(payload.sourceStage || '')
        };

        docs.wordVersions.push(entry);
        docs.currentWordVersion = nextVersion;
        return nextVersion;
    }

    function getCurrentWordVersionInfo(app) {
        var docs = ensureDocumentBundle(app);
        if (!docs || !docs.currentWordVersion) return null;
        var version = docs.currentWordVersion;
        for (var i = docs.wordVersions.length - 1; i >= 0; i--) {
            if (docs.wordVersions[i].version === version) return docs.wordVersions[i];
        }
        return null;
    }

    function ensureGrantAgreement(app) {
        if (!app) return null;
        if (!app.grantAgreement) {
            app.grantAgreement = {
                uploaded: false,
                fileName: '',
                mimeType: '',
                fileDataUrl: '',
                uploadedAt: '',
                uploadedByRole: '',
                uploadedByName: '',
                note: '',
                replaceCount: 0
            };
        }
        if (typeof app.grantAgreement.mimeType !== 'string') app.grantAgreement.mimeType = '';
        if (typeof app.grantAgreement.fileDataUrl !== 'string') app.grantAgreement.fileDataUrl = '';
        return app.grantAgreement;
    }

    function registerGrantAgreement(app, payload) {
        if (!app || !payload || !payload.fileName) return null;
        var agreement = ensureGrantAgreement(app);
        if (!agreement) return null;

        var isReplacing = !!agreement.uploaded;
        agreement.uploaded = true;
        agreement.fileName = sanitizeText(payload.fileName);
        agreement.mimeType = sanitizeText(payload.mimeType || '');
        agreement.fileDataUrl = sanitizeText(payload.fileDataUrl || '');
        agreement.uploadedAt = getCurrentDateTime();
        agreement.uploadedByRole = sanitizeText(payload.uploadedByRole || 'Фасилитатор');
        agreement.uploadedByName = sanitizeText(payload.uploadedByName || 'Фасилитатор');
        agreement.note = sanitizeText(payload.note || '');
        agreement.replaceCount = isReplacing ? (agreement.replaceCount || 0) + 1 : 0;
        return agreement;
    }

    function ensureGrantContractDraft(app) {
        if (!app) return null;
        if (!app.grantContractDraft) {
            app.grantContractDraft = {
                fields: {},
                updatedAt: '',
                updatedByRole: '',
                updatedByName: ''
            };
        }
        if (!app.grantContractDraft.fields || typeof app.grantContractDraft.fields !== 'object') {
            app.grantContractDraft.fields = {};
        }
        return app.grantContractDraft;
    }

    function registerGrantContractDraft(app, payload) {
        if (!app) return null;
        var draft = ensureGrantContractDraft(app);
        if (!draft) return null;

        var fields = payload && payload.fields && typeof payload.fields === 'object' ? payload.fields : {};
        draft.fields = fields;
        draft.updatedAt = getCurrentDateTime();
        draft.updatedByRole = sanitizeText((payload && payload.updatedByRole) || 'Фасилитатор');
        draft.updatedByName = sanitizeText((payload && payload.updatedByName) || 'Фасилитатор');
        return draft;
    }

    function downloadGrantAgreementFile(appId) {
        var app = typeof appId === 'string' ? (window.getApp ? window.getApp(appId) : null) : appId;
        if (!app) {
            alert('Заявка не найдена / Дархост ёфт нашуд');
            return;
        }

        var agreement = ensureGrantAgreement(app);
        if (!agreement || !agreement.uploaded || !agreement.fileName) {
            alert('Подписанный договор еще не загружен / Шартномаи имзошуда ҳанӯз бор нашудааст');
            return;
        }

        if (agreement.fileDataUrl) {
            var linkFile = document.createElement('a');
            linkFile.setAttribute('href', agreement.fileDataUrl);
            linkFile.setAttribute('download', agreement.fileName || ('GrantAgreement_' + app.id + '.pdf'));
            document.body.appendChild(linkFile);
            linkFile.click();
            document.body.removeChild(linkFile);
            return;
        }

        var lines = [
            'SIGNED GRANT AGREEMENT / ПОДПИСАННЫЙ ДОГОВОР О ГРАНТЕ',
            'ID: ' + app.id,
            'Заявитель: ' + sanitizeText(app.name || ''),
            'Файл: ' + sanitizeText(agreement.fileName),
            'Загружен: ' + sanitizeText(agreement.uploadedAt || '—'),
            'Роль: ' + sanitizeText(agreement.uploadedByRole || '—'),
            'Пользователь: ' + sanitizeText(agreement.uploadedByName || '—')
        ];

        if (agreement.note) {
            lines.push('Комментарий: ' + sanitizeText(agreement.note));
        }

        var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'GrantAgreement_' + app.id + '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function downloadBusinessPlanFile(appId) {
        var app = typeof appId === 'string' ? (window.getApp ? window.getApp(appId) : null) : appId;
        if (!app) {
            alert('Заявка не найдена / Дархост ёфт нашуд');
            return;
        }

        var docs = ensureDocumentBundle(app);
        var currentWord = getCurrentWordVersionInfo(app);
        var pdf = docs.basePdf ? docs.basePdf.name : '—';
        var photos = docs.basePhotos || [];

        var content = [
            'BUSINESS PLAN PACKAGE / ПАКЕТ БИЗНЕС-ПЛАНА',
            'ID: ' + app.id,
            'Заявитель: ' + sanitizeText(app.name || ''),
            'Текущая версия Word: ' + (currentWord ? ('V' + currentWord.version + ' (' + currentWord.name + ')') : '—'),
            'PDF (фиксированный): ' + pdf,
            'Фото (фиксированные): ' + (photos.length ? photos.map(function (p) { return p.name; }).join(', ') : '—'),
            '',
            'История версий Word:'
        ];

        if (!docs.wordVersions.length) {
            content.push('- Нет версий');
        } else {
            docs.wordVersions.forEach(function (v) {
                content.push('- V' + v.version + ': ' + v.name + ' [' + v.uploadedAt + ', ' + v.uploadedByRole + ']');
            });
        }

        var blob = new Blob([content.join('\n')], { type: 'text/plain;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        var versionSuffix = currentWord ? ('_V' + currentWord.version) : '';
        link.setAttribute('download', 'BusinessPlan_' + app.id + versionSuffix + '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function downloadBusinessPlanPdfFile(appId) {
        var app = typeof appId === 'string' ? (window.getApp ? window.getApp(appId) : null) : appId;
        if (!app) {
            alert('Заявка не найдена / Дархост ёфт нашуд');
            return;
        }

        var docs = ensureDocumentBundle(app);
        if (!docs.basePdf || !docs.basePdf.name) {
            alert('PDF пока не загружен / PDF то ҳол бор нашудааст');
            return;
        }

        var content = [
            'FIXED PDF ATTACHMENT / ФИКСИРОВАННОЕ PDF-ВЛОЖЕНИЕ',
            'ID: ' + app.id,
            'Заявитель: ' + sanitizeText(app.name || ''),
            'Файл: ' + sanitizeText(docs.basePdf.name),
            'Загружен: ' + sanitizeText(docs.basePdf.uploadedAt || '—'),
            'Роль: ' + sanitizeText(docs.basePdf.uploadedByRole || '—')
        ];

        var blob = new Blob([content.join('\n')], { type: 'text/plain;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'BusinessPlanPDF_' + app.id + '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function downloadBusinessPlanPhotoPack(appId) {
        var app = typeof appId === 'string' ? (window.getApp ? window.getApp(appId) : null) : appId;
        if (!app) {
            alert('Заявка не найдена / Дархост ёфт нашуд');
            return;
        }

        var docs = ensureDocumentBundle(app);
        var photos = docs.basePhotos || [];
        if (!photos.length) {
            alert('Фото-комплект пока не загружен / Маҷмӯи аксҳо то ҳол бор нашудааст');
            return;
        }

        var lines = [
            'FIXED PHOTO PACK / ФИКСИРОВАННЫЙ ФОТО-КОМПЛЕКТ',
            'ID: ' + app.id,
            'Заявитель: ' + sanitizeText(app.name || ''),
            'Количество фото: ' + photos.length,
            ''
        ];

        photos.forEach(function (p) {
            lines.push('Фото ' + p.slot + ': ' + sanitizeText(p.name) + ' [' + sanitizeText(p.uploadedAt || '—') + ']');
        });

        var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'BusinessPlanPhotos_' + app.id + '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function getApplicationDocumentCompleteness(app) {
        if (!app) {
            return {
                hasWord: false,
                hasPdf: false,
                hasPhotos4: false,
                photosCount: 0,
                hasAgreement: false,
                isBasePackageComplete: false,
                isFullPackageComplete: false,
                missingItemsRu: ['Word', 'PDF', 'Фото (4)', 'Подписанный договор']
            };
        }

        var docs = ensureDocumentBundle(app);
        var agreement = ensureGrantAgreement(app);
        var photosCount = Array.isArray(docs.basePhotos) ? docs.basePhotos.length : 0;
        var hasWord = !!(docs.wordVersions && docs.wordVersions.length > 0);
        var hasPdf = !!(docs.basePdf && docs.basePdf.name);
        var hasPhotos4 = photosCount === 4;
        var hasAgreement = !!(agreement && agreement.uploaded && agreement.fileName);

        var missingItemsRu = [];
        if (!hasWord) missingItemsRu.push('Word');
        if (!hasPdf) missingItemsRu.push('PDF');
        if (!hasPhotos4) missingItemsRu.push('Фото (4)');
        if (!hasAgreement) missingItemsRu.push('Подписанный договор');

        var isBasePackageComplete = hasWord && hasPdf && hasPhotos4;
        return {
            hasWord: hasWord,
            hasPdf: hasPdf,
            hasPhotos4: hasPhotos4,
            photosCount: photosCount,
            hasAgreement: hasAgreement,
            isBasePackageComplete: isBasePackageComplete,
            isFullPackageComplete: isBasePackageComplete && hasAgreement,
            missingItemsRu: missingItemsRu
        };
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
        isPostponedUnlockReady,
        ensureDocumentBundle,
        registerBaseDocuments,
        registerWordVersion,
        getCurrentWordVersionInfo,
        ensureGrantAgreement,
        registerGrantAgreement,
        ensureGrantContractDraft,
        registerGrantContractDraft,
        getApplicationDocumentCompleteness,
        downloadGrantAgreementFile,
        downloadBusinessPlanFile,
        downloadBusinessPlanPdfFile,
        downloadBusinessPlanPhotoPack
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
    window.ensureDocumentBundle = ensureDocumentBundle;
    window.registerBaseDocuments = registerBaseDocuments;
    window.registerWordVersion = registerWordVersion;
    window.getCurrentWordVersionInfo = getCurrentWordVersionInfo;
    window.ensureGrantAgreement = ensureGrantAgreement;
    window.registerGrantAgreement = registerGrantAgreement;
    window.ensureGrantContractDraft = ensureGrantContractDraft;
    window.registerGrantContractDraft = registerGrantContractDraft;
    window.getApplicationDocumentCompleteness = getApplicationDocumentCompleteness;
    window.downloadGrantAgreementFile = downloadGrantAgreementFile;
    window.downloadBusinessPlanFile = downloadBusinessPlanFile;
    window.downloadBusinessPlanPdfFile = downloadBusinessPlanPdfFile;
    window.downloadBusinessPlanPhotoPack = downloadBusinessPlanPhotoPack;
})();
