/**
 * SearchLimitModal – shown when a free-plan user exhausts their daily searches.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Crown, Zap, CheckCircle2 } from 'lucide-react';

interface SearchLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchLimitModal({
  open,
  onOpenChange,
}: SearchLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-2">
            <Zap className="w-8 h-8 text-amber-500" />
          </div>
          <DialogTitle className="text-xl">
            Limite de recherches atteinte
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Vous avez utilisé vos 5 recherches gratuites pour aujourd'hui. Passez
            au plan Pro pour continuer sans limite.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <h4 className="text-sm font-semibold text-slate-700">
            Le plan Pro inclut :
          </h4>
          <ul className="space-y-2">
            {[
              'Recherches illimitées',
              'Tous les territoires Caraïbe & Outre-mer',
              'Historique & favoris complets',
              'Export PDF de rapports',
              'Support prioritaire',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Link to="/pricing" className="w-full">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Crown className="w-4 h-4 mr-2" />
              Voir les plans Pro
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full text-slate-500"
            onClick={() => onOpenChange(false)}
          >
            Revenir plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
