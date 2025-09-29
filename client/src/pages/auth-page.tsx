
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Loader2, Shield, Users, BarChart3 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "User",
    },
  });

  // Redirect if already authenticated - use useEffect to avoid setState during render
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const onLogin = async (data: LoginData) => {
    try {
      await loginMutation.mutateAsync(data);
      navigate("/");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onRegister = async (data: RegisterData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerMutation.mutateAsync(registerData);
      navigate("/");
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Don't render the auth form if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Project Manager</h1>
            <p className="text-muted-foreground">Manage your projects with ease</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        data-testid="input-username"
                        {...loginForm.register("username")}
                        placeholder="Enter your username"
                        disabled={loginMutation.isPending}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        data-testid="input-password"
                        type="password"
                        {...loginForm.register("password")}
                        placeholder="Enter your password"
                        disabled={loginMutation.isPending}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Sign In
                    </Button>
                  </form>

                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Demo accounts:</p>
                    <div className="space-y-1 text-xs">
                      <p><strong>Admin:</strong> admin / admin123</p>
                      <p><strong>Team Lead:</strong> teamlead / admin123</p>
                      <p><strong>User:</strong> user / admin123</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>
                    Fill in your details to create a new account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input
                        id="register-name"
                        data-testid="input-name"
                        {...registerForm.register("name")}
                        placeholder="Enter your full name"
                        disabled={registerMutation.isPending}
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        data-testid="input-register-username"
                        {...registerForm.register("username")}
                        placeholder="Choose a username"
                        disabled={registerMutation.isPending}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        data-testid="input-email"
                        type="email"
                        {...registerForm.register("email")}
                        placeholder="Enter your email"
                        disabled={registerMutation.isPending}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        data-testid="input-register-password"
                        type="password"
                        {...registerForm.register("password")}
                        placeholder="Create a password"
                        disabled={registerMutation.isPending}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">Confirm Password</Label>
                      <Input
                        id="register-confirm-password"
                        data-testid="input-confirm-password"
                        type="password"
                        {...registerForm.register("confirmPassword")}
                        placeholder="Confirm your password"
                        disabled={registerMutation.isPending}
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Streamline Your Project Management
          </h2>
          <p className="text-muted-foreground mb-8">
            Organize your work with our powerful Kanban board, track progress with insightful metrics, 
            and collaborate effectively with role-based permissions.
          </p>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Dashboard Analytics</h3>
                <p className="text-sm text-muted-foreground">Track progress with real-time metrics</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Team Collaboration</h3>
                <p className="text-sm text-muted-foreground">Work together with comments and mentions</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Role-based Access</h3>
                <p className="text-sm text-muted-foreground">Secure permissions for different user types</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
