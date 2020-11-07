const fs    = require('fs')
const path  = require ('path');
const righto = require('righto');
const async = require('righto')

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

  // non-working example from righto readme
  // const initialFileRighto = righto (fs.readFile, 'utf8', path('testFiles.txt'))

  const initialFileRighto = righto (fs.readFile, path('testFiles.txt'), {encoding: 'utf8'})

  // arrayOfFileRightos :: String -> Array Righto
  const arrayOfFileRightos = S.pipe ([
      S.lines
    , S.map (path)
    , S.map (fileName => righto (readFileAsync, fileName))
  ]) 

  // righto.sync is equivalent to S.pipe for rightos and normal synchronous fns
  const fileRightos = righto.sync (arrayOfFileRightos, initialFileRighto)

  const finalResultsRighto = righto.sync (S.joinWith (''), righto.all(fileRightos))

  finalResultsRighto((err, result) => {
    if (err) {
      exit1(err)
    }

    console.log("result:", result)

    exit0(result)
  })
};

main()
