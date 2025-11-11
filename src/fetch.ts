export async function fetchBuffer(
  url: string,
  retries: number,
  retryDelay: number,
  timeout: number
): Promise<Buffer | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (e) {
      const isLastAttempt = attempt === retries;
      const errorMessage = e instanceof Error ? e.message : String(e);
      const attemptNumber = attempt + 1;
      const remainingAttempts = retries - attempt;

      if (isLastAttempt) {
        console.warn(`[blur64] Fetch attempt ${attemptNumber} failed: ${errorMessage}. No more attempts remaining.`);
        return null;
      }

      const delay = retryDelay * (1 << attempt);
      const delaySeconds = (delay / 1000).toFixed(2);

      console.warn(
        `[blur64] Fetch attempt ${attemptNumber} failed: ${errorMessage}. Will retry in ${delaySeconds}s. ${remainingAttempts} attempt(s) remaining.`
      );

      await new Promise(r => setTimeout(r, delay));
    } finally {
      clearTimeout(timeoutId);
    }
  }
  return null;
}

export async function fetchBufferNext(
  url: string,
  retries: number,
  retryDelay: number,
  timeout: number,
  revalidate?: number | false
): Promise<Buffer | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const init: RequestInit & { next?: { revalidate?: number | false } } = {
        signal: controller.signal,
      };

      if (typeof revalidate === 'number' && !isNaN(revalidate) && revalidate > 0) {
        init.cache = 'force-cache';
        init.next = { revalidate };
      }

      const response = await fetch(url, init);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (e) {
      const isLastAttempt = attempt === retries;
      const errorMessage = e instanceof Error ? e.message : String(e);
      const attemptNumber = attempt + 1;
      const remainingAttempts = retries - attempt;

      if (isLastAttempt) {
        console.warn(`[blur64] Fetch attempt ${attemptNumber} failed: ${errorMessage}. No more attempts remaining.`);
        return null;
      }

      const delay = retryDelay * (1 << attempt);
      const delaySeconds = (delay / 1000).toFixed(2);

      console.warn(
        `[blur64] Fetch attempt ${attemptNumber} failed: ${errorMessage}. Will retry in ${delaySeconds}s. ${remainingAttempts} attempt(s) remaining.`
      );

      await new Promise(r => setTimeout(r, delay));
    } finally {
      clearTimeout(timeoutId);
    }
  }
  return null;
}
