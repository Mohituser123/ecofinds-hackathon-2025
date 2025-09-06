import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Leaf, Package, TrendingUp, Users } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    userItems: 0,
    totalCO2Saved: 0,
    userCO2Saved: 0,
    totalUsers: 0
  });
  
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [co2TrendData, setCO2TrendData] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    await Promise.all([
      fetchStats(),
      fetchCategoryData(),
      fetchCO2TrendData(),
      fetchTopContributors()
    ]);
  };

  const fetchStats = async () => {
    // Total items and CO2 saved
    const { data: allItems } = await supabase
      .from('eco_items')
      .select('co2_saved, owner_id');

    // User's items
    const { data: userItems } = await supabase
      .from('eco_items')
      .select('co2_saved')
      .eq('owner_id', user?.id);

    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const totalCO2 = allItems?.reduce((sum, item) => sum + (item.co2_saved || 0), 0) || 0;
    const userCO2 = userItems?.reduce((sum, item) => sum + (item.co2_saved || 0), 0) || 0;

    setStats({
      totalItems: allItems?.length || 0,
      userItems: userItems?.length || 0,
      totalCO2Saved: totalCO2,
      userCO2Saved: userCO2,
      totalUsers: totalUsers || 0
    });
  };

  const fetchCategoryData = async () => {
    const { data } = await supabase
      .from('eco_items')
      .select('category');

    if (data) {
      const categoryCount = data.reduce((acc: any, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count,
        fill: getColorForCategory(category as string)
      }));

      setCategoryData(chartData);
    }
  };

  const fetchCO2TrendData = async () => {
    const { data } = await supabase
      .from('eco_items')
      .select('co2_saved, created_at')
      .order('created_at', { ascending: true });

    if (data) {
      // Group by month and calculate cumulative CO2 saved
      const monthlyData: { [key: string]: number } = {};
      let cumulativeCO2 = 0;

      data.forEach(item => {
        const date = new Date(item.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += item.co2_saved || 0;
      });

      const trendData = Object.entries(monthlyData).map(([month, co2]) => {
        cumulativeCO2 += co2;
        return {
          month,
          co2Saved: Math.round(co2),
          cumulative: Math.round(cumulativeCO2)
        };
      });

      setCO2TrendData(trendData.slice(-6)); // Last 6 months
    }
  };

  const fetchTopContributors = async () => {
    const { data } = await supabase
      .from('eco_items')
      .select(`
        owner_id,
        co2_saved,
        profiles!inner(username)
      `);

    if (data) {
      const contributorData: { [key: string]: { username: string; co2: number } } = {};

      data.forEach(item => {
        const ownerId = item.owner_id;
        if (!contributorData[ownerId]) {
          contributorData[ownerId] = {
            username: item.profiles?.username || 'Anonymous',
            co2: 0
          };
        }
        contributorData[ownerId].co2 += item.co2_saved || 0;
      });

      const topContribs = Object.values(contributorData)
        .sort((a, b) => b.co2 - a.co2)
        .slice(0, 5)
        .map(contrib => ({
          username: contrib.username,
          co2Saved: Math.round(contrib.co2)
        }));

      setTopContributors(topContribs);
    }
  };

  const getColorForCategory = (category: string) => {
    const colors = {
      'Electronics': 'hsl(var(--primary))',
      'Transportation': 'hsl(var(--eco-success))',
      'Lifestyle': 'hsl(var(--accent))',
      'Garden': 'hsl(var(--eco-warning))'
    };
    return colors[category as keyof typeof colors] || 'hsl(var(--muted))';
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">EcoFinds Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track the environmental impact of our sustainable marketplace
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {user && `+${stats.userItems} by you`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
            <Leaf className="h-4 w-4 text-eco-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-eco-success">
              {Math.round(stats.totalCO2Saved)}kg
            </div>
            <p className="text-xs text-muted-foreground">
              {user && `+${Math.round(stats.userCO2Saved)}kg by you`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-eco-success">
              Growing community
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round(stats.totalCO2Saved / Math.max(stats.totalItems, 1))}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg CO₂ per item
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Items by Category</CardTitle>
            <CardDescription>Distribution of eco-friendly items</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Items",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* CO2 Trend */}
        <Card>
          <CardHeader>
            <CardTitle>CO₂ Impact Trend</CardTitle>
            <CardDescription>Monthly CO₂ savings over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                co2Saved: {
                  label: "CO₂ Saved (kg)",
                  color: "hsl(var(--eco-success))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={co2TrendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="hsl(var(--eco-success))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Environmental Contributors</CardTitle>
          <CardDescription>Community members making the biggest impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topContributors.map((contributor, index) => (
              <div key={contributor.username} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-yellow-900' :
                    index === 1 ? 'bg-gray-400 text-gray-900' :
                    index === 2 ? 'bg-amber-600 text-amber-900' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{contributor.username}</span>
                </div>
                <div className="text-right">
                  <span className="text-eco-success font-bold">
                    {contributor.co2Saved}kg CO₂
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}