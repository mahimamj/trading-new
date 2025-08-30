'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { dashboardAPI } from '@/lib/api';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Gift, 
  DollarSign, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

interface DashboardData {
  accountBalance: number;
  totalEarnings: number;
  rewards: number;
  level1Income: number;
  level2Income: number;
  level1Business: number;
  level2Business: number;
  referralCount: number;
  recentTransactions: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getOverview();
      setData(response.data);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      default:
        return 'text-slate-400';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpRight className="text-green-400" size={16} />;
      case 'withdraw':
        return <ArrowDownRight className="text-red-400" size={16} />;
      case 'referral_bonus':
        return <Gift className="text-blue-400" size={16} />;
      case 'reward':
        return <Gift className="text-purple-400" size={16} />;
      default:
        return <BarChart3 className="text-slate-400" size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">Failed to load dashboard data</p>
        <button
          onClick={fetchDashboardData}
          className="btn btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-slate-400">Welcome back! Here's your financial summary</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn btn-outline flex items-center space-x-2"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Account Balance */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Account Balance</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(data.accountBalance)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <Wallet className="text-primary-400" size={24} />
            </div>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Earnings</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(data.totalEarnings)}
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-secondary-400" size={24} />
            </div>
          </div>
        </div>

        {/* Level 1 Income */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Level 1 Income</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(data.level1Income)}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-accent-400" size={24} />
            </div>
          </div>
        </div>

        {/* Level 2 Income */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Level 2 Income</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(data.level2Income)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Business & Referral Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rewards */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Rewards</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(data.rewards)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <Gift className="text-yellow-400" size={24} />
            </div>
          </div>
        </div>

        {/* Level 1 Business */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Level 1 Business</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(data.level1Business)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <Users className="text-green-400" size={24} />
            </div>
          </div>
        </div>

        {/* Level 2 Business */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Level 2 Business</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(data.level2Business)}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <Users className="text-indigo-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
          <span className="text-slate-400 text-sm">
            {data.recentTransactions.length} transactions
          </span>
        </div>

        {data.recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="mx-auto text-slate-400" size={48} />
            <p className="text-slate-400 mt-2">No recent transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.recentTransactions.map((transaction, index) => (
              <div
                key={index}
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
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className={`text-sm ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referral Count */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Referrals</p>
              <p className="text-3xl font-bold text-white mt-1">
                {data.referralCount}
              </p>
              <p className="text-slate-400 text-sm mt-1">Direct referrals</p>
            </div>
            <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Users className="text-blue-400" size={32} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full btn btn-primary text-left">
              <DollarSign size={16} className="mr-2" />
              Deposit Funds
            </button>
            <button className="w-full btn btn-outline text-left">
              <Users size={16} className="mr-2" />
              Invite Friends
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
