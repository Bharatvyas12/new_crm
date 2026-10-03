"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      // Simulate API call since backend may not be ready
      // const response = await api.post('/auth/login', data);
      
      // Mock login for now based on email
      const role = data.email.includes("admin") ? "ADMIN" : "EMPLOYEE";
      
      login({
        id: "1",
        email: data.email,
        name: data.email.split('@')[0],
        role: role
      });

      if (role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/app');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-muted/30 shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center border border-primary/20"
            >
              <div className="w-8 h-8 bg-primary rounded-lg transform rotate-45"></div>
            </motion.div>
            <div>
              <CardTitle className="text-5xl font-serif text-primary mb-2">Workforce</CardTitle>
              <CardDescription className="text-lg">Premium Operations Control</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium tracking-wide">Email</label>
                <input 
                  {...register("email")}
                  type="email" 
                  className="w-full p-3 rounded-lg border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  placeholder="admin@example.com"
                />
                {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium tracking-wide">Password</label>
                </div>
                <input 
                  {...register("password")}
                  type="password" 
                  className="w-full p-3 rounded-lg border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-medium tracking-wide shadow-lg hover:shadow-primary/25 transition-all" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Authenticating..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
