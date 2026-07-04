
"use client";

import { useMemo, useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { BookUser, CalendarDays, Users, Settings, Tractor, Package, TrendingUp, ChevronRight } from "lucide-react";
import { format, subDays } from "date-fns";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ReminderCard } from "@/components/ReminderCard";
import { FarmerReminderCard } from "@/components/FarmerReminderCard";
import { DailySummary } from "@/components/DailySummary";
import { MonthlyReport } from "@/components/MonthlyReport";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

function AnimatedStat({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    
    let timer = setInterval(() => {
      start += Math.ceil(end / 10);
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 20);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="animate-count">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

function DailyStatus() {
  const { customers, entries, farmers, farmerEntries, inAppRemindersEnabled, t } = useAppContext();

  const {
    anyEntryToday,
    areTodayEntriesComplete,
    areYesterdayEntriesComplete,
    pendingEntities,
  } = useMemo(() => {
    const today = new Date();
    const todayDateString = format(today, 'yyyy-MM-dd');
    const yesterdayDateString = format(subDays(today, 1), 'yyyy-MM-dd');

    const customerEntriesToday = entries.filter(e => e.date === todayDateString);
    const customersWithEntriesToday = new Set(customerEntriesToday.map(e => e.customerId));
    const pendingCustomersToday = customers.filter(c => !customersWithEntriesToday.has(c.id));

    const farmerEntriesToday = farmerEntries.filter(e => e.date === todayDateString);
    const farmersWithEntriesToday = new Set(farmerEntriesToday.map(e => e.farmerId));
    const pendingFarmersToday = farmers.filter(f => !farmersWithEntriesToday.has(f.id));

    const anyEntryToday = customerEntriesToday.length > 0 || farmerEntriesToday.length > 0;
    const areTodayEntriesComplete = (customers.length > 0 || farmers.length > 0) && pendingCustomersToday.length === 0 && pendingFarmersToday.length === 0;

    const customerEntriesYesterday = entries.filter(e => e.date === yesterdayDateString);
    const customersWithEntriesYesterday = new Set(customerEntriesYesterday.map(e => e.customerId));
    const pendingCustomersYesterday = customers.filter(c => !customersWithEntriesYesterday.has(c.id));

    const farmerEntriesYesterday = farmerEntries.filter(e => e.date === yesterdayDateString);
    const farmersWithEntriesYesterday = new Set(farmerEntriesYesterday.map(e => e.farmerId));
    const pendingFarmersYesterday = farmers.filter(f => !farmersWithEntriesYesterday.has(f.id));
    
    const areYesterdayEntriesComplete = (customers.length > 0 || farmers.length > 0) && pendingCustomersYesterday.length === 0 && pendingFarmersYesterday.length === 0;

    const allPending = [
        ...pendingCustomersToday.map(c => ({...c, type: 'customer' as const})),
        ...pendingFarmersToday.map(f => ({...f, type: 'farmer' as const}))
    ];

    return { anyEntryToday, areTodayEntriesComplete, areYesterdayEntriesComplete, pendingEntities: allPending };
  }, [customers, entries, farmers, farmerEntries]);

  if (areTodayEntriesComplete) {
    return <DailySummary date={new Date()} />;
  }

  if (!anyEntryToday && areYesterdayEntriesComplete) {
    return <DailySummary date={subDays(new Date(), 1)} title={t('yesterdaysSummary')} />;
  }

  if (!inAppRemindersEnabled) return null;

  const showReminders = anyEntryToday && pendingEntities.length > 0;

  return (
    <div className="mb-4">
      <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-accent" />
        {t('pendingEntries')}
      </h2>
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <CarouselContent className="-ml-2">
          {showReminders ? (
            pendingEntities.map((entity) => (
              <CarouselItem key={entity.id} className="pl-2 basis-[75%] sm:basis-1/2 md:basis-1/3">
                <div className="h-full">
                  {entity.type === 'customer' ? <ReminderCard customer={entity} /> : <FarmerReminderCard farmer={entity} />}
                </div>
              </CarouselItem>
            ))
          ) : (
            <CarouselItem className="pl-2 basis-full">
              <Card className="glass-card flex items-center justify-center h-16 border-dashed">
                <CardContent className="p-3 text-center">
                  {!anyEntryToday ? (
                    <p className="text-destructive font-bold text-[10px]">{t('noEntryToday')}</p>
                  ) : (
                    <p className="text-muted-foreground font-medium text-[10px]">{t('noPendingEntries')}</p>
                  )}
                </CardContent>
              </Card>
            </CarouselItem>
          )}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

const MilkCanLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white opacity-90">
    <path d="M7 8V7C7 5.34315 8.34315 4 10 4H14C15.6569 4 17 5.34315 17 7V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="5" y="8" width="14" height="4" rx="1" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 12V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ReportLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white opacity-90">
    <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 4.5C4 3.11929 5.11929 2 6.5 2H18C19.1046 2 20 2.89543 20 4V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 4.5V19.5C4 20.8807 5.11929 22 6.5 22H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 7H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 11H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 15H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function Home() {
  const { t, isDataLoaded } = useAppContext();

  if (!isDataLoaded) {
    return (
      <div className="container py-6 animate-pulse space-y-4">
        <div className="h-16 w-full rounded-xl bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3">
           {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 max-w-2xl page-transition space-y-5">
      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">MilkLedger</h1>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{format(new Date(), 'EEEE, dd MMMM')}</p>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shadow-md bg-slate-950/40 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white transition-all">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <DailyStatus />

      <div className="grid grid-cols-2 gap-4">
        <Link href="/daily-entry" className="block h-34 group">
          <Card className="p-4 border border-blue-500/10 bg-gradient-to-br from-blue-600 to-blue-800 text-white active:scale-95 hover:scale-[1.02] hover:shadow-blue-500/10 transition-all duration-200 premium-shadow h-full flex flex-col justify-between relative overflow-hidden rounded-2xl">
            <div className="absolute top-0 right-0 p-2 opacity-15 group-hover:opacity-25 transition-opacity duration-300">
               <MilkCanLogo />
            </div>
            <div className="bg-white/10 p-2 rounded-xl w-fit backdrop-blur-md">
              <MilkCanLogo />
            </div>
            <div className="pt-4">
                <h2 className="text-lg font-extrabold leading-tight mb-1">{t('dailyEntry')}</h2>
                <div className="flex items-center gap-1.5">
                  <p className="text-[9px] text-blue-100 font-bold uppercase tracking-wider">{t('addTodaysMilk')}</p>
                  <ChevronRight className="w-3 h-3 text-blue-200" />
                </div>
            </div>
          </Card>
        </Link>

        <Link href="/summary" className="block h-34 group">
          <Card className="p-4 border border-indigo-500/10 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white active:scale-95 hover:scale-[1.02] hover:shadow-indigo-500/10 transition-all duration-200 premium-shadow h-full flex flex-col justify-between relative overflow-hidden rounded-2xl">
            <div className="absolute top-0 right-0 p-2 opacity-15 group-hover:opacity-25 transition-opacity duration-300">
               <ReportLogo />
            </div>
            <div className="bg-white/10 p-2 rounded-xl w-fit backdrop-blur-md">
               <ReportLogo />
            </div>
             <div className="pt-4">
                <h2 className="text-lg font-extrabold leading-tight mb-1">{t('monthlySummary')}</h2>
                <div className="flex items-center gap-1.5">
                  <p className="text-[9px] text-indigo-100 font-bold uppercase tracking-wider">{t('viewMonthlyReports')}</p>
                  <ChevronRight className="w-3 h-3 text-indigo-200" />
                </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/products" className="group">
          <Card className="glass-card p-3.5 text-center active:bg-slate-800/80 transition-all duration-200 border border-slate-800/60 shadow-md rounded-2xl hover:scale-[1.03] hover:bg-slate-900/60">
            <div className="bg-blue-500/10 p-2 rounded-xl w-fit mx-auto mb-2 group-hover:scale-105 transition-transform">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="font-extrabold text-[11px] text-slate-200 tracking-wide uppercase">{t('products')}</h3>
          </Card>
        </Link>
        <Link href="/customers" className="group">
          <Card className="glass-card p-3.5 text-center active:bg-slate-800/80 transition-all duration-200 border border-slate-800/60 shadow-md rounded-2xl hover:scale-[1.03] hover:bg-slate-900/60">
            <div className="bg-indigo-500/10 p-2 rounded-xl w-fit mx-auto mb-2 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="font-extrabold text-[11px] text-slate-200 tracking-wide uppercase">{t('customers')}</h3>
          </Card>
        </Link>
        <Link href="/farmers" className="group">
          <Card className="glass-card p-3.5 text-center active:bg-slate-800/80 transition-all duration-200 border border-slate-800/60 shadow-md rounded-2xl hover:scale-[1.03] hover:bg-slate-900/60">
            <div className="bg-sky-500/10 p-2 rounded-xl w-fit mx-auto mb-2 group-hover:scale-105 transition-transform">
              <Tractor className="h-5 w-5 text-sky-400" />
            </div>
            <h3 className="font-extrabold text-[11px] text-slate-200 tracking-wide uppercase">{t('farmers')}</h3>
          </Card>
        </Link>
      </div>

      <Card className="glass-card overflow-hidden border border-slate-800/60 shadow-xl rounded-2xl">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="px-4.5 h-12 hover:no-underline transition-colors hover:bg-slate-900/30 [&[data-state=open]>div>svg]:rotate-180 text-left">
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-500/10 p-2 rounded-xl">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                </div>
                <h2 className="text-sm font-black text-slate-100 tracking-wide uppercase">
                  {t('monthlyReport')}
                </h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4.5 pb-4 border-t border-slate-800/30 pt-4">
              <MonthlyReport />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}
