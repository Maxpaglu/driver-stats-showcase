import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === "yash1" && password === "yashmv1") {
      localStorage.setItem("isAuthenticated", "true");
      toast({
        title: "Login Successful",
        description: "Welcome to F1 Performance Dashboard",
      });
      navigate("/");
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.1),transparent)]" />
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">
            F1 <span className="text-primary">Performance</span>
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
