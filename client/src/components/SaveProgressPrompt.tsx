import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth-v2';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, User, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { ThryvinLogo } from './ui/ThryvinLogo';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface SaveProgressPromptProps {
  onContinue: () => void;
  onSkip: () => void;
  onRegister: (data: any) => Promise<boolean>; // Direct registration function
  coachData: {
    selectedCoach: string;
    trainingType: string;
    goal: string;
    coachingStyle: string;
    name?: string; // User's name from onboarding
  };
}

export function SaveProgressPrompt({ onContinue, onSkip, onRegister, coachData }: SaveProgressPromptProps) {
  const { user, login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('register');

  // ALWAYS call all hooks first - never early return before hooks!
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
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // If user is already logged in, continue immediately (but in useEffect to avoid render issues)
  useEffect(() => {
    if (user) {
      onContinue();
    }
  }, [user, onContinue]);

  // Don't render the form if user is already logged in - but all hooks are called above
  if (user) {
    return null;
  }

  const onLogin = async (data: LoginFormData) => {
    try {
      loginMutation.mutate(data, {
        onSuccess: () => {
          onContinue();
        },
        onError: (error) => {
          console.error('Login failed:', error);
        }
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const onRegisterForm = async (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    
    const success = await onRegister({
      ...registerData,
      name: coachData.name || 'User', // Use name from onboarding
      ...coachData,
    });
    
    if (success) {
      // Registration worked, parent component handles navigation
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-purple-50 via-white to-pink-50 scrollbar-hide">
      <div className="min-h-full py-8 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <ThryvinLogo 
            size="lg" 
            animated={true}
            className="mb-6"
          />
          <motion.h1 
            className="text-3xl font-bold text-gray-800 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Save Your Journey
          </motion.h1>
          <motion.p 
            className="text-gray-600 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Create an account to unlock your full potential
          </motion.p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-b border-gray-100">
            <motion.div
              className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            >
              <Save className="w-10 h-10 text-white" />
            </motion.div>
            <CardTitle className="text-2xl mb-3 text-gray-800">Your Personalized Plan Awaits</CardTitle>
            <CardDescription className="text-base text-gray-600 leading-relaxed">
              Don't lose your custom workout plan and coach match. Save your progress and continue your fitness journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-1.5 shadow-inner">
                <TabsTrigger value="register" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-medium transition-all">Create Account</TabsTrigger>
                <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-medium transition-all">I Have Account</TabsTrigger>
              </TabsList>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterForm)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2 text-gray-700">
                            <User className="w-4 h-4 text-purple-500" />
                            <span>Email</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="your@email.com" 
                              {...field} 
                              className="bg-gray-50 border-gray-200 rounded-xl py-4 px-5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium" 
                            />
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
                            <FormLabel className="flex items-center space-x-2 text-gray-700">
                              <Lock className="w-4 h-4 text-purple-500" />
                              <span>Password</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Password" 
                                {...field} 
                                className="bg-gray-50 border-gray-200 rounded-xl py-4 px-5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium" 
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
                            <FormLabel className="flex items-center space-x-2 text-gray-700">
                              <Lock className="w-4 h-4 text-purple-500" />
                              <span>Confirm</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm" 
                                {...field} 
                                className="bg-gray-50 border-gray-200 rounded-xl py-4 px-5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-100">
                      <div className="flex items-center space-x-3 text-purple-700 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-lg">What you'll unlock:</span>
                      </div>
                      <ul className="text-sm text-gray-700 space-y-3">
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Personalized workout tracking & progress analytics</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                          <span>Achievement system with rewards & milestones</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>AI coach conversations & workout history</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                          <span className="font-medium text-purple-700">7-day free trial included</span>
                        </li>
                      </ul>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl py-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        'Creating Account...'
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Create Account & Continue</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>Email</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Enter your email" 
                              {...field}
                              className="bg-gray-50 border-gray-200 rounded-xl py-4 px-5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
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
                          <FormLabel className="flex items-center space-x-2">
                            <Lock className="w-4 h-4" />
                            <span>Password</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field}
                              className="bg-gray-50 border-gray-200 rounded-xl py-4 px-5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl py-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        'Logging in...'
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Login & Continue</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
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
    </div>
  );
}