'use client';

import { DollarSign, Users, Award, Briefcase } from 'lucide-react';

const stats = [
  { name: 'Account Balance', stat: '$1,500.00', icon: DollarSign, bgColor: 'bg-blue-500' },
  { name: 'Total Earnings', stat: '$500.00', icon: DollarSign, bgColor: 'bg-green-500' },
  { name: 'My Level 1 Income', stat: '$300.00', icon: Users, bgColor: 'bg-yellow-500' },
  { name: 'My Level 2 Income', stat: '$200.00', icon: Users, bgColor: 'bg-purple-500' },
  { name: 'Rewards', stat: '$50.00', icon: Award, bgColor: 'bg-red-500' },
  { name: 'My Level 1 Business', stat: '$3,000.00', icon: Briefcase, bgColor: 'bg-indigo-500' },
  { name: 'My Level 2 Business', stat: '$2,000.00', icon: Briefcase, bgColor: 'bg-pink-500' },
  { name: 'My Referrals', stat: '12', icon: Users, bgColor: 'bg-teal-500' },
];

const DashboardClient = () => {
  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
            <div className={`absolute top-0 left-0 -ml-4 -mt-4 w-24 h-24 ${item.bgColor} opacity-20 rounded-full`}></div>
            <div className="p-5 relative">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-full ${item.bgColor} text-white`}>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{item.name}</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">{item.stat}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardClient;
