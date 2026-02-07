import { useCallback } from 'react'
import { useToast } from './use-toast'

const N8N_WEBHOOK_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'

export interface SlackNotificationPayload {
  channel?: string // #nexusai-apps or #nexusai-errors
  title: string
  message: string
  color?: 'good' | 'warning' | 'danger' | string
  fields?: Array<{
    title: string
    value: string
    short?: boolean
  }>
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

/**
 * Hook for sending notifications through N8N to Slack
 * Triggers N8N webhooks that post to Slack channels
 */
export function useSlackNotification() {
  const { toast } = useToast()

  const sendSlackNotification = useCallback(
    async (payload: SlackNotificationPayload): Promise<boolean> => {
      try {
        // Determine webhook endpoint based on channel
        const webhookPath =
          payload.channel === '#nexusai-errors'
            ? '/nexusai-error'
            : '/nexusai-app-generated'

        const response = await fetch(`${N8N_WEBHOOK_URL}${webhookPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: `*${payload.title}*\n${payload.message}`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*${payload.title}*\n${payload.message}`,
                },
              },
              ...(payload.fields
                ? [
                    {
                      type: 'section',
                      fields: payload.fields.map((f) => ({
                        type: 'mrkdwn',
                        text: `*${f.title}:*\n${f.value}`,
                      })),
                    },
                  ]
                : []),
              ...(payload.actionUrl
                ? [
                    {
                      type: 'actions',
                      elements: [
                        {
                          type: 'button',
                          text: {
                            type: 'plain_text',
                            text: payload.actionLabel || 'View',
                          },
                          url: payload.actionUrl,
                        },
                      ],
                    },
                  ]
                : []),
            ],
            attachments: payload.color
              ? [
                  {
                    color: payload.color,
                  },
                ]
              : undefined,
          }),
        })

        if (!response.ok) {
          throw new Error(`N8N webhook failed: ${response.statusText}`)
        }

        return true
      } catch (error) {
        console.error('Failed to send Slack notification:', error)

        // Fallback: show local toast
        toast({
          title: 'Notification Error',
          description: 'Failed to send Slack notification, but logged locally',
          variant: 'destructive',
        })

        return false
      }
    },
    [toast],
  )

  /**
   * Notify when a new app is generated
   */
  const notifyAppGenerated = useCallback(
    async (appData: {
      app_id: string
      app_name: string
      framework: string
      user_email: string
      files: any[]
      credits_used: number
    }) => {
      return sendSlackNotification({
        channel: '#nexusai-apps',
        title: '🎉 New App Generated',
        message: `User ${appData.user_email} generated a new ${appData.framework} app`,
        color: 'good',
        fields: [
          { title: 'App Name', value: appData.app_name, short: true },
          { title: 'Framework', value: appData.framework, short: true },
          {
            title: 'Files',
            value: appData.files.length.toString(),
            short: true,
          },
          {
            title: 'Credits Used',
            value: appData.credits_used.toString(),
            short: true,
          },
        ],
        actionUrl: `https://chatbuilds.com/nexusai/apps/${appData.app_id}`,
        actionLabel: 'View App',
        metadata: appData,
      })
    },
    [sendSlackNotification],
  )

  /**
   * Notify when deployment completes
   */
  const notifyDeployment = useCallback(
    async (deployData: {
      app_id: string
      app_name: string
      status: 'success' | 'failed'
      url?: string
      error?: string
    }) => {
      return sendSlackNotification({
        channel: '#nexusai-apps',
        title:
          deployData.status === 'success'
            ? '✅ Deployment Successful'
            : '❌ Deployment Failed',
        message:
          deployData.status === 'success'
            ? `${deployData.app_name} deployed successfully`
            : `Failed to deploy ${deployData.app_name}`,
        color: deployData.status === 'success' ? 'good' : 'danger',
        fields: [
          { title: 'App ID', value: deployData.app_id, short: true },
          { title: 'Status', value: deployData.status, short: true },
          ...(deployData.url
            ? [{ title: 'URL', value: deployData.url, short: false }]
            : []),
          ...(deployData.error
            ? [{ title: 'Error', value: deployData.error, short: false }]
            : []),
        ],
        actionUrl:
          deployData.url ||
          `https://chatbuilds.com/nexusai/apps/${deployData.app_id}`,
        actionLabel: 'View App',
      })
    },
    [sendSlackNotification],
  )

  /**
   * Notify when an error occurs
   */
  const notifyError = useCallback(
    async (errorData: {
      title: string
      error: string
      context?: Record<string, any>
      stack?: string
    }) => {
      return sendSlackNotification({
        channel: '#nexusai-errors',
        title: `🐛 ${errorData.title}`,
        message: errorData.error,
        color: 'danger',
        fields: [
          { title: 'Timestamp', value: new Date().toISOString(), short: true },
          ...(errorData.context
            ? [
                {
                  title: 'Context',
                  value: JSON.stringify(errorData.context, null, 2),
                  short: false,
                },
              ]
            : []),
        ],
        metadata: errorData,
      })
    },
    [sendSlackNotification],
  )

  /**
   * Notify about credit usage
   */
  const notifyCreditUsage = useCallback(
    async (creditData: {
      user_email: string
      credits_remaining: number
      credits_used: number
      action: string
    }) => {
      const isLow = creditData.credits_remaining < 10

      return sendSlackNotification({
        channel: '#nexusai-apps',
        title: isLow ? '⚠️ Low Credits Warning' : '💰 Credit Usage Update',
        message: `${creditData.user_email} used ${creditData.credits_used} credits for ${creditData.action}`,
        color: isLow ? 'warning' : undefined,
        fields: [
          { title: 'User', value: creditData.user_email, short: true },
          {
            title: 'Remaining',
            value: creditData.credits_remaining.toString(),
            short: true,
          },
          { title: 'Action', value: creditData.action, short: false },
        ],
      })
    },
    [sendSlackNotification],
  )

  return {
    sendSlackNotification,
    notifyAppGenerated,
    notifyDeployment,
    notifyError,
    notifyCreditUsage,
  }
}
