import { Heart, Leaf } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface ItemCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  co2_saved: number;
  category: string;
  condition: string;
  isFavorited?: boolean;
  onFavoriteChange?: () => void;
}

export function ItemCard({
  id,
  title,
  description,
  price,
  image_url,
  co2_saved,
  category,
  condition,
  isFavorited = false,
  onFavoriteChange,
}: ItemCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to favorite items",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (favorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', id);

        if (error) throw error;
        
        setFavorited(false);
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
        
        setFavorited(true);
        toast({
          title: "Added to wishlist"
        });
      }
      
      onFavoriteChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link to={`/item/${id}`}>
      <Card className="group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
        <div className="aspect-square overflow-hidden">
          <img
            src={image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold line-clamp-1">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              disabled={loading}
              className="p-1 h-auto"
            >
              <Heart 
                className={`h-4 w-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} 
              />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-primary">
              ${price?.toFixed(2)}
            </span>
            <div className="flex items-center space-x-1 text-sm text-eco-success">
              <Leaf className="h-3 w-3" />
              <span>{co2_saved}kg CO₂</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {condition}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}