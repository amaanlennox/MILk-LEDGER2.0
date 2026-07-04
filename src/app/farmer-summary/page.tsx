
"use client";

import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Tractor, Home } from "lucide-react";

export default function FarmerSummaryListPage() {
  const { farmers, t } = useAppContext();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
            <Link href="/" className="text-base text-muted-foreground hover:text-primary flex items-center gap-2 mb-2">
                <Home className="w-5 h-5"/> {t('backToHome')}
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold">{t('purchaseSummary')}</h1>
        </div>
      </div>

      {farmers.length === 0 ? (
        <Card className="text-center py-16">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-6 w-fit">
              <Tractor className="h-16 w-16 text-muted-foreground"/>
            </div>
            <CardTitle className="mt-4 text-3xl">{t('noFarmers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/farmers">
              <Button size="lg">
                {t('addFarmer')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {farmers.map((farmer) => (
            <Link key={farmer.id} href={`/farmer-summary/${farmer.id}`} className="block">
                <Card className="hover:bg-muted/50 transition-colors h-full">
                    <CardHeader className="p-4">
                        <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="bg-primary/20 p-3 rounded-full">
                            <Tractor className="h-6 w-6 text-primary" />
                        </div>
                        {farmer.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Button className="w-full">{t('viewSummary')}</Button>
                    </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
