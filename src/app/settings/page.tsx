"use client";

import { useRef, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageToggle } from "@/components/LanguageToggle";
import Link from "next/link";
import { Home, Upload, Share2, Trash2, ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export default function SettingsPage() {
  const { 
    t, 
    customers, 
    entries, 
    farmers, 
    farmerEntries, 
    farmerPayments, 
    productEntries, 
    leftoverSales, 
    language, 
    inAppRemindersEnabled, 
    setInAppRemindersEnabled, 
    restoreBackup, 
    resetAllData 
  } = useAppContext();
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupFileContent, setBackupFileContent] = useState<any>(null);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);

  const handleShareBackup = async () => {
    const backupData = { 
      customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales, language, inAppRemindersEnabled 
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `MilkLedger_Backup_${format(new Date(), 'yyyy_MM_dd')}.json`;
    
    if (navigator.share) {
      const file = new File([jsonString], filename, { type: 'application/json' });
      try {
        await navigator.share({
          files: [file],
          title: 'MilkLedger Data Backup',
          text: 'Restore your MilkLedger data with this file.'
        });
        toast({ title: t('exportSuccess') });
      } catch (err) {
        console.error("Backup share failed", err);
      }
    } else {
      // Fallback for browser
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: t('exportSuccess') });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          if (typeof content === 'string') {
            const jsonData = JSON.parse(content);
            setBackupFileContent(jsonData);
            setIsImportAlertOpen(true);
          }
        } catch (error) {
          console.error("Failed to parse backup file:", error);
          toast({
            variant: "destructive",
            title: t('importError'),
            description: "The file could not be read or is not valid JSON.",
          });
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleImportConfirm = () => {
    if (backupFileContent) {
      const success = restoreBackup(backupFileContent);
      if (success) {
        toast({ title: t('importSuccess') });
      } else {
        toast({ variant: "destructive", title: t('importError') });
      }
    }
    setIsImportAlertOpen(false);
    setBackupFileContent(null);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl page-transition">
      <div className="flex justify-between items-center mb-6 bg-slate-900/40 border border-slate-800/40 p-4 rounded-2xl backdrop-blur-md">
        <div>
          <Link href="/" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-1 tracking-wider uppercase">
            <Home className="w-4 h-4"/> {t('backToHome')}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{t('settings')}</h1>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="glass-card border border-slate-800/60 shadow-xl rounded-2xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-black text-white/90 uppercase tracking-wider">{t('language')}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-slate-200">{t('changeLanguage')}</Label>
              <LanguageToggle />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-800/60 shadow-xl rounded-2xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-black text-white/90 uppercase tracking-wider">{t('dataManagement')}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <h3 className="font-extrabold text-sm text-slate-100 mb-1">{t('shareBackup')}</h3>
              <p className="text-xs text-muted-foreground mb-3">{t('backupDescription')}</p>
              <Button onClick={handleShareBackup} className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-500/10 hover:scale-[1.01] active:scale-95 transition-all">
                <Share2 className="mr-2 h-4.5 w-4.5" />
                {t('shareBackup')}
              </Button>
            </div>
            
            <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/10">
              <h3 className="font-extrabold text-sm text-slate-100 mb-1">{t('importData')}</h3>
              <p className="text-xs text-muted-foreground mb-3">{t('restoreDescription')}</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full h-11 rounded-xl bg-slate-950/20 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white transition-all">
                <Upload className="mr-2 h-4.5 w-4.5" />
                {t('importData')}
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/json" className="hidden" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-800/60 shadow-xl rounded-2xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-black text-white/90 uppercase tracking-wider">{t('reminders')}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-toggle" className="text-sm pr-4 flex-1 font-bold text-slate-200 cursor-pointer">
                {t('enableInAppReminders')}
                <p className="text-xs text-muted-foreground font-medium mt-1">{t('inAppRemindersDescription')}</p>
              </Label>
              <Switch id="reminder-toggle" checked={inAppRemindersEnabled} onCheckedChange={setInAppRemindersEnabled} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-rose-500/15 border bg-rose-500/5 overflow-hidden rounded-2xl">
          <CardHeader className="p-5 pb-3 bg-rose-500/5 border-b border-rose-500/10">
            <CardTitle className="text-base font-black text-rose-400 flex items-center gap-2 uppercase tracking-wider">
              <ShieldCheck className="h-5 w-5" />
              {t('dangerZone')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <h3 className="font-extrabold text-sm text-rose-300 mb-1">{t('resetAppData')}</h3>
            <p className="text-xs text-rose-400/80 mb-3">{t('resetDescription')}</p>
            <Button onClick={() => setIsResetAlertOpen(true)} variant="destructive" className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md shadow-rose-950/10 hover:scale-[1.01] active:scale-95 transition-all">
              <Trash2 className="mr-2 h-4.5 w-4.5" />
              {t('resetAppData')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
        <AlertDialogContent className="rounded-2xl bg-slate-900 border-slate-800 text-slate-200 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-white">{t('importWarningTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-400">{t('importWarningDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="h-10 rounded-xl bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm} className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold">{t('proceed')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
        <AlertDialogContent className="rounded-2xl bg-slate-900 border-slate-800 text-slate-200 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-rose-400">{t('resetWarningTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-400">{t('resetWarningDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="h-10 rounded-xl bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { resetAllData(); toast({ title: t('resetSuccess') }); setIsResetAlertOpen(false); }} className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">{t('proceed')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}