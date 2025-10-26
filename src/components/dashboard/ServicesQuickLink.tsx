import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Package, Eye, Plus } from 'lucide-react';

export function ServicesQuickLink() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle>Services & Products</CardTitle>
        </div>
        <CardDescription>
          Manage the services customers can book appointments for
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/dentist-services">
              <Plus className="h-4 w-4 mr-2" />
              Manage Services
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/book-appointment">
              <Eye className="h-4 w-4 mr-2" />
              Preview Booking Flow
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
