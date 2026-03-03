import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  Phone,
  Loader2,
  Shield,
} from 'lucide-react';
import type { AlertUserProfile, AlertTerritory } from '@/types/alerts';

interface ProfileContactSectionProps {
  profile: AlertUserProfile;
  onProfileChange: (profile: AlertUserProfile) => void;
}

const TERRITORY_OPTIONS: { value: AlertTerritory; label: string; flag: string }[] = [
  { value: 'guadeloupe', label: 'Guadeloupe', flag: '🇬🇵' },
  { value: 'martinique', label: 'Martinique', flag: '🇲🇶' },
  { value: 'guyane', label: 'Guyane', flag: '🇬🇫' },
  { value: 'reunion', label: 'La Réunion', flag: '🇷🇪' },
];

export default function ProfileContactSection({
  profile,
  onProfileChange,
}: ProfileContactSectionProps) {
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = () => {
    setPhoneVerifying(true);
    // Mock Twilio OTP send
    setTimeout(() => {
      setPhoneVerifying(false);
      setOtpSent(true);
      setShowOtp(true);
    }, 1500);
  };

  const handleVerifyOtp = () => {
    setPhoneVerifying(true);
    // Mock OTP verification
    setTimeout(() => {
      setPhoneVerifying(false);
      setShowOtp(false);
      setOtpSent(false);
      onProfileChange({ ...profile, phoneVerified: true });
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-emerald-600" />
          Profil & Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nom complet *</Label>
            <Input
              id="fullName"
              value={profile.fullName}
              onChange={(e) =>
                onProfileChange({ ...profile, fullName: e.target.value })
              }
              placeholder="Jean Dupont"
            />
          </div>

          {/* Agency Name */}
          <div className="space-y-1.5">
            <Label htmlFor="agencyName">Nom de l&apos;agence</Label>
            <Input
              id="agencyName"
              value={profile.agencyName ?? ''}
              onChange={(e) =>
                onProfileChange({ ...profile, agencyName: e.target.value })
              }
              placeholder="Agence Caraïbes"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <div className="flex items-center gap-2">
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) =>
                onProfileChange({ ...profile, email: e.target.value })
              }
              placeholder="agent@example.com"
              className="flex-1"
            />
            {profile.emailVerified ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Vérifié
              </Badge>
            ) : (
              <Button variant="outline" size="sm">
                Vérifier
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Utilisé pour les alertes email via Resend
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone *</Label>
          <div className="flex items-center gap-2">
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                onProfileChange({
                  ...profile,
                  phone: e.target.value,
                  phoneVerified: false,
                })
              }
              placeholder="+596 690 XX XX XX"
              className="flex-1"
            />
            {profile.phoneVerified ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Vérifié
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendOtp}
                disabled={phoneVerifying || !profile.phone}
              >
                {phoneVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Phone className="w-3 h-3 mr-1" />
                    {otpSent ? 'Renvoyer' : 'Vérifier'}
                  </>
                )}
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Format +596/+590 pour les Antilles — Vérification par SMS Twilio
          </p>

          {/* OTP Input */}
          {showOtp && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <p className="text-sm text-blue-700 font-medium">
                Un code à 6 chiffres a été envoyé au {profile.phone}
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-36 text-center font-mono text-lg tracking-widest"
                  maxLength={6}
                />
                <Button
                  size="sm"
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length !== 6 || phoneVerifying}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {phoneVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Valider'
                  )}
                </Button>
              </div>
              <p className="text-xs text-blue-500">
                3 tentatives maximum — Le code expire dans 5 minutes
              </p>
            </div>
          )}
        </div>

        {/* Territory */}
        <div className="space-y-1.5">
          <Label>Territoire *</Label>
          <Select
            value={profile.territory}
            onValueChange={(v) =>
              onProfileChange({ ...profile, territory: v as AlertTerritory })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir un territoire" />
            </SelectTrigger>
            <SelectContent>
              {TERRITORY_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.flag} {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Fuseau horaire détecté automatiquement : {profile.timezone}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
