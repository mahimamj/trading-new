// Dashboard JavaScript

// Chart time period switching
const timeBtns = document.querySelectorAll('.time-btn');

timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        timeBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Update chart title
        const chartTitle = document.querySelector('.chart-header h2');
        const timePeriod = btn.textContent;
        chartTitle.textContent = `EUR/USD - ${timePeriod} Chart`;
        
        // Simulate chart update
        updateChartData(timePeriod);
    });
});

// Simulate chart data updates
function updateChartData(timePeriod) {
    const chartContainer = document.querySelector('.chart-container');
    
    // Add loading animation
    chartContainer.style.opacity = '0.7';
    
    setTimeout(() => {
        chartContainer.style.opacity = '1';
        
        // Update price info based on time period
        const currentPrice = document.querySelector('.current-price');
        const priceChange = document.querySelector('.price-change');
        
        // Simulate different price movements for different time periods
        let newPrice, newChange;
        
        switch(timePeriod) {
            case '1H':
                newPrice = (1.0854 + (Math.random() - 0.5) * 0.002).toFixed(4);
                newChange = `+${(Math.random() * 0.1).toFixed(2)}%`;
                break;
            case '4H':
                newPrice = (1.0854 + (Math.random() - 0.5) * 0.005).toFixed(4);
                newChange = `+${(Math.random() * 0.3).toFixed(2)}%`;
                break;
            case '1D':
                newPrice = (1.0854 + (Math.random() - 0.5) * 0.01).toFixed(4);
                newChange = `+${(Math.random() * 0.8).toFixed(2)}%`;
                break;
            case '1W':
                newPrice = (1.0854 + (Math.random() - 0.5) * 0.02).toFixed(4);
                newChange = `+${(Math.random() * 2).toFixed(2)}%`;
                break;
        }
        
        currentPrice.textContent = newPrice;
        priceChange.textContent = newChange;
        
        // Update chart stats
        updateChartStats(timePeriod);
        
    }, 500);
}

// Update chart statistics
function updateChartStats(timePeriod) {
    const highValue = document.querySelector('.chart-stats .stat:nth-child(1) .value');
    const lowValue = document.querySelector('.chart-stats .stat:nth-child(2) .value');
    const volumeValue = document.querySelector('.chart-stats .stat:nth-child(3) .value');
    
    const currentPrice = parseFloat(document.querySelector('.current-price').textContent);
    
    // Simulate realistic high/low values
    const volatility = timePeriod === '1H' ? 0.002 : timePeriod === '4H' ? 0.005 : timePeriod === '1D' ? 0.01 : 0.02;
    
    const high = (currentPrice + Math.random() * volatility).toFixed(4);
    const low = (currentPrice - Math.random() * volatility).toFixed(4);
    const volume = Math.floor(Math.random() * 5 + 1) + 'M';
    
    highValue.textContent = high;
    lowValue.textContent = low;
    volumeValue.textContent = volume;
}

// Trading form functionality
const tradeForm = document.querySelector('.trade-form');
const buyBtn = document.querySelector('.btn-buy');
const sellBtn = document.querySelector('.btn-sell');

if (tradeForm) {
    // Update trade buttons based on selected currency pair
    const currencySelect = tradeForm.querySelector('select');
    currencySelect.addEventListener('change', function() {
        const selectedPair = this.value;
        buyBtn.textContent = `Buy ${selectedPair}`;
        sellBtn.textContent = `Sell ${selectedPair}`;
    });
    
    // Buy button functionality
    buyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        executeTrade('BUY');
    });
    
    // Sell button functionality
    sellBtn.addEventListener('click', function(e) {
        e.preventDefault();
        executeTrade('SELL');
    });
}

// Execute trade function
function executeTrade(type) {
    const amount = document.querySelector('.trade-form input[type="number"]').value;
    const currencyPair = document.querySelector('.trade-form select').value;
    
    if (!amount || amount < 100) {
        showNotification('Please enter a valid amount (minimum $100)', 'error');
        return;
    }
    
    // Simulate trade execution
    const btn = type === 'BUY' ? buyBtn : sellBtn;
    const originalText = btn.textContent;
    
    btn.textContent = 'Executing...';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        
        // Show success message
        showNotification(`${type} order for $${amount} ${currencyPair} executed successfully!`, 'success');
        
        // Update account balance
        updateAccountBalance(parseFloat(amount));
        
        // Add to recent activity
        addRecentActivity(type, currencyPair, amount);
        
        // Reset form
        document.querySelector('.trade-form input[type="number"]').value = '';
        
    }, 2000);
}

