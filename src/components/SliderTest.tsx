import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SliderTest() {
  const [duration, setDuration] = useState([7]);
  const [cost, setCost] = useState([500]);
  const [painLevel, setPainLevel] = useState([5]);
  const [frequency, setFrequency] = useState([2]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Slider Component Test</h1>
      <p className="text-muted-foreground">This component tests if the slider components are working properly.</p>

      <Card>
        <CardHeader>
          <CardTitle>Prescription Duration Slider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Duration: {duration[0]} days</Label>
            <Slider
              value={duration}
              onValueChange={setDuration}
              max={90}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 day</span>
              <span>90 days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost Slider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cost: €{cost[0]}</Label>
            <Slider
              value={cost}
              onValueChange={setCost}
              max={5000}
              min={50}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>€50</span>
              <span>€5000</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pain Level Slider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pain Level: {painLevel[0]}/10</Label>
            <Slider
              value={painLevel}
              onValueChange={setPainLevel}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>😊 1</span>
              <span>😰 10</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequency Slider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Times per day: {frequency[0]}</Label>
            <Slider
              value={frequency}
              onValueChange={setFrequency}
              max={6}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 time</span>
              <span>6 times</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900">Test Results:</h3>
        <ul className="mt-2 text-sm text-blue-800 space-y-1">
          <li>• Duration: {duration[0]} days</li>
          <li>• Cost: €{cost[0]}</li>
          <li>• Pain Level: {painLevel[0]}/10</li>
          <li>• Frequency: {frequency[0]} times per day</li>
        </ul>
      </div>
    </div>
  );
}