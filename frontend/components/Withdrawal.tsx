
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { accountAPI, dashboardAPI } from '@/lib/api';
import { 
  Wallet, 
  ArrowDownRight, 
  History, 
  RefreshCw,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react';

interface WithdrawalData {
  accountBalance: number;
  totalEarnings: number;
  rewards: number;
}

interface WithdrawFormData {
  amount: number;
  description?: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  description?: string;
  timestamp: string;
}

export default function Withdrawal() {
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<string>('withdraw');

  const withdrawForm = useForm<WithdrawFormData>();

  const fetchWithdrawalData = async () => {
    try {
      const response = await dashboardAPI.getOverview();
      setWithdrawalData({
        accountBalance: response.data.accountBalance,
        totalEarnings: response.data.totalEarnings,
        rewards: response.data.rewards
      });
    } catch (error) {
      toast.error('Failed to load withdrawal data');
    }
  };

  const fetchTransactions = async (page = 1) => {
    try {
      const response = await accountAPI.getHistory({ 
        page, 
        limit: 10, 
        type: 'withdraw' 
      });
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(page);
    } catch (error) {
      toast.error('Failed to load withdrawal history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawalData();
    fetchTransactions();
  }, []);

  const handleWithdraw = async (data: WithdrawFormData) => {
    if (data.amount > withdrawalData?.accountBalance!) {
      toast.error('Insufficient balance for withdrawal');
      return;
    }

    if (data.amount < 100) {
      toast.error('Minimum withdrawal amount is ₹100');
      return;
    }

    setIsSubmitting(true);
    try {
      await accountAPI.withdraw(data);
      toast.success('Withdrawal request submitted successfully');
      withdrawForm.reset();
      fetchWithdrawalData();
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
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      case 'cancelled':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-500/20 text-green-400`;
      case 'pending':
        return `${baseClasses} bg-yellow-500/20 text-yellow-400`;
      case 'failed':
        return `${baseClasses} bg-red-500/20 text-red-400`;
      case 'cancelled':
        return `${baseClasses} bg-slate-500/20 text-slate-400`;
      default:
        return `${baseClasses} bg-slate-500/20 text-slate-400`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Withdrawal</h1>
          <p className="text-slate-400">Manage your withdrawal requests and view history</p>
        </div>
        <button
          onClick={() => {
            fetchWithdrawalData();
            fetchTransactions();
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Available Balance</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(withdrawalData?.accountBalance || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <Wallet className="text-primary-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-dark-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(withdrawalData?.totalEarnings || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-dark-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Rewards</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(withdrawalData?.rewards || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <div className="bg-dark-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="text-primary-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Request Withdrawal</h2>
              <p className="text-slate-400 text-sm">Withdraw funds to your bank account</p>
            </div>
          </div>

          <form onSubmit={withdrawForm.handleSubmit(handleWithdraw)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="100"
                max={withdrawalData?.accountBalance || 0}
                {...withdrawForm.register('amount', { 
                  required: 'Amount is required',
                  min: { value: 100, message: 'Minimum amount is ₹100' },
                  max: { value: withdrawalData?.accountBalance || 0, message: 'Insufficient balance' }
                })}
                className="w-full px-4 py-3 bg-dark-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter amount"
              />
              {withdrawForm.formState.errors.amount && (
                <p className="text-red-400 text-sm mt-1">
                  {withdrawForm.formState.errors.amount.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                {...withdrawForm.register('description')}
                rows={3}
                className="w-full px-4 py-3 bg-dark-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add a description for this withdrawal"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !withdrawalData?.accountBalance}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Request Withdrawal'
              )}
            </button>
          </form>

          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Withdrawal Guidelines:</h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Minimum withdrawal amount: ₹100</li>
              <li>• Maximum withdrawal: Available balance</li>
              <li>• Processing time: 24-48 hours</li>
              <li>• Bank transfer fees may apply</li>
            </ul>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-dark-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-600/20 rounded-lg flex items-center justify-center">
                <History className="text-slate-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Withdrawal History</h2>
                <p className="text-slate-400 text-sm">Recent withdrawal transactions</p>
              </div>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="text-slate-600 mx-auto mb-4" size={48} />
              <p className="text-slate-400">No withdrawal transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-dark-700 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                      <ArrowDownRight className="text-red-400" size={16} />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {transaction.description || 'Withdrawal'}
                      </p>
                      <p className="text-slate-500 text-xs flex items-center mt-1">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={getStatusBadge(transaction.status)}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
              <button
                onClick={() => fetchTransactions(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-400 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => fetchTransactions(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
