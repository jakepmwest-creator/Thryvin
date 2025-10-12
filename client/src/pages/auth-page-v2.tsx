import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth-v2';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPageV2() {
  const { user, isAuthenticated, isLoading, login, register } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    return <Redirect to="/" />;
  }

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'test@example.com',
      password: 'password123',
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      trainingType: '',
      goal: '',
      coachingStyle: '',
      selectedCoach: '',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      await login(data.email, data.password);
    } catch (error) {
      // Error handling is done in the auth provider
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
    } catch (error) {
      // Error handling is done in the auth provider
      console.error('Register error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-lg bg-white/10 border-white/20">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Welcome to Thryvin'
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your AI-powered fitness journey starts here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="login" className="text-white data-[state=active]:bg-white/20">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="text-white data-[state=active]:bg-white/20">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                              data-testid="input-email"
                              disabled={isFormLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                                data-testid="input-password"
                                disabled={isFormLoading}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isFormLoading}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      disabled={isFormLoading}
                      data-testid="button-login"
                    >
                      {isFormLoading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your full name"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                              data-testid="input-name"
                              disabled={isFormLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                              data-testid="input-register-email"
                              disabled={isFormLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Password"
                                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                                  data-testid="input-register-password"
                                  disabled={isFormLoading}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                                  onClick={() => setShowPassword(!showPassword)}
                                  disabled={isFormLoading}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Confirm</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm"
                                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                                  data-testid="input-confirm-password"
                                  disabled={isFormLoading}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  disabled={isFormLoading}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Fitness Goal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormLoading}>
                            <FormControl>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-goal">
                                <SelectValue placeholder="Select your fitness goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weight_loss">Weight Loss</SelectItem>
                              <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                              <SelectItem value="strength">Strength Training</SelectItem>
                              <SelectItem value="endurance">Endurance</SelectItem>
                              <SelectItem value="general_fitness">General Fitness</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      disabled={isFormLoading}
                      data-testid="button-register"
                    >
                      {isFormLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}