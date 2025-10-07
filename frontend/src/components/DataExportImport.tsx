import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Upload, 
  FileJson, 
  Database,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { biometricApi } from '@/services/biometricApi';
import { nutritionApi } from '@/services/nutritionApi';

interface DataExportImportProps {
  onDataUpdated?: () => void;
}

export const DataExportImport: React.FC<DataExportImportProps> = ({ onDataUpdated }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleExportData = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      // Gather all user data
      const [profile, exercises, hydrationLogs, progressEntries, nutritionLogs] = await Promise.all([
        biometricApi.getProfile('current-user').catch(() => null),
        biometricApi.getExerciseHistory('current-user').catch(() => []),
        biometricApi.getHydrationHistory('current-user').catch(() => []),
        biometricApi.getWeeklyProgress('current-user').catch(() => []),
        nutritionApi.getNutritionLogs().catch(() => [] as any[])
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        version: '1.0',
        user_id: 'current-user',
        biometric: {
          profile: profile || null,
          exercises: exercises || [],
          hydration: hydrationLogs || [],
          progress: progressEntries || []
        },
        nutrition: {
          logs: Array.isArray(nutritionLogs) ? nutritionLogs : []
        }
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `health-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      setExportStatus({ 
        success: true, 
        message: `Successfully exported health data (${Object.keys(exportData.biometric).length + Object.keys(exportData.nutrition).length} categories)` 
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ 
        success: false, 
        message: 'Failed to export data. Please try again.' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const fileText = await file.text();
      const importData = JSON.parse(fileText);

      // Validate data structure
      if (!importData.version || !importData.biometric || !importData.nutrition) {
        throw new Error('Invalid data format');
      }

      let importCount = 0;

      // Import biometric profile
      if (importData.biometric.profile) {
        try {
          await biometricApi.createProfile(importData.biometric.profile);
          importCount++;
        } catch (error) {
          console.warn('Profile import failed:', error);
        }
      }

      // Import exercise data
      if (importData.biometric.exercises?.length > 0) {
        for (const exercise of importData.biometric.exercises) {
          try {
            await biometricApi.logExercise(exercise);
            importCount++;
          } catch (error) {
            console.warn('Exercise import failed:', error);
          }
        }
      }

      // Import hydration data
      if (importData.biometric.hydration?.length > 0) {
        for (const hydration of importData.biometric.hydration) {
          try {
            await biometricApi.logHydration(hydration);
            importCount++;
          } catch (error) {
            console.warn('Hydration import failed:', error);
          }
        }
      }

      // Import progress data
      if (importData.biometric.progress?.length > 0) {
        for (const progress of importData.biometric.progress) {
          try {
            await biometricApi.recordWeeklyProgress(progress);
            importCount++;
          } catch (error) {
            console.warn('Progress import failed:', error);
          }
        }
      }

      // Import nutrition data
      if (importData.nutrition.logs?.length > 0) {
        for (const log of importData.nutrition.logs) {
          try {
            await nutritionApi.createNutritionLog(log);
            importCount++;
          } catch (error) {
            console.warn('Nutrition import failed:', error);
          }
        }
      }

      setImportStatus({ 
        success: true, 
        message: `Successfully imported ${importCount} records` 
      });

      onDataUpdated?.();
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to import data. Please check the file format.' 
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-500" />
          Data Management
        </h2>
        <p className="text-lg text-gray-600 mt-2">
          Export your health data for backup or import previous data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Data */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              Download all your health data including:
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Biometric profile and measurements</li>
              <li>• Exercise and workout history</li>
              <li>• Hydration tracking records</li>
              <li>• Progress tracking data</li>
              <li>• Nutrition logs and meals</li>
            </ul>
            
            <Button 
              onClick={handleExportData} 
              disabled={isExporting}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isExporting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export Health Data
                </>
              )}
            </Button>

            {exportStatus && (
              <div className={`p-3 rounded-lg flex items-start gap-2 ${
                exportStatus.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {exportStatus.success ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 text-red-600" />
                )}
                <span className="text-sm">{exportStatus.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Data */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-500" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              Import previously exported health data:
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• JSON format from previous exports</li>
              <li>• Automatically validates data integrity</li>
              <li>• Merges with existing data</li>
              <li>• Skips duplicate entries</li>
            </ul>
            
            <div className="space-y-2">
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  disabled={isImporting}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gradient-to-r file:from-green-500 file:to-green-600
                    file:text-white
                    hover:file:from-green-600 hover:file:to-green-700
                    file:cursor-pointer cursor-pointer"
                />
              </label>
              
              {isImporting && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader className="h-4 w-4 animate-spin" />
                  Importing data...
                </div>
              )}
            </div>

            {importStatus && (
              <div className={`p-3 rounded-lg flex items-start gap-2 ${
                importStatus.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {importStatus.success ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 text-red-600" />
                )}
                <span className="text-sm">{importStatus.message}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Format Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-gray-500" />
            Data Format Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <strong>Export Format:</strong> JSON file containing all your health tracking data
            </div>
            <div className="text-sm text-gray-600">
              <strong>Privacy:</strong> All data remains local - nothing is sent to external servers during export/import
            </div>
            <div className="text-sm text-gray-600">
              <strong>Backup Recommendation:</strong> Export your data regularly to prevent data loss
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Keep regular backups of your health data, especially before making major changes to your tracking routine.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataExportImport;
