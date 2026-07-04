
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/context/AppContext";
import type { Farmer, MilkType } from "@/lib/types";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "./ui/checkbox";

interface FarmerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmer: Farmer | null;
}

const milkTypes: { id: MilkType; label: string }[] = [
    { id: 'cow', label: 'Cow Milk' },
    { id: 'buffalo', label: 'Buffalo Milk' },
];

export function FarmerDialog({ open, onOpenChange, farmer }: FarmerDialogProps) {
  const { addFarmer, updateFarmer, t } = useAppContext();
  const { toast } = useToast();

  const formSchema = z.object({
    name: z.string().min(1, { message: t('farmerRequired') }),
    milkTypes: z.array(z.string()).refine(value => value.some(v => v), { message: t('milkTypeRequired') }),
    cowRate: z.coerce.number().min(0),
    buffaloRate: z.coerce.number().min(0),
    defaultCowQuantity: z.coerce.number().min(0).optional(),
    defaultBuffaloQuantity: z.coerce.number().min(0).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      milkTypes: ['cow'],
      cowRate: 0,
      buffaloRate: 0,
      defaultCowQuantity: 1,
      defaultBuffaloQuantity: 1,
    },
  });

  useEffect(() => {
    if (open) {
      if (farmer) {
        form.reset({
          name: farmer.name,
          milkTypes: farmer.milkTypes ?? ['cow'],
          cowRate: farmer.cowRate ?? 0,
          buffaloRate: farmer.buffaloRate ?? 0,
          defaultCowQuantity: farmer.defaultCowQuantity ?? 1,
          defaultBuffaloQuantity: farmer.defaultBuffaloQuantity ?? 1,
        });
      } else {
        form.reset({
          name: "",
          milkTypes: ['cow'],
          cowRate: 40,
          buffaloRate: 50,
          defaultCowQuantity: 1,
          defaultBuffaloQuantity: 1,
        });
      }
    }
  }, [farmer, open, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const farmerData = {
      ...values,
      milkTypes: values.milkTypes as MilkType[],
    };

    if (farmer) {
      updateFarmer({ ...farmer, ...farmerData });
      toast({ title: t('save'), description: `${values.name} data updated.`});
    } else {
      addFarmer(farmerData);
      toast({ title: t('save'), description: `${values.name} added.`});
    }
    onOpenChange(false);
  }
  
  const watchedMilkTypes = form.watch('milkTypes');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-slate-900/95 border border-slate-800/80 text-slate-100 backdrop-blur-xl rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-white">{farmer ? t('editFarmer') : t('addFarmer')}</DialogTitle>
          <DialogDescription className="text-xs text-slate-400 font-medium">
            {t('farmerManagement')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('farmerName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('farmerName')} {...field} className="bg-slate-950/50 border-slate-800 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-indigo-500" />
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs font-bold" />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="milkTypes"
                render={() => (
                    <FormItem className="space-y-3">
                    <div>
                        <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('milkType')}</FormLabel>
                        <FormDescription className="text-[10px] text-slate-500 font-medium">{t('selectMilkTypes')}</FormDescription>
                    </div>
                    <div className="flex gap-4">
                    {milkTypes.map((item) => (
                        <FormField
                        key={item.id}
                        control={form.control}
                        name="milkTypes"
                        render={({ field }) => {
                            return (
                            <FormItem
                                key={item.id}
                                className="flex flex-row items-center space-x-2 space-y-0 bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl"
                            >
                                <FormControl>
                                <Checkbox
                                    checked={(field.value || []).includes(item.id)}
                                    className="border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white rounded-md"
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(
                                            (field.value || []).filter(
                                            (value) => value !== item.id
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-bold text-xs text-slate-200 capitalize cursor-pointer">
                                    {t(item.id as 'cow' | 'buffalo')}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                        />
                    ))}
                    </div>
                    <FormMessage className="text-rose-400 text-xs font-bold" />
                    </FormItem>
                )}
                />

            {(watchedMilkTypes || []).includes('cow') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/20 border border-slate-850 p-3 rounded-xl">
                    <FormField
                        control={form.control}
                        name="cowRate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('cowRatePerLitre')}</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" placeholder="40" {...field} value={field.value ?? 0} className="bg-slate-950/50 border-slate-800 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-indigo-500" />
                            </FormControl>
                            <FormMessage className="text-rose-400 text-xs font-bold" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="defaultCowQuantity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('defaultCowQuantity')}</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" placeholder="1" {...field} value={field.value ?? 0} className="bg-slate-950/50 border-slate-800 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-indigo-500" />
                            </FormControl>
                            <FormMessage className="text-rose-400 text-xs font-bold" />
                            </FormItem>
                        )}
                    />
                </div>
            )}

            {(watchedMilkTypes || []).includes('buffalo') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/20 border border-slate-850 p-3 rounded-xl">
                    <FormField
                        control={form.control}
                        name="buffaloRate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('buffaloRatePerLitre')}</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" placeholder="50" {...field} value={field.value ?? 0} className="bg-slate-950/50 border-slate-800 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-indigo-500" />
                            </FormControl>
                            <FormMessage className="text-rose-400 text-xs font-bold" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="defaultBuffaloQuantity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('defaultBuffaloQuantity')}</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" placeholder="1" {...field} value={field.value ?? 0} className="bg-slate-950/50 border-slate-800 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-indigo-500" />
                            </FormControl>
                            <FormMessage className="text-rose-400 text-xs font-bold" />
                            </FormItem>
                        )}
                    />
                </div>
            )}

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
