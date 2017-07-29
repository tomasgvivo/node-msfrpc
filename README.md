![MsfRpc logo](./assets/logo.png)
> The Metasploit RPC api for Node.js

## Getting started

### Installing

This will install the cli in your system.
```shell
npm install -g msfrpc
```

This will add the msfrpc module to your Node.js project.
```shell
npm install --save msfrpc
```

### Using the cli

```shell
msfrpc-cli <URI>
```

URI example: ```https://msfUser:123456@localhost:55553```

### Using the api

All msfrpc methods are grouped in the following "method groups":
* Auth
* Base
* Console
* Core
* Db
* Job
* Module
* Plugin
* Session

To call a msfrpc, use the following pattern:
```
msfrpc.<method group>.<method name (camel case)>([arguments]);
```

All methods returns Promises.

Please note that we don't pass tokens to the methods.
Tokens are added automatically by MsfRpc.

Here is an example:
```js
const MsfRpc = require('msfrpc');

const msfrpcUri = 'https://msfUser:123456@localhost:55553';
const msfrpc = new MsfRpc(msfrpcUri);

console.log(`Connecting to ${msfrpcUri}`);
msfrpc.connect().then(() => {
  return msfrpc.core.version().then((res) => {
    console.log(`Metasploit Framework version ${res.version}`);
  }).then(() => {
    const keyword = 'windows';
    console.log(`Search modules containing "${keyword}". This may take a few seconds...`);
    return msfrpc.module.search(keyword).then((modules) => {
      console.log(`Found the ${modules.length} modules for "${keyword}":`);
      modules.forEach((module) => {
        console.log('=========', module.fullname);
        console.log('  Name', module.name);
        console.log('  Type', module.type);
        console.log('  Rank', module.rank);
        if(module.disclosuredate) {
          console.log('  Date', module.disclosuredate);
        }
      });
    });
  });
});
```

In the example, we:
* Connect to the msfrpc server
* Obtain and print the Metasploit Version
* Find and print all modules containing a given keyword

### Api Reference

For a list and documentation of all available methods, visit the following links.
* http://www.nothink.org/metasploit/documentation/RemoteAPI_4.1.pdf
* https://help.rapid7.com/metasploit/Content/api/rpc/overview.html
* https://help.rapid7.com/metasploit/Content/api/rpc/standard-reference.html
* https://rapid7.github.io/metasploit-framework/api/Msf/RPC.html

Here are some examples of method calls:

Get version information:
```js
msfrpc.core.version()
```

Get module stats:
```js
msfrpc.core.moduleStats()
```

Search for a module:
```js
msfrpc.module.search('keyword')
```

List payloads:
```js
msfrpc.module.payloads()
```

## Developing

### Optional Prerequisites
This project includes a ```Dockerfile``` (and ```docker-compose.yml```) so you dont have to build a testing environment yourself.
To use docker, you need it installed in your system.
For installation, follow the steps [here](https://docs.docker.com/compose/install/).

### Setting up Dev

Clone the repository and install dependencies.
```shell
git clone https://github.com/tomasgvivo/node-msfrpc.git
cd node-msfrpc/
npm install
```

## Licensing

Copyright 2017 Tomas Gonzalez Vivo

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
