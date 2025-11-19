// Encryption/Decryption Utilities
class EncryptionService {
    constructor(key) {
        this.key = key;
    }

    // Simple encryption using XOR cipher (for demonstration - in production use stronger encryption)
    encrypt(text) {
        if (!text) return '';
        const textStr = JSON.stringify(text);
        let result = '';
        for (let i = 0; i < textStr.length; i++) {
            result += String.fromCharCode(textStr.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
        }
        return btoa(result);
    }

    decrypt(encryptedText) {
        if (!encryptedText) return null;
        try {
            const text = atob(encryptedText);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
            }
            return JSON.parse(result);
        } catch (e) {
            console.error('Decryption error:', e);
            return null;
        }
    }
}

// Finance Tracker Application
class FinanceTracker {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentMonth = new Date();
        this.editingId = null;
        this.encryptionService = new EncryptionService('ByMoralesa');
        this.hideAmounts = false;
        this.theme = localStorage.getItem('financeTrackerTheme') || 'dark';
        this.reminderDaysThreshold = parseInt(localStorage.getItem('reminderDaysThreshold')) || 7;
        this.currentPageNumber = {};
        this.itemsPerPage = 10;
        this.googleScriptKey = localStorage.getItem('googleScriptKey') || null;
        this.password = 'admin'; // Default password
        this.isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
        
        // Initialize data structures
        this.data = {
            transactions: [],
            investments: [],
            cards: [],
            debts: [],
            subscriptions: [],
            reminders: [],
            categories: {
                income: [
                    { id: 'salary', name: 'Salary', color: '#22c55e' },
                    { id: 'freelance', name: 'Freelance', color: '#3b82f6' },
                    { id: 'investment-returns', name: 'Investment Returns', color: '#8b5cf6' },
                    { id: 'other-income', name: 'Other Income', color: '#f59e0b' }
                ],
                expense: [
                    { id: 'food', name: 'Food & Dining', color: '#ef4444' },
                    { id: 'transportation', name: 'Transportation', color: '#06b6d4' },
                    { id: 'entertainment', name: 'Entertainment', color: '#ec4899' },
                    { id: 'utilities', name: 'Utilities', color: '#84cc16' },
                    { id: 'shopping', name: 'Shopping', color: '#f97316' },
                    { id: 'healthcare', name: 'Healthcare', color: '#6366f1' },
                    { id: 'education', name: 'Education', color: '#8b5cf6' },
                    { id: 'other-expense', name: 'Other Expenses', color: '#6b7280' }
                ],
                investment: [
                    { id: 'stocks', name: 'Stocks', color: '#22c55e' },
                    { id: 'bonds', name: 'Bonds', color: '#3b82f6' },
                    { id: 'crypto', name: 'Cryptocurrency', color: '#f59e0b' },
                    { id: 'real-estate', name: 'Real Estate', color: '#8b5cf6' },
                    { id: 'mutual-funds', name: 'Mutual Funds', color: '#06b6d4' },
                    { id: 'other', name: 'Other', color: '#6b7280' }
                ]
            }
        };
        
