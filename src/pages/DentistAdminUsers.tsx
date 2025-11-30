import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Mail, Calendar, Shield, Users as UsersIcon, RefreshCw, MoreVertical, Edit, Trash2, Send, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { logger } from '@/lib/logger';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserWithRoles {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  user_id: string | null;
  roles: string[];
  invitation_status?: 'pending' | 'accepted';
  invitation_sent_at?: string;
}

export default function DentistAdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithRoles | null>(null);
  const [resendingInvite, setResendingInvite] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, created_at, user_id')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles for each profile
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const allRoles: string[] = [];

          if (profile.user_id) {
            // Fetch app-level roles from user_roles table
            const { data: rolesData } = await supabase
              .from('user_roles' as any)
              .select('role')
              .eq('user_id', profile.user_id);

            if (rolesData) {
              allRoles.push(...rolesData.map((r: any) => r.role));
            }
          }

          // Fetch business-specific roles from business_members table
          const { data: businessRoles } = await supabase
            .from('business_members')
            .select('role')
            .eq('profile_id', profile.id);

          if (businessRoles && businessRoles.length > 0) {
            // Add business roles (admin, provider, patient, etc.)
            allRoles.push(...businessRoles.map(br => br.role));
          }

          // Remove duplicates
          const uniqueRoles = [...new Set(allRoles)];

          return {
            ...profile,
            roles: uniqueRoles,
            invitation_status: profile.user_id ? 'accepted' as const : 'pending' as const,
            invitation_sent_at: undefined,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      logger.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      user.email?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.roles.some(role => role.toLowerCase().includes(query));

    const matchesRole = roleFilter === "all" || user.roles.includes(roleFilter);

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'provider': return 'default';
      case 'dentist': return 'default';
      case 'staff': return 'secondary';
      case 'patient': return 'outline';
      default: return 'outline';
    }
  };

  const handleEditUser = async (updatedUser: UserWithRoles) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          email: updatedUser.email,
        })
        .eq('id', updatedUser.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      logger.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingUser.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });

      setDeletingUser(null);
      fetchUsers();
    } catch (error: any) {
      logger.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff member",
        variant: "destructive",
      });
    }
  };

  const handleResendInvitation = async (user: UserWithRoles) => {
    setResendingInvite(true);
    try {
      // Create new invitation token
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        'create_invitation_token_with_cleanup',
        {
          p_profile_id: user.id,
          p_email: user.email,
          p_expires_hours: 72,
        }
      );

      if (tokenError) throw tokenError;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-import-invitations', {
        body: {
          invitations: [{
            email: user.email,
            token: tokenData,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.roles[0] || 'staff',
          }],
        },
      });

      if (emailError) throw emailError;

      toast({
        title: "Success",
        description: `Invitation resent to ${user.email}`,
      });
    } catch (error: any) {
      logger.error('Error resending invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    } finally {
      setResendingInvite(false);
    }
  };

  const uniqueRoles = Array.from(new Set(users.flatMap(u => u.roles)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ModernLoadingSpinner message="Loading staff..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their roles
          </p>
        </div>
        <AddUserDialog onUserAdded={fetchUsers} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.user_id).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.invitation_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.roles.includes('admin')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            View and manage all staff members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} variant={getRoleBadgeVariant(role)}>
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">No roles assigned</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.invitation_status === 'pending' ? (
                          <Badge variant="secondary">Pending</Badge>
                        ) : user.user_id ? (
                          <Badge variant="default" className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            {user.invitation_status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => handleResendInvitation(user)}
                                disabled={resendingInvite}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Resend Invite
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingUser(user)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={editingUser.first_name}
                    onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={editingUser.last_name}
                    onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={() => editingUser && handleEditUser(editingUser)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingUser?.first_name} {deletingUser?.last_name}?
              This action cannot be undone and will revoke their access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
