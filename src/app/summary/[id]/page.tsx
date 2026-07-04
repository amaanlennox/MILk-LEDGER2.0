"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Share2, Eye, Package, Milk } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductType } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function SummaryPage() {
    const params = useParams();
    const id = params.id as string;
    const { getCustomerById, entries, productEntries, t, isDataLoaded } = useAppContext();
    const { toast } = useToast();

    const customer = getCustomerById(id);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const { monthlyTimeline, totals } = useMemo(() => {
        if (!customer) return { monthlyTimeline: [], totals: { cowQuantity: 0, buffaloQuantity: 0, milkTotalAmount: 0, cowTotalAmount: 0, buffaloTotalAmount: 0, productsTotalAmount: 0, grandTotal: 0, paneerQuantity: 0, paneerTotalAmount: 0, gheeQuantity: 0, gheeTotalAmount: 0 }};

        const year = getYear(selectedDate);
        const month = getMonth(selectedDate);

        const filteredMilkEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.customerId === id && getYear(entryDate) === year && getMonth(entryDate) === month;
        });

        const filteredProductEntries = productEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.customerId === id && getYear(entryDate) === year && getMonth(entryDate) === month;
        });

        const milkTotals = filteredMilkEntries.reduce((acc, entry) => {
            const cowQty = (customer.milkTypes.includes('cow') ? entry.cowQuantity : 0) || 0;
            const buffaloQty = (customer.milkTypes.includes('buffalo') ? entry.buffaloQuantity : 0) || 0;
            
            acc.cowQuantity += cowQty;
            acc.buffaloQuantity += buffaloQty;
            acc.cowTotalAmount += cowQty * (entry.cowRate || 0);
            acc.buffaloTotalAmount += buffaloQty * (entry.buffaloRate || 0);
            return acc;
        }, { cowQuantity: 0, buffaloQuantity: 0, cowTotalAmount: 0, buffaloTotalAmount: 0 });
        
        const milkTotalAmount = milkTotals.cowTotalAmount + milkTotals.buffaloTotalAmount;

        const productTotals = filteredProductEntries.reduce((acc, entry) => {
            if (entry.productType === 'paneer') {
                acc.paneerQuantity += entry.quantity;
                acc.paneerTotalAmount += entry.price;
            } else if (entry.productType === 'ghee') {
                acc.gheeQuantity += entry.quantity;
                acc.gheeTotalAmount += entry.price;
            }
            return acc;
        }, { paneerQuantity: 0, paneerTotalAmount: 0, gheeQuantity: 0, gheeTotalAmount: 0 });

        const productsTotalAmount = productTotals.paneerTotalAmount + productTotals.gheeTotalAmount;
        const grandTotal = milkTotalAmount + productsTotalAmount;

        const timeline = [
            ...filteredMilkEntries.map(e => ({ type: 'milk' as const, data: e, date: e.date })),
            ...filteredProductEntries.map(e => ({ type: 'product' as const, data: e, date: e.date })),
        ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { monthlyTimeline: timeline, totals: { ...milkTotals, milkTotalAmount, ...productTotals, productsTotalAmount, grandTotal } };
    }, [entries, productEntries, id, selectedDate, customer]);
    
    const years = useMemo(() => Array.from(new Set([...entries, ...productEntries].map(e => getYear(new Date(e.date))))).sort((a, b) => b - a), [entries, productEntries]);
    const months = useMemo(() => Array.from({length: 12}, (_, i) => ({value: i, name: format(new Date(2000, i), 'LLLL')})), []);

    const generatePdf = async (type: 'view' | 'share') => {
        if (!customer) return;
    
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let cursorY = 25;
    
        // Header
        doc.setFillColor(26, 43, 75); // Navy Blue
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(t('appName'), margin, 20);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(t('monthlyMilkStatement'), margin, 30);
        
        doc.setFontSize(10);
        doc.text(`${format(new Date(), 'dd MMM yyyy')}`, pageWidth - margin, 20, { align: 'right' });

        cursorY = 55;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${t('customerName')}: ${customer.name}`, margin, cursorY);
        cursorY += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(`${t('month')}: ${format(selectedDate, 'LLLL yyyy')}`, margin, cursorY);
        cursorY += 15;
    
        const milkEntriesForMonth = monthlyTimeline.filter(item => item.type === 'milk').map(item => item.data);
        if (milkEntriesForMonth.length > 0) {
            autoTable(doc, {
                head: [[t('date'), `${t('cow')} (L)`, `${t('buffalo')} (L)`]],
                body: milkEntriesForMonth.map((entry) => [
                    format(new Date(entry.date), 'dd MMM yyyy'),
                    (entry.cowQuantity > 0) ? entry.cowQuantity.toFixed(2) : '-',
                    (entry.buffaloQuantity > 0) ? entry.buffaloQuantity.toFixed(2) : '-',
                ]),
                startY: cursorY,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 5 },
                columnStyles: { 0: { halign: 'left' }, 1: { halign: 'center' }, 2: { halign: 'center' } },
                margin: { left: margin, right: margin }
            });
            cursorY = (doc as any).lastAutoTable.finalY + 15;
        }

        // Summary Section
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, cursorY, pageWidth - (margin * 2), 60, 'F');
        
        let summaryY = cursorY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(t('calculation'), margin + 5, summaryY);
        summaryY += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        if (totals.cowQuantity > 0) {
            doc.text(`${t('cowMilk')}: ${totals.cowQuantity.toFixed(2)}L @ Rs.${customer.cowRate}`, margin + 5, summaryY);
            doc.text(`Rs. ${totals.cowTotalAmount.toFixed(2)}`, pageWidth - margin - 5, summaryY, { align: 'right' });
            summaryY += 7;
        }
        if (totals.buffaloQuantity > 0) {
            doc.text(`${t('buffaloMilk')}: ${totals.buffaloQuantity.toFixed(2)}L @ Rs.${customer.buffaloRate}`, margin + 5, summaryY);
            doc.text(`Rs. ${totals.buffaloTotalAmount.toFixed(2)}`, pageWidth - margin - 5, summaryY, { align: 'right' });
            summaryY += 7;
        }

        const products = monthlyTimeline.filter(i => i.type === 'product');
        if (products.length > 0) {
            summaryY += 3;
            doc.setFont('helvetica', 'bold');
            doc.text(t('products'), margin + 5, summaryY);
            summaryY += 7;
            doc.setFont('helvetica', 'normal');
            products.forEach(p => {
                doc.text(`${t(p.data.productType as ProductType)} (${p.data.quantity}kg)`, margin + 5, summaryY);
                doc.text(`Rs. ${p.data.price.toFixed(2)}`, pageWidth - margin - 5, summaryY, { align: 'right' });
                summaryY += 6;
            });
        }

        cursorY = summaryY + 10;
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(1);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(37, 99, 235);
        doc.text(t('grandTotal'), margin, cursorY);
        doc.text(`Rs. ${totals.grandTotal.toFixed(2)}`, pageWidth - margin, cursorY, { align: 'right' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(t('generatedBy'), pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

        const safeName = customer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeName}_${format(selectedDate, 'MMM_yyyy')}_bill.pdf`;

        if (type === 'share') {
            const blob = doc.output('blob');
            const file = new File([blob], filename, { type: 'application/pdf' });
            const shareData = {
                files: [file],
                title: filename,
                text: `${t('milkBill')} - ${customer.name} (${format(selectedDate, 'MMMM yyyy')})`
            };

            const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare && navigator.canShare(shareData);

            if (canShare) {
                try {
                    await navigator.share(shareData);
                    return;
                } catch (err) {
                    console.log("Share failed:", err);
                }
            }
            
            // Fallback for no share support or failed share
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            toast({ 
                title: t('exportSuccess'), 
                description: canShare ? "Sharing failed, bill downloaded instead." : "Sharing not supported, bill downloaded instead." 
            });
        } else {
            const dataUri = doc.output('datauristring');
            const win = window.open();
            if (win) {
                win.document.write(`<iframe src="${dataUri}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
            } else {
                doc.save(filename);
                toast({ variant: "destructive", title: "View Blocked", description: "Pop-up blocked. Bill downloaded instead." });
            }
        }
    };

    if (!isDataLoaded) {
      return (
        <div className="container mx-auto p-4 sm:p-6 animate-pulse">
            <Skeleton className="h-6 w-40 mb-2" />
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-7 w-40" />
                </div>
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                    <Skeleton className="h-11 w-full rounded-md" />
                    <Skeleton className="h-11 w-full rounded-md" />
                </div>
            </div>
            <Skeleton className="h-48 w-full mb-6 rounded-lg" />
        </div>
      )
    }

    if (!customer) {
        return (
          <div className="container mx-auto p-6 text-center">
            <p className="text-xl">{t('customers')} not found.</p>
            <Link href="/" className="mt-4 inline-block">
              <Button size="lg">{t('backToHome')}</Button>
            </Link>
          </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto p-4 sm:p-6 page-transition">
            <Link href="/summary" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-3 tracking-wider uppercase">
                <ChevronLeft className="w-4 h-4"/> {t('backToSummary')}
            </Link>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 gap-4 bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl backdrop-blur-md">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white">{customer.name}</h1>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{t('monthlySummary')}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                    <Select value={getMonth(selectedDate).toString()} onValueChange={(m) => setSelectedDate(setMonth(selectedDate, parseInt(m)))}>
                        <SelectTrigger className="h-10 bg-slate-950/40 border-slate-800 text-white rounded-xl focus:ring-1 focus:ring-indigo-500"><SelectValue placeholder={t('month')} /></SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            {months.map(m => <SelectItem key={m.value} value={m.value.toString()} className="focus:bg-slate-800 focus:text-white">{m.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={getYear(selectedDate).toString()} onValueChange={(y) => setSelectedDate(setYear(selectedDate, parseInt(y)))}>
                        <SelectTrigger className="h-10 bg-slate-950/40 border-slate-800 text-white rounded-xl focus:ring-1 focus:ring-indigo-500"><SelectValue placeholder={t('year')} /></SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            {years.map(y => <SelectItem key={y} value={y.toString()} className="focus:bg-slate-800 focus:text-white">{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="col-span-2 grid grid-cols-2 gap-2 mt-1">
                        <Button onClick={() => generatePdf('view')} variant="outline" className="h-10 border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-slate-200 rounded-xl font-bold">
                            <Eye className="mr-1.5 h-4 w-4 text-slate-400" /> {t('viewPDF')}
                        </Button>
                        <Button onClick={() => generatePdf('share')} className="h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-500/10 rounded-xl">
                            <Share2 className="mr-1.5 h-4 w-4" /> {t('shareBill')}
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="mb-4 glass-card overflow-hidden border border-slate-800/60 rounded-2xl shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-b border-slate-800/80 p-5">
                    <CardTitle className="text-base font-black text-white/95 flex items-center justify-between uppercase tracking-wider">
                        <span>{t('grandTotal')}</span>
                        <span className="text-xl font-black text-indigo-400">Rs. {totals.grandTotal.toFixed(2)}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{t('totalMilk')}</p>
                            <p className="text-base font-black text-slate-100">{(totals.cowQuantity + totals.buffaloQuantity).toFixed(2)} L</p>
                        </div>
                        <p className="text-sm font-bold text-slate-200">Rs. {totals.milkTotalAmount.toFixed(2)}</p>
                    </div>
                    {totals.productsTotalAmount > 0 && (
                        <>
                            <Separator className="bg-slate-800/60" />
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{t('products')}</p>
                                    <p className="text-sm font-bold text-slate-100">
                                        {[
                                            totals.paneerQuantity > 0 && t('paneer'),
                                            totals.gheeQuantity > 0 && t('ghee')
                                        ].filter(Boolean).join(' / ')}
                                    </p>
                                </div>
                                <p className="text-sm font-bold text-indigo-400">Rs. {totals.productsTotalAmount.toFixed(2)}</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className="glass-card border border-slate-800/60 rounded-2xl shadow-xl">
                <CardHeader className="p-5 border-b border-slate-800/60">
                    <CardTitle className="text-xs font-black text-white/90 uppercase tracking-wider">{t('dailyEntries')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-5 sm:pt-0">
                    <div className="space-y-2 px-4 py-4 sm:px-0 sm:pb-0">
                        {monthlyTimeline.length > 0 ? (
                            monthlyTimeline.map(item => (
                                item.type === 'milk' ? (
                                    <div key={item.data.id} className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5 hover:bg-slate-900/30 transition-all duration-200">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-600/10 border border-indigo-500/20 p-2 rounded-xl"><Milk className="h-5 w-5 text-indigo-400" /></div>
                                            <div>
                                                <p className="font-extrabold text-sm text-slate-100">{format(new Date(item.data.date), 'dd MMM')}</p>
                                                <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                                                    {(customer.milkTypes.includes('cow') && (item.data.cowQuantity ?? 0) > 0) && (
                                                        <span>{t('cow')}: <b className="text-indigo-400 font-extrabold">{item.data.cowQuantity}L</b></span>
                                                    )}
                                                    {(customer.milkTypes.includes('buffalo') && (item.data.buffaloQuantity ?? 0) > 0) && (
                                                        <span>{t('buffalo')}: <b className="text-indigo-400 font-extrabold">{item.data.buffaloQuantity}L</b></span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-extrabold text-sm text-slate-200">Rs. {((item.data.cowQuantity * item.data.cowRate) + (item.data.buffaloQuantity * item.data.buffaloRate)).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={item.data.id} className="flex items-center justify-between rounded-xl border border-dashed border-indigo-500/20 bg-indigo-500/5 p-3.5 hover:bg-indigo-500/10 transition-all duration-200">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-xl"><Package className="h-5 w-5 text-indigo-400" /></div>
                                            <div>
                                                <p className="font-extrabold text-sm text-slate-100">{format(new Date(item.data.date), 'dd MMM')}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{t(item.data.productType as ProductType)} - {item.data.quantity}kg</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm text-indigo-400">Rs. {item.data.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                )
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-500">
                                <p className="text-sm font-bold">{t('noEntries')}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
