# KwestGiver

`KwestGiver` is a JavaScript class designed to simplify and streamline API requests and WebSocket connections. It offers support for various HTTP methods, queueing of requests, and integration with Google reCAPTCHA.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Methods](#methods)
  - [Constructor](#constructor)
  - [toggleQueue](#togglequeue)
  - [addApiUrl](#addapiurl)
  - [addLocalKey](#addlocalkey)
  - [getCaptcha](#getcaptcha)
  - [fetchQuest](#fetchquest)
  - [HTTP Methods](#http-methods)
    - [get](#get)
    - [getQuery](#getquery)
    - [post](#post)
    - [postFile](#postfile)
    - [put](#put)
    - [patch](#patch)
    - [delete](#delete)
  - [setLifecycle](#setlifecycle)
  - [QuestBoard](#questboard)
  - [WebSocket](#websocket)
  - [Header Keys Management](#header-keys-management)
- [Static Methods](#static-methods)
- [Error Handling](#error-handling)
- [License](#license)

## Installation

```bash
npm i kwest-giver
```

To use `KwestGiver` in your project, simply import it as follows:

```javascript
import KwestGiver from './KwestGiver';
```

## Usage

Initialize the `KwestGiver` class by providing an optional API URL:

```javascript
const kwest = new KwestGiver('https://api.example.com');
```


### Basic GET Request

```javascript
// https://api.example.com/endpoint
kwest.get('/endpoint')
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### POST Request with JSON Body

```javascript
// https://api.example.com/endpoint
const body = { key: 'value' };
kwest.post('/endpoint', body)
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### WebSocket Connection

```javascript
const kwest = new KwestGiver();

const socket = kwest.webSocket('wss://example.com/socket');

socket.onmessage = function(message) {
    // message is in JSON (if parsable)
    console.log('Message from server ', message);
};
```

## Methods

### Constructor

```javascript
constructor(url)
```

- `url` (optional): The base URL for the API.

### toggleQueue

Toggles the use of the request queue.

```javascript
toggleQueue()
```

### addApiUrl

Sets the base API URL.

```javascript
addApiUrl(url)
```

- `url`: The base URL for the API.

### addLocalKey

Adds a local storage key for authorization.

```javascript
addLocalKey(key)
```

- `key`: The key used to retrieve authorization tokens from local storage.

### getCaptcha

Gets a reCAPTCHA token.

```javascript
getCaptcha(key)
```

- `key`: The reCAPTCHA site key.

### fetchQuest

Makes a fetch request to a specified URL with a given configuration.

```javascript
fetchQuest(url, config)
```

- `url`: The request URL.
- `config`: The request configuration object.

#### config

The request configuration object that can take custom headers for further features.

- `captcha`: Add a reCAPTCHA site key to the config to add the reCAPTCHA token to the request.

### HTTP Methods

#### get

Makes a GET request.

```javascript
get(url, config = {})
```

- `url`: The request URL.
- `config`: The request configuration object.

#### getQuery

Makes a GET request with query parameters.

```javascript
getQuery(url, query, config = {})
```

- `url`: The request URL.
- `query`: The query parameters as an object.
- `config`: The request configuration object.

#### post

Makes a POST request.

```javascript
post(url, body, config = {})
```

- `url`: The request URL.
- `body`: The request body.
- `config`: The request configuration object.

#### postFile

Uploads a file using a POST request.

```javascript
postFile(url, files, key = 'file', config = {})
```

- `url`: The request URL.
- `files`: The files to upload.
- `key`: The form data key (default is 'file').
- `config`: The request configuration object.

#### put

Makes a PUT request.

```javascript
put(url, body, config = {})
```

- `url`: The request URL.
- `body`: The request body.
- `config`: The request configuration object.

#### patch

Makes a PATCH request.

```javascript
patch(url, body, operation, config = {})
```

- `url`: The request URL.
- `body`: The request body.
- `operation`: The patch operation (`update`, `add`, `remove`, `copy`, `move`, `test`).
- `config`: The request configuration object.

#### delete

Makes a DELETE request.

```javascript
delete(url, config = {})
```

- `url`: The request URL.
- `config`: The request configuration object.

### setLifecycle

Sets the token lifecycle.

```javascript
setLifecycle(span)
```

- `span`: The token lifecycle span.

### QuestBoard

Handles the request queue and lifecycle.

```javascript
QuestBoard(url, config, method)
```

- `url`: The request URL.
- `config`: The request configuration object.
- `method`: The HTTP method.

### WebSocket

Creates a WebSocket connection.

```javascript
webSocket(url)
```

- `url`: The WebSocket URL.

### Header Keys Management

#### setUnauthorized

Set a function to be called on a 401 Unauthorized error when hitting the saved API endpoint.
This function is typically used to handle authentication refresh and retry failed requests.

```javascript
kwest.setUnauthorized((url, config) => {
    return new Promise((resolve, reject) => {
        updateAccessToken()
            .then(() => (
                kwest.fetchQuest(url, config)
                    .then(res => resolve(res))
                    .catch(ex => reject(ex))
            ))
    })
})
```

#### setAuthorization

Set a function to return a Name/Value object for authorization in use with localKeys.

```javascript
kwest.setAuthorization(keyFromStorage => ({ authorization: 'Bearer ' + keyFromStorage.accessToken }))
```

#### setProcessJSONResponse

Processes the JSON response in some way, possibly handling success or failure conditions.

```javascript
kwest.setProcessJSONResponse(JSONResult => {
    if (JSONResult.success === true) {
        return JSONResult.resultData;
    }

    if (JSONResult.success === false) {
        const errorMessage = {
            errorMessage: JSONResult.errorMessage || 'An Error has occurred...'
        };
        throw errorMessage;
    }
})
```

#### showHeaderKeys

Logs the current header keys.

```javascript
showHeaderKeys()
```

#### hasHeaderKey

Checks if a header key exists.

```javascript
hasHeaderKey(key)
```

- `key`: The key to check.

#### clearHeaderKeys

Clears all header keys.

```javascript
clearHeaderKeys()
```

#### addHeaderKeyValue

Adds a header key.

```javascript
addHeaderKeyValue(keyValue)
```

- `keyValue`: The key to add.

#### replaceHeaderKeyValue

Replaces a header key.

```javascript
replaceHeaderKeyValue(keyValue)
```

- `keyValue`: The key to replace.

#### removeHeaderKey

Removes a header key.

```javascript
removeHeaderKey(key)
```

- `key`: The key to remove.

## Static Methods

`KwestGiver` provides static methods for convenience:

```javascript
fetchQuest(url, config)
get(url, config = {})
getQuery(url, query, config = {})
queryString(query)
post(url, body, config = {})
put(url, body, config = {})
patch(url, body, operation, config = {})
delete(url, config = {})
```

## Error Handling

Errors are handled and categorized as follows:
- `server`: Server errors.
- `loggedOut`: Unauthorized errors.
- `unauthorized`: Forbidden errors.
- `message`: General errors.

## License

This project is licensed under the MIT License.
