/\*\*

- EMAIL QUEUE USAGE GUIDE
-
- The email queue system ensures rate-limited email delivery to comply with
- Resend API limits (2 requests per second).
-
- FEATURES:
- - Sequential email sending with configurable delays
- - Exponential backoff for rate limit errors (429)
- - Automatic retries on failure
- - Detailed success/failure reporting
-
- DEFAULT CONFIGURATION:
- - Delay between emails: 60 seconds (1 email per minute)
- - Max retries: 3
- - Initial retry delay: 5 seconds (exponential backoff applies)
    \*/

// EXAMPLE 1: Using the default queue (1 email per minute)
import { emailQueue } from '@/lib/email/emailQueue';

async function sendDailyEmails() {
const queueItems = [
{
type: 'daily-schedule' as const,
to: 'agent1@example.com',
data: {
agentName: 'Agent 1',
date: '15 Février 2026',
items: [],
stats: { totalItems: 0, visits: 0, calls: 0, tasks: 0 }
}
},
// ... more items
];

emailQueue.addToQueue(queueItems);
const stats = await emailQueue.processQueue();

console.log(`Sent: ${stats.sent}, Failed: ${stats.failed}`);
if (stats.failedEmails.length > 0) {
console.log('Failed emails:', stats.failedEmails);
}
}

// EXAMPLE 2: For faster sending (e.g., 10 emails per minute = 6 seconds apart)
// Create a new instance with custom delays
import { EmailQueueManager } from '@/lib/email/emailQueue';

async function sendReminderEmails() {
const customQueue = new EmailQueueManager(
6000, // 6 seconds between emails = ~10 per minute
3, // max retries
2000 // initial retry delay of 2 seconds
);

const queueItems = [
{
type: 'reminder' as const,
to: 'agent@example.com',
data: {
agentName: 'Agent Name',
eventTitle: 'Client Meeting',
eventTime: '14:30',
eventType: 'followup' as const,
minutesUntil: 15
}
}
];

customQueue.addToQueue(queueItems);
const stats = await customQueue.processQueue();
return stats;
}

// EXAMPLE 3: Email type variations
const reminderEmail = {
type: 'reminder' as const,
to: 'agent@example.com',
data: {
agentName: 'John',
eventTitle: 'Follow-up Call',
eventTime: '15:00',
eventType: 'followup' as const,
clientName: 'Client Name',
clientPhone: '+213 XXX XXX XXX',
minutesUntil: 30
}
};

const genericEmail = {
type: 'generic' as const,
to: 'user@example.com',
data: {
subject: 'Custom Email Subject',
html: '<h1>Custom HTML content</h1>'
}
};

// WHEN TO USE DIFFERENT DELAYS:
// - 1 email/min (60s): Default, safest, for daily emails to all agents
// - 2 emails/min (30s): For moderately sized mailing lists
// - 5 emails/min (12s): For smaller lists, still safe
// - Never exceed 2/second (500ms) to avoid hitting Resend limits

// RATE LIMIT RESPONSE:
// If you still hit rate limits, the system will:
// 1. Detect the 429 error
// 2. Wait with exponential backoff before retrying
// 3. Retry up to 3 times
// 4. Report failures for manual intervention
