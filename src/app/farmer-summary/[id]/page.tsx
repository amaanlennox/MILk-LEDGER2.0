"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Share2, Eye, Wallet, Trash2, Milk } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FarmerPaymentDialog } from "@/components/FarmerPaymentDialog";
import { FarmerPayment } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function FarmerSummaryPage() {
    const params = useParams();
    const id = params.id as string;
    const { getFarmerById, farmerEntries, farmerPayments, t, isDataLoaded, deleteFarmerPayment } = useAppContext();
    const { toast } = useToast();

    const farmer = getFarmerById(id);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<FarmerPayment | null>(null);

    const { monthlyTimeline, totals } = useMemo(() => {
        if (!farmer) return { monthlyTimeline: [], totals: { cowQuantity: 0, buffaloQuantity: 0, milkTotalAmount: 0, cowTotalAmount: 0, buffaloTotalAmount: 0, paymentTotalAmount: 0, finalPayableAmount: 0 }};

        const year = getYear(selectedDate);
        const month = getMonth(selectedDate);

        const monthlyMilkEntries = farmerEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.farmerId === id && getYear(entryDate) === year && getMonth(entryDate) === month;
        });

        const monthlyPayments = farmerPayments.filter(payment => {
            const paymentDate = new Date(payment.date);
            return payment.farmerId === id && getYear(paymentDate) === year && getMonth(paymentDate) === month;
        });

        const milkTotals = monthlyMilkEntries.reduce((acc, entry) => {
            const cowQty = (farmer.milkTypes.includes('cow') ? entry.cowQuantity : 0) || 0;
            const buffaloQty = (farmer.milkTypes.includes('buffalo') ? entry.buffaloQuantity : 0) || 0;
            
            acc.cowQuantity += cowQty;
            acc.buffaloQuantity += buffaloQty;
            acc.cowTotalAmount += cowQty * (entry.cowRate || 0);
            acc.buffaloTotalAmount += buffaloQty * (entry.buffaloRate || 0);
            return acc;
        }, { cowQuantity: 0, buffaloQuantity: 0, cowTotalAmount: 0, buffaloTotalAmount: 0 });
        
        const milkTotalAmount = milkTotals.cowTotalAmount + milkTotals.buffaloTotalAmount;
        const paymentTotalAmount = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
        const finalPayableAmount = milkTotalAmount - paymentTotalAmount;

        const timeline = [
            ...monthlyMilkEntries.map(e => ({ type: 'milk' as const, data: e, date: e.date })),
            ...monthlyPayments.map(p => ({ type: 'payment' as const, data: p, date: p.date })),
        ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { 
            monthlyTimeline: timeline, 
            totals: { ...milkTotals, milkTotalAmount, paymentTotalAmount, finalPayableAmount } 
        };
    }, [farmerEntries, farmerPayments, id, selectedDate, farmer]);

    const handleEditPayment = (payment: FarmerPayment) => {
        setSelectedPayment(payment);
        setPaymentDialogOpen(true);
    };

    const generatePdf = async (type: 'view' | 'share') => {
        if (!farmer) return;
    
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        
        // Header
        doc.setFillColor(31, 41, 55); // Dark Gray/Navy
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(t('appName'), margin, 20);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(t('milkPurchaseBill'), margin, 30);
        doc.setFontSize(10);
        doc.text(format(new Date(), 'dd MMM yyyy'), pageWidth - margin, 20, { align: 'right' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`${t('farmerName')}: ${farmer.name}`, margin, 55);
        doc.text(`${t('month')}: ${format(selectedDate, 'LLLL yyyy')}`, margin, 62);
    
        const milkEntries = monthlyTimeline.filter(i => i.type === 'milk').map(i => i.data);
        autoTable(doc, {
            head: [[t('date'), `${t('cow')} (L)`, `${t('buffalo')} (L)`, 'Total (Rs.)']],
            body: milkEntries.map(e => [
                format(new Date(e.date), 'dd MMM yyyy'),
                e.cowQuantity.toFixed(2),
                e.buffaloQuantity.toFixed(2),
                ((e.cowQuantity * e.cowRate) + (e.buffaloQuantity * e.buffaloRate)).toFixed(2)
            ]),
            startY: 75,
            theme: 'striped',
            headStyles: { fillColor: [31, 41, 55] }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.text(`${t('totalAmount')}: Rs. ${totals.milkTotalAmount.toFixed(2)}`, pageWidth - margin, finalY, { align: 'right' });
        doc.text(`${t('totalPayments')}: Rs. ${totals.paymentTotalAmount.toFixed(2)}`, pageWidth - margin, finalY + 7, { align: 'right' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${t('finalPayableAmount')}: Rs. ${totals.finalPayableAmount.toFixed(2)}`, pageWidth - margin, finalY + 16, { align: 'right' });

        const safeName = farmer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeName}_purchase_${format(selectedDate, 'MMM_yyyy')}.pdf`;

        if (type === 'share') {
            const blob = doc.output('blob');
            const file = new File([blob], filename, { type: 'application/pdf' });
            const shareData = {
                files: [file],
                title: filename,
                text: `${t('milkPurchaseBill')} - ${farmer.name} (${format(selectedDate, 'MMMM yyyy')})`
            };
            
            const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare && navigator.canShare(shareData);

            if (canShare) {
                try {
                    await navigator.share(shareData);
                    return;
                } catch (err) {
                    console.error("Share failed:", err);
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
                win.document.write(`<iframe src="${dataUri}" frameborder="0" style="border:0; width:100%; height:100%;"></iframe>`);
            } else {
                doc.save(filename);
                toast({ variant: "destructive", title: "View Blocked", description: "Pop-up blocked. Bill downloaded instead." });
            }
        }
    };

    const years = useMemo(() => Array.from(new Set([...farmerEntries, ...farmerPayments].map(e => getYear(new Date(e.date))))).sort((a, b) => b - a), [farmerEntries, farmerPayments]);
    const months = useMemo(() => Array.from({length: 12}, (_, i) => ({value: i, name: format(new Date(2000, i), 'LLLL')})), []);

    if (!isDataLoaded) return <Skeleton className="h-screen w-full" />;

    if (!farmer) return <div className="p-20 text-center">{t('noFarmers')}</div>;

    return (
        <div className="container max-w-2xl mx-auto p-4 sm:p-6 page-transition">
            <Link href="/summary" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-3 tracking-wider uppercase">
                <ChevronLeft className="w-4 h-4"/> {t('backToFarmerSummaryList')}
            </Link>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 gap-4 bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl backdrop-blur-md">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white">{farmer.name}</h1>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{t('purchaseSummary')}</p>
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
                        <span>{t('finalPayableAmount')}</span>
                        <span className="text-xl font-black text-indigo-400">Rs. {totals.finalPayableAmount.toFixed(2)}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{t('totalAmount')}</p>
                        <p className="text-sm font-bold text-slate-200">Rs. {totals.milkTotalAmount.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center text-rose-400">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider">{t('totalPayments')}</p>
                        <p className="text-sm font-bold">- Rs. {totals.paymentTotalAmount.toFixed(2)}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-card border border-slate-800/60 rounded-2xl shadow-xl">
                <CardHeader className="p-5 border-b border-slate-800/60">
                    <CardTitle className="text-xs font-black text-white/90 uppercase tracking-wider">{t('dailyEntries')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-5 sm:pt-0">
                    <div className="space-y-2 px-4 py-4 sm:px-0 sm:pb-0">
                        {monthlyTimeline.map(item => (
                            item.type === 'milk' ? (
                                <div key={item.data.id} className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5 hover:bg-slate-900/30 transition-all duration-200">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-600/10 border border-indigo-500/20 p-2 rounded-xl"><Milk className="h-5 w-5 text-indigo-400" /></div>
                                        <div>
                                            <p className="font-extrabold text-sm text-slate-100">{format(new Date(item.data.date), 'dd MMM')}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{t('cow')}: <b className="text-indigo-400">{item.data.cowQuantity}L</b> / {t('buffalo')}: <b className="text-indigo-400">{item.data.buffaloQuantity}L</b></p>
                                        </div>
                                    </div>
                                    <p className="font-extrabold text-sm text-slate-200">Rs. {((item.data.cowQuantity * item.data.cowRate) + (item.data.buffaloQuantity * item.data.buffaloRate)).toFixed(2)}</p>
                                </div>
                            ) : (
                                <div key={item.data.id} className="flex items-center justify-between border border-dashed border-rose-500/20 bg-rose-500/5 p-3.5 rounded-xl hover:bg-rose-500/10 transition-all duration-200">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl"><Wallet className="h-5 w-5 text-rose-400" /></div>
                                        <div>
                                            <p className="font-extrabold text-sm text-slate-100">{format(new Date(item.data.date), 'dd MMM')}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{item.data.note || t('advancePaid')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="font-extrabold text-sm text-rose-400">- Rs. {item.data.amount.toFixed(2)}</p>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => deleteFarmerPayment(item.data.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </CardContent>
            </Card>
            <FarmerPaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} payment={selectedPayment} farmerId={id} date={new Date()} />
        </div>
    );
}
