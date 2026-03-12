(function initFacilitatorFeature() {
    window.AppFeatures = window.AppFeatures || {};
    if (window.AppFeatures.facilitator) return;

    function fillFacilitatorForm(id) {
        const data = (window.mockDatabase || {})[id];
        if (!data) return;
        document.getElementById('id-input').value = id;
        document.getElementById('display-id').textContent = id;
        document.getElementById('full-name').value = data['full-name'];
        document.getElementById('display-fullname').textContent = data['full-name'];
        document.getElementById('inn').value = data.inn;
        document.getElementById('display-inn').textContent = data.inn;
        document.getElementById('display-birthdate').textContent = data['birth-date'] || '—';
        document.getElementById('display-gender').textContent = data.gender || '—';
        document.getElementById('display-contacts').textContent = data.contacts || '—';
        document.getElementById('display-address').textContent = data.address || '—';
        document.getElementById('display-category').textContent = data.category || '—';
        document.getElementById('display-education').textContent = data.education || '—';
        document.getElementById('course').value = '';
        document.getElementById('display-course').textContent = data.course || '—';
    }

    function saveToDraft() {
        const id = document.getElementById('id-input').value;
        if (!id) return;
        const sectorSelect = document.getElementById('sector-input');
        const sectorText = sectorSelect.options[sectorSelect.selectedIndex].text;
        const amount = document.getElementById('amount-input').value;
        const timestamp = window.getCurrentDateTime();
        const sanitize = window.sanitizeText || function (v) { return String(v == null ? '' : v); };
        let app = window.getApp(id);
        if (!app) {
            app = { id: id, name: sanitize(document.getElementById('full-name').value), auditLog: [] };
            window.state.applications.push(app);
        }
        app.sector = sectorText || 'Номаълум';
        app.amount = sanitize(amount || '0');
        app.date = timestamp;
        app.status = 'draft';
        window.addLog(app, 'Фасилитатор', 'Сиёҳнавис захира шуд', 'Сохранен черновик', 'slate', 'edit-3');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
        document.getElementById('toggleFormBtn').click();
    }

    function submitToGmc() {
        const id = document.getElementById('id-input').value;
        if (!id) return;
        const sectorSelect = document.getElementById('sector-input');
        const sectorText = sectorSelect.options[sectorSelect.selectedIndex].text;
        const amount = document.getElementById('amount-input').value;
        if (!sectorText || !amount) {
            alert('Бахш ва маблағро пур кунед!');
            return;
        }

        const timestamp = window.getCurrentDateTime();
        const sanitize = window.sanitizeText || function (v) { return String(v == null ? '' : v); };
        let app = window.getApp(id);
        if (!app) {
            app = { id: id, name: sanitize(document.getElementById('full-name').value), auditLog: [] };
            window.state.applications.push(app);
        }
        app.sector = sectorText;
        app.amount = sanitize(amount);
        app.date = timestamp;
        app.status = 'gmc_review';
        window.addLog(app, 'Фасилитатор', 'Ба ШИГ фиристода шуд', 'Отправлено в КУГ', 'blue', 'send');
        window.renderAllCards();
        document.getElementById('applicationModal').classList.add('hidden');
        document.getElementById('toggleFormBtn').click();
    }

    function openDraftFor(id) {
        window.currentOpenedAppId = id;
        window.setAvailableTabs(['pane-facilitator', 'pane-approved']);
        document.getElementById('applicationModal').classList.remove('hidden');
        document.querySelector('.tab-btn[data-target="pane-facilitator"]').click();
    }

    function openRevFor(id) {
        openDraftFor(id);
    }

    function initializeFacilitatorSearch() {
        const toggleBtn = document.getElementById('toggleFormBtn');
        const formBlock = document.getElementById('createFormBlock');
        const clearSelectionBtn = document.getElementById('clearSelection');
        const searchInput = document.getElementById('beneficiarySearch');
        const searchDropdownList = document.getElementById('searchDropdownList');
        const selectedBeneficiary = document.getElementById('selectedBeneficiary');
        const submitApplicationBtn = document.getElementById('submitApplicationBtn');
        if (!toggleBtn || !formBlock || !clearSelectionBtn || !searchInput || !searchDropdownList || !selectedBeneficiary || !submitApplicationBtn) return;

        let isFormVisible = false;
        let selectedMockId = null;

        function populateDropdown(query) {
            const q = query || '';
            const esc = window.sanitizeText || function (v) { return String(v == null ? '' : v); };
            searchDropdownList.innerHTML = '';
            Object.entries(window.mockDatabase || {}).forEach(function (entry) {
                const id = entry[0];
                const user = entry[1];
                if (q && !user['full-name'].toLowerCase().includes(q.toLowerCase()) && !id.includes(q)) return;
                const initials = user['full-name'].substring(0, 2).toUpperCase();
                const badgeColor = user.certStatus === 'certified' ? 'bg-emerald-100 text-emerald-600' : (user.certStatus === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600');
                const item = document.createElement('div');
                item.className = 'p-3 hover:bg-slate-50 cursor-pointer flex justify-between border-b border-slate-100 last:border-0 transition-colors';
                item.innerHTML = '<div class="flex gap-3"><div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">' + esc(initials) + '</div><div class="flex flex-col"><span class="text-[13px] font-medium">' + esc(user['full-name']) + '</span><span class="text-[11px] text-gray-500">ID: ' + esc(id) + '</span></div></div><span class="' + badgeColor + ' px-2 py-1 rounded text-[10px] font-bold h-max">' + esc(user.certStatus) + '</span>';
                item.addEventListener('click', function () {
                    selectedMockId = id;
                    document.getElementById('searchDropdown').classList.add('hidden');
                    searchInput.classList.add('hidden');
                    selectedBeneficiary.classList.remove('hidden');
                    selectedBeneficiary.classList.add('flex');
                    selectedBeneficiary.querySelector('.selected-name').textContent = user['full-name'];
                    selectedBeneficiary.querySelector('.avatar-initials').textContent = initials;
                    const selectedBadgeColor = user.certStatus === 'certified' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600';
                    selectedBeneficiary.querySelector('.selected-badge').className = selectedBadgeColor + ' px-1.5 py-0.5 rounded text-[10px] font-semibold w-max leading-none selected-badge';
                    selectedBeneficiary.querySelector('.selected-badge').textContent = user.certStatus;
                    if (user.certStatus === 'certified') {
                        submitApplicationBtn.classList.remove('bg-[#A499F5]', 'pointer-events-none');
                        submitApplicationBtn.classList.add('bg-primary', 'cursor-pointer');
                    } else {
                        submitApplicationBtn.classList.add('bg-[#A499F5]', 'pointer-events-none');
                        submitApplicationBtn.classList.remove('bg-primary', 'cursor-pointer');
                    }
                });
                searchDropdownList.appendChild(item);
            });
        }

        toggleBtn.addEventListener('click', function () {
            isFormVisible = !isFormVisible;
            if (isFormVisible) {
                formBlock.classList.remove('hidden');
                document.getElementById('btnIcon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                document.getElementById('btnText').innerHTML = 'Бекор кардан <span class="ru">/ Отмена</span>';
            } else {
                formBlock.classList.add('hidden');
                document.getElementById('btnIcon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
                document.getElementById('btnText').innerHTML = 'Дархости нав <span class="ru">/ Новая заявка</span>';
                clearSelectionBtn.click();
            }
        });

        const cancelFormBtn = document.getElementById('cancelFormBtn');
        if (cancelFormBtn) {
            cancelFormBtn.addEventListener('click', function () {
                if (isFormVisible) toggleBtn.click();
            });
        }

        searchInput.addEventListener('focus', function () {
            populateDropdown(searchInput.value);
            document.getElementById('searchDropdown').classList.remove('hidden');
        });
        searchInput.addEventListener('input', function (e) {
            populateDropdown(e.target.value);
            document.getElementById('searchDropdown').classList.remove('hidden');
        });

        clearSelectionBtn.addEventListener('click', function () {
            selectedMockId = null;
            selectedBeneficiary.classList.add('hidden');
            selectedBeneficiary.classList.remove('flex');
            searchInput.classList.remove('hidden');
            searchInput.value = '';
            submitApplicationBtn.className = 'bg-[#A499F5] text-white px-5 py-2.5 rounded-lg text-[13px] font-medium transition-colors pointer-events-none shadow-sm';
        });

        submitApplicationBtn.addEventListener('click', function () {
            window.setAvailableTabs(['pane-facilitator']);
            document.getElementById('applicationModal').classList.remove('hidden');
            document.querySelector('.tab-btn[data-target="pane-facilitator"]').click();
            document.getElementById('facilitator-revision-block').classList.add('hidden');
            document.getElementById('amount-input').value = '';
            document.getElementById('sector-input').selectedIndex = 0;
            document.getElementById('experience').value = '';
            fillFacilitatorForm(selectedMockId);
            if (window.lucide) window.lucide.createIcons();
        });
    }

    initializeFacilitatorSearch();

    window.AppFeatures.facilitator = {
        ready: true,
        fillFacilitatorForm,
        saveToDraft,
        submitToGmc,
        openDraftFor,
        openRevFor,
        initializeFacilitatorSearch
    };

    // Legacy compatibility while migrating code out of grant.html
    window.fillFacilitatorForm = fillFacilitatorForm;
    window.saveToDraft = saveToDraft;
    window.submitToGmc = submitToGmc;
    window.openDraftFor = openDraftFor;
    window.openRevFor = openRevFor;
})();
