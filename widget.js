/**
 * SSC GD Constable Result Checker - Core Logic
 */

(function () {
    // Category Code Mapping
    const CATEGORY_MAP = {
        '0': 'EWS',
        '1': 'SC',
        '2': 'ST',
        '3': 'ESM (Ex-Servicemen)',
        '4': 'OBC (PWD)',
        '5': 'SC (PWD)',
        '6': 'OBC',
        '7': 'ST (PWD)',
        '9': 'UR (General)'
    };

    // Shard cache in memory
    const shardCache = new Map();
    let knownPrefixes = null;

    // DOM Elements
    const formSection = document.getElementById('formSection');
    const resultForm = document.getElementById('resultForm');
    const userNameInput = document.getElementById('userName');
    const userMobileInput = document.getElementById('userMobile');
    const rollNumberInput = document.getElementById('rollNumber');
    const checkBtn = document.getElementById('checkBtn');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');

    const nameError = document.getElementById('nameError');
    const mobileError = document.getElementById('mobileError');
    const rollError = document.getElementById('rollError');

    const qualifiedCard = document.getElementById('qualifiedCard');
    const notQualifiedCard = document.getElementById('notQualifiedCard');

    const resOfficialName = document.getElementById('resOfficialName');
    const resRollNumber = document.getElementById('resRollNumber');
    const resCategory = document.getElementById('resCategory');
    const resList = document.getElementById('resList');

    const notRollNumber = document.getElementById('notRollNumber');
    const notEnteredName = document.getElementById('notEnteredName');
    const notResRoll = document.getElementById('notResRoll');

    const toastMessage = document.getElementById('toastMessage');

    // Auto-load prefixes on initialization
    async function loadPrefixes() {
        if (knownPrefixes) return knownPrefixes;
        try {
            const res = await fetch((CONFIG.DATA_PATH || './data/') + 'prefixes.json');
            if (res.ok) {
                knownPrefixes = await res.json();
            }
        } catch (e) {
            console.warn("Could not load prefix list pre-check, will fetch on demand.");
        }
        return knownPrefixes;
    }
    loadPrefixes();

    // Input sanitization and formatting
    userMobileInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 10);
        if (this.value.length === 10) {
            mobileError.style.display = 'none';
        }
    });

    rollNumberInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 14);
        if (this.value.length >= 10) {
            rollError.style.display = 'none';
        }
    });

    userNameInput.addEventListener('input', function () {
        if (this.value.trim().length >= 2) {
            nameError.style.display = 'none';
        }
    });

    // Form submission
    resultForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = userNameInput.value.trim();
        const mobile = userMobileInput.value.trim();
        const roll = rollNumberInput.value.trim();

        let valid = true;

        if (name.length < 2) {
            nameError.style.display = 'block';
            valid = false;
        } else {
            nameError.style.display = 'none';
        }

        if (!/^\d{10}$/.test(mobile)) {
            mobileError.style.display = 'block';
            valid = false;
        } else {
            mobileError.style.display = 'none';
        }

        if (!/^\d{9,14}$/.test(roll)) {
            rollError.style.display = 'block';
            valid = false;
        } else {
            rollError.style.display = 'none';
        }

        if (!valid) return;

        // Set Loading State
        setLoading(true);

        try {
            const matchResult = await lookupRollNumber(roll);
            const isQualified = matchResult.qualified;

            // Submit data to Google Apps Script
            logToGoogleSheet({
                name: name,
                mobile: mobile,
                rollNumber: roll,
                resultStatus: isQualified ? 'QUALIFIED' : 'NOT QUALIFIED',
                officialName: matchResult.name || '',
                category: matchResult.categoryName || matchResult.cat || '',
                gender: matchResult.listName || ''
            });

            // Display Results
            formSection.style.display = 'none';

            if (isQualified) {
                resOfficialName.textContent = matchResult.name || name;
                resRollNumber.textContent = roll;
                resCategory.textContent = matchResult.categoryName || 'UR (General)';
                resList.textContent = matchResult.listName || (matchResult.g === 'F' ? 'List-1 (Female)' : 'List-2 (Male)');

                qualifiedCard.style.display = 'block';
                notQualifiedCard.style.display = 'none';
            } else {
                notRollNumber.textContent = roll;
                notEnteredName.textContent = name;
                notResRoll.textContent = roll;

                notQualifiedCard.style.display = 'block';
                qualifiedCard.style.display = 'none';
            }
        } catch (err) {
            console.error("Error during verification:", err);
            showToast("Verification failed. Please check your internet connection.");
        } finally {
            setLoading(false);
        }
    });

    // Lookup Roll Number in Sharded JSON files
    async function lookupRollNumber(roll) {
        const prefix = roll.slice(0, 4);

        // Check if prefix is valid
        const prefixes = await loadPrefixes();
        if (prefixes && !prefixes.includes(prefix)) {
            return { qualified: false };
        }

        let shardData = shardCache.get(prefix);

        if (!shardData) {
            try {
                const res = await fetch((CONFIG.DATA_PATH || './data/') + prefix + '.json');
                if (res.ok) {
                    shardData = await res.json();
                    shardCache.set(prefix, shardData);
                } else {
                    return { qualified: false };
                }
            } catch (err) {
                console.warn(`Could not fetch shard ${prefix}.json`, err);
                return { qualified: false };
            }
        }

        if (shardData && shardData[roll]) {
            const [candName, catCode, gender] = shardData[roll];
            const catName = CATEGORY_MAP[catCode] || `Category ${catCode}`;
            const listName = gender === 'F' ? 'List-1 (Female Candidates)' : 'List-2 (Male Candidates)';
            return {
                qualified: true,
                name: candName,
                cat: catCode,
                categoryName: catName,
                g: gender,
                listName: listName
            };
        }

        return { qualified: false };
    }

    // Send data to Google Apps Script Web App
    function logToGoogleSheet(payload) {
        let endpoint = CONFIG.WEB_APP_URL;

        if (!endpoint && CONFIG.DEPLOYMENT_ID) {
            endpoint = `https://script.google.com/macros/s/${CONFIG.DEPLOYMENT_ID}/exec`;
        }

        if (!endpoint) {
            console.log("ℹ️ Google Apps Script endpoint not configured yet in config.js. Payload ready:", payload);
            return;
        }

        // Send via POST with no-cors to bypass browser CORS preflight restrictions
        try {
            fetch(endpoint, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(payload)
            }).then(() => {
                console.log("✓ Result entry logged to Google Sheets");
            }).catch(err => {
                console.warn("Could not log to Google Sheets via POST, attempting GET fallback...", err);
                // Fallback: send as GET query parameter
                const getParams = new URLSearchParams(payload).toString();
                new Image().src = `${endpoint}?${getParams}`;
            });
        } catch (e) {
            console.error("Failed to trigger sheet sync:", e);
        }
    }

    // Reset Form for "Check Another" button
    document.querySelectorAll('.check-again-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            qualifiedCard.style.display = 'none';
            notQualifiedCard.style.display = 'none';
            formSection.style.display = 'block';

            rollNumberInput.value = '';
            rollNumberInput.focus();
        });
    });

    // Helper: Button Loading State
    function setLoading(isLoading) {
        if (isLoading) {
            checkBtn.disabled = true;
            btnSpinner.style.display = 'inline-block';
            btnText.textContent = 'Verifying...';
        } else {
            checkBtn.disabled = false;
            btnSpinner.style.display = 'none';
            btnText.textContent = 'Check Result';
        }
    }

    // Helper: Toast Message
    function showToast(msg) {
        toastMessage.textContent = msg;
        toastMessage.classList.add('show');
        setTimeout(() => {
            toastMessage.classList.remove('show');
        }, 3200);
    }
})();
