
class TransferWebview {
    #_isinit = false;//是否进行初始化
    #_messageListener = null;//监听器
    #_messageMap = new Map();//消息映射
    #_transferDataimplement = null;//传输数据的实现方法
    #_parseDataFun = null;//解析数据方法
    static #_instance = null;

    // 日志级别
    static LogLevels = {
        ERROR: 'error',
        WARN: 'warn',
        INFO: 'info',
        DEBUG: 'debug'
    };

    #_log(level, message, error = null) {
        const prefix = '[transfer-webview-channel]';
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


    static getInstance() {
        if (!TransferWebview.#_instance) {
            TransferWebview.#_instance = new TransferWebview();
        }
        return TransferWebview.#_instance;
    }

    //初始化方法
    init(transferfun, parseDatafun) {
        return new Promise((resolve, reject) => {
            if (this.#_isinit) {
                const error = new Error("Transfer instance has already been initialized");
                this.#_log(TransferWebview.LogLevels.ERROR, "Initialization failed", error);
                reject(error);
                return;
            }
            if (typeof transferfun !== 'function') {
                const error = new Error("transferfun must be a valid function");
                this.#_log(TransferWebview.LogLevels.ERROR, "Initialization failed", error);
                reject(error);
                return;
            }
            this.#_transferDataimplement = transferfun;
            if (parseDatafun) {
                this.#_parseDataFun = parseDatafun;
            } else {
                this.#_parseDataFun = JSON.parse;
            }
            if (typeof window === 'undefined' || !window.addEventListener) {
                const error = new Error("window object with addEventListener support is required");
                this.#_log(TransferWebview.LogLevels.ERROR, "Initialization failed", error);
                reject(error);
                return;
            }
            this.#_isinit = true;
            this.setupMessageListener();
            resolve();
        });
    }

    //获取当前的消息映射表
    getMessageMap() {
        return this.#_messageMap;
    }

    //添加监听器
    setupMessageListener() {
        if (!this.#_messageListener) {
            this.#_messageListener = (event) => {
                try {
                    let msg = this.#_parseDataFun(event);
                    if (!msg) return;
                    // 根据 id 获取对应的 resolve/reject
                    //如果有id就找到对应的
                    if (msg.id) {
                        const context = this.#_messageMap.get(msg.id);
                        if (!context) return;
                        // 清除超时计时器
                        if (context.timeout) {
                            clearTimeout(context.timeout);
                        }
                        const { resolve } = context;
                        resolve(msg);
                        // 清理引用
                        this.#_messageMap.delete(msg.id);
                        return;
                    }
                } catch (e) {
                    this.#_log(TransferWebview.LogLevels.ERROR, "Failed to handle message", e);
                }
            };
            window.addEventListener("message", this.#_messageListener);
        }
    }


    //h5发送信号并等待结果
    /// [Map] params
    /// [String] params.actionType
    /// [String] params.data
    /// [String] params.ext
    /// [String] params.callback
    /// [String] params.id
    /// [bool] isAwait 是否需要等待结果，默认为true
    /// [Number] maxTime 超时时间，默认为3000ms 当超时时间为-1的时候，默认不会超时
    async transferData(
        params,
        isAwait = true,
        maxTime = 3000
    ) {
        return new Promise((resolve, reject) => {
            try {
                console.log('params', params)
                if (!this.#_isinit) {
                    const error = new Error("Transfer instance is not initialized");
                    this.#_log(TransferWebview.LogLevels.ERROR, "Transfer failed", error);
                    reject(error);
                }
                //如果不需要等待结果，直接返回
                if (params?.id && !isAwait) {
                    // 发送消息到不同端
                    this.#_transferDataimplement(params);
                    resolve();
                    return;
                }
                if (!params?.id) {
                    const error = new Error("Message ID is required");
                    this.#_log(TransferWebview.LogLevels.ERROR, "Transfer failed", error);
                    reject(error);
                    return;
                }
                let timeout = null;
                // 设置超时计时器
                if (maxTime > 0) {
                    timeout = setTimeout(() => {
                        const context = this.#_messageMap.get(params.id);
                        if (context) {
                            this.#_messageMap.delete(params.id); // 清理 Map 条目
                            const error = new Error(`Transfer timeout after ${maxTime}ms`);
                            this.#_log(TransferWebview.LogLevels.ERROR, "Transfer failed", error);
                            reject(error); // 触发失败
                        }
                    }, maxTime);
                }
                this.#_messageMap.set(params.id, {
                    params,
                    resolve,
                    reject,
                    timeout,
                });
                // 发送消息到不同端
                this.#_transferDataimplement(params);
            } catch (e) {
                reject(e);
            }
        });
    }
}

export default TransferWebview.getInstance();