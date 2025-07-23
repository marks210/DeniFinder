document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let selectedMethod = null;
    let username = '';

    const steps = document.querySelectorAll('.payment-step');
    const methodOptions = document.querySelectorAll('.method-option');
    const nextBtnStep1 = document.getElementById('nextBtnStep1');
    const nextBtnStep2 = document.getElementById('nextBtnStep2');
    const backBtnStep2 = document.getElementById('backBtnStep2');
    const usernameInput = document.getElementById('usernameInput');
    const methodDetailsContainer = document.getElementById('method-details-container');
    const finalReferenceEl = document.getElementById('final-reference');
    const verificationResultEl = document.querySelector('.verification-result');

    const paymentData = {
        airtel: {
            name: 'Airtel Money',
            instructions: `
                <p>1. Dial *150*60#</p>
                <p>2. Select 'Pay Bill'</p>
                <p>3. Enter Business Number: <strong>58689</strong> <button class="copy-btn" data-copy="58689">Copy</button></p>
                <p>4. Enter Reference Number: <strong>Your Username</strong></p>
                <p>5. Enter Amount: <strong>KSh 2,000</strong></p>
                <p>6. Enter your PIN to confirm.</p>
            `,
        },
        tnm: {
            name: 'TNM Mpamba',
            instructions: `
                <p>1. Dial *444#</p>
                <p>2. Select 'Payments'</p>
                <p>3. Select 'Pay Bill'</p>
                <p>4. Enter Biller Code: <strong>059059</strong> <button class="copy-btn" data-copy="059059">Copy</button></p>
                <p>5. Enter Reference: <strong>Your Username</strong></p>
                <p>6. Enter Amount: <strong>KSh 2,000</strong></p>
                <p>7. Enter your PIN to confirm.</p>
            `,
        },
        bank: {
            name: 'Bank Transfer',
            instructions: `
                <p>Use your bank's app or visit a branch to transfer funds.</p>
                <p><strong>Bank Name:</strong> National Bank</p>
                <p><strong>Account Name:</strong> DeniFinder Ltd</p>
                <p><strong>Account Number:</strong> <strong>1002345678</strong> <button class="copy-btn" data-copy="1002345678">Copy</button></p>
                <p><strong>Branch Code:</strong> 12345</p>
                <p><strong>Reference:</strong> <strong>Your Username</strong></p>
            `,
        }
    };

    const showStep = (stepNumber) => {
        steps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === stepNumber);
        });
        currentStep = stepNumber;
    };

    const generatePaymentDetails = () => {
        const details = paymentData[selectedMethod];
        methodDetailsContainer.innerHTML = `
            <h4>Instructions for ${details.name}</h4>
            <div class="instructions-box">${details.instructions}</div>
        `;
        methodDetailsContainer.style.display = 'block';
    };

    methodOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectedMethod = option.dataset.method;
            methodOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            generatePaymentDetails();
            nextBtnStep1.disabled = false;
        });
    });

    nextBtnStep1.addEventListener('click', () => {
        if (selectedMethod) {
            showStep(2);
        }
    });

    backBtnStep2.addEventListener('click', () => showStep(1));

    usernameInput.addEventListener('input', (e) => {
        username = e.target.value.trim();
        nextBtnStep2.disabled = username.length < 3;
    });

    nextBtnStep2.addEventListener('click', () => {
        if (username) {
            showStep(3);
            startVerification();
        }
    });

    const startVerification = () => {
        const reference = `DF-${username.toUpperCase()}-${Date.now().toString().slice(-6)}`;
        finalReferenceEl.textContent = reference;

        setTimeout(() => {
            document.querySelector('.verification-status i').classList.remove('fa-spinner', 'fa-spin');
            document.querySelector('.verification-status i').classList.add('fa-check-circle', 'success');
            document.querySelector('.verification-status h4').textContent = 'Payment Verified!';
            verificationResultEl.innerHTML = `
                <p class="success-message">Your payment has been confirmed. Your admin access is now active.</p>
                <button id="dashboardRedirectBtn" class="btn-primary">Go to Dashboard</button>
            `;
            document.getElementById('dashboardRedirectBtn').addEventListener('click', () => {
                window.location.href = 'dashboard.html?payment=success';
            });
        }, 3000);
    };

    document.body.addEventListener('click', e => {
        if (e.target.matches('.copy-btn')) {
            navigator.clipboard.writeText(e.target.dataset.copy).then(() => {
                e.target.textContent = 'Copied!';
                setTimeout(() => { e.target.textContent = 'Copy'; }, 2000);
            });
        }
    });

    showStep(1);
});