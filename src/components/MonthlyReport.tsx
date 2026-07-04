"use client";

import { useMemo, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, getMonth, getYear, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from "date-fns";
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function MonthlyReport() {
    const { customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales, t } = useAppContext();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const report = useMemo(() => {
        const year = getYear(selectedDate);
        const month = getMonth(selectedDate);

        // Filter data for the selected month
        const monthlyMilkEntries = entries.filter(e => getYear(new Date(e.date)) === year && getMonth(new Date(e.date)) === month);
        const monthlyFarmerEntries = farmerEntries.filter(e => getYear(new Date(e.date)) === year && getMonth(new Date(e.date)) === month);
        const monthlyProductEntries = productEntries.filter(e => getYear(new Date(e.date)) === year && getMonth(new Date(e.date)) === month);
        const monthlyLeftoverSales = leftoverSales.filter(e => getYear(new Date(e.date)) === year && getMonth(new Date(e.date)) === month);
        const monthlyFarmerPayments = farmerPayments.filter(p => getYear(new Date(p.date)) === year && getMonth(new Date(p.date)) === month);

        // 1. Milk Summary
        const totalMilkPurchased = monthlyFarmerEntries.reduce((sum, e) => sum + (e.cowQuantity || 0) + (e.buffaloQuantity || 0), 0);
        const totalMilkSold = monthlyMilkEntries.reduce((sum, e) => sum + (e.cowQuantity || 0) + (e.buffaloQuantity || 0), 0);
        const totalLeftoverSold = monthlyLeftoverSales.reduce((sum, s) => sum + s.quantity, 0);
        const remainingMilk = totalMilkPurchased - totalMilkSold - totalLeftoverSold;

        // 2. Revenue Summary
        const milkRevenue = monthlyMilkEntries.reduce((sum, e) => sum + (e.cowQuantity * e.cowRate) + (e.buffaloQuantity * e.buffaloRate), 0);
        const productsRevenue = monthlyProductEntries.reduce((sum, e) => sum + e.price, 0);
        const leftoverRevenue = monthlyLeftoverSales.reduce((sum, s) => sum + s.total, 0);
        const totalRevenue = milkRevenue + productsRevenue + leftoverRevenue;

        // 3. Expense Summary
        const milkPurchaseCost = monthlyFarmerEntries.reduce((sum, e) => sum + (e.cowQuantity * e.cowRate) + (e.buffaloQuantity * e.buffaloRate), 0);
        const farmerAdvancePayments = monthlyFarmerPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpense = milkPurchaseCost + farmerAdvancePayments;

        // 4. Profit
        const netProfit = totalRevenue - totalExpense;

        // 5. Product Summary
        const paneerQty = monthlyProductEntries.filter(e => e.productType === 'paneer').reduce((sum, e) => sum + e.quantity, 0);
        const paneerAmount = monthlyProductEntries.filter(e => e.productType === 'paneer').reduce((sum, e) => sum + e.price, 0);
        const gheeQty = monthlyProductEntries.filter(e => e.productType === 'ghee').reduce((sum, e) => sum + e.quantity, 0);
        const gheeAmount = monthlyProductEntries.filter(e => e.productType === 'ghee').reduce((sum, e) => sum + e.price, 0);

        // 6. Insights
        const customerSales = customers.map(c => {
            const customerMilkSales = monthlyMilkEntries.filter(e => e.customerId === c.id).reduce((sum, e) => sum + (e.cowQuantity * e.cowRate) + (e.buffaloQuantity * e.buffaloRate), 0);
            const customerProductSales = monthlyProductEntries.filter(e => e.customerId === c.id).reduce((sum, e) => sum + e.price, 0);
            return { name: c.name, total: customerMilkSales + customerProductSales };
        });
        const topCustomer = customerSales.length > 0 ? customerSales.reduce((prev, current) => (prev.total > current.total) ? prev : current) : { name: 'N/A', total: 0 };

        const farmerPurchases = farmers.map(f => {
            const farmerMilkPurchases = monthlyFarmerEntries.filter(e => e.farmerId === f.id).reduce((sum, e) => sum + (e.cowQuantity * e.cowRate) + (e.buffaloQuantity * e.buffaloRate), 0);
            return { name: f.name, total: farmerMilkPurchases };
        });
        const topFarmer = farmerPurchases.length > 0 ? farmerPurchases.reduce((prev, current) => (prev.total > current.total) ? prev : current) : { name: 'N/A', total: 0 };

        const daysInMonth = eachDayOfInterval({ start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) });
        const dailySales = daysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const milk = entries.filter(e => e.date === dateStr).reduce((sum, e) => sum + (e.cowQuantity * e.cowRate) + (e.buffaloQuantity * e.buffaloRate), 0);
            const product = productEntries.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.price, 0);
            const leftover = leftoverSales.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.total, 0);
            return { date: day, total: milk + product + leftover };
        }).filter(d => d.total > 0);

        const highestSaleDay = dailySales.length > 0 ? dailySales.reduce((prev, current) => (prev.total > current.total) ? prev : current) : null;
        const lowestSaleDay = dailySales.length > 0 ? dailySales.reduce((prev, current) => (prev.total < current.total) ? prev : current) : null;

        return {
            totalMilkPurchased, totalMilkSold, remainingMilk,
            milkRevenue, productsRevenue, leftoverRevenue, totalRevenue,
            milkPurchaseCost, farmerAdvancePayments, totalExpense,
            netProfit,
            paneerQty, paneerAmount, gheeQty, gheeAmount,
            topCustomer, topFarmer, highestSaleDay, lowestSaleDay
        };
    }, [selectedDate, customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales]);

    const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
    const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}><ArrowLeft /></Button>
                <h3 className="text-xl font-semibold text-center flex-grow">{format(selectedDate, 'LLLL yyyy')}</h3>
                <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={getMonth(selectedDate) === getMonth(new Date()) && getYear(selectedDate) === getYear(new Date())}><ArrowRight /></Button>
            </div>
            
            {/* Profit */}
            <Card className={cn("relative overflow-hidden border-0 shadow-2xl rounded-2xl p-6", report.netProfit >= 0 ? "bg-gradient-to-br from-emerald-500 to-teal-700 text-white" : "bg-gradient-to-br from-rose-500 to-red-700 text-white")}>
                <div className="absolute top-0 right-0 p-8 opacity-10 bg-white/20 rounded-full translate-x-1/3 -translate-y-1/3 blur-xl" />
                <div className="space-y-1.5 relative z-10">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/80">{t('netProfit')}</p>
                    <p className="text-4xl font-black tracking-tight drop-shadow-sm">₹{report.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </Card>

            {/* Revenue vs Expense */}
            <div className="grid grid-cols-2 gap-3.5">
                <Card className="border border-emerald-500/15 bg-emerald-500/5 rounded-2xl shadow-lg shadow-emerald-950/20">
                     <div className="p-4.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mb-1">{t('totalRevenue')}</p>
                        <p className="text-xl font-black text-emerald-400 tracking-tight">₹{report.totalRevenue.toFixed(1)}</p>
                    </div>
                </Card>
                <Card className="border border-rose-500/15 bg-rose-500/5 rounded-2xl shadow-lg shadow-rose-950/20">
                    <div className="p-4.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400/80 mb-1">{t('totalExpense')}</p>
                        <p className="text-xl font-black text-rose-400 tracking-tight">₹{report.totalExpense.toFixed(1)}</p>
                    </div>
                </Card>
            </div>
            
            {/* Milk Summary */}
            <Card className="glass-card rounded-2xl">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-black text-white/90 uppercase tracking-wider">{t('milkSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{t('milkPurchased')}:</span>
                        <span className="font-extrabold text-white">{report.totalMilkPurchased.toFixed(1)} L</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{t('milkSold')}:</span>
                        <span className="font-extrabold text-white">{report.totalMilkSold.toFixed(1)} L</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-dashed border-slate-800/80 pt-2.5">
                        <span className="text-muted-foreground font-semibold">{t('remainingMilk')}:</span>
                        <span className="font-black text-sky-400">{report.remainingMilk.toFixed(1)} L</span>
                    </div>
                </CardContent>
            </Card>
            
            {/* Products */}
            <Card className="glass-card rounded-2xl">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-black text-white/90 uppercase tracking-wider">{t('productsSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{t('paneer')}:</span>
                        <span className="font-extrabold text-white">{report.paneerQty.toFixed(1)} kg / <span className="text-indigo-400">₹{report.paneerAmount.toFixed(0)}</span></span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{t('ghee')}:</span>
                        <span className="font-extrabold text-white">{report.gheeQty.toFixed(1)} kg / <span className="text-indigo-400">₹{report.gheeAmount.toFixed(0)}</span></span>
                    </div>
                </CardContent>
            </Card>

            {/* Insights */}
            <Card className="glass-card rounded-2xl">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-black text-white/90 uppercase tracking-wider">{t('insights')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3.5">
                   <div className="flex items-center gap-3 text-sm">
                        <div className="bg-amber-500/10 p-1.5 rounded-lg shrink-0">
                            <Crown className="text-amber-400 w-4 h-4" />
                        </div>
                        <span className="text-muted-foreground">
                            {t('topCustomer')}: <strong className="text-white font-extrabold">{report.topCustomer.name}</strong> <span className="text-emerald-400 font-semibold">(₹{report.topCustomer.total.toFixed(0)})</span>
                        </span>
                   </div>
                   <div className="flex items-center gap-3 text-sm">
                        <div className="bg-sky-500/10 p-1.5 rounded-lg shrink-0">
                            <Star className="text-sky-400 w-4 h-4" />
                        </div>
                        <span className="text-muted-foreground">
                            {t('topFarmer')}: <strong className="text-white font-extrabold">{report.topFarmer.name}</strong> <span className="text-emerald-400 font-semibold">(₹{report.topFarmer.total.toFixed(0)})</span>
                        </span>
                   </div>
                   {report.highestSaleDay && (
                       <div className="flex items-center gap-3 text-sm">
                            <div className="bg-emerald-500/10 p-1.5 rounded-lg shrink-0">
                                <TrendingUp className="text-emerald-400 w-4 h-4" />
                            </div>
                            <span className="text-muted-foreground">
                                {t('highestSaleDay')}: <strong className="text-white font-extrabold">{format(report.highestSaleDay.date, 'do MMM')}</strong> <span className="text-emerald-400 font-semibold">(₹{report.highestSaleDay.total.toFixed(0)})</span>
                            </span>
                       </div>
                   )}
                   {report.lowestSaleDay && (
                       <div className="flex items-center gap-3 text-sm">
                            <div className="bg-rose-500/10 p-1.5 rounded-lg shrink-0">
                                <TrendingDown className="text-rose-400 w-4 h-4" />
                            </div>
                            <span className="text-muted-foreground">
                                {t('lowestSaleDay')}: <strong className="text-white font-extrabold">{format(report.lowestSaleDay.date, 'do MMM')}</strong> <span className="text-rose-400 font-semibold">(₹{report.lowestSaleDay.total.toFixed(0)})</span>
                            </span>
                       </div>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}
