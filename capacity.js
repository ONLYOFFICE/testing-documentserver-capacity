const crypto = require('crypto');
const request = require('request');
const fs = require('fs');
const W3CWebSocket = require('websocket').w3cwebsocket;
const extraEscapable = /[\x00-\x1f\ud800-\udfff\ufffe\uffff\u0300-\u0333\u033d-\u0346\u034a-\u034c\u0350-\u0352\u0357-\u0358\u035c-\u0362\u0374\u037e\u0387\u0591-\u05af\u05c4\u0610-\u0617\u0653-\u0654\u0657-\u065b\u065d-\u065e\u06df-\u06e2\u06eb-\u06ec\u0730\u0732-\u0733\u0735-\u0736\u073a\u073d\u073f-\u0741\u0743\u0745\u0747\u07eb-\u07f1\u0951\u0958-\u095f\u09dc-\u09dd\u09df\u0a33\u0a36\u0a59-\u0a5b\u0a5e\u0b5c-\u0b5d\u0e38-\u0e39\u0f43\u0f4d\u0f52\u0f57\u0f5c\u0f69\u0f72-\u0f76\u0f78\u0f80-\u0f83\u0f93\u0f9d\u0fa2\u0fa7\u0fac\u0fb9\u1939-\u193a\u1a17\u1b6b\u1cda-\u1cdb\u1dc0-\u1dcf\u1dfc\u1dfe\u1f71\u1f73\u1f75\u1f77\u1f79\u1f7b\u1f7d\u1fbb\u1fbe\u1fc9\u1fcb\u1fd3\u1fdb\u1fe3\u1feb\u1fee-\u1fef\u1ff9\u1ffb\u1ffd\u2000-\u2001\u20d0-\u20d1\u20d4-\u20d7\u20e7-\u20e9\u2126\u212a-\u212b\u2329-\u232a\u2adc\u302b-\u302c\uaab2-\uaab3\uf900-\ufa0d\ufa10\ufa12\ufa15-\ufa1e\ufa20\ufa22\ufa25-\ufa26\ufa2a-\ufa2d\ufa30-\ufa6d\ufa70-\ufad9\ufb1d\ufb1f\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufb4e\ufff0-\uffff]/g;
var extraLookup;

// This may be quite slow, so let's delay until user actually uses bad
// characters.
var unrollLookup = function (escapable) {
	var i;
	var unrolled = {};
	var c = [];
	for (i = 0; i < 65536; i++) {
		c.push(String.fromCharCode(i));
	}
	escapable.lastIndex = 0;
	c.join('').replace(escapable, function (a) {
		unrolled[a] = '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
		return '';
	});
	escapable.lastIndex = 0;
	return unrolled;
};
function quote(string) {
	var quoted = JSON.stringify(string);

	// In most cases this should be very fast and good enough.
	extraEscapable.lastIndex = 0;
	if (!extraEscapable.test(quoted)) {
		return quoted;
	}

	if (!extraLookup) {
		extraLookup = unrollLookup(extraEscapable);
	}

	return quoted.replace(extraEscapable, function (a) {
		return extraLookup[a];
	});
}
function randomString(count = 8) {
	return crypto.randomBytes(count).toString('hex');
}
function randomNumber(count = 1000) {
	return Math.floor(Math.random() * count) + '';
}

const enableLog = -1 !== process.argv.indexOf('--debug');
function log(message) {
	enableLog && console.log(message);
}

