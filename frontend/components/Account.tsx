'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { accountAPI, dashboardAPI } from '@/lib/api';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  Copy,
  RefreshCw,
  Filter
} from 'lucide-react';

interface AccountData {
  accountBalance: number;
  totalEarnings: number;
  rewards: number;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  description?: string;
  timestamp: string;
}

export default function Account() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const depositForm = useForm();
  const withdrawForm = useForm();

  const fetchAccountData = async () => {
    try {
      const response = await dashboardAPI.getOverview();
      setAccountData({
        accountBalance: response.data.accountBalance,
        totalEarnings: response.data.totalEarnings,
        rewards: response.data.rewards
      });
    } catch (error) {
      toast.error('Failed to load account data');
    }
  };

  const fetchTransactions = async (page = 1) => {
    try {
      const response = await accountAPI.getHistory({ page, limit: 10 });
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(page);
    } catch (error) {
      toast.error('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
    fetchTransactions();
  }, []);

  const handleDeposit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await accountAPI.deposit(data);
      toast.success('Deposit request submitted successfully');
      depositForm.reset();
      fetchAccountData();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Deposit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (data: any) => {
    setIsSubmitting(true);
    try {
      await accountAPI.withdraw(data);
      toast.success('Withdrawal request submitted successfully');
      withdrawForm.reset();
      fetchAccountData();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/10';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'failed':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpRight className="text-green-400" size={16} />;
      case 'withdraw':
        return <ArrowDownRight className="text-red-400" size={16} />;
      case 'referral_bonus':
        return <DollarSign className="text-blue-400" size={16} />;
      case 'reward':
        return <DollarSign className="text-purple-400" size={16} />;
      default:
        return <DollarSign className="text-slate-400" size={16} />;
    }
  };

  const tabs = [
    { id: 'deposit', label: 'Deposit', icon: ArrowUpRight },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowDownRight },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Account</h1>
          <p className="text-slate-400">Manage your deposits, withdrawals, and view transaction history</p>
        </div>
        <button
          onClick={() => {
            fetchAccountData();
            fetchTransactions();
          }}
          className="btn btn-outline flex items-center space-x-2"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Account Balance Cards */}
      {accountData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Account Balance</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(accountData.accountBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-primary-400" size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(accountData.totalEarnings)}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary-600/20 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="text-secondary-400" size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Rewards</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(accountData.rewards)}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-yellow-400" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'deposit' && (
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-white mb-4">Deposit Funds</h3>
              <form onSubmit={depositForm.handleSubmit(handleDeposit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    {...depositForm.register('amount', { 
                      required: 'Amount is required',
                      min: { value: 100, message: 'Minimum amount is ₹100' }
                    })}
                    className="input"
                    placeholder="Enter amount"
                    min="100"
                  />
                  {depositForm.formState.errors.amount && (
                    <p className="text-red-400 text-sm mt-1">
                      {depositForm.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    {...depositForm.register('description')}
                    className="input"
                    rows={3}
                    placeholder="Add a description for this deposit"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Submit Deposit Request'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-white mb-4">Withdraw Funds</h3>
              <form onSubmit={withdrawForm.handleSubmit(handleWithdraw)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    {...withdrawForm.register('amount', { 
                      required: 'Amount is required',
                      min: { value: 500, message: 'Minimum amount is ₹500' },
                      max: { 
                        value: accountData?.accountBalance || 0, 
                        message: 'Amount exceeds available balance' 
                      }
                    })}
                    className="input"
                    placeholder="Enter amount"
                    min="500"
                    max={accountData?.accountBalance || 0}
                  />
                  {withdrawForm.formState.errors.amount && (
                    <p className="text-red-400 text-sm mt-1">
                      {withdrawForm.formState.errors.amount.message}
                    </p>
                  )}
                  <p className="text-slate-400 text-sm mt-1">
                    Available balance: {formatCurrency(accountData?.accountBalance || 0)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    {...withdrawForm.register('description')}
                    className="input"
                    rows={3}
                    placeholder="Add a description for this withdrawal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-secondary disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Submit Withdrawal Request'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Transaction History</h3>
                <div className="flex items-center space-x-2">
                  <Filter size={16} className="text-slate-400" />
                  <span className="text-slate-400 text-sm">All transactions</span>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="mx-auto text-slate-400" size={48} />
                  <p className="text-slate-400 mt-2">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-dark-700 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="text-white font-medium capitalize">
                            {transaction.type.replace('_', ' ')}
                          </p>
                          <p className="text-slate-400 text-sm">
                            {new Date(transaction.timestamp).toLocaleDateString()}
                          </p>
                          {transaction.description && (
                            <p className="text-slate-500 text-sm">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <button
                    onClick={() => fetchTransactions(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-outline disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchTransactions(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
