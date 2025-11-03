import { useBusinessTemplate } from '@/hooks/useBusinessTemplate';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed } from 'lucide-react';

interface RestaurantMenuManagerProps {
  businessId: string;
}

export function RestaurantMenuManager({ businessId }: RestaurantMenuManagerProps) {
  const { t } = useBusinessTemplate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <p className="text-muted-foreground">Manage your restaurant menu items</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            {t('servicePlural')} Configuration
          </CardTitle>
          <CardDescription>
            Your menu items are managed through the {t('servicePlural')} page. Each service represents a menu item that customers can order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/dentist-services">
              Go to {t('servicePlural')} Management
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menu Item Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Use the <strong>Category</strong> field to organize items (Appetizers, Mains, Desserts, Beverages)</p>
          <p>• Add detailed descriptions to help customers make choices</p>
          <p>• Upload appealing photos for better presentation</p>
          <p>• Set accurate prices and preparation times</p>
          <p>• Mark items as inactive if temporarily unavailable</p>
        </CardContent>
      </Card>
    </div>
  );
}
