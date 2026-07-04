
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function ReminderCard({ customer }: { customer: Customer }) {
    const { addOrUpdateEntry, t } = useAppContext();
    const { toast } = useToast();
    const date = new Date();
    const dateString = format(date, 'yyyy-MM-dd');

    const [cowQuantity, setCowQuantity] = useState(0);
    const [buffaloQuantity, setBuffaloQuantity] = useState(0);
    
    useEffect(() => {
        const milkTypes = customer.milkTypes || [];
        setCowQuantity(milkTypes.includes('cow') ? (customer.defaultCowQuantity ?? 0) : 0);
        setBuffaloQuantity(milkTypes.includes('buffalo') ? (customer.defaultBuffaloQuantity ?? 0) : 0);
    }, [customer.defaultCowQuantity, customer.defaultBuffaloQuantity, customer.milkTypes]);

    const handleSave = () => {
        addOrUpdateEntry({
            customerId: customer.id,
            date: dateString,
            cowQuantity,
            cowRate: customer.cowRate || 0,
            buffaloQuantity,
            buffaloRate: customer.buffaloRate || 0,
        });
        toast({
            title: t('save'),
            description: `Entry for ${customer.name} saved.`,
        });
    };

    const isZero = cowQuantity === 0 && buffaloQuantity === 0;

    const handleZeroCheck = (checked: boolean | 'indeterminate') => {
        const milkTypes = customer.milkTypes || [];
        if (checked) {
            setCowQuantity(0);
            setBuffaloQuantity(0);
        } else {
            setCowQuantity(milkTypes.includes('cow') ? (customer.defaultCowQuantity ?? 0) : 0);
            setBuffaloQuantity(milkTypes.includes('buffalo') ? (customer.defaultBuffaloQuantity ?? 0) : 0);
        }
    }

    return (
        <Card className="h-full bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 transition-all rounded-xl shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-950/40 border-b border-slate-800/80">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider truncate">{customer.name}</h3>
            </div>
            <div className="p-3.5 space-y-2.5 flex-1">
                {(customer.milkTypes || []).includes('cow') && (
                    <div className="flex items-center justify-between gap-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">{t('cowMilk')}</Label>
                        <Input 
                            type="number" 
                            value={cowQuantity} 
                            onChange={(e) => setCowQuantity(parseFloat(e.target.value) || 0)} 
                            className="w-16 h-8 text-xs text-center font-black p-1 bg-slate-950/50 border-slate-800 text-white rounded-lg focus-visible:ring-1 focus-visible:ring-indigo-500"
                            disabled={isZero}
                        />
                    </div>
                )}
                {(customer.milkTypes || []).includes('buffalo') && (
                    <div className="flex items-center justify-between gap-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">{t('buffaloMilk')}</Label>
                        <Input 
                            type="number" 
                            value={buffaloQuantity} 
                            onChange={(e) => setBuffaloQuantity(parseFloat(e.target.value) || 0)} 
                            className="w-16 h-8 text-xs text-center font-black p-1 bg-slate-950/50 border-slate-800 text-white rounded-lg focus-visible:ring-1 focus-visible:ring-indigo-500"
                            disabled={isZero}
                        />
                    </div>
                )}
                 <div className="flex items-center space-x-2 pt-2 border-t border-dashed border-slate-800">
                    <Checkbox 
                        id={`rem-zero-check-${customer.id}`} 
                        checked={isZero} 
                        onCheckedChange={handleZeroCheck} 
                        className="border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white rounded"
                    />
                    <Label htmlFor={`rem-zero-check-${customer.id}`} className="text-[10px] font-black text-slate-400 cursor-pointer">
                        {t('noMilk')}
                    </Label>
                </div>
            </div>
            <div className="p-2 bg-slate-950/30 border-t border-slate-800/80">
                <Button onClick={handleSave} size="sm" className="w-full h-8 text-xs font-black bg-indigo-600/80 hover:bg-indigo-500 text-slate-100 rounded-lg transition-all">
                    {t('save')}
                </Button>
            </div>
        </Card>
    )
}
