import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Login from './Login';
import Signup from './Signup';
import clsx from 'clsx';

const AuthForm = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full shadow-md border">
        <CardContent className="pt-6">
          <header className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Dynamic Discounting</h2>
            <p className="mt-2 text-gray-600">Optimize your cash flow with early payments</p>
          </header>
          
          <Tabs 
            defaultValue="login" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger 
                value="login" 
                className={clsx(
                  "py-2 px-4 text-center rounded transition-colors",
                  activeTab === 'login' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                )}
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className={clsx(
                  "py-2 px-4 text-center rounded transition-colors",
                  activeTab === 'signup' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                )}
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Login />
            </TabsContent>
            <TabsContent value="signup">
              <Signup />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
