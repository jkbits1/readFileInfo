const fs    = require('fs');
const { resolve } = require('path');
const path  = require ('path');
const { reject } = require('sanctuary');

const S     = require('sanctuary')

const exit0 = require ('./exit0');
const exit1 = require ('./exit1');
// const join          = require ('./common/join');

// Given a path to a directory containing an index file, index.txt, and zero or more other files, read the index file (which contains one filename per line), then read each of the files listed in the index concurrently, concat the resulting strings (in the order specified by the index), and write the result to stdout.

//  join :: String -> String -> String
const commonJoin = S.curry2 (path.join);

//  readFile :: String -> ((Error?, String?) -> Undefined) -> Undefined
const readFile = filename => callback =>
  fs.readFile (filename, {encoding: 'utf8'}, callback);

const readFileP = fileName => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, {encoding: 'utf8'}, (err, data) => {
      if (err) {
        return reject(err)
      }

      resolve(data)
    })
  })
}

const main = () => {
  const path = commonJoin (process.argv[2]);

  Promise.resolve ('testFiles.txt')
  .then (path)
  .then (readFileP)
  .then (S.lines)
  .then (S.map (path))
  // .then (paths => S.map (readFileP) (paths)) // doesn't work
  .then ( data => {

    const pall = data.map(readFileP)

    console.log("data:", data)
    console.log("data:", pall)

    return pall
  })
  .then (Promise.all.bind(Promise))
  .then (S.joinWith (''))
  .then (exit0)
  .catch (error => {
    console.log("error:", error)

    exit1(error)
  })



};

main()
