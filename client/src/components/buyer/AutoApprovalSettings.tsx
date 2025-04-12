import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { AutoApprovalSettings as AutoApprovalSettingsType } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  enabled: z.boolean().default(false),
  maxDiscountRate: z.string().transform(val => parseFloat(val)),
  maxAmount: z.string().transform(val => parseFloat(val)),
});

type FormValues = z.infer<typeof formSchema>;

const AutoApprovalSettings = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: settings, isLoading } = useQuery<AutoApprovalSettingsType>({
    queryKey: ['/api/auto-approval-settings', user?.id],
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabled: settings?.enabled || false,
      maxDiscountRate: settings?.maxDiscountRate?.toString() || "2.5",
      maxAmount: settings?.maxAmount?.toString() || "100000",
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest('POST', '/api/auto-approval-settings', {
        userId: user?.id,
        enabled: values.enabled,
        maxDiscountRate: values.maxDiscountRate,
        maxAmount: values.maxAmount,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/auto-approval-settings'] });
      
      toast({
        title: 'Success',
        description: 'Auto-approval settings updated successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update auto-approval settings.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update form when settings are loaded
  if (!isLoading && settings && !form.formState.isDirty) {
    form.reset({
      enabled: settings.enabled,
      maxDiscountRate: settings.maxDiscountRate.toString(),
      maxAmount: settings.maxAmount.toString(),
    });
  }
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Auto-Approval Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-base font-normal">
                      Enable auto-approval for discount offers meeting criteria
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maxDiscountRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Discount Rate (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.1" placeholder="e.g., 2.5" />
                      </FormControl>
                      <FormDescription>
                        Automatically approve offers below this discount rate
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Invoice Amount (₹)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="1000" placeholder="e.g., 100000" />
                      </FormControl>
                      <FormDescription>
                        Only auto-approve invoices below this amount
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoApprovalSettings;
