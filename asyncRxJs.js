const fs = require('fs')
const path          = require ('path');

// const Rx = require('rxjs')
// const {Observable} = require('rxjs')
const { from, concat, bindNodeCallback, of, merge, toPromise } = require('rxjs')
const { concatAll, flatMap, map, mergeAll, reduce } = require('rxjs/operators')

// const S = require('sanctuary')
// const {sanctuary} = require('sanctuary')

const $ = require ('sanctuary-def');
const {create, env: Senv} = require ('sanctuary');
const {env, FutureType} = require ('fluture-sanctuary-types');
// const {resolve} = require ('fluture');
const Future = require('fluture')

// const {env as flutureEnv} = require('fluture-sanctuary-types')
// const S = sanctuary.create ({checkTypes: true, env: S.env.concat (flutureEnv)})
 
const S = create ({checkTypes: true, env: Senv.concat (env)});


const exit0         = require ('./exit0');
const exit1         = require ('./exit1');
const { await } = require('most');
// const join          = require ('./common/join');


//  join :: String -> String -> String
const commonJoin = S.curry2 (path.join);

//    readFile :: String -> Future Error String
const readFileF = 
  // S.flip (Future.encaseN2 (fs.readFile)) ({encoding: 'utf8'});
  // Future.node (done => { fs.readFile (file, 'utf8', done) })
  file => Future.node (done => { fs.readFile (file, 'utf8', done) })
  // file => Future.node (done => done (null, 42))

//    readFilePar :: String -> ConcurrentFuture Error String
const readFilePar = S.compose (Future.Par) (readFileF);

// readDirF :: String -> Future Error (Array String)
const readDirF = path => Future.node (done => { fs.readdir (path, done)})


