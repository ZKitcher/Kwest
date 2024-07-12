class KwestGiver {
    constructor(url) {
        this.apiURL = url;
        this.headerKeys = [];
        this.unauthorized = null;
        this.authorization = null;

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
            if (typeof window !== 'undefined' && window.grecaptcha) {
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
            } else {
                reject(new Error('CAPTCHA is not available in Node.js environment.'));
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
                this.replaceHeaderKeyValue({ [config.captcha]: token });
            } catch (ex) {
                console.error(ex);
            }
        }

        this.headerKeys.forEach(e => Object.assign(config.headers, e));

        if (this.localKey && this.authorization && typeof localStorage !== 'undefined') {
            try {
                const keys = window.localStorage.getItem(this.localKey);
                const parsedKeys = JSON.parse(keys);
                Object.assign(config.headers, this.authorization(parsedKeys))
            } catch {
                console.warn('Keys Missing.')
            }
        }

        const errorType = {
            server: 'Server Error',
            forbidden: 'Forbidden',
            unauthorized: 'Unauthorized',
            message: 'Error'
        }
        const errorMessage = {};

        try {
            const res = await fetch(url, config);

            if (!res.ok) {
                const contentType = res.headers.get('content-type') ?? '';
                const error = await (contentType.includes('application/json') ? res.json() : res.text());
                errorMessage.error = error;
                errorMessage.status = res.status;

                switch (res.status) {
                    case 401:
                        if (url.match(this.apiURL) && this.unauthorized) {
                            return this.unauthorized(url, config);
                        }
                        errorMessage.errorMessage = errorType.unauthorized;
                        throw errorMessage;

                    case 403:
                        errorMessage.errorMessage = errorType.forbidden;
                        throw errorMessage;

                    case 500:
                        errorMessage.errorMessage = errorType.server;
                        throw errorMessage;

                    default:
                        throw error;
                }
            }

            if (res.status === 204 || res.headers.get('content-length') === 0) {
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

                if (this.processJSONResponse) {
                    return this.processJSONResponse(JSONRes)
                }

                return JSONRes;
            }

            return await res.text();
        } catch (ex) {
            throw ex;
        }
    }

    get(url, config = {}) {
        return this.QuestBoard(url, config, this.methods.get);
    }

    getQuery(url, query, config = {}) {
        if (!Object.entries(query).length) {
            return this.get(url, config)
        }

        url += this.queryString(query);

        return this.QuestBoard(url, config, this.methods.get);
    }

    queryString(query) {
        return '?' + Object
            .entries(query)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
    }

    decodeQueryString(query) {
        return query
            .split('&')
            .reduce((a, b) => {
                const [name, value] = b.split('=');
                a[name] = decodeURIComponent(value);
                return a
            }, {})
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

            Object.entries(body).forEach(([key, value]) => {
                let objectProp = { op: operation };
                switch (operation) {
                    case 'add':
                    case 'update':
                    case 'test':
                        objectProp.path = `/${key}`;
                        objectProp.value = value;
                        break;
                    case 'remove':
                        objectProp.path = `/${key}`;
                        break;
                    case 'copy':
                    case 'move':
                        objectProp.from = `/${key}`;
                        objectProp.path = `/${value}`;
                        break;
                    default:
                        throw new Error(`Unsupported operation: ${operation}`);
                }
                patchBody.push(objectProp);
            });

            config.body = patchBody;
        }
        return this.QuestBoard(url, config, this.methods.patch);
    }

    delete(url, config = {}) {
        return this.QuestBoard(url, config, this.methods.delete);
    }

    setLifecycle(span) {
        const now = new Date();
        const targetDate = new Date(span);
        this.lifecycle = targetDate > now ? targetDate : new Date(now.getTime() + (span - 1) * 60000);
        console.log('Token Lifecycle Set:', this.lifecycle);
    }

    async QuestBoard(url, config, method) {
        if (config.body instanceof Object && config.postFile !== true) {
            config.body = JSON.stringify(config.body)
        }

        const useQueue = (new Date() < this.lifecycle || this.useQueue === false) ? false : true;

        if (this.showQueueType) {
            this.replaceHeaderKeyValue({ '_Queue-Type': useQueue ? 'QUEUED' : 'SHOTGUNNED' });
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

    updateMethod(config, method) {
        return Object.assign(config, { method });
    }

    /**
     * Set a function to be called on a 401 Unauthorized error when hitting the saved API endpoint.
     * This function is typically used to handle authentication refresh and retry failed requests.
     * 
     * @param {function} func - The function to call on a 401 error. It receives the request URL and config object.
     * @returns {void}
     */
    setUnauthorized(func) {
        this.unauthorized = func;
    }

    clearUnauthorized() {
        this.unauthorized = null;
    }

    /**
     * Set a function to return a Name/Value object for authorization.
     * @param {Function} func Function that returns the authorization value.
     * @returns {void}
     */
    setAuthorization(func) {
        this.authorization = func;
    }

    clearAuthorization() {
        this.authorization = null;
    }

    /**
     * Processes the JSON response in some way, possibly handling success or failure conditions.
     * @param {Function} func Function that returns the processed the JSON response.
     * @returns {void}
     */
    setProcessJSONResponse(func) {
        this.processJSONResponse = func;
    }

    clearProcessJSONResponse() {
        this.processJSONResponse = null;
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
                    if (socket.ready)
                        socket.ready(msg);
                } else {
                    if (socket.messaged)
                        socket.messaged(msg)
                }
            }
            catch (ex) {
                console.error('WS Error:', ex)
                if (socket.messaged)
                    socket.messaged(event.data)
            }
        };

        socket.onclose = function (event) {
            if (event.wasClean) {
                console.log(`%c[close]`, 'color:red', `Connection closed cleanly, code=${event.code} reason=${event.reason}`);
                if (socket.closed)
                    socket.closed(event)
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

    hasHeaderKey(key) {
        return this.headerKeys.find(e => e.hasOwnProperty(key));
    }

    clearHeaderKeys() {
        this.headerKeys.length = 0;
    }

    addHeaderKeyValue(keyValue) {
        this.headerKeys.push(keyValue);
    }

    replaceHeaderKeyValue(keyValue) {
        const key = Object.keys(keyValue)[0];
        let foundKey = this.headerKeys.find(e => e[key]);
        if (foundKey) {
            foundKey[key] = keyValue[key];
        } else {
            this.addHeaderKeyValue(keyValue);
        }
    }

    removeHeaderKey(key) {
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
    static queryString(query) {
        const Quest = new KwestGiver();
        return Quest.queryString(query);
    }
    static decodeQueryString(query) {
        const Quest = new KwestGiver();
        return Quest.queryString(query);
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

module.exports = KwestGiver;