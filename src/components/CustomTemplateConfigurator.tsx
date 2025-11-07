import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  FileText,
  Pill,
  Calendar,
  CreditCard,
  Camera,
  AlertTriangle,
  Save,
  Plus,
  X,
  Eye,
  Layout,
  Sparkles,
  Settings,
  List,
  DollarSign,
  Clock,
  Tag,
  Palette,
  LayoutDashboard,
  Navigation as NavigationIcon,
  CheckSquare,
  Bot
} from 'lucide-react';
import {
  TemplateFeatures,
  TemplateTerminology,
  LayoutCustomization,
  QuickAddService,
  CompletionStep,
  AIBehaviorDefaults,
  ServiceFieldLabels
} from '@/lib/businessTemplates';

interface CustomTemplateConfiguratorProps {
  initialFeatures?: TemplateFeatures;
  initialTerminology?: TemplateTerminology;
  initialLayoutCustomization?: LayoutCustomization;
  initialAppointmentReasons?: string[];
  initialServiceCategories?: string[];
  initialQuickAddServices?: QuickAddService[];
  initialCompletionSteps?: CompletionStep[];
  initialNavigationItems?: string[];
  initialAIBehavior?: AIBehaviorDefaults;
  initialServiceFieldLabels?: ServiceFieldLabels;
  onSave: (config: FullTemplateConfig) => void;
  showPreview?: boolean;
}

export interface FullTemplateConfig {
  features: TemplateFeatures;
  terminology: TemplateTerminology;
  layoutCustomization: LayoutCustomization;
  appointmentReasons: string[];
  serviceCategories: string[];
  quickAddServices: QuickAddService[];
  completionSteps: CompletionStep[];
  navigationItems: string[];
  aiBehaviorDefaults: AIBehaviorDefaults;
  serviceFieldLabels: ServiceFieldLabels;
}

const featureDefinitions = [
  {
    key: 'appointments' as keyof TemplateFeatures,
    name: 'Appointment System',
    description: 'Core appointment booking and scheduling functionality',
    icon: Calendar,
    recommended: true,
  },
  {
    key: 'services' as keyof TemplateFeatures,
    name: 'Service Management',
    description: 'Manage services, pricing, and service categories',
    icon: Settings,
    recommended: true,
  },
  {
    key: 'aiChat' as keyof TemplateFeatures,
    name: 'AI Chat Assistant',
    description: 'AI-powered chat for appointment booking and customer support',
    icon: MessageSquare,
  },
  {
    key: 'prescriptions' as keyof TemplateFeatures,
    name: 'Prescriptions',
    description: 'Manage and issue digital prescriptions (medical practices)',
    icon: Pill,
  },
  {
    key: 'treatmentPlans' as keyof TemplateFeatures,
    name: 'Treatment Plans',
    description: 'Create and track comprehensive treatment or service plans',
    icon: FileText,
  },
  {
    key: 'medicalRecords' as keyof TemplateFeatures,
    name: 'Medical Records',
    description: 'Store and access complete medical history',
    icon: FileText,
  },
  {
    key: 'photoUpload' as keyof TemplateFeatures,
    name: 'Photo Upload',
    description: 'Upload and manage photos for documentation (before/after, etc.)',
    icon: Camera,
  },
  {
    key: 'urgencyLevels' as keyof TemplateFeatures,
    name: 'Urgency Levels',
    description: 'Priority-based scheduling for urgent appointments',
    icon: AlertTriangle,
  },
  {
    key: 'paymentRequests' as keyof TemplateFeatures,
    name: 'Payment Requests',
    description: 'Send and track payment requests to customers',
    icon: CreditCard,
  },
];

const defaultCompletionSteps: CompletionStep[] = [
  { id: 'overview', title: 'Overview', enabled: true },
  { id: 'services', title: 'Services', enabled: true },
  { id: 'notes', title: 'Notes', enabled: true },
  { id: 'billing', title: 'Payment', enabled: true },
  { id: 'complete', title: 'Complete', enabled: true },
];

const defaultNavigationItems = [
  'dashboard',
  'appointments',
  'customers',
  'services',
  'analytics',
  'settings',
];

