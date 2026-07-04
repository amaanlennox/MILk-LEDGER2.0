
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, CheckCircle, Home, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Customer, Farmer } from '@/lib/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeftoverSaleDialog } from '@/components/LeftoverSaleDialog';
import { Skeleton } from '@/components/ui/skeleton';

function CustomerEntryCard({ customer, date }: { customer: Customer, date: Date }) {
    const { getEntry, addOrUpdateEntry, t } = useAppContext();
    const { toast } = useToast();
    const dateString = format(date, 'yyyy-MM-dd');

    const [cowQuantity, setCowQuantity] = useState(0);
    const [buffaloQuantity, setBuffaloQuantity] = useState(0);
    const [isNoMilk, setIsNoMilk] = useState(false);
    
    const existingEntry = getEntry(customer.id, dateString);

    useEffect(() => {
        const entry = getEntry(customer.id, dateString);
        if (entry) {
            setCowQuantity(entry.cowQuantity ?? 0);
            setBuffaloQuantity(entry.buffaloQuantity ?? 0);
            setIsNoMilk(entry.cowQuantity === 0 && entry.buffaloQuantity === 0);
        } else {
            const milkTypes = customer.milkTypes || [];
            setCowQuantity(milkTypes.includes('cow') ? (customer.defaultCowQuantity ?? 0) : 0);
            setBuffaloQuantity(milkTypes.includes('buffalo') ? (customer.defaultBuffaloQuantity ?? 0) : 0);
            setIsNoMilk(false);
        }
    }, [dateString, customer, getEntry]);

    const handleSave = () => {
        addOrUpdateEntry({
            customerId: customer.id,
            date: dateString,
            cowQuantity: isNoMilk ? 0 : cowQuantity,
            cowRate: customer.cowRate || 0,
            buffaloQuantity: isNoMilk ? 0 : buffaloQuantity,
            buffaloRate: customer.buffaloRate || 0,
        });
        toast({
            title: t('save'),
            description: `Entry for ${customer.name} saved.`,
        });
    };

    const total = (isNoMilk ? 0 : (cowQuantity * customer.cowRate + buffaloQuantity * customer.buffaloRate));

    return (
        <Card className="overflow-hidden glass-card shadow-lg border border-slate-800/60 h-full flex flex-col rounded-2xl bg-slate-950/40 hover:bg-slate-900/30 transition-all duration-200">
            <CardHeader className="flex-row items-center justify-between p-3.5 bg-slate-950/30 border-b border-slate-800/60">
                <CardTitle className="text-xs font-black text-slate-100 truncate">{customer.name}</CardTitle>
                {existingEntry && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
            </CardHeader>
            <CardContent className="p-3.5 flex-1 space-y-2">
                {(customer.milkTypes || []).includes('cow') && (
                    <div className="flex items-center justify-between gap-1">
                        <Label className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">{t('cowMilk')}</Label>
                        <Input 
                            type="number" 
                            value={isNoMilk ? 0 : cowQuantity} 
                            onChange={(e) => setCowQuantity(parseFloat(e.target.value) || 0)} 
                            className="h-8 w-16 text-center text-xs font-black bg-slate-950/60 border-slate-800 text-slate-100 rounded-lg p-1 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80"
                            disabled={isNoMilk}
                        />
                    </div>
                )}
                {(customer.milkTypes || []).includes('buffalo') && (
                    <div className="flex items-center justify-between gap-1">
                        <Label className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">{t('buffaloMilk')}</Label>
                        <Input 
                            type="number" 
                            value={isNoMilk ? 0 : buffaloQuantity} 
                            onChange={(e) => setBuffaloQuantity(parseFloat(e.target.value) || 0)} 
                            className="h-8 w-16 text-center text-xs font-black bg-slate-950/60 border-slate-800 text-slate-100 rounded-lg p-1 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80"
                            disabled={isNoMilk}
                        />
                    </div>
                )}
                <div className="flex items-center space-x-1.5 pt-2 border-t border-dashed border-slate-800/80">
                    <Checkbox 
                        id={`no-milk-${customer.id}`} 
                        checked={isNoMilk} 
                        onCheckedChange={(checked) => setIsNoMilk(!!checked)} 
                        className="h-4 w-4 border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded"
                    />
                    <Label htmlFor={`no-milk-${customer.id}`} className="text-[10px] font-bold text-slate-300 cursor-pointer">{t('noMilk')}</Label>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-950/20 p-3 border-t border-slate-800/60 flex items-center justify-between">
                <div className="text-sm font-black text-indigo-400">₹{total.toFixed(0)}</div>
                <Button onClick={handleSave} size="sm" className="h-7 px-3 text-[10px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-md hover:scale-[1.02] active:scale-95 transition-transform">
                    {t('save')}
                </Button>
            </CardFooter>
        </Card>
    );
}

function FarmerPurchaseCard({ farmer, date }: { farmer: Farmer, date: Date }) {
    const { getFarmerEntry, addOrUpdateFarmerEntry, t } = useAppContext();
    const { toast } = useToast();
    const dateString = format(date, 'yyyy-MM-dd');

    const [cowQuantity, setCowQuantity] = useState(0);
    const [buffaloQuantity, setBuffaloQuantity] = useState(0);
    const [isNoMilk, setIsNoMilk] = useState(false);
    
    const existingEntry = getFarmerEntry(farmer.id, dateString);

    useEffect(() => {
        const entry = getFarmerEntry(farmer.id, dateString);
        if (entry) {
            setCowQuantity(entry.cowQuantity ?? 0);
            setBuffaloQuantity(entry.buffaloQuantity ?? 0);
            setIsNoMilk(entry.cowQuantity === 0 && entry.buffaloQuantity === 0);
        } else {
            const milkTypes = farmer.milkTypes || [];
            setCowQuantity(milkTypes.includes('cow') ? (farmer.defaultCowQuantity ?? 0) : 0);
            setBuffaloQuantity(milkTypes.includes('buffalo') ? (farmer.defaultBuffaloQuantity ?? 0) : 0);
            setIsNoMilk(false);
        }
    }, [dateString, farmer, getFarmerEntry]);

    const handleSave = () => {
        addOrUpdateFarmerEntry({
            farmerId: farmer.id,
            date: dateString,
            cowQuantity: isNoMilk ? 0 : cowQuantity,
            cowRate: farmer.cowRate || 0,
            buffaloQuantity: isNoMilk ? 0 : buffaloQuantity,
            buffaloRate: farmer.buffaloRate || 0,
        });
        toast({
            title: t('save'),
            description: `Purchase entry for ${farmer.name} saved.`,
        });
    };

    const total = (isNoMilk ? 0 : (cowQuantity * farmer.cowRate + buffaloQuantity * farmer.buffaloRate));

    return (
        <Card className="overflow-hidden glass-card shadow-lg border border-slate-800/60 h-full flex flex-col rounded-2xl bg-slate-950/40 hover:bg-slate-900/30 transition-all duration-200">
            <CardHeader className="flex-row items-center justify-between p-3.5 bg-slate-950/30 border-b border-slate-800/60">
                <CardTitle className="text-xs font-black text-slate-100 truncate">{farmer.name}</CardTitle>
                {existingEntry && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
            </CardHeader>
            <CardContent className="p-3.5 flex-1 space-y-2">
                {(farmer.milkTypes || []).includes('cow') && (
                    <div className="flex items-center justify-between gap-1">
                        <Label className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">{t('cowMilk')}</Label>
                        <Input 
                            type="number" 
                            value={isNoMilk ? 0 : cowQuantity} 
                            onChange={(e) => setCowQuantity(parseFloat(e.target.value) || 0)} 
                            className="h-8 w-16 text-center text-xs font-black bg-slate-950/60 border-slate-800 text-slate-100 rounded-lg p-1 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80"
                            disabled={isNoMilk}
                        />
                    </div>
                )}
                {(farmer.milkTypes || []).includes('buffalo') && (
                    <div className="flex items-center justify-between gap-1">
                        <Label className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">{t('buffaloMilk')}</Label>
                        <Input 
                            type="number" 
                            value={isNoMilk ? 0 : buffaloQuantity} 
                            onChange={(e) => setBuffaloQuantity(parseFloat(e.target.value) || 0)} 
                            className="h-8 w-16 text-center text-xs font-black bg-slate-950/60 border-slate-800 text-slate-100 rounded-lg p-1 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80"
                            disabled={isNoMilk}
                        />
                    </div>
                )}
                <div className="flex items-center space-x-1.5 pt-2 border-t border-dashed border-slate-800/80">
                    <Checkbox 
                        id={`no-milk-farmer-${farmer.id}`} 
                        checked={isNoMilk} 
                        onCheckedChange={(checked) => setIsNoMilk(!!checked)} 
                        className="h-4 w-4 border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded"
                    />
                    <Label htmlFor={`no-milk-farmer-${farmer.id}`} className="text-[10px] font-bold text-slate-300 cursor-pointer">{t('noMilk')}</Label>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-950/20 p-3 border-t border-slate-800/60 flex items-center justify-between">
                <div className="text-sm font-black text-indigo-400">₹{total.toFixed(0)}</div>
                <Button onClick={handleSave} size="sm" className="h-7 px-3 text-[10px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-md hover:scale-[1.02] active:scale-95 transition-transform">
                    {t('save')}
                </Button>
            </CardFooter>
        </Card>
    );
}

function DailyEntryContent() {
    const { customers, farmers, t, isDataLoaded } = useAppContext();
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');
    const [date, setDate] = useState(dateParam ? new Date(dateParam) : new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [leftoverDialogOpen, setLeftoverDialogOpen] = useState(false);

    if (!isDataLoaded) {
      return (
        <div className="container max-w-2xl mx-auto py-6 animate-pulse space-y-4 px-4">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
            </div>
        </div>
      )
    }

    return (
        <div className="container py-4 max-w-2xl mx-auto page-transition px-4">
            <div className="flex justify-between items-center mb-5 gap-2 bg-slate-900/40 border border-slate-800/40 p-3.5 rounded-2xl backdrop-blur-md">
                <div>
                    <Link href="/" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-1 tracking-wider uppercase">
                        <Home className="w-3.5 h-3.5"/> {t('backToHome')}
                    </Link>
                    <h1 className="text-xl font-black text-white">{t('dailyEntry')}</h1>
                </div>
                <div className='flex gap-2 items-center'>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-9 px-3 text-xs font-extrabold rounded-xl border border-slate-800/80 bg-slate-950/40 text-slate-200 hover:bg-slate-800 hover:text-white transition-all">
                                <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                                {format(date, "dd MMM")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && (setDate(d), setCalendarOpen(false))}
                                initialFocus
                                className="bg-slate-900 text-slate-200 rounded-2xl border-none"
                            />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border border-slate-800/80 bg-slate-950/40 text-slate-200 hover:bg-slate-800 transition-all" onClick={() => setLeftoverDialogOpen(true)}>
                        <Zap className="h-4 w-4 text-amber-400" />
                    </Button>
                </div>
            </div>
            
            <Tabs defaultValue="customers" className="w-full space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-slate-950/40 border border-slate-800/80 p-1 rounded-2xl h-12">
                    <TabsTrigger value="customers" className="rounded-xl font-extrabold text-xs uppercase tracking-wider h-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all">{t('customers')}</TabsTrigger>
                    <TabsTrigger value="farmers" className="rounded-xl font-extrabold text-xs uppercase tracking-wider h-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all">{t('farmers')}</TabsTrigger>
                </TabsList>
                <TabsContent value="customers" className="mt-0 focus-visible:ring-0">
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                        {customers.map(c => <CustomerEntryCard key={c.id} customer={c} date={date} />)}
                        {customers.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 font-bold text-xs">{t('noCustomers')}</div>}
                    </div>
                </TabsContent>
                <TabsContent value="farmers" className="mt-0 focus-visible:ring-0">
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                        {farmers.map(f => <FarmerPurchaseCard key={f.id} farmer={f} date={date} />)}
                        {farmers.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 font-bold text-xs">{t('noFarmers')}</div>}
                    </div>
                </TabsContent>
            </Tabs>
            <LeftoverSaleDialog open={leftoverDialogOpen} onOpenChange={setLeftoverDialogOpen} date={date} />
        </div>
    )
}

export default function DailyEntryPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-sm">Loading...</div>}>
            <DailyEntryContent />
        </Suspense>
    )
}
