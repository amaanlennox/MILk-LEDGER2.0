
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MoreVertical, Edit, Trash2, Home } from "lucide-react";
import { FarmerDialog } from "@/components/FarmerDialog";
import type { Farmer } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function FarmersPage() {
  const { farmers, deleteFarmer, t, isDataLoaded } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

  const handleAdd = () => {
    setSelectedFarmer(null);
    setDialogOpen(true);
  };

  const handleEdit = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setDialogOpen(true);
  };
  
  if (!isDataLoaded) {
    return (
      <div className="container mx-auto p-6 animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-12 w-40 rounded-md" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto p-4 sm:p-6 page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl backdrop-blur-md">
         <div>
          <Link href="/" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-1 tracking-wider uppercase">
             <Home className="w-4 h-4"/> {t('backToHome')}
           </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{t('farmerManagement')}</h1>
         </div>
        <Button onClick={handleAdd} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold shadow-lg shadow-indigo-500/15 hover:scale-[1.02] active:scale-95 transition-all">
          <Plus className="mr-2 h-5 w-5" />
          {t('addFarmer')}
        </Button>
      </div>

      <Card className="glass-card border border-slate-800/60 shadow-xl rounded-2xl">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl font-black text-white/90">{t('farmers')}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-medium">
            {t('manageYourFarmers')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-3">
            {farmers.map((farmer) => (
              <div key={farmer.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-800/60 bg-slate-950/40 hover:bg-slate-900/30 transition-all duration-200">
                <div>
                  <p className="font-extrabold text-base text-slate-100">{farmer.name}</p>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-1">
                    {(farmer.milkTypes || []).map(t).join(' • ')}
                  </p>
                </div>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-slate-800 rounded-xl">
                        <MoreVertical className="h-5 w-5 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                      <DropdownMenuItem onClick={() => handleEdit(farmer)} className="text-sm p-2.5 focus:bg-slate-800 focus:text-white cursor-pointer">
                        <Edit className="mr-2.5 h-4 w-4" />
                        <span>{t('editFarmer')}</span>
                      </DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-rose-400 focus:bg-rose-950/30 focus:text-rose-400 text-sm p-2.5 cursor-pointer">
                          <Trash2 className="mr-2.5 h-4 w-4" />
                          <span>{t('deleteFarmer')}</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white font-black">{t('areYouSure')}</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400 text-sm">{t('deleteConfirmation')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteFarmer(farmer.id)} className="bg-rose-600 text-white hover:bg-rose-700 font-bold">
                        {t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
             {farmers.length === 0 && <p className="text-muted-foreground text-center p-10 text-sm">{t('noFarmers')}</p>}
          </div>
        </CardContent>
      </Card>

      <FarmerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        farmer={selectedFarmer}
      />
    </div>
  );
}
