export class KwestGiver {
    constructor(url) {
        this.apiURL = url;
        this.headerKeys = [];
        this.unauthorized = null;

        this.patchOp = {
            update: 'replace',
            add: 'add',
            remove: 'remove',
            copy: 'copy',
            move: 'move',
            test: 'test'
        };

        this.methods = {
            get: 'GET',
            post: 'POST',
            put: 'PUT',
            patch: 'PATCH',
            delete: 'DELETE'
        };

        this.useQueue = true;
        this.queue = [];
        this.isProcessing = false;
        this.showQueueType = false;

        this.localKey = null;
    }

    toggleQueue() {
        this.useQueue = !this.useQueue;
    }

    addApiUrl(url) {
        this.apiURL = url;
    }

    addLocalKey(key) {
        this.localKey = key;
    }

    getCaptcha(key) {
        return new Promise((resolve, reject) => {
            try {
                window.grecaptcha
                    .ready(() => {
                        window.grecaptcha
                            .execute(key, { action: 'submit' })
                            .then((token) => resolve(token));
                    });
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
        });
    }

    // FETCH
    async fetchQuest(url, config) {
        if (!url) throw new Error('No URL provided.');
        if (!url.match(/^https?:\/\//)) url = this.apiURL ? this.apiURL + url : url;

        config.headers = config.headers || {};

        if (!config.headers['Content-Type'] && !config.postFile) {
            config.headers['Content-Type'] = 'application/json';
        }

        if (config.captcha && window.grecaptcha) {
            try {
                const token = await this.getCaptcha(config.captcha);
                this.replaceHeaderKey({ [config.captcha]: token });
            } catch (ex) {
                console.error(ex);
            }
        }

        this.headerKeys.forEach(e => Object.assign(config.headers, e));

        if (this.localKey) {
            try {
                const keys = window.localStorage.getItem(this.localKey);
                const parsedKeys = JSON.parse(keys);
                Object.assign(config.headers, { authorization: 'Bearer ' + parsedKeys.access })
            } catch {
                console.warn('Keys Missing.')
            }
        }

        const errorType = {
            server: 'Server Error',
            loggedOut: 'Logged Out',
            unauthorized: 'Unauthorized',
            message: 'Error'
        }
        const errorMessage = {};

        try {
            const res = await fetch(url, config);

            if (!res.ok) {
                if (res.status === 401 && url.match(this.apiURL) && this.unauthorized) {
                    return this.unauthorized(url, config);
                }

                const error = await res.json().catch(() => res.text());
                errorMessage.error = error;

                if (res.status === 401) {
                    errorMessage.errorMessage = errorType.loggedOut;
                    throw errorMessage;
                }

                if (res.status === 403) {
                    errorMessage.errorMessage = errorType.unauthorized;
                    throw errorMessage;
                }

                throw error;
            }

            if (res.headers.get('content-length') === 0 || res.status === 204) {
                return true;
            }

            if (config.download) {
                const metaData = {};
                let disposition = res.headers.get('content-disposition');
                if (disposition) {
                    disposition.split(';').forEach(e => {
                        const [key, value] = e.trim().split('=');
                        metaData[key] = value ? value : true;
                    });
                }

                return {
                    file: await res.blob(),
                    metaData
                };
            }

            const contentType = res.headers.get('content-type') ?? '';

            if (contentType.includes('application/json')) {
                const JSONRes = await res.json();

                if (JSONRes.success === true) {
                    return JSONRes.resultData;
                }

                if (JSONRes.success === false) {
                    const errorMessage = {
                        error: errorType.message,
                        errorMessage: JSONRes.errorMessage || 'An Error has occurred...'
                    };
                    throw errorMessage;
                }

                return JSONRes;
            }

            return await res.text();

        } catch (ex) {
            const errorMessage = {
                error: ex,
                errorMessage: ex.errorMessage || 'An Error has occurred...'
            };
            throw errorMessage;
        }
    }

    get(url, config = {}) {
        return this.QuestBoard(url, config, this.methods.get);
    }

    getQuery(url, query, config = {}) {
        if (!Object.entries(query).length) {
            return this.get(url, config)
        }

        url += '?' + Object
            .entries(query)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        return this.QuestBoard(url, config, this.methods.get);
    }

    post(url, body, config = {}) {
        config.body = body;
        return this.QuestBoard(url, config, this.methods.post);
    }

    postFile(url, files, key = 'file', config = {}) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append(key, files[i]);
        }

        config.body = formData;
        config.headers = {}
        config.postFile = true;

        return this.QuestBoard(url, config, this.methods.post);
    }

    put(url, body, config = {}) {
        config.body = body;
        return this.QuestBoard(url, config, this.methods.put);
    }

    patch(url, body, operation, config = {}) {
        config.body = body;

        if (body) {
            let patchBody = [];
            Object
                .entries(body)
                .forEach(([key, value]) => {
                    let objectProp = {
                        op: operation
                    }
                    if (operation === this.patchOp.add || operation === this.patchOp.update || operation === this.patchOp.test) {
                        objectProp.path = `/${key}`;
                        objectProp.value = value;
                    } else if (operation === this.patchOp.remove) {
                        objectProp.path = `/${key}`;
                    } else if (operation === this.patchOp.copy || operation === this.patchOp.move) {
                        objectProp.from = `/${key}`;
                        objectProp.path = `/${value}`;
                    }
                    patchBody.push(objectProp);
                })
            config.body = patchBody;
        }
        return this.QuestBoard(url, config, this.methods.patch);
    }

    delete(url, config = {}) {
        return this.QuestBoard(url, config, this.methods.delete);
    }

    setLifecycle(span) {
        this.lifecycle = new Date(span) > new Date() ? new Date(span) : new Date(new Date().getTime() + (span - 1) * 60000);
        console.log('Token Lifecycle Set:', this.lifecycle);
    }

    async QuestBoard(url, config, method) {
        if (config.body instanceof Object && config.postFile !== true) {
            config.body = JSON.stringify(config.body)
        }

        let useQueue = true;
        if (new Date() < this.lifecycle || this.useQueue === false) {
            useQueue = false;
        }

        if (this.showQueueType) {
            this.replaceHeaderKey({ '_Queue-Type': useQueue ? 'QUEUED' : 'SHOTGUNNED' });
        }

        return this.addRequest(url, config, method, useQueue);
    }

    async addRequest(url, config, method, useQueue) {
        return new Promise(async (resolve, reject) => {
            if (useQueue) {
                this.queue.push({ url, config, method, resolve, reject });
                await this.processQueue();
            } else {
                try {
                    resolve(await this.fetchQuest(url, this.updateMethod(config, method)));
                } catch (ex) {
                    reject(ex);
                }
            }
        });
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const { url, config, method, resolve, reject } = this.queue.shift();

        try {
            resolve(await this.fetchQuest(url, this.updateMethod(config, method)));
        } catch (ex) {
            reject(ex);
        } finally {
            this.isProcessing = false;
            await this.processQueue();
        }
    }

    emptyQueue() {
        this.isProcessing = false;
        this.queue = [];
    }

    updateMethod(c, m) {
        return Object.assign(c, { method: m });
    }

    setUnauthorized(func) {
        this.unauthorized = func;
    }

    clearUnauthorized() {
        this.unauthorized = null;
    }

    // WEBSOCKET
    webSocket(url) {
        const socket = new WebSocket(url);

        socket.onopen = function (e) {
            console.log(`%c[open]`, 'color:green', `Connection established`);
        };

        socket.onmessage = function (event) {
            console.log(`%c[message]`, 'color:blue', `Data received from server: ${event.data}`);
            try {
                const msg = JSON.parse(event.data);
                if (msg.socketId) {
                    socket.id = msg.socketId;
                    socket.ready();
                } else {
                    socket.messaged(msg)
                }
            }
            catch {
                socket.messaged(event.data)
            }
        };

        socket.onclose = function (event) {
            if (event.wasClean) {
                console.log(`%c[close]`, 'color:red', `Connection closed cleanly, code=${event.code} reason=${event.reason}`);
                socket.closed();
            } else {
                console.log(`%c[close]`, 'color:red', `Connection died`);
            }
        };

        socket.onerror = function (error) {
            console.log(`%c[ERROR]`, 'color:red', error);
            socket.error(error);
        };

        return socket;
    }

    // HEADER KEYS
    showHeaderKeys() {
        console.log([...this.headerKeys]);
    }

    hasHeaderKeys(k) {
        return this.headerKeys.find(e => e.hasOwnProperty(k));
    }

    clearHeaderKeys() {
        this.headerKeys.length = 0;
    }

    addHeaderKeys(k) {
        this.headerKeys.push(k);
    }

    replaceHeaderKey(k) {
        const key = Object.keys(k)[0];
        let authKey = this.headerKeys.find(e => e[key]);
        if (authKey) {
            authKey[key] = k[key];
        } else {
            this.addHeaderKeys(k);
        }
    }

    removeHeaderKey(k) {
        const key = Object.keys(k)[0];
        let authKey = this.headerKeys.findIndex(e => e[key]);
        if (authKey !== -1) {
            this.headerKeys.splice(authKey, 1);
        }
    }

    static fetchQuest(url, config) {
        const Quest = new KwestGiver()
        return Quest.fetchQuest(url, config);
    }
    static get(url, config = {}) {
        const Quest = new KwestGiver();
        return Quest.get(url, config);
    }
    static getQuery(url, query, config = {}) {
        const Quest = new KwestGiver();
        return Quest.getQuery(url, query, config);
    }
    static post(url, body, config = {}) {
        const Quest = new KwestGiver();
        return Quest.post(url, body, config);
    }
    static put(url, body, config = {}) {
        const Quest = new KwestGiver();
        return Quest.put(url, body, config);
    }
    static patch(url, body, operation, config = {}) {
        const Quest = new KwestGiver();
        return Quest.patch(url, body, operation, config)
    }
    static delete(url, config = {}) {
        const Quest = new KwestGiver();
        return Quest.delete(url, config);
    }
}

export default KwestGiver;