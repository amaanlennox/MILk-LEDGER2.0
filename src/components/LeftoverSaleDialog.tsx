
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
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "@/components/ui/label";

interface LeftoverSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
}

export function LeftoverSaleDialog({ open, onOpenChange, date }: LeftoverSaleDialogProps) {
  const { addLeftoverSale, t } = useAppContext();
  const { toast } = useToast();

  const formSchema = z.object({
    milkType: z.enum(["cow", "buffalo"], { required_error: t('milkTypeRequired')}),
    quantity: z.coerce.number().min(0.01, { message: t('quantityRequired') }),
    total: z.coerce.number().min(0.01, { message: t('priceRequired') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      milkType: "cow",
      quantity: 1,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        milkType: "cow",
        quantity: 1,
        total: undefined,
      });
    }
  }, [open, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const finalRate = values.quantity > 0 ? (values.total / values.quantity) : 0;

    addLeftoverSale({
      milkType: values.milkType,
      quantity: values.quantity,
      rate: finalRate,
      total: values.total,
      buyer: t('buyerNamePlaceholder'), // Default buyer
      date: format(date, 'yyyy-MM-dd'),
    });
    toast({ title: t('save'), description: t('leftoverSaleSuccess') });
    onOpenChange(false);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-slate-900/95 border border-slate-800/80 text-slate-100 backdrop-blur-xl rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-white">{t('addLeftoverSale')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            <FormField
              control={form.control}
              name="milkType"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('milkType')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4 pt-1"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0 bg-slate-950/40 border border-slate-850 px-3.5 py-2 rounded-xl">
                        <FormControl>
                          <RadioGroupItem value="cow" className="border-slate-700 data-[state=checked]:border-indigo-500 data-[state=checked]:text-indigo-400" />
                        </FormControl>
                        <FormLabel className="font-bold text-xs text-slate-200 cursor-pointer">{t('cow')}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0 bg-slate-950/40 border border-slate-850 px-3.5 py-2 rounded-xl">
                        <FormControl>
                          <RadioGroupItem value="buffalo" className="border-slate-700 data-[state=checked]:border-indigo-500 data-[state=checked]:text-indigo-400" />
                        </FormControl>
                        <FormLabel className="font-bold text-xs text-slate-200 cursor-pointer">{t('buffalo')}</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs font-bold" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('quantityInLitre')}</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} className="bg-slate-950/50 border-slate-800 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-indigo-500" /></FormControl>
                        <FormMessage className="text-rose-400 text-xs font-bold" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="total"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('totalAmount')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
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
            </div>
            
            <div className="space-y-1.5">
                <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('date')}</Label>
                <div className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs font-bold text-slate-200 uppercase tracking-wide">
                    {format(date, "dd MMM yyyy")}
                </div>
            </div>


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
