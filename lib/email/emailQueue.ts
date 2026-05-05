import { Resend } from "resend";
import DailyScheduleEmail from "./templates/DailyScheduleEmail";
import ReminderEmail from "./templates/ReminderEmail";
import { DailyScheduleData, ReminderData } from "./emailService";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL =
  process.env.RESEND_FROM || "Pyramide <onboarding@resend.dev>";

export interface EmailQueueItem {
  type: "daily-schedule" | "reminder" | "generic";
  to: string;
  data?: DailyScheduleData | ReminderData | { subject: string; html: string };
  retries?: number;
  nextRetry?: Date;
}

interface EmailStats {
  sent: number;
  failed: number;
  total: number;
  failedEmails: Array<{ email: string; error: string }>;
}

class EmailQueueManager {
  private isProcessing = false;
  private queue: EmailQueueItem[] = [];
  readonly delayBetweenEmails: number; // milliseconds
  readonly maxRetries: number;
  readonly initialRetryDelay: number; // milliseconds

  constructor(
    delayBetweenEmails: number = 1000, // 1 second — stays within Resend free tier (1 req/s)
    maxRetries: number = 3,
    initialRetryDelay: number = 5000 // 5 seconds
  ) {
    this.delayBetweenEmails = delayBetweenEmails;
    this.maxRetries = maxRetries;
    this.initialRetryDelay = initialRetryDelay;
  }

  /**
   * Add emails to the queue
   */
  addToQueue(items: EmailQueueItem[]): void {
    this.queue.push(...items);
  }

  /**
   * Process the entire queue with rate limiting
   */
  async processQueue(): Promise<EmailStats> {
    if (this.isProcessing) {
      throw new Error("Email queue is already processing");
    }

    this.isProcessing = true;
    const stats: EmailStats = {
      sent: 0,
      failed: 0,
      total: this.queue.length,
      failedEmails: [],
    };

    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (!item) break;

        // Process item with potential retries
        const result = await this.sendEmailWithRetry(item);

        if (result.success) {
          stats.sent++;
          console.log(`✓ Email sent to ${item.to}`);
        } else {
          stats.failed++;
          stats.failedEmails.push({
            email: item.to,
            error: result.error || "Unknown error",
          });
          console.error(
            `✗ Failed to send email to ${item.to}: ${result.error}`
          );
        }

        // Wait before sending the next email (except for the last one)
        if (this.queue.length > 0) {
          await this.delay(this.delayBetweenEmails);
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return stats;
  }

  /**
   * Send email with exponential backoff retry
   */
  private async sendEmailWithRetry(
    item: EmailQueueItem
  ): Promise<{ success: boolean; error?: string }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // If this is a retry and we should wait, do exponential backoff
        if (attempt > 0) {
          const waitTime = this.initialRetryDelay * Math.pow(2, attempt - 1);
          console.log(
            `Retrying email to ${item.to} (attempt ${attempt}/${this.maxRetries}) after ${waitTime}ms`
          );
          await this.delay(waitTime);
        }

        const result = await this.sendSingleEmail(item);

        if (result.success) {
          return result;
        }

        lastError = new Error(result.error);

        // If it's a rate limit error (429), retry with backoff
        if (result.error?.includes("rate limit")) {
          if (attempt < this.maxRetries) {
            continue;
          }
        }

        // For other errors on first attempt, still retry
        if (attempt < this.maxRetries) {
          continue;
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries) {
          continue;
        }

        return {
          success: false,
          error: lastError.message,
        };
      }
    }

    return {
      success: false,
      error: lastError?.message || "Failed after all retries",
    };
  }

  /**
   * Send a single email
   */
  private async sendSingleEmail(
    item: EmailQueueItem
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Build email parameters based on type
      const baseParams = {
        from: FROM_EMAIL,
        to: item.to,
      };

      let emailPayload;

      switch (item.type) {
        case "daily-schedule": {
          const scheduleData = item.data as DailyScheduleData;
          emailPayload = {
            ...baseParams,
            subject: `Votre planning du ${scheduleData.date} - Pyramide`,
            react: DailyScheduleEmail(scheduleData),
          };
          break;
        }

        case "reminder": {
          const reminderData = item.data as ReminderData;
          emailPayload = {
            ...baseParams,
            subject: `Rappel: ${reminderData.eventTitle} dans ${reminderData.minutesUntil} minutes`,
            react: ReminderEmail(reminderData),
          };
          break;
        }

        case "generic": {
          const genericData = item.data as {
            subject: string;
            html: string;
          };
          emailPayload = {
            ...baseParams,
            subject: genericData.subject,
            html: genericData.html,
          };
          break;
        }

        default:
          return {
            success: false,
            error: `Unknown email type: ${item.type}`,
          };
      }

      const { error } = await resend.emails.send(
        emailPayload as Parameters<typeof resend.emails.send>[0]
      );

      if (error) {
        // Check if it's a rate limit error
        if (error.message?.includes("rate limit")) {
          return {
            success: false,
            error: `Rate limit: ${error.message}`,
          };
        }

        return {
          success: false,
          error: error.message || "Unknown Resend error",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = [];
  }
}

// Export a singleton instance
export const emailQueue = new EmailQueueManager();
