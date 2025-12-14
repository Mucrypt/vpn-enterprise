"use client";

import { useState } from 'react';
import { 
  Shield, Download, RotateCcw, Clock, AlertTriangle, CheckCircle,
  Copy, Check, Database, Server, FileText, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function BackupRecoveryPage() {
  const [copied, setCopied] = useState<string>('');

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const backupTypes = [
    {
      type: "Automated Backups",
      description: "Scheduled backups with configurable frequency and retention",
      frequency: ["Continuous", "Hourly", "Daily", "Weekly"],
      retention: "Up to 35 days",
      features: ["Point-in-time recovery", "Compression", "Encryption", "Cross-region replication"],
      icon: Clock,
      color: "blue",
      recommended: true
    },
    {
      type: "Manual Backups",
      description: "On-demand backups triggered manually or via API",
      frequency: ["On-demand"],
      retention: "Custom (up to 1 year)",
      features: ["Named snapshots", "Custom metadata", "Export capability", "Long-term retention"],
      icon: Download,
      color: "green"
    },
    {
      type: "Continuous Backup",
      description: "Real-time backup with sub-second recovery points",
      frequency: ["Real-time"],
      retention: "7-35 days",
      features: ["Zero data loss", "Instant recovery", "Transaction log backup", "Hot standby"],
      icon: Shield,
      color: "purple"
    }
  ];

  const recoveryScenarios = [
    {
      scenario: "Point-in-Time Recovery",
      description: "Restore database to any specific moment in time",
      useCase: "Recover from accidental data modification or deletion",
      timeframe: "Any point within retention period",
      downtime: "5-15 minutes",
      commands: [
        "db-cli restore my-database --point-in-time '2024-01-15 14:30:00'",
        "db-cli restore my-database --pit-relative '2h ago'"
      ]
    },
    {
      scenario: "Full Database Restore",
      description: "Complete restoration from backup snapshot",
      useCase: "Recover from complete database corruption or loss",
      timeframe: "From any available backup",
      downtime: "10-30 minutes",
      commands: [
        "db-cli restore my-database --backup-id backup_20240115_143000",
        "db-cli restore my-database --latest-backup"
      ]
    },
    {
      scenario: "Cross-Region Restore",
      description: "Restore database in a different geographic region",
      useCase: "Disaster recovery or geographic relocation",
      timeframe: "From replicated backups",
      downtime: "15-45 minutes",
      commands: [
        "db-cli restore my-database --backup-id backup_20240115_143000 --region eu-west-1",
        "db-cli restore my-database --cross-region --target-region ap-southeast-1"
      ]
    },
    {
      scenario: "Clone from Backup",
      description: "Create new database instance from existing backup",
      useCase: "Testing, staging, or development environments",
      timeframe: "From any backup",
      downtime: "None (new instance)",
      commands: [
        "db-cli clone my-database --backup-id backup_20240115_143000 --name my-database-test",
        "db-cli clone my-database --name staging-db --latest"
      ]
    }
  ];

  const backupStrategies = [
    {
      strategy: "Development Environment",
      description: "Basic backup for development and testing",
      frequency: "Daily",
      retention: "7 days",
      features: ["Automated backups", "Local region", "Basic encryption"],
      cost: "Low",
      setup: `db-cli backup-policy create \\
  --database my-dev-db \\
  --frequency daily \\
  --retention 7d \\
  --compression enabled`
    },
    {
      strategy: "Production Standard",
      description: "Comprehensive backup for production workloads",
      frequency: "Hourly",
      retention: "30 days",
      features: ["Automated + manual", "Cross-region replication", "Point-in-time recovery"],
      cost: "Medium",
      setup: `db-cli backup-policy create \\
  --database my-prod-db \\
  --frequency hourly \\
  --retention 30d \\
  --cross-region enabled \\
  --pit-recovery enabled`
    },
    {
      strategy: "Enterprise Mission-Critical",
      description: "Maximum protection for critical business data",
      frequency: "Continuous",
      retention: "90 days",
      features: ["Continuous backup", "Multi-region", "Zero data loss", "Hot standby"],
      cost: "High",
      setup: `db-cli backup-policy create \\
  --database my-critical-db \\
  --frequency continuous \\
  --retention 90d \\
  --multi-region enabled \\
  --hot-standby enabled \\
  --zero-data-loss true`
    }
  ];

  const monitoringMetrics = [
    { metric: "Backup Success Rate", value: "99.97%", trend: "up", color: "green" },
    { metric: "Average Backup Time", value: "4.2 min", trend: "down", color: "blue" },
    { metric: "Recovery Time Objective", value: "< 15 min", trend: "stable", color: "purple" },
    { metric: "Point-in-Time Coverage", value: "24/7", trend: "stable", color: "orange" }
  ];

  const bestPractices = [
    {
      title: "Test Your Backups Regularly",
      description: "Perform regular recovery drills to ensure backups are working",
      implementation: "Schedule monthly recovery tests to staging environments",
      importance: "Critical"
    },
    {
      title: "Use Cross-Region Replication",
      description: "Store backups in multiple geographic regions for disaster recovery",
      implementation: "Enable cross-region replication for production databases",
      importance: "High"
    },
    {
      title: "Implement Backup Monitoring",
      description: "Set up alerts for backup failures and unusual patterns",
      implementation: "Configure notifications for backup status changes",
      importance: "High"
    },
    {
      title: "Document Recovery Procedures",
      description: "Maintain clear documentation of recovery processes",
      implementation: "Create runbooks with step-by-step recovery instructions",
      importance: "Medium"
    },
    {
      title: "Validate Backup Integrity",
      description: "Regularly check backup files for corruption or issues",
      implementation: "Enable automatic integrity checks after each backup",
      importance: "High"
    }
  ];

  return (
    <DocLayout>
      <div className="px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
          <span>›</span>
          <Link href="/docs/database/overview" className="hover:text-gray-900">Database Service</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Backup & Recovery</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Backup & Recovery</h1>
              <p className="text-lg text-gray-600 mt-2">
                Comprehensive backup strategies and disaster recovery solutions
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {monitoringMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                <div className={`text-2xl font-bold mb-1 ${
                  metric.color === 'green' ? 'text-green-600' :
                  metric.color === 'blue' ? 'text-blue-600' :
                  metric.color === 'purple' ? 'text-purple-600' :
                  'text-orange-600'
                }`}>
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600">{metric.metric}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Backup Overview */}
        <div className="mb-12">
          <Card className="bg-green-50/50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="h-5 w-5 text-green-600" />
                Backup System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                VPN Enterprise provides automated, secure, and reliable backup solutions with multiple recovery options. 
                All backups are encrypted, compressed, and stored across multiple availability zones for maximum durability.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Automated Scheduling</h4>
                  <span className="text-sm text-gray-600">Continuous, hourly, daily, or custom intervals</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Point-in-Time Recovery</h4>
                  <span className="text-sm text-gray-600">Restore to any second within retention period</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Cross-Region Replication</h4>
                  <span className="text-sm text-gray-600">Automatic backup replication to multiple regions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backup Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Backup Types</h2>
          
          <div className="space-y-6">
            {backupTypes.map((backup, index) => (
              <Card 
                key={index}
                className={`${
                  backup.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' :
                  backup.color === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                  'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200'
                } ${backup.recommended ? 'ring-2 ring-blue-500' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        backup.color === 'blue' ? 'bg-blue-100' :
                        backup.color === 'green' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        <backup.icon className={`h-6 w-6 ${
                          backup.color === 'blue' ? 'text-blue-600' :
                          backup.color === 'green' ? 'text-green-600' :
                          'text-purple-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-3">
                          {backup.type}
                          {backup.recommended && (
                            <Badge className="bg-blue-600 text-white">Recommended</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{backup.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Configuration</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Frequency:</span>
                          <span className="text-sm font-medium">{backup.frequency.join(', ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Retention:</span>
                          <span className="text-sm font-medium">{backup.retention}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
                      <div className="space-y-2">
                        {backup.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recovery Scenarios */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recovery Scenarios</h2>
          
          <div className="space-y-6">
            {recoveryScenarios.map((scenario, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl">{scenario.scenario}</CardTitle>
                  <CardDescription>{scenario.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Scenario Details</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Use Case: </span>
                          <span className="text-sm text-gray-900">{scenario.useCase}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Timeframe: </span>
                          <span className="text-sm text-gray-900">{scenario.timeframe}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Expected Downtime: </span>
                          <span className="text-sm text-gray-900">{scenario.downtime}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Recovery Commands</h4>
                      <div className="space-y-3">
                        {scenario.commands.map((command, cmdIndex) => (
                          <div key={cmdIndex} className="relative">
                            <Button
                              onClick={() => copyToClipboard(command, `scenario-${index}-${cmdIndex}`)}
                              size="sm"
                              variant="ghost"
                              className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
                            >
                              {copied === `scenario-${index}-${cmdIndex}` ? 
                                <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />
                              }
                            </Button>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                              <code>{command}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Backup Strategies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Backup Strategies by Environment</h2>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {backupStrategies.map((strategy, index) => (
              <Card key={index} className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">{strategy.strategy}</CardTitle>
                  <CardDescription>{strategy.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Frequency:</span>
                        <div className="font-medium">{strategy.frequency}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Retention:</span>
                        <div className="font-medium">{strategy.retention}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Cost:</span>
                        <Badge className={
                          strategy.cost === 'Low' ? 'bg-green-100 text-green-800' :
                          strategy.cost === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {strategy.cost}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Features</h5>
                      <div className="space-y-1">
                        {strategy.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Setup Command</h5>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(strategy.setup, `strategy-${index}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `strategy-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                          <code>{strategy.setup}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Backup Management */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Backup Management</h2>
          
          <Tabs defaultValue="configure" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="configure">Configure</TabsTrigger>
              <TabsTrigger value="monitor">Monitor</TabsTrigger>
              <TabsTrigger value="restore">Restore</TabsTrigger>
              <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configure" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Backup Configuration</CardTitle>
                  <CardDescription>
                    Configure backup policies and schedules for your databases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Create backup policy
db-cli backup-policy create \\
  --database my-database \\
  --frequency hourly \\
  --retention 30d \\
  --compression gzip \\
  --encryption aes-256 \\
  --cross-region enabled

# Update existing policy
db-cli backup-policy update my-database \\
  --frequency daily \\
  --retention 90d

# Enable point-in-time recovery
db-cli backup-policy enable-pitr my-database \\
  --retention 7d

# Configure backup window
db-cli backup-policy window my-database \\
  --start "02:00" \\
  --duration "4h" \\
  --timezone "UTC"`, 'config-backups')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'config-backups' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Create backup policy
db-cli backup-policy create \\
  --database my-database \\
  --frequency hourly \\
  --retention 30d \\
  --compression gzip \\
  --encryption aes-256 \\
  --cross-region enabled

# Update existing policy
db-cli backup-policy update my-database \\
  --frequency daily \\
  --retention 90d

# Enable point-in-time recovery
db-cli backup-policy enable-pitr my-database \\
  --retention 7d

# Configure backup window
db-cli backup-policy window my-database \\
  --start "02:00" \\
  --duration "4h" \\
  --timezone "UTC"`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="monitor" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Backup Monitoring</CardTitle>
                  <CardDescription>
                    Monitor backup status, health, and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# List all backups
db-cli backup list my-database

# Check backup status
db-cli backup status my-database

# View backup history with details
db-cli backup history my-database --verbose

# Monitor backup performance
db-cli backup metrics my-database \\
  --metric "success_rate,duration,size" \\
  --period "7d"

# Check backup integrity
db-cli backup verify backup_20240115_143000

# Set up backup alerts
db-cli backup alerts create \\
  --database my-database \\
  --on-failure email:admin@company.com \\
  --on-success false`, 'monitor-backups')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'monitor-backups' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# List all backups
db-cli backup list my-database

# Check backup status
db-cli backup status my-database

# View backup history with details
db-cli backup history my-database --verbose

# Monitor backup performance
db-cli backup metrics my-database \\
  --metric "success_rate,duration,size" \\
  --period "7d"

# Check backup integrity
db-cli backup verify backup_20240115_143000

# Set up backup alerts
db-cli backup alerts create \\
  --database my-database \\
  --on-failure email:admin@company.com \\
  --on-success false`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="restore" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Restoration</CardTitle>
                  <CardDescription>
                    Restore databases from backups with various recovery options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Point-in-time restore
db-cli restore my-database \\
  --point-in-time "2024-01-15 14:30:00"

# Restore from specific backup
db-cli restore my-database \\
  --backup-id backup_20240115_143000

# Clone database from backup
db-cli clone my-database \\
  --name my-database-clone \\
  --backup-id backup_20240115_143000

# Cross-region restore
db-cli restore my-database \\
  --backup-id backup_20240115_143000 \\
  --region eu-west-1

# Partial restore (specific tables)
db-cli restore my-database \\
  --backup-id backup_20240115_143000 \\
  --tables "users,orders,products"

# Dry-run restore (test without applying)
db-cli restore my-database \\
  --backup-id backup_20240115_143000 \\
  --dry-run`, 'restore-backups')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'restore-backups' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Point-in-time restore
db-cli restore my-database \\
  --point-in-time "2024-01-15 14:30:00"

# Restore from specific backup
db-cli restore my-database \\
  --backup-id backup_20240115_143000

# Clone database from backup
db-cli clone my-database \\
  --name my-database-clone \\
  --backup-id backup_20240115_143000

# Cross-region restore
db-cli restore my-database \\
  --backup-id backup_20240115_143000 \\
  --region eu-west-1

# Partial restore (specific tables)
db-cli restore my-database \\
  --backup-id backup_20240115_143000 \\
  --tables "users,orders,products"

# Dry-run restore (test without applying)
db-cli restore my-database \\
  --backup-id backup_20240115_143000 \\
  --dry-run`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="cleanup" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Backup Cleanup</CardTitle>
                  <CardDescription>
                    Manage backup retention and cleanup policies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Delete specific backup
db-cli backup delete backup_20240115_143000

# Clean up expired backups
db-cli backup cleanup my-database --expired

# Set retention policy
db-cli backup retention my-database \\
  --daily 30 \\
  --weekly 12 \\
  --monthly 6

# Force cleanup old backups
db-cli backup cleanup my-database \\
  --older-than "90d" \\
  --force

# Archive old backups to cold storage
db-cli backup archive my-database \\
  --older-than "365d" \\
  --storage-class glacier

# Show backup storage usage
db-cli backup usage my-database \\
  --breakdown by-type`, 'cleanup-backups')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'cleanup-backups' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Delete specific backup
db-cli backup delete backup_20240115_143000

# Clean up expired backups
db-cli backup cleanup my-database --expired

# Set retention policy
db-cli backup retention my-database \\
  --daily 30 \\
  --weekly 12 \\
  --monthly 6

# Force cleanup old backups
db-cli backup cleanup my-database \\
  --older-than "90d" \\
  --force

# Archive old backups to cold storage
db-cli backup archive my-database \\
  --older-than "365d" \\
  --storage-class glacier

# Show backup storage usage
db-cli backup usage my-database \\
  --breakdown by-type`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Practices</h2>
          
          <div className="space-y-4">
            {bestPractices.map((practice, index) => (
              <Card 
                key={index} 
                className={`${
                  practice.importance === 'Critical' ? 'border-red-200 bg-red-50/50' :
                  practice.importance === 'High' ? 'border-orange-200 bg-orange-50/50' :
                  'border-blue-200 bg-blue-50/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {practice.importance === 'Critical' ? 
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" /> :
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      }
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">{practice.title}</h4>
                        <Badge className={
                          practice.importance === 'Critical' ? 'bg-red-100 text-red-800' :
                          practice.importance === 'High' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {practice.importance}
                        </Badge>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{practice.description}</p>
                      <p className="text-gray-600 text-sm font-medium">{practice.implementation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            With backup and recovery configured, learn about scaling your database infrastructure and optimizing performance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/database/scaling">
              <Button className="bg-green-600 hover:bg-green-700">
                Scaling Guide
              </Button>
            </Link>
            <Link href="/docs/database/performance">
              <Button variant="outline" className="border-green-300 text-green-600 hover:bg-green-50">
                Performance Optimization
              </Button>
            </Link>
            <Link href="/docs/database/connection-strings">
              <Button variant="outline" className="border-green-300 text-green-600 hover:bg-green-50">
                Connection Strings
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}