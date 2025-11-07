import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Star, 
  Zap, 
  Shield, 
  Users, 
  Calendar,
  FileText,
  Settings,
  BarChart3,
  MessageSquare,
  Clock,
  CreditCard,
  Stethoscope,
  Pill,
  ClipboardList as ClipboardListIcon,
  Eye,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Award,
  DollarSign,
  Calendar as CalendarIcon,
  Search,
  User,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  EyeOff,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  XCircle,
  AlertTriangle as AlertTriangleIcon
} from "lucide-react";

interface ChangelogEntry {
  id: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'security';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  date: string;
}

interface ChangelogPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const changelogEntries: ChangelogEntry[] = [
  {
    id: '1',
    type: 'feature',
    title: 'Redesigned Availability Settings',
    description: 'Completely redesigned availability management with quick presets, visual day cards, summary statistics, and intuitive controls for easier schedule management.',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-blue-600 bg-blue-50',
    date: '2024-01-20'
  },
  {
    id: '2',
    type: 'feature',
    title: 'Enhanced Appointment Confirmation Widget',
    description: 'New comprehensive appointment confirmation widget showing all details with confirm/cancel actions, usable for both patients and dentists with detailed information display.',
    icon: <Calendar className="h-5 w-5" />,
    color: 'text-green-600 bg-green-50',
    date: '2024-01-20'
  },
  {
    id: '3',
    type: 'feature',
    title: 'Redesigned Triage Dashboard',
    description: 'Complete redesign of the triage dashboard with real-time statistics, patient queue management, search and filtering, and quick actions for emergency cases.',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-red-600 bg-red-50',
    date: '2024-01-20'
  },
  {
    id: '4',
    type: 'improvement',
    title: 'Enhanced Dentist Management',
    description: 'Improved dentist profile management with proper dentist profiles display, search functionality, and better user interface for managing dental team members.',
    icon: <User className="h-5 w-5" />,
    color: 'text-purple-600 bg-purple-50',
    date: '2024-01-20'
  },
  {
    id: '5',
    type: 'improvement',
    title: 'Better UI/UX Design',
    description: 'Complete UI redesign with modern glass morphism effects, improved color schemes, better responsive design, and enhanced user experience throughout the application.',
    icon: <Settings className="h-5 w-5" />,
    color: 'text-orange-600 bg-orange-50',
    date: '2024-01-20'
  },
  {
    id: '6',
    type: 'feature',
    title: 'Quick Actions & Presets',
    description: 'Added quick action buttons and preset schedules for availability management, making it much easier for dentists to set up their working hours.',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-yellow-600 bg-yellow-50',
    date: '2024-01-20'
  },
  {
    id: '7',
    type: 'improvement',
    title: 'Enhanced Patient Queue',
    description: 'Improved patient queue display with urgency indicators, pain level tracking, symptom badges, and quick action buttons for better triage management.',
    icon: <Users className="h-5 w-5" />,
    color: 'text-indigo-600 bg-indigo-50',
    date: '2024-01-20'
  },
  {
    id: '8',
    type: 'bugfix',
    title: 'Fixed Dentist Profile Display',
    description: 'Resolved the issue where dentist profiles were incorrectly labeled as patient profiles and improved the overall dentist management interface.',
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'text-teal-600 bg-teal-50',
    date: '2024-01-20'
  }
];

export function ChangelogPopup({ isOpen, onClose }: ChangelogPopupProps) {
  const [selectedEntry, setSelectedEntry] = useState<ChangelogEntry | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Star className="h-4 w-4" />;
      case 'improvement':
        return <Zap className="h-4 w-4" />;
      case 'bugfix':
        return <CheckCircle className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'improvement':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'bugfix':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'security':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-2xl font-bold">
            <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span>What's New in Denti Bot</span>
          </DialogTitle>
          <p className="text-muted-foreground">
            Here are the latest improvements and new features we've added to enhance your dental practice management experience.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {changelogEntries.filter(e => e.type === 'feature').length}
                </div>
                <div className="text-sm text-muted-foreground">New Features</div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {changelogEntries.filter(e => e.type === 'improvement').length}
                </div>
                <div className="text-sm text-muted-foreground">Improvements</div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-red-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {changelogEntries.filter(e => e.type === 'bugfix').length}
                </div>
                <div className="text-sm text-muted-foreground">Bug Fixes</div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-yellow-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {changelogEntries.filter(e => e.type === 'security').length}
                </div>
                <div className="text-sm text-muted-foreground">Security</div>
              </CardContent>
            </Card>
          </div>

          {/* Changelog Entries */}
          <div className="space-y-4">
            {changelogEntries.map((entry) => (
              <Card 
                key={entry.id} 
                className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedEntry(entry)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full ${entry.color}`}>
                      {entry.icon}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{entry.title}</h3>
                        <Badge className={getTypeColor(entry.type)}>
                          {getTypeIcon(entry.type)}
                          <span className="ml-1 capitalize">{entry.type}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {entry.description}
                      </p>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed View Modal */}
          {selectedEntry && (
            <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${selectedEntry.color}`}>
                      {selectedEntry.icon}
                    </div>
                    <span>{selectedEntry.title}</span>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={getTypeColor(selectedEntry.type)}>
                      {getTypeIcon(selectedEntry.type)}
                      <span className="ml-1 capitalize">{selectedEntry.type}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedEntry.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedEntry.description}
                  </p>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">What this means for you:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Improved workflow efficiency</li>
                      <li>• Better patient care management</li>
                      <li>• Enhanced user experience</li>
                      <li>• More reliable system performance</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Got it, thanks!
            </Button>
            <Button onClick={onClose} className="bg-gradient-to-r from-blue-500 to-purple-600">
              Start Exploring
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}