interface TransferParams {
  actionType?: string;
  data?: string;
  ext?: string;
  callback?: string;
  id: string;
}

interface MessageContext {
  params: TransferParams;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout | null;
}

class TransferWebview {
  #_isinit = false;
  #_messageListener: ((event: MessageEvent) => void) | null = null;
  #_messageMap = new Map<string, MessageContext>();
  #_transferDataimplement: ((params: TransferParams) => void) | null = null;
  #_parseDataFun: ((data: any) => any) | null = null;
  static #_instance: TransferWebview | null = null;

  static LogLevels = {
    ERROR: "error" as const,
    WARN: "warn" as const,
    INFO: "info" as const,
    DEBUG: "debug" as const,
  };

  #_log(
    level: (typeof TransferWebview.LogLevels)[keyof typeof TransferWebview.LogLevels],
    message: string,
    error: Error | null = null
  ): void {
    const prefix = "[transfer-webview-channel]";
    switch (level) {
      case TransferWebview.LogLevels.ERROR:
        console.error(`${prefix} ${message}`, error);
        break;
      case TransferWebview.LogLevels.WARN:
        console.warn(`${prefix} ${message}`, error);
        break;
      case TransferWebview.LogLevels.INFO:
        console.info(`${prefix} ${message}`);
        break;
      case TransferWebview.LogLevels.DEBUG:
        console.debug(`${prefix} ${message}`);
        break;
    }
  }

  static getInstance(): TransferWebview {
    if (!TransferWebview.#_instance) {
      TransferWebview.#_instance = new TransferWebview();
    }
    return TransferWebview.#_instance;
  }

  init(
    transferfun: (params: TransferParams) => void,
    parseDatafun?: (data: any) => any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.#_isinit) {
        const error = new Error(
          "Transfer instance has already been initialized"
        );
        this.#_log(
          TransferWebview.LogLevels.ERROR,
          "Initialization failed",
          error
        );
        reject(error);
        return;
      }
      if (typeof transferfun !== "function") {
        const error = new Error("transferfun must be a valid function");
        this.#_log(
          TransferWebview.LogLevels.ERROR,
          "Initialization failed",
          error
        );
        reject(error);
        return;
      }
      this.#_transferDataimplement = transferfun;
      if (parseDatafun) {
        this.#_parseDataFun = parseDatafun;
      } else {
        this.#_parseDataFun = JSON.parse;
      }
      if (typeof window === "undefined" || !window.addEventListener) {
        const error = new Error(
          "window object with addEventListener support is required"
        );
        this.#_log(
          TransferWebview.LogLevels.ERROR,
          "Initialization failed",
          error
        );
        reject(error);
        return;
      }
      this.#_isinit = true;
      this.setupMessageListener();
      resolve();
    });
  }

  getMessageMap(): Map<string, MessageContext> {
    return this.#_messageMap;
  }

  setupMessageListener(): void {
    if (!this.#_messageListener) {
      this.#_messageListener = (event: MessageEvent) => {
        try {
          let msg = this.#_parseDataFun!(event);
          if (!msg) return;
          if (msg.id) {
            const context = this.#_messageMap.get(msg.id);
            if (!context) return;
            if (context.timeout) {
              clearTimeout(context.timeout);
            }
            const { resolve } = context;
            resolve(msg);
            this.#_messageMap.delete(msg.id);
            return;
          }
        } catch (e) {
          this.#_log(
            TransferWebview.LogLevels.ERROR,
            "Failed to handle message",
            e as Error
          );
        }
      };
      window.addEventListener("message", this.#_messageListener);
    }
  }

  async transferData(
    params: TransferParams,
    isAwait: boolean = true,
    maxTime: number = 3000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.#_isinit) {
          const error = new Error("Transfer instance is not initialized");
          this.#_log(TransferWebview.LogLevels.ERROR, "Transfer failed", error);
          reject(error);
          return;
        }
        if (params?.id && !isAwait) {
          this.#_transferDataimplement!(params);
          resolve();
          return;
        }
        if (!params?.id) {
          const error = new Error("Message ID is required");
          this.#_log(TransferWebview.LogLevels.ERROR, "Transfer failed", error);
          reject(error);
          return;
        }
        let timeout: NodeJS.Timeout | null = null;
        if (maxTime > 0) {
          timeout = setTimeout(() => {
            const context = this.#_messageMap.get(params.id);
            if (context) {
              this.#_messageMap.delete(params.id);
              const error = new Error(`Transfer timeout after ${maxTime}ms`);
              this.#_log(
                TransferWebview.LogLevels.ERROR,
                "Transfer failed",
                error
              );
              reject(error);
            }
          }, maxTime);
        }
        this.#_messageMap.set(params.id, {
          params,
          resolve,
          reject,
          timeout,
        });
        this.#_transferDataimplement!(params);
      } catch (e) {
        reject(e);
      }
    });
  }
}

export default TransferWebview.getInstance();
