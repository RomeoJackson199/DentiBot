import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CheckCircle2, Clock, AlertCircle, Plus, Calendar,
  User, Phone, FileText, X, Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskBoardProps {
  dentistId: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  task_type: string;
  priority: string;
  status: string;
  due_date: string;
  assigned_to: string;
  patient_id: string;
  appointment_id: string;
  created_at: string;
}

export const TaskBoard = ({ dentistId }: TaskBoardProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_type: 'general',
    priority: 'medium',
    due_date: '',
    assigned_to: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [dentistId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('dentist_tasks')
        .select('*')
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('dentist_tasks')
        .insert({
          dentist_id: dentistId,
          ...newTask,
          due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      setNewTask({
        title: '',
        description: '',
        task_type: 'general',
        priority: 'medium',
        due_date: '',
        assigned_to: ''
      });
      setShowNewTask(false);
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('dentist_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Task marked as ${newStatus}`,
      });

      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('dentist_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'review': return <FileText className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const openTasks = tasks.filter(task => task.status === 'open');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Task & Reminder Board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-dental-primary" />
          Task & Reminder Board
        </CardTitle>
        <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <Textarea
                placeholder="Task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={newTask.task_type}
                  onValueChange={(value) => setNewTask({ ...newTask, task_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="call">Call Patient</SelectItem>
                    <SelectItem value="review">Review X-rays</SelectItem>
                    <SelectItem value="appointment">Follow-up Appointment</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="datetime-local"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
                <Input
                  placeholder="Assigned to"
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createTask} className="bg-gradient-primary">
                  Create Task
                </Button>
                <Button variant="outline" onClick={() => setShowNewTask(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Open Tasks */}
          <div className="space-y-3">
            <h3 className="font-semibold text-orange-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Open ({openTasks.length})
            </h3>
            <div className="space-y-3">
              {openTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTaskTypeIcon(task.task_type)}
                      <h4 className="font-medium text-sm">{task.title}</h4>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTask(task.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-600">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.assigned_to && (
                    <p className="text-xs text-gray-500">Assigned to: {task.assigned_to}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Tasks */}
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Progress ({inProgressTasks.length})
            </h3>
            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTaskTypeIcon(task.task_type)}
                      <h4 className="font-medium text-sm">{task.title}</h4>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTask(task.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-600">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.assigned_to && (
                    <p className="text-xs text-gray-500">Assigned to: {task.assigned_to}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed ({completedTasks.length})
            </h3>
            <div className="space-y-3">
              {completedTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTaskTypeIcon(task.task_type)}
                      <h4 className="font-medium text-sm line-through">{task.title}</h4>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTask(task.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-600">{task.description}</p>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Completed
                  </Badge>
                  {task.assigned_to && (
                    <p className="text-xs text-gray-500">Assigned to: {task.assigned_to}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};