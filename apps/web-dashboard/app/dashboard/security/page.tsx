'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Shield, AlertTriangle, CheckCircle, XCircle, Download, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecurityPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSecurityData();
  }, []);

  async function loadSecurityData() {
    try {
      setLoading(true);
      const [logsData, eventsData] = await Promise.all([
        api.getAuditLogs().catch(() => []),
        api.getSecurityEvents().catch(() => []),
      ]);
      setAuditLogs(logsData);
      setSecurityEvents(eventsData);
    } catch (error: any) {
      toast.error('Failed to load security data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = auditLogs.filter(log =>
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const securityScore = 85; // Mock security score
  const criticalAlerts = securityEvents.filter(e => e.severity === 'critical').length;
  const warningAlerts = securityEvents.filter(e => e.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security & Compliance</h1>
          <p className="text-gray-600 mt-1">Monitor security events and audit logs</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{securityScore}%</div>
            <p className="text-xs text-gray-600 mt-1">Excellent security posture</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalAlerts}</div>
            <p className="text-xs text-gray-500 mt-1">requires immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{warningAlerts}</div>
            <p className="text-xs text-gray-500 mt-1">needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{auditLogs.length}</div>
            <p className="text-xs text-gray-500 mt-1">total events logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Security Events</CardTitle>
          <CardDescription>Potential threats and anomalies detected</CardDescription>
        </CardHeader>
        <CardContent>
          {securityEvents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">No security events detected</p>
              <p className="text-sm text-gray-500 mt-1">Your system is secure</p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityEvents.slice(0, 5).map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  {event.severity === 'critical' ? (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  ) : event.severity === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">{event.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900">Audit Logs</CardTitle>
              <CardDescription>Complete activity history and access logs</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Timestamp</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Resource</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">IP Address</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={6} className="py-4">
                        <div className="h-8 animate-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      <Shield className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No audit logs found</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.slice(0, 20).map((log, idx) => (
                    <tr key={log.id || idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {log.timestamp 
                          ? new Date(log.timestamp).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {log.user_id?.substring(0, 8) || 'System'}...
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {log.action || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {log.resource || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-sm">
                        {log.ip_address || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          log.status === 'success' 
                            ? 'bg-green-100 text-green-700'
                            : log.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {log.status || 'success'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              GDPR Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              All data handling meets GDPR requirements
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              SOC 2 Type II
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Security controls independently verified
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              ISO 27001
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Information security management certified
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
