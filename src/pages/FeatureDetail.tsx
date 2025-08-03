import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const FeatureDetail = () => {
  const { id } = useParams();
  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Feature {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Details about feature {id} will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureDetail;
