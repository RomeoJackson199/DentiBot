import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Zap,
  ArrowRight,
  CheckCircle,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalculatorInputs {
  practiceSize: 'small' | 'medium' | 'large';
  monthlyPatients: number;
  avgAppointmentValue: number;
  noShowRate: number;
  adminHoursPerWeek: number;
  hourlyAdminCost: number;
}

interface ROIResults {
  monthlySubscriptionCost: number;
  recapturedRevenue: number;
  timeSavings: number;
  timeSavingsCost: number;
  totalMonthlySavings: number;
  annualSavings: number;
  roi: number;
  breakEvenDays: number;
}

const PRACTICE_SIZES = {
  small: { name: "Small Practice", patients: 500, cost: 99 },
  medium: { name: "Medium Practice", patients: 2500, cost: 250 },
  large: { name: "Large Practice", patients: 7500, cost: 999 },
};

export function ROICalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    practiceSize: 'medium',
    monthlyPatients: 200,
    avgAppointmentValue: 150,
    noShowRate: 15,
    adminHoursPerWeek: 20,
    hourlyAdminCost: 25,
  });

  const [results, setResults] = useState<ROIResults | null>(null);

  useEffect(() => {
    calculateROI();
  }, [inputs]);

  const calculateROI = () => {
    const subscriptionCost = PRACTICE_SIZES[inputs.practiceSize].cost;

    // Calculate recaptured revenue from reducing no-shows by 40%
    const currentNoShows = (inputs.monthlyPatients * inputs.noShowRate) / 100;
    const reducedNoShows = currentNoShows * 0.4; // 40% reduction
    const recapturedRevenue = reducedNoShows * inputs.avgAppointmentValue;

    // Calculate time savings (60% reduction in admin time)
    const monthlyAdminHours = inputs.adminHoursPerWeek * 4.33; // Average weeks per month
    const savedHours = monthlyAdminHours * 0.6; // 60% time savings
    const timeSavingsCost = savedHours * inputs.hourlyAdminCost;

    // Calculate total savings and ROI
    const totalMonthlySavings = recapturedRevenue + timeSavingsCost;
    const netMonthlySavings = totalMonthlySavings - subscriptionCost;
    const annualSavings = netMonthlySavings * 12;
    const roi = ((netMonthlySavings * 12) / (subscriptionCost * 12)) * 100;

    // Calculate break-even
    const breakEvenDays = (subscriptionCost / totalMonthlySavings) * 30;

    setResults({
      monthlySubscriptionCost: subscriptionCost,
      recapturedRevenue,
      timeSavings: savedHours,
      timeSavingsCost,
      totalMonthlySavings,
      annualSavings,
      roi,
      breakEvenDays: Math.max(1, Math.round(breakEvenDays)),
    });
  };

  const updateInput = (key: keyof CalculatorInputs, value: any) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ROI Calculator
        </h2>
        <p className="text-lg text-gray-600">
          See how much you can save with Caberu based on your practice size
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Your Practice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Practice Size */}
            <div className="space-y-2">
              <Label htmlFor="practiceSize" className="flex items-center gap-2">
                Practice Size
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Select your practice size based on total active patients</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={inputs.practiceSize}
                onValueChange={(value: any) => updateInput('practiceSize', value)}
              >
                <SelectTrigger id="practiceSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRACTICE_SIZES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.name} (up to {value.patients.toLocaleString()} patients)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Monthly Cost: <span className="font-semibold">${PRACTICE_SIZES[inputs.practiceSize].cost}</span>
              </p>
            </div>

            {/* Monthly Patients */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Monthly Patient Appointments
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[inputs.monthlyPatients]}
                  onValueChange={([value]) => updateInput('monthlyPatients', value)}
                  min={50}
                  max={1000}
                  step={10}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={inputs.monthlyPatients}
                  onChange={(e) => updateInput('monthlyPatients', parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              <p className="text-xs text-gray-500">Number of appointments per month</p>
            </div>

            {/* Average Appointment Value */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Average Appointment Value ($)
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[inputs.avgAppointmentValue]}
                  onValueChange={([value]) => updateInput('avgAppointmentValue', value)}
                  min={50}
                  max={500}
                  step={10}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={inputs.avgAppointmentValue}
                  onChange={(e) => updateInput('avgAppointmentValue', parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              <p className="text-xs text-gray-500">Average revenue per appointment</p>
            </div>

            {/* No-Show Rate */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Current No-Show Rate (%)
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[inputs.noShowRate]}
                  onValueChange={([value]) => updateInput('noShowRate', value)}
                  min={0}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={inputs.noShowRate}
                  onChange={(e) => updateInput('noShowRate', parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              <p className="text-xs text-gray-500">Industry average is 15-20%</p>
            </div>

            {/* Admin Hours */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Admin Hours Per Week
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[inputs.adminHoursPerWeek]}
                  onValueChange={([value]) => updateInput('adminHoursPerWeek', value)}
                  min={5}
                  max={60}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={inputs.adminHoursPerWeek}
                  onChange={(e) => updateInput('adminHoursPerWeek', parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              <p className="text-xs text-gray-500">Spent on scheduling, reminders, admin tasks</p>
            </div>

            {/* Hourly Admin Cost */}
            <div className="space-y-2">
              <Label htmlFor="adminCost">Hourly Admin Cost ($)</Label>
              <Input
                id="adminCost"
                type="number"
                value={inputs.hourlyAdminCost}
                onChange={(e) => updateInput('hourlyAdminCost', parseInt(e.target.value) || 0)}
                min={10}
                max={100}
              />
              <p className="text-xs text-gray-500">Average cost per hour for admin staff</p>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        {results && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Your Potential Savings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Break Even */}
              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {results.breakEvenDays} Days
                </div>
                <p className="text-gray-600 font-medium">To Break Even</p>
                <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
                  ROI: {results.roi.toFixed(0)}%
                </Badge>
              </div>

              {/* Monthly Savings Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Recaptured Revenue</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    +${results.recapturedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Time Savings</p>
                      <p className="text-xs text-gray-500">{results.timeSavings.toFixed(0)} hours/month</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    +${results.timeSavingsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Subscription Cost</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    -${results.monthlySubscriptionCost}
                  </span>
                </div>
              </div>

              {/* Total Savings */}
              <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                <p className="text-sm font-medium mb-1">Net Monthly Savings</p>
                <div className="text-4xl font-bold mb-3">
                  ${(results.totalMonthlySavings - results.monthlySubscriptionCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-green-100 text-sm">
                  ${results.annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} per year
                </p>
              </div>

              {/* Key Benefits */}
              <div className="space-y-2">
                <p className="font-semibold text-sm text-gray-700">What You Get:</p>
                <div className="space-y-1.5">
                  {[
                    "40% reduction in no-shows",
                    "60% less admin time",
                    "Automated reminders & scheduling",
                    "Complete patient management",
                    "HIPAA-compliant security",
                    "AI-powered insights"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Call to Action */}
      {results && results.roi > 0 && (
        <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">
                  Start Saving ${((results.totalMonthlySavings - results.monthlySubscriptionCost) * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} Per Year
                </h3>
                <p className="text-blue-100">
                  Join hundreds of practices already using Caberu to grow their business
                </p>
              </div>
              <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group">
                Start Free Trial
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-500 italic">
        * Calculations are estimates based on industry averages and actual results may vary.
        Based on 40% no-show reduction and 60% admin time savings reported by Caberu users.
      </p>
    </div>
  );
}
