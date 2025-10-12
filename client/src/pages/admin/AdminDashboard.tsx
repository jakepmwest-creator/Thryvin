import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage and generate resources for the FitVerse AI app</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Coach Roster Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Coach Roster</CardTitle>
            <CardDescription>View and manage all coaches in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-md mb-4">
              <i className="fas fa-users text-4xl text-gray-500"></i>
            </div>
            <p className="text-sm text-gray-600">
              The expanded coach roster includes 14 specialized fitness instructors covering strength training, cardio, yoga, calisthenics, nutrition, general fitness, and running.
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/admin/coach-roster">
              <Button className="w-full">
                <i className="fas fa-clipboard-list mr-2"></i>
                View Coach Roster
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Coach Generator Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Coach Generator</CardTitle>
            <CardDescription>Generate realistic coach avatars with AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-md mb-4">
              <i className="fas fa-robot text-4xl text-gray-500"></i>
            </div>
            <p className="text-sm text-gray-600">
              Create realistic 3D rendered coach avatars with physiques matching their specialties using AI image generation.
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/admin/generate-coaches">
              <Button className="w-full">
                <i className="fas fa-magic mr-2"></i>
                Generate Coaches
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* User Management Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage app users and their data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-md mb-4">
              <i className="fas fa-user-cog text-4xl text-gray-500"></i>
            </div>
            <p className="text-sm text-gray-600">
              View user profiles, workout data, and manage account settings. Track user engagement and progress.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              <i className="fas fa-users-cog mr-2"></i>
              Manage Users
            </Button>
          </CardFooter>
        </Card>
        
        {/* Analytics Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>App Analytics</CardTitle>
            <CardDescription>View usage statistics and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-md mb-4">
              <i className="fas fa-chart-line text-4xl text-gray-500"></i>
            </div>
            <p className="text-sm text-gray-600">
              Track user engagement, popular workout types, coach selection patterns, and other key metrics.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              <i className="fas fa-chart-bar mr-2"></i>
              View Analytics
            </Button>
          </CardFooter>
        </Card>
        
        {/* Video Studio Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Video Studio</CardTitle>
            <CardDescription>Generate exercise demonstration videos with OpenAI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-md mb-4">
              <i className="fas fa-video text-4xl text-purple-600"></i>
            </div>
            <p className="text-sm text-gray-600">
              Create professional exercise demonstration videos using AI image generation for workout content.
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/admin/video-studio">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <i className="fas fa-play mr-2"></i>
                Open Video Studio
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Workouts Library Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Workouts Library</CardTitle>
            <CardDescription>Manage workout database and exercises</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-md mb-4">
              <i className="fas fa-dumbbell text-4xl text-gray-500"></i>
            </div>
            <p className="text-sm text-gray-600">
              Create, edit and organize the workout database including exercises, routines, and training plans.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              <i className="fas fa-list-alt mr-2"></i>
              Manage Workouts
            </Button>
          </CardFooter>
        </Card>
        
        {/* Settings Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
            <CardDescription>Configure application settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-md mb-4">
              <i className="fas fa-cogs text-4xl text-gray-500"></i>
            </div>
            <p className="text-sm text-gray-600">
              Manage global app settings, notification settings, AI configuration, and other system parameters.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              <i className="fas fa-sliders-h mr-2"></i>
              Configure App
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-6 text-center">
        <Link to="/">
          <Button variant="ghost">
            <i className="fas fa-arrow-left mr-2"></i>
            Return to App
          </Button>
        </Link>
      </div>
    </div>
  );
}