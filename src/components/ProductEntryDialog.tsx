
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/context/AppContext";
import type { Customer, ProductType } from "@/lib/types";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface ProductEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  productType: ProductType;
}

export function ProductEntryDialog({ open, onOpenChange, customer, productType }: ProductEntryDialogProps) {
  const { addOrUpdateProductEntry, t } = useAppContext();
  const { toast } = useToast();

  const formSchema = z.object({
    quantity: z.coerce.number().min(0.01, { message: t('quantityRequired') }),
    price: z.number().min(0.01, { message: t('priceRequired') }),
    date: z.date(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 0.5,
      price: undefined,
      date: new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        quantity: 0.5,
        price: undefined,
        date: new Date(),
      });
    }
  }, [open, form]);
  
  const handleDateChange = (days: number) => {
    const currentDate = form.getValues('date');
    form.setValue('date', addDays(currentDate, days));
  };


  function onSubmit(values: z.infer<typeof formSchema>) {
    addOrUpdateProductEntry({
      customerId: customer.id,
      productType,
      quantity: values.quantity,
      price: values.price,
      date: format(values.date, 'yyyy-MM-dd'),
    });
    toast({ title: t('save'), description: `${t(productType)} entry for ${customer.name} saved.`});
    onOpenChange(false);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 border border-slate-800/80 text-slate-100 backdrop-blur-xl rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-white capitalize">{t(productType)} {t('productEntry')}</DialogTitle>
          <DialogDescription className="text-xs text-indigo-400 font-bold">{customer.name}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('quantityInKg')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} className="bg-slate-950/50 border-slate-800 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-indigo-500" />
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs font-bold" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('totalPrice')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder={t('pricePlaceholder')}
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="bg-slate-950/50 border-slate-800 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-indigo-500"
                    />
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs font-bold" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="space-y-2 bg-slate-950/20 border border-slate-850 p-3 rounded-xl">
                  <FormLabel className="text-center block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('date')}</FormLabel>
                  <div className="flex items-center justify-center gap-4 py-1">
                      <Button variant="outline" size="icon" type="button" onClick={() => handleDateChange(-1)} className="border-slate-800 bg-slate-950/40 text-slate-200 hover:bg-slate-850 hover:text-white rounded-xl h-9 w-9 transition-all">
                          <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-xs text-center text-slate-200 uppercase tracking-wide w-40">{field.value ? format(field.value, "dd MMM yyyy") : ''}</span>
                      <Button variant="outline" size="icon" type="button" onClick={() => handleDateChange(1)} className="border-slate-800 bg-slate-950/40 text-slate-200 hover:bg-slate-850 hover:text-white rounded-xl h-9 w-9 transition-all">
                          <ChevronRight className="h-4 w-4" />
                      </Button>
                  </div>
                  <FormMessage className="text-rose-400 text-xs font-bold" />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-10 border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl font-bold">
                {t('cancel')}
              </Button>
              <Button type="submit" className="w-full sm:w-auto h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/10">{t('save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
