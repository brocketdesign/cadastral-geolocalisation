import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { ALERT_TYPES, type AlertTypeKey } from '@/types/alerts';

interface AlertTypesSectionProps {
  enabledTypes: AlertTypeKey[];
  onEnabledTypesChange: (types: AlertTypeKey[]) => void;
}

export default function AlertTypesSection({
  enabledTypes,
  onEnabledTypesChange,
}: AlertTypesSectionProps) {
  const handleToggle = (key: AlertTypeKey) => {
    if (enabledTypes.includes(key)) {
      onEnabledTypesChange(enabledTypes.filter((t) => t !== key));
    } else {
      onEnabledTypesChange([...enabledTypes, key]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="w-5 h-5 text-emerald-600" />
          Types d&apos;alertes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALERT_TYPES.map((alertType) => {
            const isEnabled = enabledTypes.includes(alertType.key);
            return (
              <div
                key={alertType.key}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isEnabled
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`alert-type-${alertType.key}`}
                      className="font-medium text-sm cursor-pointer"
                    >
                      {alertType.label}
                    </Label>
                    {alertType.urgent && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
                        URGENT
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {alertType.description}
                  </p>
                </div>
                <Switch
                  id={`alert-type-${alertType.key}`}
                  checked={isEnabled}
                  onCheckedChange={() => handleToggle(alertType.key)}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
