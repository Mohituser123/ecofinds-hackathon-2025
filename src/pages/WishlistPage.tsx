import { useEffect, useState } from 'react';
import { ItemCard } from '@/components/ItemCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EcoItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  co2_saved: number;
  category: string;
  condition: string;
  created_at: string;
}

export default function WishlistPage() {
  const { user } = useAuth();
  const [favoriteItems, setFavoriteItems] = useState<EcoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavoriteItems();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFavoriteItems = async () => {
    if (!user) return;

    setLoading(true);

    const { data } = await supabase
      .from('favorites')
      .select(`
        item_id,
        eco_items (
          id,
          title,
          description,
          price,
          image_url,
          co2_saved,
          category,
          condition,
          created_at
        )
      `)
      .eq('user_id', user.id);

    if (data) {
      // Filter out any null eco_items (in case item was deleted)
      const items = data
        .filter(favorite => favorite.eco_items)
        .map(favorite => favorite.eco_items) as EcoItem[];
      
      setFavoriteItems(items);
    }

    setLoading(false);
  };

  const handleFavoriteChange = () => {
    fetchFavoriteItems();
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Sign in to view your wishlist</h1>
          <p className="text-muted-foreground mb-6">
            Save your favorite eco-friendly items for later
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted rounded-lg aspect-square mb-4"></div>
              <div className="space-y-2">
                <div className="bg-muted h-4 rounded w-3/4"></div>
                <div className="bg-muted h-3 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
        <p className="text-muted-foreground">
          Your favorite eco-friendly items saved for later
        </p>
      </div>

      {favoriteItems.length > 0 ? (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {favoriteItems.length} item{favoriteItems.length !== 1 ? 's' : ''} in your wishlist
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                <span>Total CO₂ impact: {Math.round(favoriteItems.reduce((sum, item) => sum + (item.co2_saved || 0), 0))}kg</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteItems.map((item) => (
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
                isFavorited={true}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start exploring eco-friendly items and save your favorites for later
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full sm:w-auto">
                <Link to="/marketplace">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Browse Marketplace
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}