// Update account balance
function updateAccountBalance(amount) {
    const balanceElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
    const currentBalance = parseFloat(balanceElement.textContent.replace('$', '').replace(',', ''));
    const newBalance = currentBalance - amount;
    
    balanceElement.textContent = `$${newBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
}

// Add recent activity
function addRecentActivity(type, pair, amount) {
    const activityList = document.querySelector('.activity-list');
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    const iconClass = type === 'BUY' ? 'buy' : 'sell';
    const iconSymbol = type === 'BUY' ? 'fa-arrow-up' : 'fa-arrow-down';
    
    activityItem.innerHTML = `
        <div class="activity-icon ${iconClass}">
            <i class="fas ${iconSymbol}"></i>
        </div>
        <div class="activity-details">
            <span class="activity-text">${type === 'BUY' ? 'Bought' : 'Sold'} ${pair}</span>
            <span class="activity-time">Just now</span>
        </div>
        <span class="activity-amount">${type === 'BUY' ? '-' : '+'}$${amount}</span>
    `;
    
    // Insert at the beginning
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    // Remove oldest activity if more than 5
    if (activityList.children.length > 5) {
        activityList.removeChild(activityList.lastChild);
    }
}

// Close position functionality
const closeBtns = document.querySelectorAll('.close-btn');

closeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const positionItem = this.closest('.position-item');
        const pair = positionItem.querySelector('.pair').textContent;
        const amount = positionItem.querySelector('.amount').textContent;
        const pnl = positionItem.querySelector('.pnl').textContent;
        
        // Show confirmation
        if (confirm(`Close ${pair} position for ${amount}? P&L: ${pnl}`)) {
            // Simulate position closure
            this.textContent = 'Closing...';
            this.disabled = true;
            
            setTimeout(() => {
                // Remove position from list
                positionItem.style.opacity = '0';
                positionItem.style.transform = 'translateX(-100%)';
                
                setTimeout(() => {
                    positionItem.remove();
                    
                    // Update open positions count
                    updateOpenPositionsCount();
                    
                    // Add to recent activity
                    addRecentActivity('CLOSE', pair, amount.replace('$', ''));
                    
                }, 300);
                
            }, 1000);
        }
    });
});

// Update open positions count
function updateOpenPositionsCount() {
    const positionsCount = document.querySelectorAll('.position-item').length;
    const countElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
    countElement.textContent = positionsCount;
}

// Watchlist price updates
function updateWatchlistPrices() {
    const watchlistItems = document.querySelectorAll('.watchlist-item');
    
    watchlistItems.forEach(item => {
        const priceElement = item.querySelector('.price');
        const changeElement = item.querySelector('.change');
        const currentPrice = parseFloat(priceElement.textContent);
        
        // Simulate price movement
        const change = (Math.random() - 0.5) * 0.001;
        const newPrice = currentPrice + change;
        const percentageChange = ((change / currentPrice) * 100).toFixed(2);
        
        priceElement.textContent = newPrice.toFixed(4);
        changeElement.textContent = `${change >= 0 ? '+' : ''}${percentageChange}%`;
        
        // Update colors
        if (change >= 0) {
            priceElement.className = 'price positive';
            changeElement.style.color = 'var(--secondary-color)';
        } else {
            priceElement.className = 'price negative';
            changeElement.style.color = 'var(--accent-color)';
        }
    });
}

// Update watchlist every 10 seconds
setInterval(updateWatchlistPrices, 10000);

// Quick actions functionality
const quickActions = document.querySelectorAll('.quick-actions a');

quickActions.forEach(action => {
    action.addEventListener('click', function(e) {
        e.preventDefault();
        const actionText = this.textContent.trim();
        
        switch(actionText) {
            case 'New Trade':
                document.querySelector('.trading-panel').scrollIntoView({ behavior: 'smooth' });
                break;
            case 'Market Analysis':
                document.querySelector('.chart-section').scrollIntoView({ behavior: 'smooth' });
                break;
            case 'Download Report':
                showNotification('Generating report...', 'info');
                setTimeout(() => {
                    showNotification('Report downloaded successfully!', 'success');
                }, 2000);
                break;
            case 'Settings':
                showNotification('Settings page not implemented in this demo', 'info');
                break;
        }
    });
});

// User menu functionality
const userAvatar = document.querySelector('.user-avatar');
const userName = document.querySelector('.user-name');

if (userAvatar) {
    userAvatar.addEventListener('click', function() {
        // Toggle user dropdown (simplified)
        showNotification('User profile not implemented in this demo', 'info');
    });
}

// Simulate real-time data updates
function simulateRealTimeUpdates() {
    // Update account balance with small fluctuations
    const balanceElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
    if (balanceElement) {
        const currentBalance = parseFloat(balanceElement.textContent.replace('$', '').replace(',', ''));
        const fluctuation = (Math.random() - 0.5) * 10; // ±$5 fluctuation
        const newBalance = currentBalance + fluctuation;
        
        balanceElement.textContent = `$${newBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    }
    
    // Update P&L
    const pnlElement = document.querySelector('.stat-card:nth-child(2) .stat-value');
    if (pnlElement) {
        const currentPnl = parseFloat(pnlElement.textContent.replace('$', '').replace(',', ''));
        const fluctuation = (Math.random() - 0.5) * 5; // ±$2.5 fluctuation
        const newPnl = currentPnl + fluctuation;
        
        pnlElement.textContent = `$${newPnl.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    }
}

// Update real-time data every 30 seconds
setInterval(simulateRealTimeUpdates, 30000);

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add click effects to buttons
    const buttons = document.querySelectorAll('.btn, .close-btn, .time-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add focus effects to form inputs
    const inputs = document.querySelectorAll('.trade-form input, .trade-form select');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
});

// Add CSS for ripple animation if not already present
if (!document.querySelector('#dashboard-ripple-style')) {
    const style = document.createElement('style');
    style.id = 'dashboard-ripple-style';
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Notification system (reuse from main script)
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff6b35' : '#00d4ff'};
        color: #0a0e1a;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}
