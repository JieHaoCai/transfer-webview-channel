/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var _TransferWebview_instances, _a, _TransferWebview__isinit, _TransferWebview__messageListener, _TransferWebview__messageMap, _TransferWebview__transferDataimplement, _TransferWebview__parseDataFun, _TransferWebview__instance, _TransferWebview__log;
class TransferWebview {
    constructor() {
        _TransferWebview_instances.add(this);
        _TransferWebview__isinit.set(this, false);
        _TransferWebview__messageListener.set(this, null);
        _TransferWebview__messageMap.set(this, new Map());
        _TransferWebview__transferDataimplement.set(this, null);
        _TransferWebview__parseDataFun.set(this, null);
    }
    static getInstance() {
        if (!__classPrivateFieldGet(_a, _a, "f", _TransferWebview__instance)) {
            __classPrivateFieldSet(_a, _a, new _a(), "f", _TransferWebview__instance);
        }
        return __classPrivateFieldGet(_a, _a, "f", _TransferWebview__instance);
    }
    init(transferfun, parseDatafun) {
        return new Promise((resolve, reject) => {
            if (__classPrivateFieldGet(this, _TransferWebview__isinit, "f")) {
                const error = new Error("Transfer instance has already been initialized");
                __classPrivateFieldGet(this, _TransferWebview_instances, "m", _TransferWebview__log).call(this, _a.LogLevels.ERROR, "Initialization failed", error);
                reject(error);
                return;
            }
            if (typeof transferfun !== "function") {
                const error = new Error("transferfun must be a valid function");
                __classPrivateFieldGet(this, _TransferWebview_instances, "m", _TransferWebview__log).call(this, _a.LogLevels.ERROR, "Initialization failed", error);
                reject(error);
                return;
            }
            __classPrivateFieldSet(this, _TransferWebview__transferDataimplement, transferfun, "f");
            if (parseDatafun) {
                __classPrivateFieldSet(this, _TransferWebview__parseDataFun, parseDatafun, "f");
            }
            else {
                __classPrivateFieldSet(this, _TransferWebview__parseDataFun, JSON.parse, "f");
            }
            if (typeof window === "undefined" || !window.addEventListener) {
                const error = new Error("window object with addEventListener support is required");
                __classPrivateFieldGet(this, _TransferWebview_instances, "m", _TransferWebview__log).call(this, _a.LogLevels.ERROR, "Initialization failed", error);
                reject(error);
                return;
            }
            __classPrivateFieldSet(this, _TransferWebview__isinit, true, "f");
            this.setupMessageListener();
            resolve();
        });
    }
    getMessageMap() {
        return __classPrivateFieldGet(this, _TransferWebview__messageMap, "f");
    }
    setupMessageListener() {
        if (!__classPrivateFieldGet(this, _TransferWebview__messageListener, "f")) {
            __classPrivateFieldSet(this, _TransferWebview__messageListener, (event) => {
                try {
                    let msg = __classPrivateFieldGet(this, _TransferWebview__parseDataFun, "f")(event);
                    if (!msg)
                        return;
                    if (msg.id) {
                        const context = __classPrivateFieldGet(this, _TransferWebview__messageMap, "f").get(msg.id);
                        if (!context)
                            return;
                        if (context.timeout) {
                            clearTimeout(context.timeout);
                        }
                        const { resolve } = context;
                        resolve(msg);
                        __classPrivateFieldGet(this, _TransferWebview__messageMap, "f").delete(msg.id);
                        return;
                    }
                }
                catch (e) {
                    __classPrivateFieldGet(this, _TransferWebview_instances, "m", _TransferWebview__log).call(this, _a.LogLevels.ERROR, "Failed to handle message", e);
                }
            }, "f");
            window.addEventListener("message", __classPrivateFieldGet(this, _TransferWebview__messageListener, "f"));
        }
    }
    async transferData(params, isAwait = true, maxTime = 3000) {
        return new Promise((resolve, reject) => {
            try {
                if (!__classPrivateFieldGet(this, _TransferWebview__isinit, "f")) {
                    const error = new Error("Transfer instance is not initialized");
                    __classPrivateFieldGet(this, _TransferWebview_instances, "m", _TransferWebview__log).call(this, _a.LogLevels.ERROR, "Transfer failed", error);
                    reject(error);
                    return;
                }
                if (params?.id && !isAwait) {
                    __classPrivateFieldGet(this, _TransferWebview__transferDataimplement, "f")(params);
                    resolve();
                    return;
                }
                if (!params?.id) {
                    const error = new Error("Message ID is required");
                    __classPrivateFieldGet(this, _TransferWebview_instances, "m", _TransferWebview__log).call(this, _a.LogLevels.ERROR, "Transfer failed", error);
                    reject(error);
                    return;
                }
                let timeout = null;
                if (maxTime > 0) {
                    timeout = setTimeout(() => {
                        const context = __classPrivateFieldGet(this, _TransferWebview__messageMap, "f").get(params.id);
                        if (context) {
                            __classPrivateFieldGet(this, _TransferWebview__messageMap, "f").delete(params.id);
                            const error = new Error(`Transfer timeout after ${maxTime}ms`);
                            __classPrivateFieldGet(this, _TransferWebview_instances, "m", _TransferWebview__log).call(this, _a.LogLevels.ERROR, "Transfer failed", error);
                            reject(error);
                        }
                    }, maxTime);
                }
                __classPrivateFieldGet(this, _TransferWebview__messageMap, "f").set(params.id, {
                    params,
                    resolve,
                    reject,
                    timeout,
                });
                __classPrivateFieldGet(this, _TransferWebview__transferDataimplement, "f")(params);
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
_a = TransferWebview, _TransferWebview__isinit = new WeakMap(), _TransferWebview__messageListener = new WeakMap(), _TransferWebview__messageMap = new WeakMap(), _TransferWebview__transferDataimplement = new WeakMap(), _TransferWebview__parseDataFun = new WeakMap(), _TransferWebview_instances = new WeakSet(), _TransferWebview__log = function _TransferWebview__log(level, message, error = null) {
    const prefix = "[transfer-webview-channel]";
    switch (level) {
        case _a.LogLevels.ERROR:
            console.error(`${prefix} ${message}`, error);
            break;
        case _a.LogLevels.WARN:
            console.warn(`${prefix} ${message}`, error);
            break;
        case _a.LogLevels.INFO:
            console.info(`${prefix} ${message}`);
            break;
        case _a.LogLevels.DEBUG:
            console.debug(`${prefix} ${message}`);
            break;
    }
};
_TransferWebview__instance = { value: null };
TransferWebview.LogLevels = {
    ERROR: "error",
    WARN: "warn",
    INFO: "info",
    DEBUG: "debug",
};
var transferWebview = TransferWebview.getInstance();

export { transferWebview as default };
//# sourceMappingURL=index.js.map
