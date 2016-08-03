# testing-documentserver-capacity
Script for testing [ONLYOFFICE Document Server][2] capacity.

## Super simple to use
    $ node capacity.js --debug --users 2 --documents 5 --server wss://your-server.com --file https://your-server.com/sample.xlsx

## Installation
    $ npm install

## Options
- `--debug` show all logs
- `--users` count users per one document
- `--documents` count documents
- `--server` url to the testing server
- `--file` url to opening file

## User Feedback and Support

If you have any problems with or questions about [ONLYOFFICE Document Server][2], please visit our official forum to find answers to your questions: [dev.onlyoffice.org][1].

  [1]: http://dev.onlyoffice.org
  [2]: https://github.com/ONLYOFFICE/DocumentServer

## License

document-server-integration is released under the MIT License. See the LICENSE.txt file for more information.
