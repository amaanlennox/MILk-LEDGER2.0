
"use client";

import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { User, Home, Tractor } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SummaryListPage() {
  const { customers, farmers, t, isDataLoaded } = useAppContext();

  if (!isDataLoaded) {
    return (
      <div className="container mx-auto p-6 animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
        <Tabs defaultValue="customers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
            </TabsList>
            <TabsContent value="customers" className="mt-4">
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-lg" />
                ))}
              </div>
            </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 sm:p-6 page-transition">
      <div className="flex justify-between items-center mb-6 bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl backdrop-blur-md">
        <div>
            <Link href="/" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-1 tracking-wider uppercase">
                <Home className="w-4 h-4"/> {t('backToHome')}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{t('monthlySummary')}</h1>
        </div>
      </div>

      <Tabs defaultValue="customers" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-slate-950/40 border border-slate-800/80 p-1 rounded-2xl h-12">
            <TabsTrigger value="customers" className="rounded-xl font-extrabold text-xs uppercase tracking-wider h-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all">{t('customers')}</TabsTrigger>
            <TabsTrigger value="farmers" className="rounded-xl font-extrabold text-xs uppercase tracking-wider h-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all">{t('farmers')}</TabsTrigger>
        </TabsList>
        <TabsContent value="customers" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {customers.length === 0 ? (
            <Card className="glass-card text-center py-12 border border-slate-800/60 shadow-xl rounded-2xl">
              <CardHeader className="p-6">
                <div className="mx-auto bg-slate-900 border border-slate-800 rounded-full p-4 w-fit">
                  <User className="h-10 w-10 text-slate-400"/>
                </div>
                <CardTitle className="mt-4 text-xl font-black text-white">{t('noCustomers')}</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <Link href="/customers">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/10">
                    {t('addCustomer')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {customers.map((customer) => (
                <Link key={customer.id} href={`/summary/${customer.id}`} className="block group">
                    <Card className="glass-card border border-slate-800/60 hover:bg-slate-900/30 transition-all duration-200 shadow-lg rounded-2xl overflow-hidden group-hover:scale-[1.01]">
                        <CardHeader className="p-4">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-base font-extrabold text-slate-100">
                                <div className="bg-indigo-600/15 p-2.5 rounded-xl border border-indigo-500/20">
                                    <User className="h-5 w-5 text-indigo-400" />
                                </div>
                                {customer.name}
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold uppercase text-[10px] tracking-wider px-2.5 py-1">SALE</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <Button className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-md">{t('viewSummary')}</Button>
                        </CardContent>
                    </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="farmers" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {farmers.length === 0 ? (
            <Card className="glass-card text-center py-12 border border-slate-800/60 shadow-xl rounded-2xl">
              <CardHeader className="p-6">
                <div className="mx-auto bg-slate-900 border border-slate-800 rounded-full p-4 w-fit">
                  <Tractor className="h-10 w-10 text-slate-400"/>
                </div>
                <CardTitle className="mt-4 text-xl font-black text-white">{t('noFarmers')}</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <Link href="/farmers">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/10">
                    {t('addFarmer')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {farmers.map((farmer) => (
                <Link key={farmer.id} href={`/farmer-summary/${farmer.id}`} className="block group">
                    <Card className="glass-card border border-slate-800/60 hover:bg-slate-900/30 transition-all duration-200 shadow-lg rounded-2xl overflow-hidden group-hover:scale-[1.01]">
                        <CardHeader className="p-4">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-base font-extrabold text-slate-100">
                                <div className="bg-indigo-600/15 p-2.5 rounded-xl border border-indigo-500/20">
                                    <Tractor className="h-5 w-5 text-indigo-400" />
                                </div>
                                {farmer.name}
                              </div>
                              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold uppercase text-[10px] tracking-wider px-2.5 py-1">PURCHASE</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <Button className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-md">{t('viewSummary')}</Button>
                        </CardContent>
                    </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
