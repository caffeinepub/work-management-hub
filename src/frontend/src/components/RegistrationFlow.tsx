import { useState } from 'react';
import { useRegistration } from '../hooks/useRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2, CheckCircle2 } from 'lucide-react';
import LoginButton from './LoginButton';

const AVAILABLE_ROLES = [
  { value: 'Client', label: 'Client' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Concierge', label: 'Concierge' },
  { value: 'Asistenmu', label: 'Asistenmu' },
  { value: 'Strategic Partner', label: 'Strategic Partner' },
  { value: 'Finance', label: 'Finance' },
];

export default function RegistrationFlow() {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const { mutate: register, isPending, isSuccess, error } = useRegistration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedRole) {
      register({ name: name.trim(), requestedRole: selectedRole });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-soft animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Registration Submitted!</CardTitle>
            <CardDescription>
              Your registration request has been sent to the administrators for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                You will be notified once your account has been approved. Please check back later.
              </AlertDescription>
            </Alert>
            <div className="pt-4 flex justify-center">
              <LoginButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Work Management Hub</span>
          </div>
          <LoginButton />
        </div>
      </header>

      {/* Registration Form */}
      <main className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-soft animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
            <CardDescription>
              Please provide your information to request access to the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Requested Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isPending}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isPending || !name.trim() || !selectedRole}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
