const fs = require('fs')
const path          = require ('path');

// const Rx = require('rxjs')
// const {Observable} = require('rxjs')
const { from } = require('rxjs')

// const S = require('sanctuary')
// const {sanctuary} = require('sanctuary')

const $ = require ('sanctuary-def');
const {create, env: Senv, concat} = require ('sanctuary');
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

  const logFut = caption => resolveValue => {
    console.log (`${caption}: ${resolveValue}`)
  }

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

  // const dir1c = S.pipe ([
  //   readDirF                    // :: Future Error (Array String)
  // , S.map (S.filter (S.test (/\.js/)))
  //                               // :: Future Error (Array String)
  // , S.chain (S.traverse (Future.Future) (readFileF))
  //                               // :: Future Error (Array String)
  // ]) 
  // ('.')

  // use standard JS concat on two files
  // Sanctuary - S.lift2
  const dir1c = S.lift2 (concat) (readFileF ('foo.txt')) (readFileF ('bar.txt'))

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

  // use standard JS concat on two files
  // Future ap ... ap
  const dir1d = 
    Future.ap (readFileF ('bar.txt'))
      (Future.ap (readFileF ('foo.txt')) (S.of (Future.Future) (concat)))
 
  // use standard JS concat on two files
  // Future map ... ap
  const dir1e = 
    Future.ap (readFileF ('bar.txt'))
      (Future.map (concat) (readFileF ('foo.txt')))
 
  // Future.fork (logFut ('rej')) (logFut ('res')) (dir1e)

  const p1 = Future.promise (dir1e)

  console.log ("p1:", p1)
  console.log ()

  const go1 = Future.go (function *(){
    const fileInfo = yield readFileF (path('testFiles.txt'))
                                  // :: String

    console.log ("fileInfo:", fileInfo)
    console.log ()

    const fileNames = S.pipe ([
      S.lines
    , S.map (path)
    ]) 
    (fileInfo)

      // ,                          // :: Future Error String   
  // , Future.map (S.lines)              // :: Future Error (Array String)
  // , Future.map (S.map (path))         // :: Future Error (Array String)

    return fileNames
                                
  // // 
  // // also works
  // // , S.map (S.map (path))
  // // 
  // // doesn't work - for Future.map, Array doesn't seem to be a Functor
  // // , Future.map (Future.map (path))
  
  // , Future.map (S.map (readFileF))    // :: Future Error (Array (Future Error String))
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
  // , S.chain (Future.parallel (5))         // :: Future Error (Array String)

  // , Future.map (S.joinWith (''))          // :: Future Error String
  // , 

  })

  Future.fork (logFut ('rej')) (logFut ('res')) (go1)

  const pgo1 = Future.promise (go1)

  // aync await with futures

  // rxjs

  // return x
  // return p1
  return pgo1
  // return x3
}


const main = async () => {

  // const logFut = caption => resolveValue => {
  //   console.log (`${caption}: ${resolveValue}`)
  // }

  // await is only needed if we return a promise (created from a future)
  const cf = await concatFiles (commonJoin (process.argv[2]))

  console.log ("cf:", cf)
  console.log ()

  // Future.fork (exit1) (exit0) (cf)
  
  // this works
  // cf.pipe (Future.fork (exit1) (exit0));

  // this works
  // const pp1a = await Future.promise (cf).then (exit0, exit1)

  // this works
  // const result = from(Future.promise (cf));

// result.subscribe(x => console.log(x), e => console.error(e));
  // result.subscribe(exit0, exit1);

// console.log('pp1a: ', pp1a)

};

main()
