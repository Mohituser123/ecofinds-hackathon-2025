import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ItemCard } from '@/components/ItemCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Edit3, Leaf, Package, Calendar } from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
  created_at: string;
}

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

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userItems, setUserItems] = useState<EcoItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalCO2Saved: 0,
    joinDate: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserItems();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      setProfile(data);
      setStats(prev => ({
        ...prev,
        joinDate: new Date(data.created_at).toLocaleDateString()
      }));
    } else {
      // Create profile if it doesn't exist
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          username: user.email?.split('@')[0] || 'EcoFinder'
        }]);

      if (!insertError) {
        fetchProfile();
      }
    }
  };

  const fetchUserItems = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('eco_items')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setUserItems(data);
      const totalCO2 = data.reduce((sum, item) => sum + (item.co2_saved || 0), 0);
      setStats(prev => ({
        ...prev,
        totalItems: data.length,
        totalCO2Saved: totalCO2
      }));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const updates = {
      username: formData.get('username') as string,
      bio: formData.get('bio') as string,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setProfile({ ...profile, ...updates });
      setIsEditing(false);
      toast({
        title: "Profile updated successfully"
      });
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="text-muted-foreground">
          Please sign in to view your profile
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-2xl">
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                  {profile?.username || 'EcoFinder'}
                </h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
              
              <p className="text-muted-foreground">
                {profile?.bio || 'Passionate about sustainable living and eco-friendly products'}
              </p>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {stats.joinDate}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Badge variant="secondary" className="justify-center">
                <Package className="w-3 h-3 mr-1" />
                {stats.totalItems} Items
              </Badge>
              <Badge variant="secondary" className="justify-center text-eco-success">
                <Leaf className="w-3 h-3 mr-1" />
                {Math.round(stats.totalCO2Saved)}kg CO₂
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    defaultValue={profile?.username || ''}
                    placeholder="Your username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={profile?.bio || ''}
                  placeholder="Tell us about yourself and your eco-friendly journey..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Profile Content Tabs */}
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">My Items ({stats.totalItems})</TabsTrigger>
          <TabsTrigger value="impact">Environmental Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {userItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userItems.map((item) => (
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
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Items Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start your eco-friendly journey by listing your first item
                </p>
                <Button asChild>
                  <a href="/add-item">Add Your First Item</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Leaf className="w-5 h-5 mr-2 text-eco-success" />
                  Total CO₂ Saved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-eco-success">
                  {Math.round(stats.totalCO2Saved)}kg
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Equivalent to planting {Math.round(stats.totalCO2Saved / 22)} trees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2 text-primary" />
                  Items Listed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {stats.totalItems}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Contributing to circular economy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.totalItems > 0 ? Math.round(stats.totalCO2Saved / stats.totalItems) : 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Average CO₂ saved per item
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Environmental Contribution</CardTitle>
              <CardDescription>
                Every item you list helps build a more sustainable future
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span>Items preventing waste</span>
                  <Badge variant="outline">{stats.totalItems} items</Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Carbon footprint reduction</span>
                  <Badge variant="outline" className="text-eco-success">
                    {Math.round(stats.totalCO2Saved)}kg CO₂
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Contribution to circular economy</span>
                  <Badge variant="outline" className="text-primary">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}