// Finance Tracker Application
class FinanceTracker {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentMonth = new Date();
        this.editingId = null;
        
        // Initialize data structures
        this.data = {
            transactions: [],
            investments: [],
            cards: [],
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

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
        this.renderCategories();
        this.updateMonthDisplay();
        this.setupCardTypeToggle();
    }

    // Data Management
    loadData() {
        const savedData = localStorage.getItem('financeTrackerData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            this.data = { ...this.data, ...parsed };
        }
        this.saveData();
    }

    saveData() {
        localStorage.setItem('financeTrackerData', JSON.stringify(this.data));
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

        // Filters
        document.getElementById('transactionTypeFilter').addEventListener('change', () => {
            this.renderTransactions();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.renderTransactions();
        });

        document.getElementById('monthFilter').addEventListener('change', () => {
            this.renderTransactions();
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
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
            case 'settings':
                // Settings page doesn't need special rendering
                break;
        }
    }

    // Dashboard
    renderDashboard() {
        const monthData = this.getMonthData(this.currentMonth);
        this.updateSummaryCards(monthData);
        this.renderCharts(monthData);
        this.renderRecentTransactions();
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
        this.renderIncomeExpenseChart(data);
        this.renderExpenseCategoryChart(data.expenseTransactions);
        this.renderInvestmentAllocationChart();
        this.renderInvestmentPerformanceChart();
        this.renderMonthlyTrendChart();
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
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
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
                                return context.label + ': $' + context.parsed.toLocaleString() + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    renderInvestmentPerformanceChart() {
        const ctx = document.getElementById('investmentPerformanceChart').getContext('2d');
        
        if (this.data.investments.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No investments yet', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        const investments = this.data.investments.map(inv => ({
            name: inv.name,
            gainLoss: inv.currentValue - inv.amountInvested,
            gainLossPercent: ((inv.currentValue - inv.amountInvested) / inv.amountInvested) * 100
        }));

        // Sort by gain/loss percentage
        investments.sort((a, b) => b.gainLossPercent - a.gainLossPercent);

        const names = investments.map(inv => inv.name.length > 15 ? inv.name.substring(0, 15) + '...' : inv.name);
        const percentages = investments.map(inv => inv.gainLossPercent);
        const colors = percentages.map(pct => pct >= 0 ? '#22c55e' : '#ef4444');

        if (this.investmentPerformanceChart) {
            this.investmentPerformanceChart.destroy();
        }

        this.investmentPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: names,
                datasets: [{
                    data: percentages,
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
                                const inv = investments[context.dataIndex];
                                return inv.name + ': ' + (inv.gainLossPercent >= 0 ? '+' : '') + inv.gainLossPercent.toFixed(2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
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
                                return '$' + value.toLocaleString();
                            }
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
                    <div style="font-size: 0.8rem; opacity: 0.7;">${this.getCategoryName(t.category, t.type)} • ${new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div class="amount ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                </div>
            </div>
        `).join('');
    }

    // Transactions
    renderTransactions() {
        this.populateCategoryFilter();
        this.populateCardOptions();
        
        let filteredTransactions = [...this.data.transactions];
        
        // Apply filters
        const typeFilter = document.getElementById('transactionTypeFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const monthFilter = document.getElementById('monthFilter').value;
        
        if (typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }
        
        if (categoryFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
        }
        
        if (monthFilter) {
            const filterDate = new Date(monthFilter);
            filteredTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getFullYear() === filterDate.getFullYear() && 
                       transactionDate.getMonth() === filterDate.getMonth();
            });
        }
        
        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.renderTransactionsTable(filteredTransactions);
    }

    renderTransactionsTable(transactions) {
        const tbody = document.getElementById('transactionsTableBody');
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No transactions found</td></tr>';
            return;
        }
        
        tbody.innerHTML = transactions.map(t => `
            <tr>
                <td>${new Date(t.date).toLocaleDateString()}</td>
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
        `).join('');
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
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No investments yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.data.investments.map(inv => {
            const gainLoss = inv.currentValue - inv.amountInvested;
            const gainLossPercent = ((gainLoss / inv.amountInvested) * 100).toFixed(2);
            
            return `
                <tr>
                    <td><strong>${inv.name}</strong></td>
                    <td><span class="badge">${inv.type.charAt(0).toUpperCase() + inv.type.slice(1)}</span></td>
                    <td>${this.formatCurrency(inv.amountInvested)}</td>
                    <td>${this.formatCurrency(inv.currentValue)}</td>
                    <td class="${gainLoss >= 0 ? 'text-success' : 'text-danger'}">
                        ${gainLoss >= 0 ? '+' : ''}${this.formatCurrency(gainLoss)} (${gainLossPercent}%)
                    </td>
                    <td>${new Date(inv.date).toLocaleDateString()}</td>
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
            document.getElementById('investmentCurrentValue').value = investment.currentValue;
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
            currentValue: parseFloat(document.getElementById('investmentCurrentValue').value),
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

    // Utility Methods
    populateCategoryOptions() {
        const incomeOptions = this.data.categories.income.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
        
        const expenseOptions = this.data.categories.expense.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
        
        document.getElementById('transactionCategory').innerHTML = 
            '<option value="">Select Category</option>' + incomeOptions + expenseOptions;
    }

    populateCategoryFilter() {
        const allCategories = [
            ...this.data.categories.income.map(cat => `<option value="${cat.id}">${cat.name}</option>`),
            ...this.data.categories.expense.map(cat => `<option value="${cat.id}">${cat.name}</option>`)
        ].join('');
        
        document.getElementById('categoryFilter').innerHTML = 
            '<option value="all">All Categories</option>' + allCategories;
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
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `finance-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        this.showNotification('Data exported successfully!', 'success');
    }

    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
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
                    }
                } else {
                    this.showNotification('Invalid data format. Please select a valid backup file.', 'error');
                }
            } catch (error) {
                this.showNotification('Error reading file. Please make sure it\'s a valid JSON file.', 'error');
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
