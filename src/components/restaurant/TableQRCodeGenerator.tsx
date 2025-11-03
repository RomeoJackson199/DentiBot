import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

interface TableQRCodeGeneratorProps {
  table: any;
  businessSlug: string;
}

export function TableQRCodeGenerator({ table, businessSlug }: TableQRCodeGeneratorProps) {
  const orderUrl = `${window.location.origin}/order?table=${table.id}&business=${businessSlug}`;

  const downloadQR = () => {
    const svg = document.getElementById(`qr-${table.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `table-${table.table_number}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Table ${table.table_number} QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #000;
              padding: 30px;
              border-radius: 10px;
            }
            h1 { margin: 0 0 10px 0; font-size: 32px; }
            p { margin: 10px 0; font-size: 18px; }
            .qr-code { margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>Table ${table.table_number}</h1>
            <p>Scan to view menu & order</p>
            <div class="qr-code">
              ${document.getElementById(`qr-${table.id}`)?.outerHTML}
            </div>
            <p style="font-size: 14px; color: #666;">Capacity: ${table.capacity} guests</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table {table.table_number}</CardTitle>
        <CardDescription>
          QR Code for customer ordering • Capacity: {table.capacity}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center p-4 bg-white rounded-lg">
          <QRCodeSVG
            id={`qr-${table.id}`}
            value={orderUrl}
            size={200}
            level="H"
            includeMargin
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadQR} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={printQR} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          <p>Customers scan this code to:</p>
          <p>• View the menu</p>
          <p>• Place orders directly</p>
          <p>• Track order status</p>
        </div>
      </CardContent>
    </Card>
  );
}