function DocsCoApi(options = {}) {
	this.docId = options.docId || '1234567890';
	this.server = options.server || 'ws://127.0.0.1:8001';
	this.url = options.url || 'https://doc.onlyoffice.com/example/samples/sample.docx';
	this.sessionId = randomString();
	this.serverId = randomNumber();
	this.client = null;
	this.init();
}
DocsCoApi.prototype.init = function () {
	this.client =
		new W3CWebSocket(this.server + '/doc/' + this.docId + '/c/' + this.serverId + '/' + this.sessionId + '/websocket');
	this.client.onerror = () => {
		log('Connection Error');
	};

	this.client.onopen = () => {
		log('WebSocket Client Connected');
	};

	this.client.onclose = () => {
		log('echo-protocol Client Closed');
	};

	this.client.onmessage = (e) => {
		const msg = e.data;
		if (typeof msg === 'string') {
			log('Received: "' + msg + '"');

			const type = msg.slice(0, 1);
			const content = msg.slice(1);
			var payload;

			if (content) {
				try {
					payload = JSON.parse(content);
				} catch (e) {
					log('bad json', content);
				}
			}

			switch (type) {
				case 'o':
					log('open');
					break;
				case 'h':
					log('heartbeat');
					break;
				case 'a':
					if (Array.isArray(payload)) {
						payload.forEach((p) => {
							this.onMessage(p);
						});
					}
					break;
				case 'm':
					this.onMessage(payload);
					break;
				case 'c':
					log('close');
					break;
			}
		}
	};
};
DocsCoApi.prototype._onAuth = function (data) {
};
DocsCoApi.prototype._onMessages = function (data) {
	log('onMessages: ' + data["messages"]);
};
DocsCoApi.prototype._onCursor = function (data) {
};
DocsCoApi.prototype._onGetLock = function (data) {
};
DocsCoApi.prototype._onReleaseLock = function (data) {
};
DocsCoApi.prototype._onConnectionStateChanged = function (data) {
};
DocsCoApi.prototype._onSaveChanges = function (data) {
};
DocsCoApi.prototype._onSaveLock = function (data) {
};
DocsCoApi.prototype._onUnSaveLock = function (data) {
};
DocsCoApi.prototype._onSavePartChanges = function (data) {
};
DocsCoApi.prototype._onDrop = function (data) {
};
DocsCoApi.prototype._documentOpen = function (data) {
	this.sendRequest({'type': 'getMessages'});
	if ((data = data['data']) && (data = data['data']) && (data = data['Editor.bin'])) {
		request(data).pipe(fs.createWriteStream(randomString() + '-' + 'Editor.bin'));
		return;
	}

	log('error open file: ' + this.url);
};
DocsCoApi.prototype._onWarning = function (data) {
};
DocsCoApi.prototype._onLicense = function (data) {
	this.sendRequest({
		'type': 'auth',
		'docid': this.docId,
		'token': 'fghhfgsjdgfjs',
		'user': {'id': 'uid-1', 'username': 'Jonn Smith', 'indexUser': -1},
		'editorType': 1,
		'lastOtherSaveTime': -1,
		'block': [],
		'sessionId': null,
		'view': false,
		'isCloseCoAuthoring': false,
		'openCmd': {
			'c': 'open',
			'id': this.docId,
			'userid': 'uid-1',
			'format': 'docx',
			'url': this.url,
			'title': 'test',
			'embeddedfonts': false,
			'viewmode': false
		},
		'version': '3.0.9'
	});
};
DocsCoApi.prototype.onMessage = function (data) {
	log('message: "' + data + '"');

	var dataObject = JSON.parse(data);
	switch (dataObject['type']) {
		case 'auth'        :
			this._onAuth(dataObject);
			break;
		case 'message'      :
			this._onMessages(dataObject, false);
			break;
		case 'cursor'       :
			this._onCursor(dataObject);
			break;
		case 'getLock'      :
			this._onGetLock(dataObject);
			break;
		case 'releaseLock'    :
			this._onReleaseLock(dataObject);
			break;
		case 'connectState'    :
			this._onConnectionStateChanged(dataObject);
			break;
		case 'saveChanges'    :
			this._onSaveChanges(dataObject);
			break;
		case 'saveLock'      :
			this._onSaveLock(dataObject);
			break;
		case 'unSaveLock'    :
			this._onUnSaveLock(dataObject);
			break;
		case 'savePartChanges'  :
			this._onSavePartChanges(dataObject);
			break;
		case 'drop'        :
			this._onDrop(dataObject);
			break;
		case 'waitAuth'      : /*Ждем, когда придет auth, документ залочен*/
			break;
		case 'error'      : /*Старая версия sdk*/
			this._onDrop(dataObject);
			break;
		case 'documentOpen'    :
			this._documentOpen(dataObject);
			break;
		case 'warning':
			this._onWarning(dataObject);
			break;
		case 'license':
			this._onLicense(dataObject);
			break;
	}
};
DocsCoApi.prototype.sendRequest = function (data) {
	if (this.client.readyState === this.client.OPEN) {
		const sendData = JSON.stringify(data);
		log("Send: '" + sendData + "'");
		this.client.send(quote(sendData));
	}
};

var countUsers = 1;
var countDocuments = 5;
var serverUrl, documentUrl;

var indexArg = process.argv.indexOf('--users');
if (-1 !== indexArg) {
	countUsers = process.argv[indexArg + 1];
}
indexArg = process.argv.indexOf('--documents');
if (-1 !== indexArg) {
	countDocuments = process.argv[indexArg + 1];
}
indexArg = process.argv.indexOf('--server');
if (-1 !== indexArg) {
	serverUrl = process.argv[indexArg + 1];
}
indexArg = process.argv.indexOf('--file');
if (-1 !== indexArg) {
	documentUrl = process.argv[indexArg + 1];
}

var sDocId;
for (var nDoc = 0; nDoc < countDocuments; ++nDoc) {
	sDocId = randomString();
	for (var nUser = 0; nUser < countUsers; ++nUser) {
		var oDocsCoApi = new DocsCoApi({server: serverUrl, docId: sDocId, url: documentUrl});
	}
}
