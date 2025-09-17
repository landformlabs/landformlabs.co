/**
 * Request throttling utility to prevent overwhelming external services
 */

class RequestThrottle {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private maxConcurrent: number;
  private requestDelay: number;

  constructor(maxConcurrent = 6, requestDelay = 100) {
    this.maxConcurrent = maxConcurrent;
    this.requestDelay = requestDelay;
  }

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.activeRequests++;
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (request) {
      // Add small delay between requests to be respectful to the service
      if (this.activeRequests > 0) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      }
      request();
    }
  }
}

// Global instance for tile requests
export const tileRequestThrottle = new RequestThrottle(6, 100);