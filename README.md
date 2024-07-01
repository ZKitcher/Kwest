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
- [Examples](#examples)
- [License](#license)

## Installation

To use `KwestGiver` in your project, simply import it as follows:

```javascript
import KwestGiver from './KwestGiver';
```

## Usage

Initialize the `KwestGiver` class by providing an optional API URL:

```javascript
const questGiver = new KwestGiver('https://api.example.com');
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

#### showHeaderKeys

Logs the current header keys.

```javascript
showHeaderKeys()
```

#### hasHeaderKeys

Checks if a header key exists.

```javascript
hasHeaderKeys(k)
```

- `k`: The key to check.

#### clearHeaderKeys

Clears all header keys.

```javascript
clearHeaderKeys()
```

#### addHeaderKeys

Adds a header key.

```javascript
addHeaderKeys(k)
```

- `k`: The key to add.

#### replaceHeaderKey

Replaces a header key.

```javascript
replaceHeaderKey(k)
```

- `k`: The key to replace.

#### removeHeaderKey

Removes a header key.

```javascript
removeHeaderKey(k)
```

- `k`: The key to remove.

## Static Methods

`KwestGiver` provides static methods for convenience:

```javascript
fetchQuest(url, config)
get(url, config = {})
getQuery(url, query, config = {})
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

## Examples

### Basic GET Request

```javascript
const questGiver = new KwestGiver('https://api.example.com');

questGiver.get('/endpoint')
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### POST Request with JSON Body

```javascript
const questGiver = new KwestGiver('https://api.example.com');

const body = { key: 'value' };

questGiver.post('/endpoint', body)
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### WebSocket Connection

```javascript
const questGiver = new KwestGiver();

const socket = questGiver.webSocket('wss://example.com/socket');

socket.onmessage = function(event) {
    console.log('Message from server ', event.data);
};
```

## License

This project is licensed under the MIT License.
