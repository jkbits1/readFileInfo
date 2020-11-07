const fs    = require('fs');
const { resolve } = require('path');
const path  = require ('path');
const { reject } = require('sanctuary');

// const S     = require('sanctuary')
const {create, env} = require ('sanctuary');
const $ = require ('sanctuary-def');

const exit0 = require ('./exit0');
const exit1 = require ('./exit1');
// const join          = require ('./common/join');

// (x => Object.prototype.toString.call (x) === '[object Promise]')

//    PromiseType :: Type -> Type -> Type
const PromiseType = $.BinaryType
  ('my-package/Promise')
  ('https://example.com/my-package#Promise')
  ([])
  (x => Object.prototype.toString.call (x) === '[object Promise]')
  (p => [])
  (p => []);

const S = create ({
  checkTypes: true,
  env: env.concat ([PromiseType ($.Unknown) ($.Unknown)]),
});

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

// then :: (a -> (b | Promise e b)) -> Promise e a -> Promise e b
const then = f => p => p.then (f)

const main = () => {
  const path = commonJoin (process.argv[2]);

  const p = 
    S.pipe ([
        path
      , readFileP
      , then (S.lines)
      , then (S.map (path))
      , then (S.map (readFileP)) 
      , then (Promise.all.bind(Promise))
      , then (S.joinWith (''))
    ])
    ('testFiles.txt')

  console.log(`p: ${S.show (p)}`)
  console.log()

  p.then (exit0, exit1)
};

main()
