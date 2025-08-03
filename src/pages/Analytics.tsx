import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalytics } from "@/lib/mockApi";

const Analytics = () => {
  const [data, setData] = useState<{ totalVisits: number; streak: number } | null>(null);

  useEffect(() => {
    getAnalytics().then(res => {
      if (res.data) setData(res.data);
    });
  }, []);

  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {data ? (
            <ul className="space-y-2">
              <li>Total visits: {data.totalVisits}</li>
              <li>Current streak: {data.streak}</li>
            </ul>
          ) : (
            <p>Loading analytics...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
