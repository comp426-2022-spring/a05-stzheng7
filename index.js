// Require Express.js
const express = require('express')
const app = express()
const morgan = require('morgan')
const logdb = require('./database')
const fs = require('fs')

const args = require('minimist')(process.argv.slice(2))
args['port']
const port = args.port || process.env.PORT || 5000

// Start an app server
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',port))
});

const help = (`
server.js [options]
--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help	Return this message and exit.
`)

if (args.help || args.h) {
  console.log(help)
  process.exit(0)
}

if(args.log == true) {
  const accesslog = fs.createWriteStream('access.log', { flags: 'a'})
  app.use(morgan('combined', {stream: accesslog}))
}

app.use((req, res, next) => {
  let logdata = {
    remoteaddr: req.ip,
    remoteuser: req.user,
    time: Date.now(),
    method: req.method,
    url: req.url,
    protocol: req.protocol,
    httpversion: req.httpVersion,
    status: res.statusCode,
    referer: req.headers['referer'],
    useragent: req.headers['user-agent']
  }

  const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
  
  next()
})


if(args.debug) {
  app.get("/app/log/access", (req, res, next) => {
    try {
      const stmt = logdb.prepare('SELECT * FROM accesslog').all();
      res.status(200).json(stmt)
    } catch (e) {
      console.error(e)
    }
  })

  app.get("/app/error", (req, res) => {
    throw new Error("Error test successful")
  });
}

app.get("/app/", (req, res, next) => {
  res.status(200).json({"message": "Your API works! (200)"});
})

app.post("/app/new/user", (req, res, next) => {
  let data = {
    user: req.body.username,
    pass: req.body.password
  }
  const stmt = logdb.prepare('INSERT INTO userinfo (username, password) VALUES (?, ?)');
  const info = stmt.run(data.user, data.pass)
  res.status(200).json(info)
})

app.get("/app/users", (req, res) => {
  try {
    const stmt = logdb.prepare('SELECT * FROM userinfo').all()
    res.status(200).json(stmt)
  } catch (e) {
      console.error(e)
  }
})

app.get("/app/user/:id", (req, res) => {
  try {
    const stmt = logdb.prepare('SELECT * FROM userinfo WHERE id = ?').get(req.params.id);
    res.status(200).json(stmt)
  } catch (e) {
    console.error(e)
  }
})

app.patch("/app/update/user/:id", (req, res) => {
  let data = {
    user: req.body.username,
    pass: req.body.password
  }
  const stmt = logdb.prepare('UPDATE userinfo SET username = COALESCE(?,username), password = COALESCE(?, password) WHERE id = ?')
  const info = stmt.run(data.user, data.pass, req.params.id)
  res.status(200).json(info)
})

app.delete("/app/delete/user/:id", (req, res) => {
  try {
    const stmt = logdb.prepare('DELETE * FROM userinfo WHERE id = ?').get(req.params.id);
    const info = stmt.run(req.params.id)
    res.status(200).json(info)
  } catch (e) {
    console.error(e)
  }
})

// Default response for any other request
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});


function coinFlip() {
    if(Math.random() > .5) {
      return "heads";
    }
    else{
      return "tails";
    }
  }
  function coinFlips(flips) {
    const flipsA = [];
    for (var i = 0; i < flips; i++) {
      flipsA.push(coinFlip());
    }
    return flipsA;
  }
  
  function countFlips(array) {
    const countA = {heads: 0, tails: 0};
    for (var i = 0; i < array.length; i++) {
      if (array[i] == "heads") {
        countA.heads++;
      }
      else {
        countA.tails++;
      }
    }
    return countA;
  }

  function flipACoin(call) {
    const FlipA = {call: call, flip: "", result: ""}
    FlipA.flip = coinFlip();
    if (FlipA.flip == call) {
      FlipA.result = "win";
    }
    else {
      FlipA.result = "lose";
    }
    return FlipA;
  }