        this.init();
    }

    async init() {
        // Check authentication first
        if (!this.isAuthenticated) {
            this.showLoginPage();
            return;
        }
        
        this.showApp();
        await this.loadData();
        this.setupEventListeners();
        this.applyTheme();
        this.renderDashboard();
        this.renderCategories();
        this.updateMonthDisplay();
        this.setupCardTypeToggle();
        this.loadSettings();
    }

    showLoginPage() {
        const loginPage = document.getElementById('loginPage');
        const appContainer = document.getElementById('appContainer');
        if (loginPage) loginPage.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        
        // Setup login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    showApp() {
        const loginPage = document.getElementById('loginPage');
        const appContainer = document.getElementById('appContainer');
        if (loginPage) loginPage.style.display = 'none';
        if (appContainer) {
            appContainer.style.display = 'flex';
        }
    }

    handleLogin() {
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('loginError');
        
        if (passwordInput && passwordInput.value === this.password) {
            this.isAuthenticated = true;
            sessionStorage.setItem('isAuthenticated', 'true');
            this.showApp();
            // Initialize app after login
            this.loadData().then(() => {
                this.setupEventListeners();
                this.applyTheme();
                this.renderDashboard();
                this.renderCategories();
                this.updateMonthDisplay();
                this.setupCardTypeToggle();
                this.loadSettings();
            });
        } else {
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }

    loadSettings() {
        // Load API key into settings page
        const apiKeyInput = document.getElementById('googleScriptKey');
        if (apiKeyInput && this.googleScriptKey) {
            apiKeyInput.value = this.googleScriptKey;
        }
    }

    // Data Management with Encryption
    async loadData() {
        if (this.googleScriptKey) {
            // Load from Google Apps Script
            try {
                const response = await fetch(`https://script.google.com/macros/s/${this.googleScriptKey}/exec?action=read`);
                const result = await response.text();
                if (result != '') {
                    try {
                        // Try to decrypt first
                        const decrypted = this.encryptionService.decrypt(result);
                        if (decrypted) {
                            this.data = { ...this.data, ...decrypted };
                        } else {
                            // Fallback: try parsing as plain JSON
                            try {
                                const parsed = JSON.parse(result.data);
                                this.data = { ...this.data, ...parsed };
                                await this.saveData(); // Re-save encrypted
                            } catch (e) {
                                console.error('Failed to parse data:', e);
                            }
                        }
                    } catch (e) {
                        console.error('Failed to decrypt data:', e);
                    }
                }
            } catch (e) {
                console.error('Failed to load data from Google Apps Script:', e);
                // Fallback to localStorage
                this.loadDataFromLocalStorage();
            }
        } else {
            // Load from localStorage
            this.loadDataFromLocalStorage();
        }
        
        // Initialize missing arrays
        if (!this.data.subscriptions) this.data.subscriptions = [];
        if (!this.data.reminders) this.data.reminders = [];
        
        // Save to ensure data structure is correct (only if we have data)
        if (this.data.transactions.length > 0 || this.data.investments.length > 0 || this.data.cards.length > 0) {
            await this.saveData();
        }
    }

    loadDataFromLocalStorage() {
        const savedData = localStorage.getItem('financeTrackerData');
        if (savedData) {
            try {
                // Try to decrypt first
                const decrypted = this.encryptionService.decrypt(savedData);
                if (decrypted) {
                    this.data = { ...this.data, ...decrypted };
                } else {
                    // Fallback: try parsing as plain JSON (for migration)
                    try {
                        const parsed = JSON.parse(savedData);
                        this.data = { ...this.data, ...parsed };
                        // Note: saveData will be called by loadData after this
                    } catch (e) {
                        console.error('Failed to load data:', e);
                    }
                }
            } catch (e) {
                console.error('Failed to decrypt data:', e);
            }
        }
    }

    async saveData() {
        const encrypted = this.encryptionService.encrypt(this.data);
    
        if (this.googleScriptKey) {
            try {
                const url = `https://script.google.com/macros/s/${this.googleScriptKey}/exec?action=save`;
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain" // simple, sin JSON
                    },
                    body: encrypted
                });
    
                const result = await response.text();
    
                if (result !== "ok") {
                    console.error("Failed to save:", result);
                    localStorage.setItem("financeTrackerData", encrypted);
                }
            } catch (e) {
                console.error("Error saving to Google Apps Script:", e);
                localStorage.setItem("financeTrackerData", encrypted);
            }
        } else {
            localStorage.setItem("financeTrackerData", encrypted);
        }
    }
    
    

    // Date utility to fix timezone issues
    formatDateString(dateString) {
        if (!dateString) return '';
        // Parse date string directly without timezone conversion
        const parts = dateString.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            return new Date(year, month, day).toLocaleDateString();
        }
        return new Date(dateString).toLocaleDateString();
    }

    // Format currency with hide amounts option
    formatCurrency(amount) {
        if (this.hideAmounts) {
            // Replace all digits with asterisks
            const formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
            return formatted.replace(/\d/g, '*');
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Format number with hide amounts option
    formatNumber(number) {
        if (this.hideAmounts) {
            return number.toString().replace(/\d/g, '*');
        }
        return number.toString();
    }

    // Theme Management
    applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.innerHTML = this.theme === 'dark' 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('financeTrackerTheme', this.theme);
        this.applyTheme();
    }

    toggleHideAmounts() {
        this.hideAmounts = !this.hideAmounts;
        const btn = document.getElementById('hideAmountsBtn');
        if (btn) {
            btn.innerHTML = this.hideAmounts 
                ? '<i class="fas fa-eye"></i> Show Amounts' 
                : '<i class="fas fa-eye-slash"></i> Hide Amounts';
            btn.classList.toggle('active', this.hideAmounts);
        }
        // Re-render all pages to update amounts
        this.renderDashboard();
        if (this.currentPage === 'transactions') this.renderTransactions();
        if (this.currentPage === 'investments') this.renderInvestments();
        if (this.currentPage === 'debts') this.renderDebts();
        if (this.currentPage === 'subscriptions') this.renderSubscriptions();
    }

    // Pagination helper
    paginateArray(array, page, itemsPerPage) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return {
            data: array.slice(start, end),
            totalPages: Math.ceil(array.length / itemsPerPage),
            currentPage: page,
            totalItems: array.length
        };
    }

    renderPagination(containerId, currentPage, totalPages, callback) {
        const container = document.getElementById(containerId);
        if (!container || totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        paginationHTML += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${callback}(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Previous
        </button>`;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="${callback}(${i})">${i}</button>`;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Next button
        paginationHTML += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${callback}(${currentPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>`;

        paginationHTML += '</div>';
        container.innerHTML = paginationHTML;
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Month navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            this.updateMonthDisplay();
            this.renderDashboard();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
            this.updateMonthDisplay();
            this.renderDashboard();
        });

        // Add buttons
        document.getElementById('addTransactionBtn').addEventListener('click', () => {
            this.openTransactionModal();
        });

        document.getElementById('addInvestmentBtn').addEventListener('click', () => {
            this.openInvestmentModal();
        });

        document.getElementById('addCardBtn').addEventListener('click', () => {
            this.openCardModal();
        });

        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.openCategoryModal();
        });

        document.getElementById('addDebtBtn').addEventListener('click', () => {
            this.openDebtModal();
        });

        const addSubscriptionBtn = document.getElementById('addSubscriptionBtn');
        if (addSubscriptionBtn) {
            addSubscriptionBtn.addEventListener('click', () => {
                this.openSubscriptionModal();
            });
        }

        const addReminderBtn = document.getElementById('addReminderBtn');
        if (addReminderBtn) {
            addReminderBtn.addEventListener('click', () => {
                this.openReminderModal();
            });
        }

        // Modal close events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Form submissions
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        document.getElementById('investmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInvestment();
        });

        document.getElementById('cardForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCard();
        });

        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });

        document.getElementById('debtForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDebt();
        });

        const subscriptionForm = document.getElementById('subscriptionForm');
        if (subscriptionForm) {
            subscriptionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSubscription();
            });
        }

        const reminderForm = document.getElementById('reminderForm');
        if (reminderForm) {
            reminderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveReminder();
            });
        }

        // Cancel buttons
        document.getElementById('cancelTransaction').addEventListener('click', () => {
            this.closeModal(document.getElementById('transactionModal'));
        });

        document.getElementById('cancelInvestment').addEventListener('click', () => {
            this.closeModal(document.getElementById('investmentModal'));
        });

        document.getElementById('cancelCard').addEventListener('click', () => {
            this.closeModal(document.getElementById('cardModal'));
        });

        document.getElementById('cancelCategory').addEventListener('click', () => {
            this.closeModal(document.getElementById('categoryModal'));
        });

        document.getElementById('cancelDebt').addEventListener('click', () => {
            this.closeModal(document.getElementById('debtModal'));
        });

        const cancelSubscription = document.getElementById('cancelSubscription');
        if (cancelSubscription) {
            cancelSubscription.addEventListener('click', () => {
                this.closeModal(document.getElementById('subscriptionModal'));
            });
        }

        const cancelReminder = document.getElementById('cancelReminder');
        if (cancelReminder) {
            cancelReminder.addEventListener('click', () => {
                this.closeModal(document.getElementById('reminderModal'));
            });
        }

        // Settings page events
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
        });

        // Save API key button
        const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
        if (saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', () => {
                this.saveApiKey();
            });
        }

        // Filters
        document.getElementById('transactionTypeFilter').addEventListener('change', () => {
            this.renderTransactions();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.renderTransactions();
        });

        document.getElementById('transactionMonthFilter').addEventListener('change', () => {
            this.renderTransactions();
        });

        document.getElementById('transactionYearFilter').addEventListener('change', () => {
            this.renderTransactions();
        });

        // Debt filters
        document.getElementById('debtMonthFilter').addEventListener('change', () => {
            this.renderDebts();
        });

        document.getElementById('debtYearFilter').addEventListener('change', () => {
            this.renderDebts();
        });

        document.getElementById('debtStatusFilter').addEventListener('change', () => {
            this.renderDebts();
        });

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('open');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && e.target !== mobileMenuToggle && !mobileMenuToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });

        // Close sidebar when navigating on mobile
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    document.querySelector('.sidebar').classList.remove('open');
                }
            });
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Hide amounts toggle
        const hideAmountsBtn = document.getElementById('hideAmountsBtn');
        if (hideAmountsBtn) {
            hideAmountsBtn.addEventListener('click', () => this.toggleHideAmounts());
        }

        // Global search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
        }
    }

    setupCardTypeToggle() {
        const cardTypeSelect = document.getElementById('cardType');
        const creditLimitGroup = document.getElementById('creditLimitGroup');
        const debitBalanceGroup = document.getElementById('debitBalanceGroup');
        const dueDateGroup = document.querySelector('#cardDueDate').parentElement;

        if (cardTypeSelect) {
            cardTypeSelect.addEventListener('change', () => {
                if (cardTypeSelect.value === 'credit') {
                    creditLimitGroup.style.display = 'block';
                    debitBalanceGroup.style.display = 'none';
                    dueDateGroup.style.display = 'block';
                    document.getElementById('cardLimit').required = true;
                    document.getElementById('cardBalance').required = false;
                    document.getElementById('cardDueDate').required = true;
                } else {
                    creditLimitGroup.style.display = 'none';
                    debitBalanceGroup.style.display = 'block';
                    dueDateGroup.style.display = 'none';
                    document.getElementById('cardLimit').required = false;
                    document.getElementById('cardBalance').required = true;
                    document.getElementById('cardDueDate').required = false;
                }
            });
        }
    }

    // Navigation
    navigateToPage(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Show page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(page).classList.add('active');

        this.currentPage = page;

        // Render page content
        switch (page) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'transactions':
                this.renderTransactions();
                break;
            case 'investments':
                this.renderInvestments();
                break;
            case 'cards':
                this.renderCards();
                break;
            case 'categories':
                this.renderCategories();
                break;
            case 'debts':
                this.renderDebts();
                break;
            case 'subscriptions':
                this.renderSubscriptions();
                break;
            case 'reminders':
                this.renderReminders();
                break;
            case 'settings':
                // Settings page doesn't need special rendering
                break;
        }
    }

    // Global Search
    handleGlobalSearch(query) {
        if (!query || query.length < 2) {
            // Clear search results if query is too short
            return;
        }
        const results = this.searchAll(query);
        this.displaySearchResults(results);
    }

    searchAll(query) {
        const lowerQuery = query.toLowerCase();
        const results = {
            transactions: this.data.transactions.filter(t => 
                t.description.toLowerCase().includes(lowerQuery) ||
                this.getCategoryName(t.category, t.type).toLowerCase().includes(lowerQuery)
            ),
            debts: this.data.debts.filter(d => 
                d.name.toLowerCase().includes(lowerQuery)
            ),
            subscriptions: this.data.subscriptions.filter(s => 
                s.name.toLowerCase().includes(lowerQuery) ||
                s.category.toLowerCase().includes(lowerQuery)
            ),
            reminders: this.data.reminders.filter(r => 
                r.title.toLowerCase().includes(lowerQuery) ||
                (r.description && r.description.toLowerCase().includes(lowerQuery))
            )
        };
        return results;
    }

    displaySearchResults(results) {
        // This could be implemented as a modal or dropdown
        // For now, we'll just highlight matching items in current view
        console.log('Search results:', results);
    }

    // Dashboard
    renderDashboard() {
        const monthData = this.getMonthData(this.currentMonth);
        this.updateSummaryCards(monthData);
        this.renderCharts(monthData);
        this.renderCardsOverview();
        this.renderDebtsChart();
        this.renderRecentTransactions();
        this.renderUpcomingReminders();
        this.renderSubscriptionsChart();
    }

    getMonthData(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const monthTransactions = this.data.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
        });

        const income = monthTransactions.filter(t => t.type === 'income');
        const expenses = monthTransactions.filter(t => t.type === 'expense');

        return {
            income: income.reduce((sum, t) => sum + t.amount, 0),
            expenses: expenses.reduce((sum, t) => sum + t.amount, 0),
            transactions: monthTransactions,
            incomeTransactions: income,
            expenseTransactions: expenses
        };
    }

    updateSummaryCards(data) {
        document.getElementById('totalIncome').textContent = this.formatCurrency(data.income);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(data.expenses);
        document.getElementById('netBalance').textContent = this.formatCurrency(data.income - data.expenses);
        
        const totalInvestments = this.data.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
        document.getElementById('totalInvestments').textContent = this.formatCurrency(totalInvestments);
    }

    renderCharts(data) {
        // Always show charts, but amounts will be hidden via formatCurrency
        this.renderIncomeExpenseChart(data);
        this.renderExpenseCategoryChart(data.expenseTransactions);
        this.renderInvestmentAllocationChart();
        this.renderCurrentInvestmentsChart();
        this.renderMonthlyTrendChart();
        this.renderSubscriptionsChart();
    }

    renderIncomeExpenseChart(data) {
        const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.incomeExpenseChart) {
            this.incomeExpenseChart.destroy();
        }

        this.incomeExpenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [data.income, data.expenses],
                    backgroundColor: ['#22c55e', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (this.hideAmounts) {
                                    return context.label + ': ***';
                                }
                                return context.label + ': $' + context.parsed.toLocaleString();
                            }.bind(this)
                        }
                    }
                }
            }
        });
    }

    renderExpenseCategoryChart(expenseTransactions) {
        const ctx = document.getElementById('expenseCategoryChart').getContext('2d');
        
        // Group expenses by category
        const categoryTotals = {};
        expenseTransactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const categories = Object.keys(categoryTotals);
        const amounts = Object.values(categoryTotals);
        const colors = categories.map(cat => {
            const category = this.data.categories.expense.find(c => c.id === cat);
            return category ? category.color : '#6b7280';
        });

        if (this.expenseCategoryChart) {
            this.expenseCategoryChart.destroy();
        }

        this.expenseCategoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories.map(cat => {
                    const category = this.data.categories.expense.find(c => c.id === cat);
                    return category ? category.name : cat;
                }),
                datasets: [{
                    data: amounts,
                    backgroundColor: colors,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (this.hideAmounts) {
                                    return context.label + ': ***';
                                }
                                return context.label + ': $' + context.parsed.y.toLocaleString();
                            }.bind(this)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (this.hideAmounts) {
                                    return '***';
                                }
                                return '$' + value.toLocaleString();
                            }.bind(this)
                        }
                    }
                }
            }
        });
    }

    renderInvestmentAllocationChart() {
        const ctx = document.getElementById('investmentAllocationChart').getContext('2d');
        
        // Group investments by type
        const typeTotals = {};
        this.data.investments.forEach(inv => {
            typeTotals[inv.type] = (typeTotals[inv.type] || 0) + inv.currentValue;
        });

        const types = Object.keys(typeTotals);
        const values = Object.values(typeTotals);
        
        // Get colors from investment types in categories
        const colors = types.map(type => {
            const investmentType = this.data.categories.investment.find(cat => cat.id === type);
            return investmentType ? investmentType.color : '#6b7280';
        });

        if (this.investmentAllocationChart) {
            this.investmentAllocationChart.destroy();
        }

        if (types.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No investments yet', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        this.investmentAllocationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: types.map(type => {
                    const investmentType = this.data.categories.investment.find(cat => cat.id === type);
                    return investmentType ? investmentType.name : type;
                }),
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                if (this.hideAmounts) {
                                    return context.label + ': *** (' + percentage + '%)';
                                }
                                return context.label + ': $' + context.parsed.toLocaleString() + ' (' + percentage + '%)';
                            }.bind(this)
                        }
                    }
                }
            }
        });
    }

    renderCurrentInvestmentsChart() {
        const ctx = document.getElementById('investmentPerformanceChart').getContext('2d');
        
        if (this.data.investments.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No investments yet', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        // Group investments by type and show current values
        const typeTotals = {};
        this.data.investments.forEach(inv => {
            if (!typeTotals[inv.type]) {
                typeTotals[inv.type] = 0;
            }
            typeTotals[inv.type] += inv.currentValue;
        });

        const types = Object.keys(typeTotals);
        const values = Object.values(typeTotals);
        const colors = types.map(type => {
            const investmentType = this.data.categories.investment.find(cat => cat.id === type);
            return investmentType ? investmentType.color : '#6b7280';
        });

        if (this.investmentPerformanceChart) {
            this.investmentPerformanceChart.destroy();
        }

        this.investmentPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: types.map(type => {
                    const investmentType = this.data.categories.investment.find(cat => cat.id === type);
                    return investmentType ? investmentType.name : type;
                }),
                datasets: [{
                    label: 'Current Value',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (this.hideAmounts) {
                                    return 'Current Value: ***';
                                }
                                return 'Current Value: $' + context.parsed.y.toLocaleString();
                            }.bind(this)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (this.hideAmounts) {
                                    return '***';
                                }
                                return '$' + value.toLocaleString();
                            }.bind(this)
                        }
                    }
                }
            }
        });
    }

    renderSubscriptionsChart() {
        const ctx = document.getElementById('subscriptionsChart');
        if (!ctx) return;
        const chartCtx = ctx.getContext('2d');
        
        if (this.data.subscriptions.length === 0) {
            chartCtx.clearRect(0, 0, chartCtx.canvas.width, chartCtx.canvas.height);
            chartCtx.fillStyle = '#94a3b8';
            chartCtx.font = '16px Arial';
            chartCtx.textAlign = 'center';
            chartCtx.fillText('No subscriptions yet', chartCtx.canvas.width / 2, chartCtx.canvas.height / 2);
            return;
        }

        // Group by category
        const categoryTotals = {};
        this.data.subscriptions.forEach(sub => {
            categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + sub.amount;
        });

        const categories = Object.keys(categoryTotals);
        const amounts = Object.values(categoryTotals);
        const colors = categories.map(cat => {
            const category = this.data.categories.expense.find(c => c.id === cat);
            return category ? category.color : '#6b7280';
        });

        if (this.subscriptionsChart) {
            this.subscriptionsChart.destroy();
        }

        this.subscriptionsChart = new Chart(chartCtx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => {
                    const category = this.data.categories.expense.find(c => c.id === cat);
                    return category ? category.name : cat;
                }),
                datasets: [{
                    data: amounts,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                if (this.hideAmounts) {
                                    return context.label + ': *** (' + percentage + '%)';
                                }
                                return context.label + ': $' + context.parsed.toLocaleString() + ' (' + percentage + '%)';
                            }.bind(this)
                        }
                    }
                }
            }
        });
    }

    renderMonthlyTrendChart() {
        const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
        
        // Get last 6 months data
        const months = [];
        const incomeData = [];
        const expenseData = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthData = this.getMonthData(date);
            
            months.push(date.toLocaleDateString('en-US', { month: 'short' }));
            incomeData.push(monthData.income);
            expenseData.push(monthData.expenses);
        }

        if (this.monthlyTrendChart) {
            this.monthlyTrendChart.destroy();
        }

        this.monthlyTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (this.hideAmounts) {
                                    return '***';
                                }
                                return '$' + value.toLocaleString();
                            }.bind(this)
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (this.hideAmounts) {
                                    return context.dataset.label + ': ***';
                                }
                                return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                            }.bind(this)
                        }
                    }
                }
            }
        });
    }

    renderCardsOverview() {
        const container = document.getElementById('cardsOverviewList');
        
        if (this.data.cards.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-credit-card"></i><h3>No cards added</h3><p>Add your first card to track payments</p></div>';
            return;
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const cardsHtml = this.data.cards.map(card => {
            if (!card.dueDate) {
                // Show card even without due date, but without days until due
                const currentBalance = this.getCardBalance(card.id);
                const utilization = card.type === 'credit' && card.limit ? (currentBalance / card.limit) * 100 : 0;
                
                return `
                    <div class="card-overview-item" style="border-left: 4px solid ${card.color}">
                        <div class="card-overview-header">
                            <h4>${card.name}</h4>
                            <span class="card-type-badge-small">${card.type === 'credit' ? 'Credit' : 'Debit'}</span>
                        </div>
                        <div class="card-overview-info">
                            <p><strong>Balance:</strong> ${this.formatCurrency(card.type === 'credit' ? currentBalance : (card.balance || 0))}</p>
                            ${card.type === 'credit' ? `<p><strong>Utilization:</strong> ${utilization.toFixed(1)}%</p>` : ''}
                        </div>
                    </div>
                `;
            }
            
            let daysUntilDue = 0;
            const dueDay = parseInt(card.dueDate);
            
            // Calculate next due date
            let nextDueDate = new Date(currentYear, currentMonth, dueDay);
            if (nextDueDate < now) {
                nextDueDate = new Date(currentYear, currentMonth + 1, dueDay);
            }
            
            daysUntilDue = Math.ceil((nextDueDate - now) / (1000 * 60 * 60 * 24));
            
            const currentBalance = this.getCardBalance(card.id);
            const utilization = card.type === 'credit' && card.limit ? (currentBalance / card.limit) * 100 : 0;
            
            return `
                <div class="card-overview-item" style="border-left: 4px solid ${card.color}">
                    <div class="card-overview-header">
                        <h4>${card.name}</h4>
                        <span class="card-type-badge-small">${card.type === 'credit' ? 'Credit' : 'Debit'}</span>
                    </div>
                    <div class="card-overview-info">
                        <p><strong>Balance:</strong> ${this.formatCurrency(card.type === 'credit' ? currentBalance : (card.balance || 0))}</p>
                        ${card.type === 'credit' ? `<p><strong>Utilization:</strong> ${utilization.toFixed(1)}%</p>` : ''}
                        <p><strong>Days until due:</strong> <span class="${daysUntilDue <= 7 ? 'text-danger' : daysUntilDue <= 14 ? 'text-warning' : 'text-success'}">${daysUntilDue} days</span></p>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = cardsHtml;
    }

    renderDebtsChart() {
        const ctx = document.getElementById('debtsChart').getContext('2d');
        
        if (this.data.debts.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No debts yet', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        const debts = this.data.debts.map(debt => {
            const progress = this.calculateDebtProgress(debt);
            return {
                name: debt.name,
                total: debt.amount,
                paid: (progress.currentInstallments / debt.installments) * debt.amount,
                remaining: debt.amount - ((progress.currentInstallments / debt.installments) * debt.amount)
            };
        });

        if (this.debtsChart) {
            this.debtsChart.destroy();
        }

        this.debtsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: debts.map(d => d.name),
                datasets: [{
                    label: 'Paid',
                    data: debts.map(d => d.paid),
                    backgroundColor: '#22c55e'
                }, {
                    label: 'Remaining',
                    data: debts.map(d => d.remaining),
                    backgroundColor: '#ef4444'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (this.hideAmounts) {
                                    return context.dataset.label + ': ***';
                                }
                                return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                            }.bind(this)
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (this.hideAmounts) {
                                    return '***';
                                }
                                return '$' + value.toLocaleString();
                            }.bind(this)
                        }
                    }
                }
            }
        });
    }

    renderRecentTransactions() {
        const recentTransactions = this.data.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        const container = document.getElementById('recentTransactionsList');
        
        if (recentTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><h3>No transactions yet</h3><p>Add your first transaction to get started</p></div>';
            return;
        }

        container.innerHTML = recentTransactions.map(t => `
            <div class="transaction-item ${t.type}">
                <div>
                    <strong>${t.description}</strong>
                    <div style="font-size: 0.8rem; opacity: 0.7;">${this.getCategoryName(t.category, t.type)} • ${this.formatDateString(t.date)}</div>
                </div>
                <div class="amount ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                </div>
            </div>
        `).join('');
    }

    renderUpcomingReminders() {
        const container = document.getElementById('upcomingRemindersList');
        if (!container) return;

        const now = new Date();
        const thresholdDate = new Date(now);
        thresholdDate.setDate(thresholdDate.getDate() + this.reminderDaysThreshold);

        const upcomingReminders = this.data.reminders
            .filter(r => {
                const status = r.status || 'pending';
                if (status !== 'pending') return false;
                const reminderDate = new Date(r.date);
                return reminderDate >= now && reminderDate <= thresholdDate;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingReminders.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-bell"></i><h3>No upcoming reminders</h3><p>All caught up!</p></div>';
            return;
        }

        container.innerHTML = upcomingReminders.map(r => {
            const reminderDate = new Date(r.date);
            const daysUntil = Math.ceil((reminderDate - now) / (1000 * 60 * 60 * 24));
            return `
                <div class="reminder-item ${daysUntil <= 3 ? 'urgent' : ''}">
                    <div>
                        <strong>${r.title}</strong>
                        ${r.description ? `<div style="font-size: 0.8rem; opacity: 0.7;">${r.description}</div>` : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="reminder-date ${daysUntil <= 3 ? 'text-danger' : daysUntil <= 7 ? 'text-warning' : ''}">
                            ${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </div>
                        <button class="btn-success" onclick="financeTracker.markReminderComplete('${r.id}')" title="Mark as Complete" style="padding: 6px 12px; font-size: 0.8rem;">
                            <i class="fas fa-check"></i> Complete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Transactions
    renderTransactions() {
        // Preserve current filter values
        const currentCategory = document.getElementById('categoryFilter')?.value || 'all';
        const currentMonth = document.getElementById('transactionMonthFilter')?.value || 'all';
        const currentYear = document.getElementById('transactionYearFilter')?.value || 'all';
        
        this.populateCategoryFilter();
        this.populateMonthYearFilters();
        
        // Restore filter values
        if (document.getElementById('categoryFilter')) {
            document.getElementById('categoryFilter').value = currentCategory;
        }
        if (document.getElementById('transactionMonthFilter')) {
            document.getElementById('transactionMonthFilter').value = currentMonth;
        }
        if (document.getElementById('transactionYearFilter')) {
            document.getElementById('transactionYearFilter').value = currentYear;
        }
        
        let filteredTransactions = [...this.data.transactions];
        
        // Apply filters
        const typeFilter = document.getElementById('transactionTypeFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const monthFilter = document.getElementById('transactionMonthFilter').value;
        const yearFilter = document.getElementById('transactionYearFilter').value;
        
        if (typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }
        
        if (categoryFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
        }
        
        if (monthFilter !== 'all') {
            const monthIndex = parseInt(monthFilter);
            filteredTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === monthIndex;
            });
        }
        
        if (yearFilter !== 'all') {
            const year = parseInt(yearFilter);
            filteredTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getFullYear() === year;
            });
        }
        
        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.renderTransactionsByWeek(filteredTransactions);
    }

    renderTransactionsByWeek(transactions) {
        const container = document.getElementById('transactionsByWeek');
        
        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><h3>No transactions found</h3><p>Try adjusting your filters</p></div>';
            return;
        }
        
        // Group transactions by week
        const weeks = {};
        
        transactions.forEach(t => {
            const date = new Date(t.date);
            const weekStart = this.getWeekStart(date);
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    start: weekStart,
                    transactions: []
                };
            }
            weeks[weekKey].transactions.push(t);
        });
        
        // Sort weeks by date (newest first)
        const sortedWeeks = Object.keys(weeks).sort((a, b) => new Date(b) - new Date(a));
        
        container.innerHTML = sortedWeeks.map(weekKey => {
            const week = weeks[weekKey];
            const weekEnd = new Date(week.start);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const weekLabel = `${week.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            
            return `
                <div class="week-section">
                    <h3 class="week-header">${weekLabel}</h3>
                    <table class="transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Credit Card</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${week.transactions.map(t => `
                                <tr>
                                    <td>${this.formatDateString(t.date)}</td>
                                    <td><span class="badge ${t.type}">${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</span></td>
                                    <td>${this.getCategoryName(t.category, t.type)}</td>
                                    <td>${t.description}</td>
                                    <td class="${t.type === 'income' ? 'text-success' : 'text-danger'}">
                                        ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                                    </td>
                                    <td>${t.card ? this.getCardName(t.card) : '-'}</td>
                                    <td>
                                        <button class="btn-edit" onclick="financeTracker.editTransaction('${t.id}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-danger" onclick="financeTracker.deleteTransaction('${t.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');
    }
    
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }

    openTransactionModal(transaction = null) {
        this.editingId = transaction ? transaction.id : null;
        
        document.getElementById('transactionModalTitle').textContent = 
            transaction ? 'Edit Transaction' : 'Add Transaction';
        
        // Populate category options
        this.populateCategoryOptions();
        this.populateCardOptions();
        
        if (transaction) {
            document.getElementById('transactionType').value = transaction.type;
            document.getElementById('transactionCategory').value = transaction.category;
            document.getElementById('transactionDescription').value = transaction.description;
            document.getElementById('transactionAmount').value = transaction.amount;
            document.getElementById('transactionDate').value = transaction.date;
            document.getElementById('transactionCard').value = transaction.card || '';
        } else {
            document.getElementById('transactionForm').reset();
            document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        }
        
        document.getElementById('transactionModal').style.display = 'block';
    }

    saveTransaction() {
        const formData = {
            id: this.editingId || this.generateId(),
            type: document.getElementById('transactionType').value,
            category: document.getElementById('transactionCategory').value,
            description: document.getElementById('transactionDescription').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            date: document.getElementById('transactionDate').value,
            card: document.getElementById('transactionCard').value || null
        };
        
        if (this.editingId) {
            const index = this.data.transactions.findIndex(t => t.id === this.editingId);
            this.data.transactions[index] = formData;
        } else {
            this.data.transactions.push(formData);
        }
        
        this.saveData();
        this.closeModal(document.getElementById('transactionModal'));
        this.renderTransactions();
        this.renderDashboard();
    }

    editTransaction(id) {
        const transaction = this.data.transactions.find(t => t.id === id);
        if (transaction) {
            this.openTransactionModal(transaction);
        }
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.data.transactions = this.data.transactions.filter(t => t.id !== id);
            this.saveData();
            this.renderTransactions();
            this.renderDashboard();
        }
    }

    // Investments
    renderInvestments() {
        const totalValue = this.data.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalInvested = this.data.investments.reduce((sum, inv) => sum + inv.amountInvested, 0);
        const totalGainLoss = totalValue - totalInvested;
        
        document.getElementById('portfolioValue').textContent = this.formatCurrency(totalValue);
        document.getElementById('portfolioGainLoss').textContent = this.formatCurrency(totalGainLoss);
        
        this.renderInvestmentsTable();
    }

    renderInvestmentsTable() {
        const tbody = document.getElementById('investmentsTableBody');
        
        if (this.data.investments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No investments yet</td></tr>';
            return;
        }
        
        // Apply pagination
        const page = this.currentPageNumber['investments'] || 1;
        const paginated = this.paginateArray(this.data.investments, page, this.itemsPerPage);
        
        tbody.innerHTML = paginated.data.map(inv => {
            return `
                <tr>
                    <td><strong>${inv.name}</strong></td>
                    <td><span class="badge">${inv.type.charAt(0).toUpperCase() + inv.type.slice(1)}</span></td>
                    <td>${this.formatCurrency(inv.amountInvested)}</td>
                    <td>${this.formatDateString(inv.date)}</td>
                    <td>
                        <button class="btn-edit" onclick="financeTracker.editInvestment('${inv.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="financeTracker.deleteInvestment('${inv.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Render pagination
        this.renderPagination('investmentsPagination', page, paginated.totalPages, 'financeTracker.goToInvestmentsPage');
    }

    goToInvestmentsPage(page) {
        this.currentPageNumber['investments'] = page;
        this.renderInvestments();
    }

    openInvestmentModal(investment = null) {
        this.editingId = investment ? investment.id : null;
        
        document.getElementById('investmentModalTitle').textContent = 
            investment ? 'Edit Investment' : 'Add Investment';
        
        // Populate investment type options
        this.populateInvestmentTypeOptions();
        
        if (investment) {
            document.getElementById('investmentName').value = investment.name;
            document.getElementById('investmentType').value = investment.type;
            document.getElementById('investmentAmount').value = investment.amountInvested;
            document.getElementById('investmentDate').value = investment.date;
        } else {
            document.getElementById('investmentForm').reset();
            document.getElementById('investmentDate').value = new Date().toISOString().split('T')[0];
        }
        
        document.getElementById('investmentModal').style.display = 'block';
    }

    saveInvestment() {
        const formData = {
            id: this.editingId || this.generateId(),
            name: document.getElementById('investmentName').value,
            type: document.getElementById('investmentType').value,
            amountInvested: parseFloat(document.getElementById('investmentAmount').value),
            currentValue: parseFloat(document.getElementById('investmentAmount').value), // Use amount invested as current value
            date: document.getElementById('investmentDate').value
        };
        
        if (this.editingId) {
            const index = this.data.investments.findIndex(inv => inv.id === this.editingId);
            this.data.investments[index] = formData;
        } else {
            this.data.investments.push(formData);
        }
        
        this.saveData();
        this.closeModal(document.getElementById('investmentModal'));
        this.renderInvestments();
        this.renderDashboard();
    }

    editInvestment(id) {
        const investment = this.data.investments.find(inv => inv.id === id);
        if (investment) {
            this.openInvestmentModal(investment);
        }
    }

    deleteInvestment(id) {
        if (confirm('Are you sure you want to delete this investment?')) {
            this.data.investments = this.data.investments.filter(inv => inv.id !== id);
            this.saveData();
            this.renderInvestments();
            this.renderDashboard();
        }
    }

    // Cards
    renderCards() {
        const container = document.getElementById('cardsGrid');
        
        if (this.data.cards.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-credit-card"></i><h3>No cards added</h3><p>Add your first card to track payments</p></div>';
            return;
        }
        
        container.innerHTML = this.data.cards.map(card => {
            const currentBalance = this.getCardBalance(card.id);
            const utilization = card.type === 'credit' && card.limit ? (currentBalance / card.limit) * 100 : 0;
            
            return `
                <div class="card-item" style="background: linear-gradient(135deg, ${card.color}, ${this.darkenColor(card.color, 20)})">
                    <h3>
                        ${card.name}
                        <span class="card-type-badge">${card.type === 'credit' ? 'Credit' : 'Debit'}</span>
                        <div class="card-color-preview" style="background-color: ${card.color}"></div>
                    </h3>
                    <div class="card-info">
                        <p><strong>Last 4 digits:</strong> ${card.number}</p>
                        ${card.type === 'credit' ? `
                            <p><strong>Credit Limit:</strong> ${this.formatCurrency(card.limit)}</p>
                            <p><strong>Current Balance:</strong> ${this.formatCurrency(currentBalance)}</p>
                            <p><strong>Utilization:</strong> ${utilization.toFixed(1)}%</p>
                            <p><strong>Due Date:</strong> ${card.dueDate}th of each month</p>
                        ` : `
                            <p><strong>Current Balance:</strong> ${this.formatCurrency(card.balance || 0)}</p>
                        `}
                    </div>
                    <div class="card-actions">
                        <button class="btn-edit" onclick="financeTracker.editCard('${card.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="financeTracker.deleteCard('${card.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getCardBalance(cardId) {
        return this.data.transactions
            .filter(t => t.card === cardId)
            .reduce((sum, t) => {
                return sum + (t.type === 'expense' ? t.amount : -t.amount);
            }, 0);
    }

    openCardModal(card = null) {
        this.editingId = card ? card.id : null;
        
        document.getElementById('cardModalTitle').textContent = 
            card ? 'Edit Card' : 'Add Card';
        
        if (card) {
            document.getElementById('cardName').value = card.name;
            document.getElementById('cardType').value = card.type;
            document.getElementById('cardNumber').value = card.number;
            document.getElementById('cardLimit').value = card.limit || '';
            document.getElementById('cardBalance').value = card.balance || '';
            document.getElementById('cardDueDate').value = card.dueDate || '';
            document.getElementById('cardColor').value = card.color;
            
            // Trigger the card type change to show/hide appropriate fields
            document.getElementById('cardType').dispatchEvent(new Event('change'));
        } else {
            document.getElementById('cardForm').reset();
            document.getElementById('cardColor').value = '#3B82F6';
        }
        
        document.getElementById('cardModal').style.display = 'block';
    }

    saveCard() {
        const formData = {
            id: this.editingId || this.generateId(),
            name: document.getElementById('cardName').value,
            type: document.getElementById('cardType').value,
            number: document.getElementById('cardNumber').value,
            limit: document.getElementById('cardLimit').value ? parseFloat(document.getElementById('cardLimit').value) : null,
            balance: document.getElementById('cardBalance').value ? parseFloat(document.getElementById('cardBalance').value) : null,
            dueDate: document.getElementById('cardDueDate').value ? parseInt(document.getElementById('cardDueDate').value) : null,
            color: document.getElementById('cardColor').value
        };
        
        if (this.editingId) {
            const index = this.data.cards.findIndex(card => card.id === this.editingId);
            this.data.cards[index] = formData;
        } else {
            this.data.cards.push(formData);
        }
        
        this.saveData();
        this.closeModal(document.getElementById('cardModal'));
        this.renderCards();
    }

    editCard(id) {
        const card = this.data.cards.find(card => card.id === id);
        if (card) {
            this.openCardModal(card);
        }
    }

    deleteCard(id) {
        if (confirm('Are you sure you want to delete this card?')) {
            this.data.cards = this.data.cards.filter(card => card.id !== id);
            this.saveData();
            this.renderCards();
        }
    }

    // Categories
    renderCategories() {
        this.renderCategorySection('income', 'incomeCategories');
        this.renderCategorySection('expense', 'expenseCategories');
        this.renderCategorySection('investment', 'investmentTypes');
    }

    renderCategorySection(type, containerId) {
        const container = document.getElementById(containerId);
        const categories = this.data.categories[type];
        
        container.innerHTML = categories.map(cat => `
            <div class="category-item">
                <div style="display: flex; align-items: center;">
                    <div class="category-color" style="background-color: ${cat.color}"></div>
                    <span class="category-name">${cat.name}</span>
                </div>
                <div class="category-actions">
                    <button class="btn-edit" onclick="financeTracker.editCategory('${cat.id}', '${type}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" onclick="financeTracker.deleteCategory('${cat.id}', '${type}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    openCategoryModal(category = null, type = 'income') {
        this.editingId = category ? category.id : null;
        this.editingType = type;
        
        document.getElementById('categoryModalTitle').textContent = 
            category ? 'Edit Category' : 'Add Category';
        
        if (category) {
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryType').value = type;
            document.getElementById('categoryColor').value = category.color;
        } else {
            document.getElementById('categoryForm').reset();
            document.getElementById('categoryType').value = type;
        }
        
        document.getElementById('categoryModal').style.display = 'block';
    }

    saveCategory() {
        const formData = {
            id: this.editingId || this.generateId(),
            name: document.getElementById('categoryName').value,
            color: document.getElementById('categoryColor').value
        };
        
        const type = document.getElementById('categoryType').value;
        
        if (this.editingId) {
            const index = this.data.categories[type].findIndex(cat => cat.id === this.editingId);
            this.data.categories[type][index] = formData;
        } else {
            this.data.categories[type].push(formData);
        }
        
        this.saveData();
        this.closeModal(document.getElementById('categoryModal'));
        this.renderCategories();
        this.populateCategoryOptions();
        this.populateInvestmentTypeOptions();
    }

    editCategory(id, type) {
        const category = this.data.categories[type].find(cat => cat.id === id);
        if (category) {
            this.openCategoryModal(category, type);
        }
    }

    deleteCategory(id, type) {
        if (confirm('Are you sure you want to delete this category?')) {
            this.data.categories[type] = this.data.categories[type].filter(cat => cat.id !== id);
            this.saveData();
            this.renderCategories();
            this.populateCategoryOptions();
            this.populateInvestmentTypeOptions();
        }
    }

    // Debts
    renderDebts() {
        // Preserve current filter values
        const currentMonth = document.getElementById('debtMonthFilter')?.value || 'all';
        const currentYear = document.getElementById('debtYearFilter')?.value || 'all';
        const currentStatus = document.getElementById('debtStatusFilter')?.value || 'all';
        
        this.populateDebtFilters();
        
        // Restore filter values
        if (document.getElementById('debtMonthFilter')) {
            document.getElementById('debtMonthFilter').value = currentMonth;
        }
        if (document.getElementById('debtYearFilter')) {
            document.getElementById('debtYearFilter').value = currentYear;
        }
        if (document.getElementById('debtStatusFilter')) {
            document.getElementById('debtStatusFilter').value = currentStatus;
        }
        
        let filteredDebts = [...this.data.debts];
        
        // Apply filters
        const monthFilter = document.getElementById('debtMonthFilter').value;
        const yearFilter = document.getElementById('debtYearFilter').value;
        const statusFilter = document.getElementById('debtStatusFilter').value;
        
        if (monthFilter !== 'all') {
            const monthIndex = parseInt(monthFilter);
            filteredDebts = filteredDebts.filter(d => {
                const debtDate = new Date(d.startDate);
                return debtDate.getMonth() === monthIndex;
            });
        }
        
        if (yearFilter !== 'all') {
            const year = parseInt(yearFilter);
            filteredDebts = filteredDebts.filter(d => {
                const debtDate = new Date(d.startDate);
                return debtDate.getFullYear() === year;
            });
        }
        
        if (statusFilter !== 'all') {
            filteredDebts = filteredDebts.filter(d => {
                const progress = this.calculateDebtProgress(d);
                return progress.status === statusFilter;
            });
        }
        
        this.renderDebtsTable(filteredDebts);
    }

    renderDebtsTable(debts) {
        const tbody = document.getElementById('debtsTableBody');
        
        // Apply pagination
        const page = this.currentPageNumber['debts'] || 1;
        const paginated = this.paginateArray(debts, page, this.itemsPerPage);
        
        if (paginated.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No debts found</td></tr>';
            this.renderPagination('debtsPagination', 1, 0, 'financeTracker.goToDebtsPage');
            return;
        }
        
        tbody.innerHTML = paginated.data.map(debt => {
            const progress = this.calculateDebtProgress(debt);
            const card = this.data.cards.find(c => c.id === debt.card);
            
            return `
                <tr>
                    <td><strong>${debt.name}</strong></td>
                    <td>${this.formatCurrency(debt.amount)}</td>
                    <td>${progress.currentInstallments}/${debt.installments}</td>
                    <td>${card ? card.name : 'N/A'}</td>
                    <td>${this.formatDateString(debt.startDate)}</td>
                    <td><span class="badge ${progress.status}">${progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}</span></td>
                    <td>
                        <button class="btn-edit" onclick="financeTracker.editDebt('${debt.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="financeTracker.deleteDebt('${debt.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Render pagination
        this.renderPagination('debtsPagination', page, paginated.totalPages, 'financeTracker.goToDebtsPage');
    }

    goToDebtsPage(page) {
        this.currentPageNumber['debts'] = page;
        this.renderDebts();
    }

    calculateDebtProgress(debt) {
        const startDate = new Date(debt.startDate);
        const now = new Date();
        
        // Calculate months difference
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                          (now.getMonth() - startDate.getMonth());
        
        const currentInstallments = Math.min(Math.max(0, monthsDiff + 1), debt.installments);
        const status = currentInstallments >= debt.installments ? 'complete' : 'pending';
        
        return {
            currentInstallments,
            status
        };
    }

    openDebtModal(debt = null) {
        this.editingId = debt ? debt.id : null;
        
        document.getElementById('debtModalTitle').textContent = 
            debt ? 'Edit Debt' : 'Add Debt';
        
        // Populate card options
        const cardOptions = this.data.cards.map(card => 
            `<option value="${card.id}">${card.name} (****${card.number})</option>`
        ).join('');
        document.getElementById('debtCard').innerHTML = 
            '<option value="">Select Card</option>' + cardOptions;
        
        if (debt) {
            document.getElementById('debtName').value = debt.name;
            document.getElementById('debtAmount').value = debt.amount;
            document.getElementById('debtInstallments').value = debt.installments;
            document.getElementById('debtCard').value = debt.card;
            document.getElementById('debtStartDate').value = debt.startDate;
        } else {
            document.getElementById('debtForm').reset();
            document.getElementById('debtStartDate').value = new Date().toISOString().split('T')[0];
        }
        
        document.getElementById('debtModal').style.display = 'block';
    }

    saveDebt() {
        const formData = {
            id: this.editingId || this.generateId(),
            name: document.getElementById('debtName').value,
            amount: parseFloat(document.getElementById('debtAmount').value),
            installments: parseInt(document.getElementById('debtInstallments').value),
            card: document.getElementById('debtCard').value,
            startDate: document.getElementById('debtStartDate').value
        };
        
        if (this.editingId) {
            const index = this.data.debts.findIndex(d => d.id === this.editingId);
            this.data.debts[index] = formData;
        } else {
            this.data.debts.push(formData);
        }
        
        this.saveData();
        this.closeModal(document.getElementById('debtModal'));
        this.renderDebts();
        this.renderDashboard();
    }

    editDebt(id) {
        const debt = this.data.debts.find(d => d.id === id);
        if (debt) {
            this.openDebtModal(debt);
        }
    }

    deleteDebt(id) {
        if (confirm('Are you sure you want to delete this debt?')) {
            this.data.debts = this.data.debts.filter(d => d.id !== id);
            this.saveData();
            this.renderDebts();
            this.renderDashboard();
        }
    }

    // Subscriptions
    renderSubscriptions() {
        const page = this.currentPageNumber['subscriptions'] || 1;
        const paginated = this.paginateArray(this.data.subscriptions, page, this.itemsPerPage);
        
        const tbody = document.getElementById('subscriptionsTableBody');
        if (!tbody) return;
        
        if (paginated.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No subscriptions yet</td></tr>';
            this.renderPagination('subscriptionsPagination', 1, 0, 'financeTracker.goToSubscriptionsPage');
            return;
        }
        
        tbody.innerHTML = paginated.data.map(sub => {
            const category = this.data.categories.expense.find(c => c.id === sub.category);
            return `
                <tr>
                    <td><strong>${sub.name}</strong></td>
                    <td>${category ? category.name : sub.category}</td>
                    <td>${this.formatCurrency(sub.amount)}</td>
                    <td>${sub.frequency}</td>
                    <td>${this.formatDateString(sub.startDate)}</td>
                    <td>
                        <button class="btn-edit" onclick="financeTracker.editSubscription('${sub.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="financeTracker.deleteSubscription('${sub.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        this.renderPagination('subscriptionsPagination', page, paginated.totalPages, 'financeTracker.goToSubscriptionsPage');
    }

    goToSubscriptionsPage(page) {
        this.currentPageNumber['subscriptions'] = page;
        this.renderSubscriptions();
    }

    openSubscriptionModal(subscription = null) {
        this.editingId = subscription ? subscription.id : null;
        
        document.getElementById('subscriptionModalTitle').textContent = 
            subscription ? 'Edit Subscription' : 'Add Subscription';
        
        this.populateCategoryOptions();
        
        if (subscription) {
            document.getElementById('subscriptionName').value = subscription.name;
            document.getElementById('subscriptionCategory').value = subscription.category;
            document.getElementById('subscriptionAmount').value = subscription.amount;
            document.getElementById('subscriptionFrequency').value = subscription.frequency;
            document.getElementById('subscriptionStartDate').value = subscription.startDate;
        } else {
            document.getElementById('subscriptionForm').reset();
            document.getElementById('subscriptionStartDate').value = new Date().toISOString().split('T')[0];
        }
        
        document.getElementById('subscriptionModal').style.display = 'block';
    }

    saveSubscription() {
        const formData = {
            id: this.editingId || this.generateId(),
            name: document.getElementById('subscriptionName').value,
            category: document.getElementById('subscriptionCategory').value,
            amount: parseFloat(document.getElementById('subscriptionAmount').value),
            frequency: document.getElementById('subscriptionFrequency').value,
            startDate: document.getElementById('subscriptionStartDate').value
        };
        
        if (this.editingId) {
            const index = this.data.subscriptions.findIndex(s => s.id === this.editingId);
            this.data.subscriptions[index] = formData;
        } else {
            this.data.subscriptions.push(formData);
        }
        
        this.saveData();
        this.closeModal(document.getElementById('subscriptionModal'));
        this.renderSubscriptions();
        this.renderDashboard();
    }

    editSubscription(id) {
        const subscription = this.data.subscriptions.find(s => s.id === id);
        if (subscription) {
            this.openSubscriptionModal(subscription);
        }
    }

    deleteSubscription(id) {
        if (confirm('Are you sure you want to delete this subscription?')) {
            this.data.subscriptions = this.data.subscriptions.filter(s => s.id !== id);
            this.saveData();
            this.renderSubscriptions();
            this.renderDashboard();
        }
    }

    // Reminders
    renderReminders() {
        // Update threshold input value
        const thresholdInput = document.getElementById('reminderDaysThreshold');
        if (thresholdInput) {
            thresholdInput.value = this.reminderDaysThreshold;
        }
        
        const page = this.currentPageNumber['reminders'] || 1;
        const paginated = this.paginateArray(this.data.reminders, page, this.itemsPerPage);
        
        const tbody = document.getElementById('remindersTableBody');
        if (!tbody) return;
        
        if (paginated.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No reminders yet</td></tr>';
            this.renderPagination('remindersPagination', 1, 0, 'financeTracker.goToRemindersPage');
            return;
        }
        
        const now = new Date();
        tbody.innerHTML = paginated.data.map(reminder => {
            const reminderDate = new Date(reminder.date);
            const daysUntil = Math.ceil((reminderDate - now) / (1000 * 60 * 60 * 24));
            const isPast = reminderDate < now;
            const status = reminder.status || 'pending';
            
            return `
                <tr class="${isPast && status === 'pending' ? 'past-reminder' : ''}">
                    <td><strong>${reminder.title}</strong></td>
                    <td>${reminder.description || '-'}</td>
                    <td>${this.formatDateString(reminder.date)}</td>
                    <td>
                        <span class="badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    </td>
                    <td class="${isPast && status === 'pending' ? 'text-danger' : daysUntil <= this.reminderDaysThreshold && status === 'pending' ? 'text-warning' : ''}">
                        ${status === 'complete' ? (reminder.completedDate ? `Completed ${this.formatDateString(reminder.completedDate)}` : 'Completed') : (isPast ? 'Past' : daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`)}
                    </td>
                    <td>
                        ${status === 'pending' ? `
                            <button class="btn-success" onclick="financeTracker.markReminderComplete('${reminder.id}')" title="Mark as Complete">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn-edit" onclick="financeTracker.editReminder('${reminder.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="financeTracker.deleteReminder('${reminder.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        this.renderPagination('remindersPagination', page, paginated.totalPages, 'financeTracker.goToRemindersPage');
    }

    goToRemindersPage(page) {
        this.currentPageNumber['reminders'] = page;
        this.renderReminders();
    }

    openReminderModal(reminder = null) {
        this.editingId = reminder ? reminder.id : null;
        
        document.getElementById('reminderModalTitle').textContent = 
            reminder ? 'Edit Reminder' : 'Add Reminder';
        
        if (reminder) {
            document.getElementById('reminderTitle').value = reminder.title;
            document.getElementById('reminderDescription').value = reminder.description || '';
            document.getElementById('reminderDate').value = reminder.date;
            document.getElementById('reminderRecurring').checked = reminder.recurring || false;
        } else {
            document.getElementById('reminderForm').reset();
            document.getElementById('reminderDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('reminderRecurring').checked = false;
        }
        
        document.getElementById('reminderModal').style.display = 'block';
    }

    saveReminder() {
        const formData = {
            id: this.editingId || this.generateId(),
            title: document.getElementById('reminderTitle').value,
            description: document.getElementById('reminderDescription').value || '',
            date: document.getElementById('reminderDate').value,
            status: this.editingId ? (this.data.reminders.find(r => r.id === this.editingId)?.status || 'pending') : 'pending',
            recurring: document.getElementById('reminderRecurring').checked,
            completedDate: this.editingId ? (this.data.reminders.find(r => r.id === this.editingId)?.completedDate || null) : null
        };
        
        if (this.editingId) {
            const index = this.data.reminders.findIndex(r => r.id === this.editingId);
            this.data.reminders[index] = formData;
        } else {
            this.data.reminders.push(formData);
        }
        
        this.saveData();
        this.closeModal(document.getElementById('reminderModal'));
        this.renderReminders();
        this.renderDashboard();
    }

    editReminder(id) {
        const reminder = this.data.reminders.find(r => r.id === id);
        if (reminder) {
            this.openReminderModal(reminder);
        }
    }

    deleteReminder(id) {
        if (confirm('Are you sure you want to delete this reminder?')) {
            this.data.reminders = this.data.reminders.filter(r => r.id !== id);
            this.saveData();
            this.renderReminders();
            this.renderDashboard();
        }
    }

    markReminderComplete(id) {
        const reminder = this.data.reminders.find(r => r.id === id);
        if (!reminder) return;
        
        const completedDate = new Date().toISOString().split('T')[0];
        reminder.status = 'complete';
        reminder.completedDate = completedDate;
        
        // If recurring, create a new reminder for next month
        if (reminder.recurring) {
            const reminderDate = new Date(reminder.date);
            const nextDate = new Date(reminderDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
            
            const newReminder = {
                id: this.generateId(),
                title: reminder.title,
                description: reminder.description || '',
                date: nextDate.toISOString().split('T')[0],
                status: 'pending',
                recurring: true,
                completedDate: null
            };
            
            this.data.reminders.push(newReminder);
        }
        
        this.saveData();
        this.renderReminders();
        this.renderDashboard();
        this.showNotification('Reminder marked as complete!', 'success');
    }

    updateReminderThreshold() {
        const threshold = parseInt(document.getElementById('reminderDaysThreshold').value);
        if (threshold >= 1 && threshold <= 30) {
            this.reminderDaysThreshold = threshold;
            localStorage.setItem('reminderDaysThreshold', threshold.toString());
            this.renderReminders();
            this.renderDashboard();
            this.showNotification('Reminder threshold updated!', 'success');
        }
    }

    async saveApiKey() {
        const apiKeyInput = document.getElementById('googleScriptKey');
        if (!apiKeyInput) return;
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            this.showNotification('Please enter a valid API key', 'error');
            return;
        }
        
        // Test the API key by trying to read
        try {
            const response = await fetch(`https://script.google.com/macros/s/${apiKey}/exec?action=read`);
            console.log(`https://script.google.com/macros/s/${apiKey}/exec?action=read`);
            const result = await response.text();
            
            // If we get a response (even if empty), the key is valid
            this.googleScriptKey = apiKey;
            localStorage.setItem('googleScriptKey', apiKey);
            
            // Migrate existing data to Google Apps Script
            await this.saveData();
            
            this.showNotification('API key saved successfully! Data will now be stored in Google Apps Script.', 'success');
        } catch (e) {
            // Still save the key, but warn the user
            this.googleScriptKey = apiKey;
            localStorage.setItem('googleScriptKey', apiKey);
            this.showNotification('API key saved, but could not verify connection. Please check your Google Apps Script deployment.', 'warning');
        }
    }

    // Utility Methods
    populateCategoryOptions() {
        const incomeOptions = this.data.categories.income.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
        
        const expenseOptions = this.data.categories.expense.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
        
        const categorySelect = document.getElementById('transactionCategory');
        if (categorySelect) {
            categorySelect.innerHTML = 
                '<option value="">Select Category</option>' + incomeOptions + expenseOptions;
        }
        
        // Also populate subscription category if it exists
        const subscriptionCategory = document.getElementById('subscriptionCategory');
        if (subscriptionCategory) {
            subscriptionCategory.innerHTML = 
                '<option value="">Select Category</option>' + expenseOptions;
        }
    }

    populateCategoryFilter() {
        const allCategories = [
            ...this.data.categories.income.map(cat => `<option value="${cat.id}">${cat.name}</option>`),
            ...this.data.categories.expense.map(cat => `<option value="${cat.id}">${cat.name}</option>`)
        ].join('');
        
        document.getElementById('categoryFilter').innerHTML = 
            '<option value="all">All Categories</option>' + allCategories;
    }

    populateMonthYearFilters() {
        // Get unique years and months from transactions
        const years = new Set();
        const months = new Set();
        
        this.data.transactions.forEach(t => {
            const date = new Date(t.date);
            years.add(date.getFullYear());
            months.add(date.getMonth());
        });
        
        // Populate year filter
        const yearOptions = Array.from(years).sort((a, b) => b - a).map(year => 
            `<option value="${year}">${year}</option>`
        ).join('');
        document.getElementById('transactionYearFilter').innerHTML = 
            '<option value="all">All Years</option>' + yearOptions;
        
        // Populate month filter
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const monthOptions = Array.from(months).sort((a, b) => b - a).map(month => 
            `<option value="${month}">${monthNames[month]}</option>`
        ).join('');
        document.getElementById('transactionMonthFilter').innerHTML = 
            '<option value="all">All Months</option>' + monthOptions;
    }

    populateDebtFilters() {
        // Get unique years and months from debts
        const years = new Set();
        const months = new Set();
        
        this.data.debts.forEach(d => {
            const date = new Date(d.startDate);
            years.add(date.getFullYear());
            months.add(date.getMonth());
        });
        
        // Populate year filter
        const yearOptions = Array.from(years).sort((a, b) => b - a).map(year => 
            `<option value="${year}">${year}</option>`
        ).join('');
        document.getElementById('debtYearFilter').innerHTML = 
            '<option value="all">All Years</option>' + yearOptions;
        
        // Populate month filter
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const monthOptions = Array.from(months).sort((a, b) => b - a).map(month => 
            `<option value="${month}">${monthNames[month]}</option>`
        ).join('');
        document.getElementById('debtMonthFilter').innerHTML = 
            '<option value="all">All Months</option>' + monthOptions;
    }

    populateCardOptions() {
        const options = this.data.cards.map(card => 
            `<option value="${card.id}">${card.name} (****${card.number})</option>`
        ).join('');
        
        document.getElementById('transactionCard').innerHTML = 
            '<option value="">None</option>' + options;
    }

    populateInvestmentTypeOptions() {
        const options = this.data.categories.investment.map(type => 
            `<option value="${type.id}">${type.name}</option>`
        ).join('');
        
        document.getElementById('investmentType').innerHTML = 
            '<option value="">Select Investment Type</option>' + options;
    }

    populateCardFilter() {
        const options = this.data.cards.map(card => 
            `<option value="${card.id}">${card.name} (****${card.number})</option>`
        ).join('');
        
        document.getElementById('transactionCard').innerHTML = 
            '<option value="">None</option>' + options;
    }

    getCategoryName(id, type) {
        const category = this.data.categories[type].find(cat => cat.id === id);
        return category ? category.name : id;
    }

    getCardName(id) {
        const card = this.data.cards.find(card => card.id === id);
        return card ? `${card.name} (****${card.number})` : id;
    }

    updateMonthDisplay() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthName = monthNames[this.currentMonth.getMonth()];
        const year = this.currentMonth.getFullYear();
        
        document.getElementById('currentMonth').textContent = `${monthName} ${year}`;
    }

    closeModal(modal) {
        modal.style.display = 'none';
        this.editingId = null;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    // Export/Import functionality
    exportData() {
        const dataToExport = {
            ...this.data,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        // Encrypt the data before exporting
        const encryptedData = this.encryptionService.encrypt(dataToExport);
        const dataBlob = new Blob([encryptedData], { type: 'text/plain' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `finance-tracker-backup-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        this.showNotification('Data exported successfully (encrypted)!', 'success');
    }

    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let importedData;
                // Try to decrypt first (encrypted export)
                importedData = this.encryptionService.decrypt(e.target.result);
                
                // If decryption fails, try parsing as JSON (legacy format)
                if (!importedData) {
                    importedData = JSON.parse(e.target.result);
                }
                
                // Validate the imported data structure
                if (this.validateImportedData(importedData)) {
                    if (confirm('This will replace all your current data. Are you sure you want to continue?')) {
                        this.data = {
                            ...this.data,
                            ...importedData
                        };
                        this.saveData();
                        this.showNotification('Data imported successfully!', 'success');
                        
                        // Refresh all pages
                        this.renderDashboard();
                        this.renderTransactions();
                        this.renderInvestments();
                        this.renderCards();
                        this.renderCategories();
                        if (this.data.subscriptions) this.renderSubscriptions();
                        if (this.data.reminders) this.renderReminders();
                    }
                } else {
                    this.showNotification('Invalid data format. Please select a valid backup file.', 'error');
                }
            } catch (error) {
                this.showNotification('Error reading file. Please make sure it\'s a valid backup file.', 'error');
            }
        };
        reader.readAsText(file);
    }

    validateImportedData(data) {
        // Basic validation of data structure
        return data && 
               Array.isArray(data.transactions) && 
               Array.isArray(data.investments) && 
               Array.isArray(data.cards) && 
               (Array.isArray(data.debts) || !data.debts) &&
               data.categories && 
               Array.isArray(data.categories.income) && 
               Array.isArray(data.categories.expense) &&
               Array.isArray(data.categories.investment);
    }

    clearAllData() {
        if (confirm('Are you sure you want to delete ALL data? This action cannot be undone!')) {
            if (confirm('This will permanently delete all transactions, investments, credit cards, and categories. Type "DELETE" to confirm.')) {
                const confirmation = prompt('Type "DELETE" to confirm data deletion:');
                if (confirmation === 'DELETE') {
                    this.data = {
                        transactions: [],
                        investments: [],
                        cards: [],
                        debts: [],
                        categories: {
                            income: [
                                { id: 'salary', name: 'Salary', color: '#22c55e' },
                                { id: 'freelance', name: 'Freelance', color: '#3b82f6' },
                                { id: 'investment-returns', name: 'Investment Returns', color: '#8b5cf6' },
                                { id: 'other-income', name: 'Other Income', color: '#f59e0b' }
                            ],
                            expense: [
                                { id: 'food', name: 'Food & Dining', color: '#ef4444' },
                                { id: 'transportation', name: 'Transportation', color: '#06b6d4' },
                                { id: 'entertainment', name: 'Entertainment', color: '#ec4899' },
                                { id: 'utilities', name: 'Utilities', color: '#84cc16' },
                                { id: 'shopping', name: 'Shopping', color: '#f97316' },
                                { id: 'healthcare', name: 'Healthcare', color: '#6366f1' },
                                { id: 'education', name: 'Education', color: '#8b5cf6' },
                                { id: 'other-expense', name: 'Other Expenses', color: '#6b7280' }
                            ],
                            investment: [
                                { id: 'stocks', name: 'Stocks', color: '#22c55e' },
                                { id: 'bonds', name: 'Bonds', color: '#3b82f6' },
                                { id: 'crypto', name: 'Cryptocurrency', color: '#f59e0b' },
                                { id: 'real-estate', name: 'Real Estate', color: '#8b5cf6' },
                                { id: 'mutual-funds', name: 'Mutual Funds', color: '#06b6d4' },
                                { id: 'other', name: 'Other', color: '#6b7280' }
                            ]
                        }
                    };
                    this.saveData();
                    this.showNotification('All data has been cleared.', 'success');
                    
                    // Refresh all pages
                    this.renderDashboard();
                    this.renderTransactions();
                    this.renderInvestments();
                    this.renderCards();
                    this.renderCategories();
                } else {
                    this.showNotification('Data deletion cancelled.', 'info');
                }
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Initialize the application
const financeTracker = new FinanceTracker();
