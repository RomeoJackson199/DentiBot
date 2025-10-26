import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Package, Eye, Plus, ExternalLink } from 'lucide-react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { useBusinessTemplate } from '@/hooks/useBusinessTemplate';

export function ServicesQuickLink() {
  const { businessSlug } = useBusinessContext();
  const { t } = useBusinessTemplate();

  const handlePreviewBooking = () => {
    if (businessSlug) {
      window.open(`/book/${businessSlug}`, '_blank');
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle>{t('servicePlural')} & Products</CardTitle>
        </div>
        <CardDescription>
          Manage the {t('servicePlural').toLowerCase()} {t('customerPlural').toLowerCase()} can book {t('appointmentPlural').toLowerCase()} for
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/dentist-services">
              <Plus className="h-4 w-4 mr-2" />
              Manage {t('servicePlural')}
            </Link>
          </Button>
          <Button variant="outline" onClick={handlePreviewBooking} disabled={!businessSlug}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview {t('customer')} Booking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
