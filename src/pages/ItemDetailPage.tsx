import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Heart, Leaf, User, Mail } from 'lucide-react';

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
  owner_id: string;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [item, setItem] = useState<EcoItem | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItem();
      if (user) {
        checkIfFavorited();
      }
    }
  }, [id, user]);

  const fetchItem = async () => {
    if (!id) return;

    setLoading(true);
    const { data: itemData } = await supabase
      .from('eco_items')
      .select('*')
      .eq('id', id)
      .single();

    if (itemData) {
      setItem(itemData);
      
      // Fetch owner profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', itemData.owner_id)
        .single();

      if (profileData) {
        setOwner(profileData);
      }
    }
    setLoading(false);
  };

  const checkIfFavorited = async () => {
    if (!user || !id) return;

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', id)
      .single();

    setIsFavorited(!!data);
  };

  const handleFavorite = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to favorite items",
        variant: "destructive"
      });
      return;
    }

    if (!id) return;

    setFavoriteLoading(true);

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', id);

        if (error) throw error;
        
        setIsFavorited(false);
        toast({
          title: "Removed from wishlist"
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            item_id: id
          });

        if (error) throw error;
        
        setIsFavorited(true);
        toast({
          title: "Added to wishlist"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="bg-muted h-8 w-32 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-muted aspect-square rounded-lg"></div>
            <div className="space-y-4">
              <div className="bg-muted h-8 w-3/4"></div>
              <div className="bg-muted h-4 w-1/2"></div>
              <div className="bg-muted h-20 w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Item not found</h1>
        <Button asChild>
          <Link to="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/marketplace">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Item Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavorite}
                disabled={favoriteLoading}
              >
                <Heart 
                  className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                />
              </Button>
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-3xl font-bold text-primary">
                ${item.price?.toFixed(2)}
              </span>
              <div className="flex items-center space-x-1 text-eco-success">
                <Leaf className="h-4 w-4" />
                <span className="font-medium">{item.co2_saved}kg CO₂ saved</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="secondary">{item.category}</Badge>
              <Badge variant="outline">{item.condition}</Badge>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Environmental Impact */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <Leaf className="mr-2 h-5 w-5 text-eco-success" />
                Environmental Impact
              </h3>
              <div className="bg-eco-success/10 p-4 rounded-lg">
                <p className="text-sm text-eco-success font-medium">
                  By choosing this item, you're helping save approximately {item.co2_saved}kg of CO₂ 
                  from entering the atmosphere. This is equivalent to taking a car off the road for several days!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seller Information */}
          {owner && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Seller Information</h3>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={owner.avatar_url} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{owner.username || 'EcoFinder'}</p>
                    <p className="text-sm text-muted-foreground">
                      Member since {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Actions */}
          <div className="space-y-3">
            <Button className="w-full" size="lg">
              <Mail className="mr-2 h-4 w-4" />
              Contact Seller
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              Make Offer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}