//    concatFiles :: (String -> String) -> Future Error String
const concatFiles = async path => {

  // const xx = readFileF (path ('testFiles.txt'))

  // const x1 = 
  //   S.pipe ([
  //     path,           // :: String
  //   readFileF,               // :: Future Error String   
  //   S.map (S.lines),         // :: Future Error (Array String)
  //   ]) ('testFiles.txt')

    // const s1 = S.is (FutureType ($.String) ($.Number)) (x1);
    // const s = S.is (FutureType ($.String) ($.Number)) (Future.resolve (42));

    Future.debugMode (true)
    
    const x = S.pipe ([
          // xx,                        // :: Future Error String
          path                          // :: String
        , readFileF                     // :: Future Error String   
        , S.map (S.lines),              // :: Future Error (Array String)
          //  S.map (S.map (path)),     // :: Future Error (Array String)
          //  S.map (S.traverse (Future.Par) (readFilePar)),   
          //  // :: Future Error (ConcurrentFuture Error (Array String))
          //  S.chain (Future.seq),     // :: Future Error (Array String)
          //  S.map (S.joinWith (''))   // :: Future Error String
        ])
        // (xx)
         ('testFiles.txt');

  // console.log(`done: ${S.show (x)}`)
  console.log()

  const x1 = S.pipe ([
    path                              // :: String
  , readFileF                         // :: Future Error String   
  , Future.map (S.lines)              // :: Future Error (Array String)

  , Future.map (S.map (path))         // :: Future Error (Array String)
  // 
  // also works
  // , S.map (S.map (path))
  // 
  // doesn't work - for Future.map, Array doesn't seem to be a Functor
  // , Future.map (Future.map (path))
  
  , Future.map (S.map (readFileF))    // :: Future Error (Array (Future Error String))
  //  
  // 1) use map() then Sanctuary join to flatten this structure
  // 
  // , Future.map (Future.parallel (5))   // :: Future Error (Future Error (Array String))
  // , S.join                             // :: Future Error (Array String)
  // 
  // 2) translates to:
  // 
  // , Future.chain (Future.parallel (5)) // :: Future Error (Array String)
  // 
  // 3) alternatively: 
  // 
  , S.chain (Future.parallel (5))         // :: Future Error (Array String)

  , Future.map (S.joinWith (''))          // :: Future Error String
  , 
  ])
   ('testFiles.txt');

  // F parallel :: PositiveInteger -> Array (Future c b) -> Future c (Array b)
  // 
  // c :: Error
  // 
  // F parallel :: PositiveInteger -> Array (Future Error String) -> Future Error (Array String)

  // F/S  chain :: Chain m => (a -> m b) -> m a -> m b

  // a -> m b :: Array (Future Error String) -> Future Error (Array String)

  // m a      :: Future Error (Array (Future Error String))

  // m b      :: Future Error (Array String)

  // a        :: Array (Future Error String)

  // b        :: Array String

  // console.log(`done x1: ${S.show (x1)}`)
  // console.log()


  // Future.fork (logFut ('rej')) (logFut ('res')) (x1)


  const x2 = S.pipe ([
    // xx,                        // :: Future Error String
    path                          // :: String
  , readFileF                     // :: Future Error String   
  , S.map (S.lines)               // :: Future Error (Array String)
  , S.map (S.map (path))          // :: Future Error (Array String)
  , S.map (S.traverse (Future.Par) (readFilePar)) 
                                  // :: Future Error (ConcurrentFuture Error (Array String))
  // 
  // , S.map (Future.seq)             // :: Future Error (Future Error (Array String))
  // , S.join                         // :: Future Error (Array String)
  // 
  // translates to:
  // 
  , S.chain (Future.seq)          // :: Future Error (Array String)
  , S.map (S.joinWith (''))
  ])
  ('testFiles.txt');

  // readFilePar :: String -> ConcurrentFuture Error String

  // traverse :: (Applicative f, Traversable t) => TypeRep f -> (a -> f b) -> t a -> f (t b)

  // TypeRep f :: Par 

  // (a -> f b) :: String -> ConcurrentFuture Error String

  // t a        :: Array String

  // a          :: String

  // t          :: Array

  // f b        :: ConcurrentFuture Error String

  // f          :: ConcurrentFuture Error
  
  // b          :: String

  // t b        :: Array String

  // f (t b)    :: ConcurrentFuture Error (Array String)

  // console.log(`done x2: ${S.show (x2)}`)
  // console.log()

  // Future.fork (logFut ('rej')) (logFut ('res')) (x2)

  const x3 = S.pipe ([
    path                          // :: String
  , readFileF                     // :: Future Error String   
  , S.map (S.lines)               // :: Future Error (Array String)
  , S.map (S.map (path))          // :: Future Error (Array String)
  , S.map (S.map (readFileF))     
                        // :: Future Error (Array (Future Error String))
  
  // , S.map (Future.parallel (5))   
  //                    // :: Future Error (Future Error (Array String))
  // , S.join           // :: Future Error (Array String)
  // 
  // translates to:
  // 
  , S.chain (Future.parallel (5)) // :: Future Error (Array String)

  , S.map (S.joinWith (''))       // :: Future Error String
  ])
  ('testFiles.txt');

  // console.log(`done x3: ${S.show (x3)}`)
  // console.log()

  // Future.fork (logFut ('rej')) (logFut ('res')) (x3)

  // get first item of folder listing
  const dir1 = S.pipe ([
    readDirF                  // :: Future Error (Array String)
  , S.map (S.head)            // :: Future Error (Maybe String)

  , S.map (S.fromMaybe (''))  // :: Future Error String
  ]) 
  ('.')

  // console.log(`done dir1: ${S.show (dir1)}`)
  // console.log()

  // readFirstFile :: Array String -> Future Error String
  const readFirstFile = S.compose (readFileF) (S.head)

  // show contents of first item of folder listing
  const dir1a = S.pipe ([
    readDirF                    // :: Future Error (Array String)
  , S.map (S.filter (S.test (/\.js/)))
                                // :: Future Error (Array String)
  , S.map (S.head)              // :: Future Error (Maybe String)
  , S.map (S.fromMaybe (''))    // :: Future Error String
  , S.chain (readFileF)         // :: Future Error String
  ]) 
  ('.')


    // traverse :: (Applicative f, Traversable t) => TypeRep f -> (a -> f b) -> t a -> f (t b)

  // show merged listings of all js files in folder listing
  const dir1b = S.pipe ([
    readDirF                    // :: Future Error (Array String)
  , S.map (S.filter (S.test (/\.js/)))
                                // :: Future Error (Array String)
  , S.chain (S.traverse (Future.Future) (readFileF))
                                // :: Future Error (Array String)
  ]) 
  ('.')
  
  // use standard JS concat on two files
  // Sanctuary - S.lift2
  const dir1c = S.lift2 (S.concat) (readFileF ('foo.txt')) (readFileF ('bar.txt'))

  // dir1c - liftA2
  // S.lift2 (f)

  // S.of (Future.Future) (f)    Future.ap ...
  // also, map and ap 
  // 
  // as mentioned here for Sanctuary:
  // https://github.com/sanctuary-js/sanctuary-type-classes/tree/v12.1.0#lift2--applyf--a-b-cfafb---fc
  // 
  // and here for Haskell
  // http://learnyouahaskell.com/functors-applicative-functors-and-monoids

  // use Sanctuary concat on two files
  // Future ap ... ap
  const dir1d = 
    Future.ap (readFileF ('bar.txt'))
      (Future.ap (readFileF ('foo.txt')) (S.of (Future.Future) (S.concat)))
 
  // use Sanctuary concat on two files
  // Future map ... ap
  const dir1e = 
    Future.ap (readFileF ('bar.txt'))
      (Future.map (S.concat) (readFileF ('foo.txt')))
 
  // Future.fork (logFut ('rej')) (logFut ('res')) (dir1e)

  // 
  // aync/await style-coding on a single future - await is used later on returned value from Future.promise
  // 
  // const p1 = Future.promise (dir1e)

  // console.log ("p1:", p1)
  // console.log ()

  // 
  // aync/await style-coding with multiple futures - using coroutines/generator function
  // 
  // also, similar to Haskell do-notation
  // 
  const go1 = Future.go (function* () {
    // similar to Haskell do-notation "<-"
    const fileInfo = yield readFileF (path('testFiles.txt'))
                                  // :: String

    console.log ("fileInfo:", fileInfo)
    console.log ()

    // similar to Haskell do-notation "<-"
    const fileNames = yield S.pipe ([
      S.lines                   // Array String
    , S.map (path)              // Array String
    , S.map (readFileF)         // Array (Future Error String)

    // , Future.parallel (5) // this works
    // 
    // or
    // 
    , S.sequence (Future.Par)   // Future Error (Array String)

    , S.map (S.joinWith (''))   // Future Error String
    ]) 
    (fileInfo)

    // similar to Haskell do-notation "return" 
    return fileNames
  })

  // Future.fork (logFut ('rej')) (logFut ('res')) (go1)

  // const pgo1 = Future.promise (go1)

  const go2 = Future.go (function* () {
    const dirListing = yield readDirF('.')  // Array String

    const firstJsFileName = 
      S.pipe ([
        S.filter (S.test (/\.js/))  // Array String
      , (S.head)                    // Maybe String 
      , S.fromMaybe ('')            // String
      ])
      (dirListing)
    
    // NOTE: as in Haskell do-notation, yield equates to "<-"
    //       while return is the same as Haskell do-notation
    //       return. So, as with Haskell, it is unnecessary 
    //       and inefficient to do both if there is no 
    //       intermediate work done between the yield and return.
    // 
    //       They are done here simply to emphasise the different 
    //       patterns of the two styles.
    // 
    // NOTE: The comparison isn't exact. In JS, there is always
    //       a return, whether explicit or not. In Haskell, 
    //       the return is only used when needed to put a 
    //       pure value into the context of the monad.
    const firstJsFileContents = yield readFileF (firstJsFileName)

    return firstJsFileContents
  })
  
  // Future.fork (logFut ('rej')) (logFut ('res')) (go2)

  // const pgo2 = Future.promise (go2)

  const go3 = Future.go (function* () {
    // NOTE: as in comments in go function above, this yield and 
    //       following Future.resolve/S.of are redundant. They merely
    //       illustrate what is happening in the various steps
    // 
    const concatMap = yield Future.map (S.concat) (readFileF ('foo.txt'))
                          // before yield :: Future Error (String -> String)
                          // after  yield :: String -> String

    const x = concatMap ('z')    // :: String

    console.log ('concatMap:', x)

    // map :: Functor m => (a -> b) -> m a -> m b

    // a :: String
    
    // b :: String -> String

    // m a :: Future Error String

    // m b :: Future Error (String -> String)

    // both versions work

    // const futureConcatMap = Future.resolve(concatMap)   // :: Future Error (String -> String)
    // 
    const futureConcatMap = S.of (Future) (concatMap)     // :: Future Error (String -> String)

    const result = yield Future.ap (readFileF ('bar.txt')) (futureConcatMap)  // String
    
    return result   // Future Error String
  })

  // Future.fork (logFut ('rej')) (logFut ('res')) (go3)

  const pgo3 = Future.promise (go3)

  // :: Future Error (String -> String)
  const concatFnFuture = Future.map (S.concat) (readFileF ('foo.txt'))

  // :: Future Error (Future Error (String -> String))
  const concatFnFuture2 = Future.go (function* () {
    return Future.map (S.concat) (readFileF ('foo.txt'))
  })

  // :: Future Error (String -> String)
  const concatFnFuture2a = S.join (concatFnFuture2)   

  // :: Future Error (String -> String)
  const concatFnFuture3 = Future.go (function* () {
    const fn = yield Future.map (S.concat) (readFileF ('foo.txt'))    
                    // String -> String

    return fn       // Future Error (String -> String)
  })

  // Future Error String
  const concatAnswer1 = S.map (f => f ('x')) 
  (
    // concatFnFuture
    concatFnFuture2a    // Future Error (String -> String)
    // concatFnFuture3
  )

  // Future Error String
  const concatAnswer1a = Future.map (f => f ('x')) 
  (concatFnFuture)      // Future Error (String -> String)

  // Future Error String
  const concatAnswer2 = 
  // S.pipe ([
  // S.map (...)
  // , S.join
  // ])
  // 
  // translates to:
  // 
  S.chain (    // map over outer Future  
      S.map (  // map over inner Future  
        f => f ('x')
      )
    )   
  (
    concatFnFuture2   // Future Error (Future Error (String -> String))
  )

  // Future.fork (logFut ('rej')) (logFut ('res')) (concatAnswer1)
  // Future.fork (logFut ('rej')) (logFut ('res')) (concatAnswer1a)

  const logFut = caption => resolveValue => {
    console.log (`${caption}: ${resolveValue}`)
  }

  // handles a nested Future, e.g. Future Error (Future Error (String -> String))
  const logFut2 = caption => resolveValue => {
    console.log (`${caption}: ${resolveValue}`)

    Future.fork (logFut ('rej')) (logFut ('res')) (resolveValue)
  }

  // Future.fork (logFut ('rej')) (logFut2 ('res')) (concatAnswer2)
  // Future.fork (logFut ('rej')) (logFut ('res')) (concatAnswer2)

  const concatAnswer3 = 
    // ap :: Apply m => m a -> m (a -> b) -> m b
    Future.ap 
      (readFileF ('bar.txt'))     //  Future Error String
      (
        // concatFnFuture         //  Future Error (String -> String)
        concatFnFuture3
      )            

  Future.fork (logFut ('rej')) (logFut ('res')) (concatAnswer3)

  
    // ap as coroutine

  // 
  // await is used later on value returned by Future.promise
  // 

  // rxjs

  const readFileAsObservable = bindNodeCallback(fs.readFile);

  // :: Observable String
  const result = readFileAsObservable('testFiles.txt', 'utf8');

  const readFileUtf8 = fileName => readFileAsObservable (fileName, 'utf8')

  // const m = map (
  //   // NOTE: map provides 2 args, so need this simple function
  //   s => S.lines (s)
  // ) (result)

  // const mP = await m.toPromise()

  // const info1 = of('foo.txt\nbar.txt')     // Observable String
  const fileName = of('testFiles.txt')        // Observable String

  // info1.subscribe (x => {
  //   console.log(x)                          // Observable String
  // }, e => console.error(e));

  // NOTES: Approx equivalents to Sanctuary
  // 
  //          flatMap is S.chain
  // 
  //          RxJs:           x.pipe (map (...), concatAll())
  //          equivalent of:  x.pipe (flatMap (...))
  // 
  //          Sanctuary:      S.pipe ([S.map (...), S.join])
  //          equivalent of:  S.pipe ([S.chain (...)])

  // const infoLines = info1.pipe (
  const infoLines = fileName.pipe (
    map (fileName => path (fileName))

  //   map (fileName => readFileUtf8 (fileName))  // Observable (Observable String)
  // , concatAll()                                // Observable String
  // 
  // translates to:
  // 
  , flatMap (fileName => readFileUtf8 (fileName)) // Observable String
  , map (s => {
      return s
    })

  , map (s => S.lines (s))                         // Observable (Array String)
  , map (lines => S.map (path) (lines))            // Observable (Array String)
  , 
    // map          // Observable (Array (Observable String)) (one array item per file)
    flatMap         // Observable ((Observable String))       (outer obs sends one obs per file)
    (paths => {
      return S.map (readFileUtf8) (paths)       // map      - Observable (Array (Observable String))
                                                // flatmap  - Observable ((Observable String))
    })
  , map (s => {
      return s                                  // map      - Observable (Array (Observable String))
                                                // flatmap  - Observable ((Observable String))
    })

  // , map (s => {
  //     // return concat (s[0], s[1])   
  //     // return concat (s)   
  //   })

  // , concatAll()                              // map      - Observable ((Observable String))

  // merge is parallel operation
  , mergeAll()                                  // map      - Observable ((Observable String))
                                                // flatmap  - Observable String
  , map (s => {
    return s                                    // map      - Observable ((Observable String))
                                                // flatmap  - Observable String
  })

  , reduce ((prev, val) => S.concat (prev) (val), '')

  // , concatAll()                                 // map - Observable String
  //                                               // flatmap  - n/a
  // , map (s => {
  //   return s                                    // map - Observable String
  //                                               // flatmap  - n/a
  // })
)

  infoLines.subscribe (x => {
    console.log(x)

  if (x.subscribe) {
    x.subscribe(x => {
      console.log(x)
    }, e => console.error(e));
  }
  else if (Array.isArray(x)) {
    x.forEach(obs => obs.subscribe(x => {
        
      console.log(x)
      }, e => console.error(e))
    )
  }
  else {
    exit0(x)
  }

  }, e => {
    console.error(e)
    exit1(e)
  });


  // const lines = result.pipe (S.lines)
  const lines = result.pipe (
    map (s => {
      console.log("pre-lines", s)
      console.log()

      return S.lines (s)
    })
  , map (lines => {
      return S.map (path) (lines)
    })
  , map (paths => {
      return S.map (readFileUtf8) (paths)
    })
  // , mergeAll()
  , concatAll()
  )
  
  // result.subscribe(x => console.log(x), e => console.error(e));
  lines.subscribe(x => {
    console.log(x)

    x.subscribe(x => {
      console.log(x)
    }, e => console.error(e));

  }, e => console.error(e));

  // const rxP = await result.toPromise();
  // const rxP = await lines.toPromise();

  // console.log ("rxp:", rxP)
  // console.log ()

  console.log ("lines:", lines)
  console.log ()

  // return x
  // return p1
  // return pgo1
  // return pgo2
  return pgo3
  // return x3
}


const main = async () => {

  // const logFut = caption => resolveValue => {
  //   console.log (`${caption}: ${resolveValue}`)
  // }

  // NOTE: await is only needed if we return a promise (created from a future)
  const cf = await concatFiles (commonJoin (process.argv[2]))

  console.log ("cf:", cf)
  console.log ()

  // Future.fork (exit1) (exit0) (cf)
  
  // this works
  // cf.pipe (Future.fork (exit1) (exit0));

  // this works
  // const pp1a = await Future.promise (cf).then (exit0, exit1)

  // this works - RxJs.from
  // const result = from(Future.promise (cf));

// result.subscribe(x => console.log(x), e => console.error(e));
  // result.subscribe(exit0, exit1);

// console.log('pp1a: ', pp1a)

};

main()
