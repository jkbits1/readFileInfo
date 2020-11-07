const fs    = require('fs')
const path  = require ('path');
const async = require('async')

const S     = require('sanctuary')

const exit0 = require ('./exit0');
const exit1 = require ('./exit1');
// const join          = require ('./common/join');

// Given a path to a directory containing an index file, index.txt, and zero or more other files, read the index file (which contains one filename per line), then read each of the files listed in the index concurrently, concat the resulting strings (in the order specified by the index), and write the result to stdout.

//  join :: String -> String -> String
const commonJoin = S.curry2 (path.join);

const readFileAsync = (filename, callback) =>
  fs.readFile (filename, {encoding: 'utf8'}, callback);

const main = () => {
  const path = commonJoin (process.argv[2]);

  const x = readFileAsync (path('testFiles.txt'), (err, data) => {
    if (err) throw err;

    console.log("data: ", data);

    const fileNames = S.pipe ([
      S.lines,
      S.map (path),
      ]) 
      (data)

    console.log ('filename', fileNames[0])

    console.log(`fileNames: ${S.show (fileNames)}`)
    console.log()

    const contents = []
    let filesRead = 0

    async.map(fileNames, readFileAsync, (err, data) => {
      if (err) {
        exit1(err)
      }

      console.log("file data: ", data)
      console.log()

      exit0 (S.joinWith ('') (data))
    })
  })

};

main()
