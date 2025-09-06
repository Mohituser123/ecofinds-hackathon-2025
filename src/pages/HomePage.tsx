import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemCard } from '@/components/ItemCard';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Leaf, Recycle, Users, ArrowRight } from 'lucide-react';

interface EcoItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  co2_saved: number;
  category: string;
  condition: string;
}

export default function HomePage() {
  const [featuredItems, setFeaturedItems] = useState<EcoItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<EcoItem[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalCO2Saved: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchFeaturedItems();
    fetchTrendingItems();
    fetchStats();
  }, []);

  const fetchFeaturedItems = async () => {
    const { data } = await supabase
      .from('eco_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4);

    if (data) setFeaturedItems(data);
  };

  const fetchTrendingItems = async () => {
    const { data } = await supabase
      .from('eco_items')
      .select('*')
      .order('co2_saved', { ascending: false })
      .limit(4);

    if (data) setTrendingItems(data);
  };

  const fetchStats = async () => {
    const [itemsResult, co2Result, usersResult] = await Promise.all([
      supabase.from('eco_items').select('id', { count: 'exact', head: true }),
      supabase.from('eco_items').select('co2_saved'),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
    ]);

    const totalCO2 = co2Result.data?.reduce((sum, item) => sum + (item.co2_saved || 0), 0) || 0;

    setStats({
      totalItems: itemsResult.count || 0,
      totalCO2Saved: totalCO2,
      activeUsers: usersResult.count || 0
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/30" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Discover{' '}
              <span className="bg-gradient-to-r from-primary to-eco-success bg-clip-text text-transparent">
                EcoFinds
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              The sustainable marketplace where every purchase makes a difference. 
              Buy, sell, and trade eco-friendly items while reducing your carbon footprint.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to="/marketplace">
                  Explore Marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Recycle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold text-primary">
                  {stats.totalItems}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Eco Items Listed</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-eco-success/10 rounded-full flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-eco-success" />
                </div>
                <CardTitle className="text-3xl font-bold text-eco-success">
                  {Math.round(stats.totalCO2Saved)}kg
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">CO₂ Saved</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
                <CardTitle className="text-3xl font-bold">
                  {stats.activeUsers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Active Users</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Featured Items</h2>
              <p className="text-muted-foreground mt-2">
                Discover the latest eco-friendly products
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/marketplace">View All</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                price={item.price}
                image_url={item.image_url}
                co2_saved={item.co2_saved}
                category={item.category}
                condition={item.condition}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Items */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Trending by Impact</h2>
              <p className="text-muted-foreground mt-2">
                Items with the highest CO₂ savings
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/marketplace?sort=co2_saved">View All</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingItems.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                price={item.price}
                image_url={item.image_url}
                co2_saved={item.co2_saved}
                category={item.category}
                condition={item.condition}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-8">
              EcoFinds is more than a marketplace – it's a community committed to sustainable living. 
              Every item bought and sold here contributes to a greener future, reducing waste and 
              promoting circular economy principles.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary">
                Sustainable Shopping
              </Badge>
              <Badge className="px-4 py-2 bg-eco-success/10 text-eco-success border-eco-success">
                Carbon Footprint Reduction
              </Badge>
              <Badge className="px-4 py-2 bg-accent/10 text-accent-foreground border-accent">
                Circular Economy
              </Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}