import DashboardClient from '@/components/dashboard/DashboardClient';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">Dashboard</h1>
      <DashboardClient />
    </div>
  );
}
