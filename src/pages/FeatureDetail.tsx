import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const content: Record<string, { title: string; body: string }> = {
  scheduling: {
    title: "Smart Scheduling",
    body: "Book appointments with real-time availability and priority handling."
  },
  analytics: {
    title: "Analytics",
    body: "Track your visits and improvement over time."
  }
};

const FeatureDetail = () => {
  const { id = "" } = useParams();
  const feature = content[id] || { title: `Feature ${id}`, body: "Details coming soon." };
  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{feature.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{feature.body}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureDetail;
