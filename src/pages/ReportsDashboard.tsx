import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  MapPin,
  Calendar,
  Building2,
  User,
  Trash2,
  Download,
  Search,
  History,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  getGeneratedReports,
  removeGeneratedReport,
  clearGeneratedReports,
  type GeneratedReport,
} from '@/lib/report-storage';
import ReportPanel from '@/components/features/ReportPanel';
import UpgradeGate from '@/components/features/UpgradeGate';
import { useUserPlan } from '@/hooks/use-user-plan';

export default function ReportsDashboard() {
  const navigate = useNavigate();
  const { plan } = useUserPlan();
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [reportPanelOpen, setReportPanelOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);

  useEffect(() => {
    setReports(getGeneratedReports());
  }, []);

  const refreshReports = () => {
    setReports(getGeneratedReports());
  };

  const handleRemove = (id: string) => {
    removeGeneratedReport(id);
    refreshReports();
    toast.success('Rapport supprimé');
  };

  const handleClearAll = () => {
    if (!window.confirm('Voulez-vous vraiment supprimer tous les rapports ?')) return;
    clearGeneratedReports();
    refreshReports();
  };

  const handleRegenerate = (report: GeneratedReport) => {
    setSelectedReport(report);
    setReportPanelOpen(true);
  };

  return (
    <UpgradeGate
      requiredPlan="pro"
      featureLabel="La génération de rapports PDF est réservée au plan Pro. Passez au Pro pour créer des rapports professionnels pour vos clients."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mes rapports</h1>
            <p className="text-slate-500 text-sm mt-1">
              {reports.length} rapport{reports.length > 1 ? 's' : ''} généré{reports.length > 1 ? 's' : ''}
            </p>
          </div>
          {reports.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Tout supprimer
            </Button>
          )}
        </div>

        {reports.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">
                Aucun rapport généré
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Recherchez une parcelle cadastrale puis générez un rapport PDF pour votre client.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher une parcelle
                </Button>
                <Button variant="outline" onClick={() => navigate('/history')}>
                  <History className="w-4 h-4 mr-2" />
                  Voir l'historique
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-slate-900">
                          {report.result.commune} — {report.result.section}{' '}
                          {report.result.numero}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {report.result.territoire}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(report.timestamp).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {report.agencyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {report.agencyName}
                          </span>
                        )}
                        {report.clientName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {report.clientName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => handleRegenerate(report)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                      <button
                        onClick={() => handleRemove(report.id)}
                        className="p-2 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA to create new report from cadastral search */}
        {reports.length > 0 && (
          <Card className="shadow-sm border-dashed border-emerald-300 bg-emerald-50/50">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Nouveau rapport</p>
                  <p className="text-sm text-slate-500">
                    Recherchez une parcelle pour créer un nouveau rapport
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/history')}>
                  <History className="w-4 h-4 mr-2" />
                  Historique
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ReportPanel for re-generating */}
      {selectedReport && (
        <ReportPanel
          open={reportPanelOpen}
          onOpenChange={(open) => {
            setReportPanelOpen(open);
            if (!open) {
              refreshReports();
            }
          }}
          result={selectedReport.result}
        />
      )}
    </UpgradeGate>
  );
}
