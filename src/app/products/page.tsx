
"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Home, User, Plus, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Customer, ProductType } from "@/lib/types";
import { ProductEntryDialog } from "@/components/ProductEntryDialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function CustomerListForProduct({ productType }: { productType: ProductType }) {
  const { customers, t, isDataLoaded } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  const handleAddProductEntry = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };
  
  if (!isDataLoaded) {
    return (
      <div className="animate-pulse">
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (customers.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">{t('noCustomers')}</p>
        <Link href="/customers">
          <Button size="lg">{t('addCustomer')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          placeholder={t('searchCustomer')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="pl-11 h-11 bg-slate-950/40 border-slate-800/80 text-white rounded-xl focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 transition-all placeholder:text-slate-500"
        />
      </div>
      {filteredCustomers.length > 0 ? (
        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="glass-card rounded-2xl border-slate-800/60 bg-slate-950/40 hover:bg-slate-900/40 transition-all duration-300">
              <CardHeader className="flex-row items-center justify-between p-4 pb-2 space-y-0">
                <CardTitle className="text-base font-extrabold text-slate-100">{customer.name}</CardTitle>
                 <Button size="icon" onClick={() => handleAddProductEntry(customer)} className="h-9 w-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all">
                      <Plus className="h-4.5 w-4.5" />
                      <span className="sr-only">Add Entry</span>
                  </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-1">
                      {(customer.milkTypes || []).map(t).join(' • ')}
                  </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10 text-sm">{t('noCustomersFound')}</p>
      )}

      {selectedCustomer && (
        <ProductEntryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customer={selectedCustomer}
          productType={productType}
        />
      )}
    </>
  );
}

export default function ProductsPage() {
  const { t } = useAppContext();

  return (
    <div className="container max-w-3xl mx-auto p-4 sm:p-6 page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl backdrop-blur-md">
        <div>
            <Link href="/" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-1 tracking-wider uppercase">
                <Home className="w-4 h-4"/> {t('backToHome')}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{t('addProducts')}</h1>
        </div>
      </div>
      
      <Tabs defaultValue="paneer" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-slate-950/40 border border-slate-800/80 p-1 rounded-2xl h-13">
            <TabsTrigger value="paneer" className="rounded-xl font-extrabold text-xs uppercase tracking-wider h-11 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all">{t('paneer')}</TabsTrigger>
            <TabsTrigger value="ghee" className="rounded-xl font-extrabold text-xs uppercase tracking-wider h-11 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all">{t('ghee')}</TabsTrigger>
        </TabsList>
        <TabsContent value="paneer" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <Card className="glass-card border border-slate-800/60 shadow-xl rounded-2xl">
                <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-lg font-black text-white/95">{t('paneer')} {t('productEntry')}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-medium">{t('selectCustomerForProduct')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <CustomerListForProduct productType="paneer" />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="ghee" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
             <Card className="glass-card border border-slate-800/60 shadow-xl rounded-2xl">
                <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-lg font-black text-white/95">{t('ghee')} {t('productEntry')}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-medium">{t('selectCustomerForProduct')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <CustomerListForProduct productType="ghee" />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