export function CustomTemplateConfigurator({
  initialFeatures,
  initialTerminology,
  initialLayoutCustomization,
  initialAppointmentReasons,
  initialServiceCategories,
  initialQuickAddServices,
  initialCompletionSteps,
  initialNavigationItems,
  initialAIBehavior,
  initialServiceFieldLabels,
  onSave,
  showPreview = true,
}: CustomTemplateConfiguratorProps) {
  // Features
  const [features, setFeatures] = useState<TemplateFeatures>(
    initialFeatures || {
      prescriptions: false,
      treatmentPlans: false,
      medicalRecords: false,
      photoUpload: true,
      urgencyLevels: false,
      paymentRequests: true,
      aiChat: true,
      appointments: true,
      services: true,
    }
  );

  // Terminology
  const [terminology, setTerminology] = useState<TemplateTerminology>(
    initialTerminology || {
      customer: 'Customer',
      customerPlural: 'Customers',
      provider: 'Provider',
      providerPlural: 'Providers',
      appointment: 'Appointment',
      appointmentPlural: 'Appointments',
      service: 'Service',
      servicePlural: 'Services',
      business: 'Business',
    }
  );

  // Layout Customization
  const [layoutCustomization, setLayoutCustomization] = useState<LayoutCustomization>(
    initialLayoutCustomization || {
      primaryColor: '#3b82f6',
      dashboardLayout: 'default',
      showQuickStats: true,
      showUpcomingAppointments: true,
      showRecentActivity: true,
      showRevenueChart: true,
      cardStyle: 'elevated',
    }
  );

  // Appointment Reasons
  const [appointmentReasons, setAppointmentReasons] = useState<string[]>(
    initialAppointmentReasons || ['Consultation', 'Service', 'Follow-up', 'Meeting']
  );
  const [newReason, setNewReason] = useState('');

  // Service Categories
  const [serviceCategories, setServiceCategories] = useState<string[]>(
    initialServiceCategories || ['Standard Services', 'Consultations', 'Premium Services', 'Packages']
  );
  const [newCategory, setNewCategory] = useState('');

  // Quick Add Services
  const [quickAddServices, setQuickAddServices] = useState<QuickAddService[]>(
    initialQuickAddServices || [
      { name: 'Standard Service', price: 50, duration: 60, description: 'Basic professional service offering', category: 'Standard Services' },
      { name: 'Consultation', price: 75, duration: 45, description: 'One-on-one consultation session', category: 'Consultations' },
    ]
  );
  const [editingService, setEditingService] = useState<QuickAddService | null>(null);

  // Completion Steps
  const [completionSteps, setCompletionSteps] = useState<CompletionStep[]>(
    initialCompletionSteps || defaultCompletionSteps
  );

  // Navigation Items
  const [navigationItems, setNavigationItems] = useState<string[]>(
    initialNavigationItems || defaultNavigationItems
  );
  const [newNavItem, setNewNavItem] = useState('');

  // AI Behavior
  const [aiBehavior, setAIBehavior] = useState<AIBehaviorDefaults>(
    initialAIBehavior || {
      systemBehavior: 'You are a helpful assistant for a professional service business. Be courteous, efficient, and focused on providing excellent customer service.',
      greeting: 'Hello! How can I assist you today?',
      personalityTraits: ['Professional', 'Helpful', 'Courteous'],
    }
  );
  const [newTrait, setNewTrait] = useState('');

  // Service Field Labels
  const [serviceFieldLabels, setServiceFieldLabels] = useState<ServiceFieldLabels>(
    initialServiceFieldLabels || {
      serviceName: 'Service Name',
      serviceNamePlaceholder: 'e.g., Consultation, Standard Service, Custom Package',
      descriptionPlaceholder: 'Describe what this service includes...',
      categoryLabel: 'Service Category',
      durationLabel: 'Service Duration (minutes)',
    }
  );

  const handleFeatureToggle = (key: keyof TemplateFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTerminologyChange = (key: keyof TemplateTerminology, value: string) => {
    setTerminology(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLayoutChange = (key: keyof LayoutCustomization, value: any) => {
    setLayoutCustomization(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addAppointmentReason = () => {
    if (newReason.trim()) {
      setAppointmentReasons(prev => [...prev, newReason.trim()]);
      setNewReason('');
    }
  };

  const removeAppointmentReason = (index: number) => {
    setAppointmentReasons(prev => prev.filter((_, i) => i !== index));
  };

  const addServiceCategory = () => {
    if (newCategory.trim()) {
      setServiceCategories(prev => [...prev, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeServiceCategory = (index: number) => {
    setServiceCategories(prev => prev.filter((_, i) => i !== index));
  };

  const addQuickService = () => {
    setEditingService({
      name: '',
      price: 0,
      duration: 30,
      description: '',
      category: serviceCategories[0] || 'Standard Services',
    });
  };

  const saveQuickService = () => {
    if (editingService && editingService.name.trim()) {
      const existingIndex = quickAddServices.findIndex(s => s.name === editingService.name);
      if (existingIndex >= 0) {
        setQuickAddServices(prev => prev.map((s, i) => i === existingIndex ? editingService : s));
      } else {
        setQuickAddServices(prev => [...prev, editingService]);
      }
      setEditingService(null);
    }
  };

  const removeQuickService = (index: number) => {
    setQuickAddServices(prev => prev.filter((_, i) => i !== index));
  };

  const addNavigationItem = () => {
    if (newNavItem.trim()) {
      setNavigationItems(prev => [...prev, newNavItem.trim()]);
      setNewNavItem('');
    }
  };

  const removeNavigationItem = (index: number) => {
    setNavigationItems(prev => prev.filter((_, i) => i !== index));
  };

  const addPersonalityTrait = () => {
    if (newTrait.trim()) {
      setAIBehavior(prev => ({
        ...prev,
        personalityTraits: [...prev.personalityTraits, newTrait.trim()],
      }));
      setNewTrait('');
    }
  };

  const removePersonalityTrait = (index: number) => {
    setAIBehavior(prev => ({
      ...prev,
      personalityTraits: prev.personalityTraits.filter((_, i) => i !== index),
    }));
  };

  const toggleCompletionStep = (id: string) => {
    setCompletionSteps(prev =>
      prev.map(step => step.id === id ? { ...step, enabled: !step.enabled } : step)
    );
  };

  const handleSave = () => {
    const config: FullTemplateConfig = {
      features,
      terminology,
      layoutCustomization,
      appointmentReasons,
      serviceCategories,
      quickAddServices,
      completionSteps,
      navigationItems,
      aiBehaviorDefaults: aiBehavior,
      serviceFieldLabels,
    };
    onSave(config);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="terminology">Terms</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Features
              </CardTitle>
              <CardDescription>
                Select which features you want to include in your custom template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {featureDefinitions.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className="flex items-start justify-between gap-4 p-3 rounded-lg border hover:border-primary/50 transition-colors">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium">{feature.name}</Label>
                          {feature.recommended && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={features[feature.key]}
                      onCheckedChange={() => handleFeatureToggle(feature.key)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terminology Tab */}
        <TabsContent value="terminology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Terminology
              </CardTitle>
              <CardDescription>
                Customize the terminology used throughout your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer (singular)</Label>
                  <Input
                    id="customer"
                    value={terminology.customer}
                    onChange={(e) => handleTerminologyChange('customer', e.target.value)}
                    placeholder="e.g., Patient, Client, Member"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPlural">Customer (plural)</Label>
                  <Input
                    id="customerPlural"
                    value={terminology.customerPlural}
                    onChange={(e) => handleTerminologyChange('customerPlural', e.target.value)}
                    placeholder="e.g., Patients, Clients, Members"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider (singular)</Label>
                  <Input
                    id="provider"
                    value={terminology.provider}
                    onChange={(e) => handleTerminologyChange('provider', e.target.value)}
                    placeholder="e.g., Doctor, Stylist, Trainer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerPlural">Provider (plural)</Label>
                  <Input
                    id="providerPlural"
                    value={terminology.providerPlural}
                    onChange={(e) => handleTerminologyChange('providerPlural', e.target.value)}
                    placeholder="e.g., Doctors, Stylists, Trainers"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment">Appointment (singular)</Label>
                  <Input
                    id="appointment"
                    value={terminology.appointment}
                    onChange={(e) => handleTerminologyChange('appointment', e.target.value)}
                    placeholder="e.g., Appointment, Session, Booking"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentPlural">Appointment (plural)</Label>
                  <Input
                    id="appointmentPlural"
                    value={terminology.appointmentPlural}
                    onChange={(e) => handleTerminologyChange('appointmentPlural', e.target.value)}
                    placeholder="e.g., Appointments, Sessions, Bookings"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Service (singular)</Label>
                  <Input
                    id="service"
                    value={terminology.service}
                    onChange={(e) => handleTerminologyChange('service', e.target.value)}
                    placeholder="e.g., Treatment, Service, Package"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servicePlural">Service (plural)</Label>
                  <Input
                    id="servicePlural"
                    value={terminology.servicePlural}
                    onChange={(e) => handleTerminologyChange('servicePlural', e.target.value)}
                    placeholder="e.g., Treatments, Services, Packages"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business">Business</Label>
                  <Input
                    id="business"
                    value={terminology.business}
                    onChange={(e) => handleTerminologyChange('business', e.target.value)}
                    placeholder="e.g., Clinic, Salon, Studio"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Layout & Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Primary Color
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={layoutCustomization.primaryColor}
                    onChange={(e) => handleLayoutChange('primaryColor', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={layoutCustomization.primaryColor}
                    onChange={(e) => handleLayoutChange('primaryColor', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dashboardLayout">Dashboard Layout</Label>
                <select
                  id="dashboardLayout"
                  value={layoutCustomization.dashboardLayout}
                  onChange={(e) => handleLayoutChange('dashboardLayout', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="default">Default - Balanced view</option>
                  <option value="compact">Compact - More info, less space</option>
                  <option value="detailed">Detailed - Spacious with large cards</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardStyle">Card Style</Label>
                <select
                  id="cardStyle"
                  value={layoutCustomization.cardStyle}
                  onChange={(e) => handleLayoutChange('cardStyle', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="elevated">Elevated - Shadow effect</option>
                  <option value="flat">Flat - No shadow</option>
                  <option value="outlined">Outlined - Border only</option>
                </select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base">Dashboard Widgets</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="showQuickStats">Quick Statistics</Label>
                    <Switch
                      id="showQuickStats"
                      checked={layoutCustomization.showQuickStats}
                      onCheckedChange={(checked) => handleLayoutChange('showQuickStats', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="showUpcomingAppointments">Upcoming Appointments Widget</Label>
                    <Switch
                      id="showUpcomingAppointments"
                      checked={layoutCustomization.showUpcomingAppointments}
                      onCheckedChange={(checked) => handleLayoutChange('showUpcomingAppointments', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="showRecentActivity">Recent Activity Feed</Label>
                    <Switch
                      id="showRecentActivity"
                      checked={layoutCustomization.showRecentActivity}
                      onCheckedChange={(checked) => handleLayoutChange('showRecentActivity', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="showRevenueChart">Revenue Chart</Label>
                    <Switch
                      id="showRevenueChart"
                      checked={layoutCustomization.showRevenueChart}
                      onCheckedChange={(checked) => handleLayoutChange('showRevenueChart', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          {/* Appointment Reasons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointment Reasons
              </CardTitle>
              <CardDescription>
                Define common reasons for appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g., Consultation, Follow-up"
                  onKeyPress={(e) => e.key === 'Enter' && addAppointmentReason()}
                />
                <Button onClick={addAppointmentReason} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {appointmentReasons.map((reason, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {reason}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeAppointmentReason(index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Service Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Service Categories
              </CardTitle>
              <CardDescription>
                Organize your services into categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Premium Services, Consultations"
                  onKeyPress={(e) => e.key === 'Enter' && addServiceCategory()}
                />
                <Button onClick={addServiceCategory} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {serviceCategories.map((category, index) => (
                  <Badge key={index} variant="outline" className="gap-1">
                    {category}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeServiceCategory(index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Add Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Quick-Add Services
              </CardTitle>
              <CardDescription>
                Pre-configured services for quick setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={addQuickService} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Quick Service
              </Button>

              {editingService && (
                <Card className="border-2 border-primary">
                  <CardContent className="pt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label>Service Name</Label>
                        <Input
                          value={editingService.name}
                          onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          placeholder="Service name"
                        />
                      </div>
                      <div>
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          value={editingService.price}
                          onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Duration (min)</Label>
                        <Input
                          type="number"
                          value={editingService.duration}
                          onChange={(e) => setEditingService({ ...editingService, duration: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Category</Label>
                        <select
                          value={editingService.category}
                          onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                          className="w-full p-2 border rounded-md"
                        >
                          {serviceCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={editingService.description}
                          onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                          placeholder="Service description"
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveQuickService} className="flex-1">Save Service</Button>
                      <Button onClick={() => setEditingService(null)} variant="outline">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {quickAddServices.map((service, index) => (
                  <div key={index} className="flex items-start justify-between p-3 rounded-lg border hover:border-primary/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{service.name}</span>
                        <Badge variant="secondary" className="text-xs">{service.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${service.price}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration}min
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingService(service)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeQuickService(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Assistant Configuration
              </CardTitle>
              <CardDescription>
                Customize how your AI assistant behaves and interacts with customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiGreeting">Greeting Message</Label>
                <Textarea
                  id="aiGreeting"
                  value={aiBehavior.greeting}
                  onChange={(e) => setAIBehavior({ ...aiBehavior, greeting: e.target.value })}
                  placeholder="The first message customers see from your AI"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemBehavior">System Behavior Instructions</Label>
                <Textarea
                  id="systemBehavior"
                  value={aiBehavior.systemBehavior}
                  onChange={(e) => setAIBehavior({ ...aiBehavior, systemBehavior: e.target.value })}
                  placeholder="Detailed instructions on how the AI should behave, what it should prioritize, tone, etc."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Be specific about tone, priorities, and how to handle different situations
                </p>
              </div>

              <div className="space-y-3">
                <Label>Personality Traits</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTrait}
                    onChange={(e) => setNewTrait(e.target.value)}
                    placeholder="e.g., Empathetic, Professional, Friendly"
                    onKeyPress={(e) => e.key === 'Enter' && addPersonalityTrait()}
                  />
                  <Button onClick={addPersonalityTrait} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiBehavior.personalityTraits.map((trait, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {trait}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removePersonalityTrait(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          {/* Completion Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Appointment Completion Steps
              </CardTitle>
              <CardDescription>
                Configure the steps shown when completing an appointment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {completionSteps.map((step) => (
                <div key={step.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor={`step-${step.id}`} className="capitalize">{step.title}</Label>
                  <Switch
                    id={`step-${step.id}`}
                    checked={step.enabled}
                    onCheckedChange={() => toggleCompletionStep(step.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Navigation Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NavigationIcon className="h-5 w-5" />
                Navigation Menu Items
              </CardTitle>
              <CardDescription>
                Customize which items appear in the navigation menu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newNavItem}
                  onChange={(e) => setNewNavItem(e.target.value)}
                  placeholder="e.g., reports, inventory, staff"
                  onKeyPress={(e) => e.key === 'Enter' && addNavigationItem()}
                />
                <Button onClick={addNavigationItem} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {navigationItems.map((item, index) => (
                  <Badge key={index} variant="outline" className="gap-1 capitalize">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeNavigationItem(index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Service Field Labels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Service Field Labels
              </CardTitle>
              <CardDescription>
                Customize labels and placeholders for service forms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Service Name Label</Label>
                <Input
                  value={serviceFieldLabels.serviceName}
                  onChange={(e) => setServiceFieldLabels({ ...serviceFieldLabels, serviceName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Service Name Placeholder</Label>
                <Input
                  value={serviceFieldLabels.serviceNamePlaceholder}
                  onChange={(e) => setServiceFieldLabels({ ...serviceFieldLabels, serviceNamePlaceholder: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description Placeholder</Label>
                <Input
                  value={serviceFieldLabels.descriptionPlaceholder}
                  onChange={(e) => setServiceFieldLabels({ ...serviceFieldLabels, descriptionPlaceholder: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category Label</Label>
                <Input
                  value={serviceFieldLabels.categoryLabel}
                  onChange={(e) => setServiceFieldLabels({ ...serviceFieldLabels, categoryLabel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration Label</Label>
                <Input
                  value={serviceFieldLabels.durationLabel}
                  onChange={(e) => setServiceFieldLabels({ ...serviceFieldLabels, durationLabel: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-background pb-4">
        <div className="text-sm text-muted-foreground">
          Configure your custom template with all the features you need
        </div>
        <Button onClick={handleSave} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          Save Custom Configuration
        </Button>
      </div>
    </div>
  );
}
