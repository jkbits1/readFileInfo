const fs    = require('fs')
const path  = require ('path');

const bluebird = require('bluebird')

// const S     = require('sanctuary')
const {create, env} = require ('sanctuary');
const $ = require ('sanctuary-def');

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

const exit0 = require ('./exit0');
const exit1 = require ('./exit1');
const { PositiveInteger } = require('sanctuary-def');

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

const readFile2 = (filename, callback) =>
  fs.readFile (filename, {encoding: 'utf8'}, callback);

const readFileP2 = bluebird.promisify(readFile2)


const getFile = fileName => {
  return readFileP(fileName).then(data => data)
}
  
const main = () => {
  const path = commonJoin (process.argv[2]);

  // co routine example
  // http://bluebirdjs.com/docs/api/promise.coroutine.html
  // 
  // similar to this Go-style example
  // https://github.com/jlongster/js-csp

  // const ping = bluebird.coroutine(function* (val) {
  //   console.log("Ping:", val)
  //   yield bluebird.delay(1000)
  //   pong(val+1)
  // })

  // const pong = bluebird.coroutine(function* (val) {
  //   console.log("Pong:", val)
  //   yield bluebird.delay(1000)
  //   ping(val + 1)
  // })

  // ping(0)

  const coData = bluebird.coroutine(function *(){
    // NOTE: a failure here causes an unhandled rejection error for the later 
    //       await calls
    const data = yield readFileP2 (path('testFiles.txtx'))

    console.log("co data:", data)
    console.log()

    const filePromises = S.pipe ([
      S.lines
    , S.map (path)
    , S.map (readFileP)
    // , yield Promise.all.bind(Promise)
    ])
    (data)

    const results = yield bluebird.all(filePromises)

    return S.joinWith ('') (results)
  })

  coData()
  // .then (exit0, exit1)
  .then (exit0)
  // (data => {
  //   console.log(`wr data: ${data}`)
  //   console.log()
  // })
  .catch(exit1)

  // const m = most.fromPromise (Promise.resolve('testFiles.txt'))

  // console.log(`final: ${final}`)
  // console.log()
  // console.log(`m: ${m}`)
  // console.log()

  // const m2 = m.map(path).map(fileName => most.fromPromise(readFileP (fileName)))

  // m2.observe (data => {
  //   console.log(`data: ${data}`)
  //   console.log()
  // })

  // const mf = most.fromPromise(readFileP('testFiles.txt'))
  //   .map(S.lines)
  //   .map(S.map (path))
  //   // .map(S.map (readFileP)) // this works, too
  //   .map(data => {
  //     const pall = data.map(readFileP)
  //     // const pall = most.from(data).map(s => {
  //     //   const p1 = (readFileP(s))

  //     //   return p1
  //     // })

  //     // pall.awaitPromises()
  //     // // const pall2 = most.awaitPromises(pall)

  //     return pall

  //     // pall.observe (data => {
  //     //   // data.awaitPromises()
    
  //     //   console.log(`data: ${data}`)
  //     //   console.log()
  //     // })
  //   })
  //   .map(Promise.all.bind(Promise))
  //   .awaitPromises()
  //   // .recoverWith(e => {
  //   //   return "failed"
  //   // })
  //   .map(S.joinWith (''))

  // // unfold

  //   // mf1a.observe (data => {
  //   .reduce ((prev, data) => {
  //     console.log(`data: ${data}`)
  //     console.log()

  //     return data + prev
  //   }, '')
  //   .then (exit0, exit1)


};

main()
