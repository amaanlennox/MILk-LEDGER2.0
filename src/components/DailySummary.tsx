
"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ShoppingCart, ArrowUp, TrendingUp, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

export function DailySummary({ date, title }: { date: Date, title?: string }) {
    const { entries, farmerEntries, productEntries, leftoverSales, t } = useAppContext();
    const dateString = format(date, 'yyyy-MM-dd');

    const summary = useMemo(() => {
        const customerEntriesForDate = entries.filter(e => e.date === dateString);
        const farmerEntriesForDate = farmerEntries.filter(e => e.date === dateString);
        const productEntriesForDate = productEntries.filter(e => e.date === dateString);
        const leftoverSaleEntriesForDate = leftoverSales.filter(e => e.date === dateString);

        const milkPurchased = farmerEntriesForDate.reduce((sum, e) => sum + (e.cowQuantity || 0) + (e.buffaloQuantity || 0), 0);
        const milkSold = customerEntriesForDate.reduce((sum, e) => sum + (e.cowQuantity || 0) + (e.buffaloQuantity || 0), 0);
        
        const milkSaleAmount = customerEntriesForDate.reduce((sum, e) => sum + (e.cowQuantity * e.cowRate) + (e.buffaloQuantity * e.buffaloRate), 0);
        const productSaleAmount = productEntriesForDate.reduce((sum, e) => sum + e.price, 0);
        const leftoverSaleAmount = leftoverSaleEntriesForDate.reduce((sum, e) => sum + e.total, 0);
        
        const revenue = milkSaleAmount + productSaleAmount + leftoverSaleAmount;

        const purchaseCost = farmerEntriesForDate.reduce((sum, e) => sum + (e.cowQuantity * e.cowRate) + (e.buffaloQuantity * e.buffaloRate), 0);
        const profit = revenue - purchaseCost;

        return { milkPurchased, milkSold, revenue, purchaseCost, profit, productSaleAmount, leftoverSaleAmount, milkSaleAmount };
    }, [dateString, entries, farmerEntries, productEntries, leftoverSales]);

    const summaryItems = [
        { 
            id: 'profit',
            title: t('todaysProfit'), 
            value1: `₹${summary.profit.toFixed(1)}`, 
            value2: null,
            icon: TrendingUp,
            color: summary.profit >= 0 
                ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/5 text-rose-400 border-rose-500/20'
        },
        { 
            id: 'sold',
            title: t('milkSold'), 
            value1: `${summary.milkSold.toFixed(1)} L`, 
            value2: `₹${summary.milkSaleAmount.toFixed(1)}`,
            icon: ArrowUp,
            color: 'bg-indigo-500/5 text-indigo-400 border-indigo-500/20'
        },
        { 
            id: 'purchased',
            title: t('milkPurchased'), 
            value1: `${summary.milkPurchased.toFixed(1)} L`,
            value2: `₹${summary.purchaseCost.toFixed(1)}`,
            icon: ShoppingCart,
            color: 'bg-blue-500/5 text-blue-400 border-blue-500/20' 
        },
        { 
            id: 'extra',
            title: t('productsAndExtra'), 
            value1: `P: ₹${summary.productSaleAmount.toFixed(1)}`,
            value2: `L: ₹${summary.leftoverSaleAmount.toFixed(1)}`,
            icon: Package,
            color: 'bg-violet-500/5 text-violet-400 border-violet-500/20'
        },
    ];

    return (
        <div className="mb-4">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                {title || t('dailySummary')}
            </h2>
            <Carousel className="w-full" opts={{ align: "start", dragFree: true }}>
                <CarouselContent className="-ml-2">
                    {summaryItems.map((item, index) => (
                        <CarouselItem key={index} className="pl-2 basis-[46%] sm:basis-1/2">
                            <Card className={cn("border backdrop-blur-md rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02]", item.color)}>
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{item.title}</span>
                                        <item.icon className="h-3.5 w-3.5 opacity-85 shrink-0" />
                                    </div>
                                    {item.id === 'purchased' || item.id === 'sold' ? (
                                        <div className="flex flex-col">
                                            <span className="text-base font-black tracking-tight">{item.value1}</span>
                                            {item.value2 && <span className="text-[10px] font-bold opacity-75">{item.value2}</span>}
                                        </div>
                                    ) : item.id === 'extra' ? (
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold tracking-tight">{item.value1}</span>
                                            <span className="text-[11px] font-bold tracking-tight">{item.value2}</span>
                                        </div>
                                    ) : (
                                        <div className="text-base font-black tracking-tight">{item.value1}</div>
                                    )}
                                </div>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
