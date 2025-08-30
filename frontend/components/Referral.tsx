'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { referralAPI } from '@/lib/api';
import { 
  Users, 
  DollarSign, 
  Copy, 
  Share2, 
  TrendingUp,
  RefreshCw,
  UserPlus,
  BarChart3
} from 'lucide-react';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  level1Referrals: any[];
  level2Referrals: any[];
  level1Income: number;
  level2Income: number;
  level1Business: number;
  level2Business: number;
  totalReferrals: number;
}

export default function Referral() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferralData = async () => {
    try {
      const response = await referralAPI.getOverview();
      setData(response.data);
    } catch (error: any) {
      toast.error('Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const copyReferralLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      toast.success('Referral link copied!');
    }
  };

  const copyReferralCode = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(data.referralCode);
      toast.success('Referral code copied!');
    }
  };

  const shareReferral = () => {
    if (data?.referralLink) {
      if (navigator.share) {
        navigator.share({
          title: 'Join Cashback Dashboard',
          text: 'Use my referral code to get started!',
          url: data.referralLink
        });
      } else {
        copyReferralLink();
      }
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
        <p className="text-slate-400">Failed to load referral data</p>
        <button
          onClick={fetchReferralData}
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
          <h1 className="text-2xl font-bold text-white">My Referrals</h1>
          <p className="text-slate-400">Manage your referral network and earnings</p>
        </div>
        <button
          onClick={fetchReferralData}
          className="btn btn-outline flex items-center space-x-2"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Referral Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Referrals */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Referrals</p>
              <p className="text-2xl font-bold text-white mt-1">
                {data.totalReferrals}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <Users className="text-primary-400" size={24} />
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
            <div className="w-12 h-12 bg-secondary-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-secondary-400" size={24} />
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
            <div className="w-12 h-12 bg-accent-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-accent-400" size={24} />
            </div>
          </div>
        </div>

        {/* Total Business */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Business</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(data.level1Business + data.level2Business)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Your Referral Link</h2>
        <div className="space-y-4">
          {/* Referral Code */}
          <div className="bg-dark-700 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Referral Code</p>
                <p className="text-primary-100 font-mono text-lg font-bold">
                  {data.referralCode}
                </p>
              </div>
              <button
                onClick={copyReferralCode}
                className="btn btn-outline flex items-center space-x-2"
              >
                <Copy size={16} />
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-dark-700 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-sm">Referral Link</p>
                <p className="text-slate-300 text-sm truncate">
                  {data.referralLink}
                </p>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={copyReferralLink}
                  className="btn btn-outline flex items-center space-x-2"
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
                <button
                  onClick={shareReferral}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level 1 Referrals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Level 1 Referrals</h3>
            <span className="text-slate-400 text-sm">
              {data.level1Referrals.length} referrals
            </span>
          </div>

          {data.level1Referrals.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="mx-auto text-slate-400" size={48} />
              <p className="text-slate-400 mt-2">No level 1 referrals yet</p>
              <p className="text-slate-500 text-sm">Share your referral link to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.level1Referrals.map((referral, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-dark-700 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {referral.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{referral.name}</p>
                      <p className="text-slate-400 text-sm">{referral.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {formatCurrency(referral.level1_business || 0)}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Level 2 Referrals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Level 2 Referrals</h3>
            <span className="text-slate-400 text-sm">
              {data.level2Referrals.length} referrals
            </span>
          </div>

          {data.level2Referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto text-slate-400" size={48} />
              <p className="text-slate-400 mt-2">No level 2 referrals yet</p>
              <p className="text-slate-500 text-sm">These are referrals of your referrals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.level2Referrals.map((referral, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-dark-700 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {referral.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{referral.name}</p>
                      <p className="text-slate-400 text-sm">{referral.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {formatCurrency(referral.level1_business || 0)}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={shareReferral}
            className="btn btn-primary flex items-center justify-center space-x-2"
          >
            <Share2 size={16} />
            <span>Share Referral Link</span>
          </button>
          <button
            onClick={copyReferralCode}
            className="btn btn-outline flex items-center justify-center space-x-2"
          >
            <Copy size={16} />
            <span>Copy Referral Code</span>
          </button>
          <button
            onClick={() => window.open('https://wa.me/919876543210?text=Join%20Cashback%20Dashboard%20with%20my%20referral%20code', '_blank')}
            className="btn btn-secondary flex items-center justify-center space-x-2"
          >
            <Share2 size={16} />
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
