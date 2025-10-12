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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Dumbbell, Target, User, Heart, Eye, EyeOff, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function AuthPage() {
  const { user, login, register, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [isRegisterPending, setIsRegisterPending] = useState(false);

  // Debug logging
  console.log('AuthPage state:', { showPassword, showConfirmPassword, forgotPasswordOpen });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
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

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Redirect if already logged in (after all hooks are called)
  if (user) {
    return <Redirect to="/" />;
  }

  const onLogin = async (data: LoginFormData) => {
    try {
      setIsLoginPending(true);
      await login(data.email, data.password);
    } catch (error) {
      // Error handling is done in the auth provider
    } finally {
      setIsLoginPending(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      setIsRegisterPending(true);
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
    } catch (error) {
      // Error handling is done in the auth provider
    } finally {
      setIsRegisterPending(false);
    }
  };

  const onForgotPassword = async (data: ForgotPasswordFormData) => {
    console.log('onForgotPassword called with:', data);
    setIsSubmittingForgotPassword(true);
    try {
      const result = await apiRequest('/api/auth/forgot-password', 'POST', data);
      console.log('API result:', result);
      toast({
        title: 'Email sent!',
        description: 'Check your email for password reset instructions.',
      });
      setForgotPasswordOpen(false);
      forgotPasswordForm.reset();
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingForgotPassword(false);
    }
  };


  // Simple password input with show/hide button
  const PasswordInput = ({ field, placeholder, showPassword, onToggle }: {
    field: any;
    placeholder: string;
    showPassword: boolean;
    onToggle: () => void;
  }) => (
    <div className="flex gap-2">
      <Input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        {...field}
        className="flex-1"
      />
      <button
        type="button"
        onClick={onToggle}
        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold min-w-[60px]"
      >
        {showPassword ? "Hide" : "Show"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <motion.div
          className="text-center lg:text-left space-y-6"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Thryvin' AI coaching
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Your personalized AI fitness coach that adapts to your goals, training style, and preferences.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="text-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
              <Dumbbell className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Smart Workouts</h3>
              <p className="text-sm text-gray-600">AI-powered training plans</p>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
              <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Goal Tracking</h3>
              <p className="text-sm text-gray-600">Progress monitoring</p>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
              <User className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Personal Coach</h3>
              <p className="text-sm text-gray-600">24/7 AI guidance</p>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Wellness Focus</h3>
              <p className="text-sm text-gray-600">Holistic health approach</p>
            </div>
          </div>
        </motion.div>

        {/* Auth Forms */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >

          <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                {activeTab === 'login' ? 'Welcome back!' : 'Create your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <PasswordInput
                                field={field}
                                placeholder="Enter your password"
                                showPassword={showPassword}
                                onToggle={() => setShowPassword(!showPassword)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => {
                            alert('Forgot password clicked!');
                            window.location.href = '/reset-password';
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-bold"
                        >
                          FORGOT PASSWORD? CLICK ME!
                        </button>
                      </div>

                      {/* Forgot Password Modal */}
                      {forgotPasswordOpen && (
                        <div 
                          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
                          onClick={() => setForgotPasswordOpen(false)}
                        >
                          <div 
                            className="bg-white p-8 rounded-lg max-w-md w-full mx-4 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setForgotPasswordOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                ✕
                              </Button>
                            </div>
                            
                            <p className="text-gray-600 mb-6">
                              Enter your email address and we'll send you a secure link to reset your password.
                            </p>

                            <Form {...forgotPasswordForm}>
                              <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                                <FormField
                                  control={forgotPasswordForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="email" 
                                          placeholder="Enter your email address" 
                                          {...field}
                                          className="mt-1"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div className="flex gap-3 pt-4">
                                  <Button
                                    type="submit"
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    disabled={isSubmittingForgotPassword}
                                  >
                                    {isSubmittingForgotPassword ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Sending...
                                      </>
                                    ) : (
                                      "Send Reset Email"
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setForgotPasswordOpen(false)}
                                    className="px-6"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoginPending}
                      >
                        {isLoginPending ? 'Logging in...' : 'Login'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your name" {...field} />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <PasswordInput
                                  field={field}
                                  placeholder="Password"
                                  showPassword={showPassword}
                                  onToggle={() => setShowPassword(!showPassword)}
                                />
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
                              <FormLabel>Confirm</FormLabel>
                              <FormControl>
                                <PasswordInput
                                  field={field}
                                  placeholder="Confirm"
                                  showPassword={showConfirmPassword}
                                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="trainingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Training Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select training type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="calisthenics">Calisthenics</SelectItem>
                                <SelectItem value="strength">Strength Training</SelectItem>
                                <SelectItem value="wellness">Wellness</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="goal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Goal</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your goal" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="strength">Build Strength</SelectItem>
                                <SelectItem value="weight">Weight Management</SelectItem>
                                <SelectItem value="health">Improve Health</SelectItem>
                                <SelectItem value="skills">Learn Skills</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="coachingStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coaching Style</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Preferred style" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="supportive">Supportive</SelectItem>
                                <SelectItem value="direct">Direct</SelectItem>
                                <SelectItem value="analytical">Analytical</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="selectedCoach"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Coach</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose your coach" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="kai-bodyweight">Kai - Calisthenics</SelectItem>
                                <SelectItem value="dylan-power">Dylan - Strength</SelectItem>
                                <SelectItem value="aurora-zen">Aurora - Wellness</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isRegisterPending}
                      >
                        {isRegisterPending ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}