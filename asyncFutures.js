const fs = require('fs')
const path          = require ('path');

// const Rx = require('rxjs')
// const {Observable} = require('rxjs')
const { from } = require('rxjs')

const Reader = require('crocks/Reader')

const { State, run: runS, chain: chainS, get: getS, put: putS } = require('monastic')

// const S = require('sanctuary')
// const {sanctuary} = require('sanctuary')

const Z = require('sanctuary-type-classes')

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
  
  // use Sanctuary concat on two files
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

  // :: c -> c -> c
  // concat

  // :: Future Error String
  // readFileF ('foo.txt')

  // :: (a -> b) -> m a -> m b
  // map 

  // :: 
  // (Future.map (S.concat) (readFileF ('foo.txt')))

  // a    :: c 
  // b    :: c -> c
  // m    :: Future Error
  // m a  :: Future Error String
  // m b  :: Future Error (String -> String)

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

  // Fluture for effects example:
  // https://gitter.im/sanctuary-js/sanctuary?at=5fc133423afabc22f1598c83

  const saveStateToDiskStd = state => {
    fs.writeFileSync ('stateTest.json', JSON.stringify (state))
    const newSize = fs.statSync ('stateTest.json').size
    return newSize
  }

  const updateStateStd = (state, updater) => {
    const newState = updater (state)
    const newSize = saveStateToDiskStd (newState)

    return {
      state: newState
    , size: newSize
    }
  }

  // file write occurs here
  const updateStateStd1 = updateStateStd (41, x => x + 1)    

  // file write occurs again here
  const updateStateStd1a = updateStateStd (41, x => x + 1)

  console.log (updateStateStd1a)

  //    saveStateToDiskF :: Number -> Future Error Number
  const saveStateToDiskF = state => {

    //    futureFileSize :: Future Error Number
    const futureFileSize = S.pipe ([ 
      state => Future.node (done => fs.writeFile('stateTestF.json', JSON.stringify (state), done))

      // test for failure in first part of Future.and 
      // state => readFileF ('bar1.txt') 
                                                                              // Future Error undefined
    , Future.and (Future.node (done => fs.stat ('stateTestF.json', done)))                       
                                                                              // Future Error Object
    , 
      // Future.map 
      S.map 
        (stats => stats.size)                                                 // Future Error Number
    ])
    (state)

    return futureFileSize
  }

  // updateStateF :: (Number, Fn) -> Future Error Object
  const updateStateF = (state, updater) => { 
    const newState = updater (state)
    // const eventualNewSize = saveStateToDiskF (newState)

    //    futureNewSize :: Future Error Number
    // const futureNewSize = saveStateToDiskF (newState)

    //    futureSizeAndState :: Future Error Object
    const futureSizeAndState = S.pipe ([ 
      saveStateToDiskF                                                        // Future Error Number
      // Future.map 
    , S.map 
        (size => ( {size, state: newState} ))
                                                                              // Future Error Object
    ])
    (
      // eventualNewSize
      // futureNewSize
      newState
    )

    return futureSizeAndState
  }

  // Future.value (console.log) (updateStateF (41, x => x + 1))

  const logFutFile = caption => resolveValue => {
    console.log (`${caption}: ${resolveValue.size ? 'fileSize: ' + resolveValue.size : ''}`)
  }

  // file write does not occur here
  const updateStateF1 = updateStateF (41, x => x + 1)

  // file write does not occur here either
  const updateStateF1a = updateStateF (41, x => x + 1)

  // file write occurs here
  Future.fork (logFutFile ('rej')) (logFutFile ('res')) (updateStateF1a)


  // Sanctuary code snippet for creating Pairs @Avaq
  // https://gitter.im/sanctuary-js/sanctuary?at=5fcbc12ffb7f155587a79874
  // 
  // also, here under R.aperture()
  // https://github.com/sanctuary-js/sanctuary/wiki/Ramda-to-Sanctuary

  const f = S.compose (S.justs) (S.extend (S.take (2)))

  const pairs1 = f ([1, 2, 3, 4])

  console.log (`pairs1: ${S.show (pairs1)}`)

  // S.show (S.extend (S.take (2)) ([1, 2, 3, 4]))
  // '[Just ([1, 2]), Just ([2, 3]), Just ([3, 4]), Nothing]'

  //   S.show (S.justs (S.extend (S.take (2)) ([1, 2, 3, 4])))
  // '[[1, 2], [2, 3], [3, 4]]'

  // NOTE: result shown in gitter doesn't match output here
  const f1 = S.unfoldr (S.lift2 (S.lift2 (S.Pair)) (S.take (2)) (S.drop (2)))

  const pairs2 = f ([1, 2, 3, 4, 5, 6, 7])

  console.log (`pairs2: ${S.show (pairs2)}`)

  
  // unfoldr :: (Number -> Maybe (Pair Number Number)) -> Number -> Array Number

  // NOTE: Apply f :: function
  // lift2a :: Apply f => (f (Maybe a) -> f (Maybe b) -> f (Maybe (Pair a b))) -> 
  //                        f (f (Maybe a)) -> f (f (Maybe b)) -> f (f (Maybe (Pair a b)))

  // lift2a :: Apply f => (a -> b -> c) -> (y -> a) -> (y -> b) -> (b -> Maybe (Pair Number Number))

  // lift2a :: Apply f => (Maybe (Array Number) -> Maybe (Array Number) -> c) -> 
  //                        (Number -> a) -> (Number -> b) -> 
  //                        (b -> Maybe (Pair Number Number))

  // S.take :: Number -> Array a -> Maybe (Array a)

  // a      :: Array Number -> Maybe (Array Number)
  // b      :: Array Number -> Maybe (Array Number)

  // y   :: 

  // f a :: (y -> a)
  // f b :: (y -> b)
  
  // f   :: ((->) y)
  // f c :: (y -> Maybe (Pair a b))
  
  // c   :: Maybe (Pair a b)

  // S.take
  // f a :: Integer -> Array a -> Maybe (Array a)

  // S.drop
  // f b :: Integer -> Array b -> Maybe (Array b)

  // lift2b :: Apply f => (Maybe a -> Maybe b -> Maybe (Pair a b)) -> 
  //                        f (Maybe a) -> f (Maybe b) -> f (Maybe (Pair a b))

  // lift2c :: Apply f => (a -> b -> Pair a b) -> Maybe a -> Maybe b -> Maybe (Pair a b)

  // S.Pair :: a -> b -> Pair a b

  // lift2c (S.Pair) :: Maybe a -> Maybe b -> Maybe (Pair a b)
  
  // take :: (Applicative f, Foldable f, Monoid (f a)) => Integer -> Array a -> Maybe (Array a)
  // drop :: (Applicative f, Foldable f, Monoid (f a)) => Integer -> Array a -> Maybe (Array a)

  const lift2a = S.lift2
  const lift2b = S.lift2
  const lift2c = S.lift2

  const f2 = S.compose (S.unfoldr) 
    (lift2a 
      (lift2b 
        (lift2c (S.Pair))
      ) 
      (S.take)                        // Integer -> Array a -> Maybe (Array a)
      (S.drop)                        // Integer -> Array a -> Maybe (Array a)
    );

//     It's just a heavily church-encoded version of 

  // x => 
    // S.unfoldr 
      // (xs => 
            // S.lift2                // (a -> b -> c) -> f a -> f b -> f c
            //                        // (Array Number -> Array Number -> Pair Number Number) -> 
                                      //     Maybe (Array Number) -> Maybe (Array Number) -> 
                                      //     Maybe (Array Number)
              // (S.Pair)             // a -> b -> Pair a b
              //                      // Array Number -> Array Number -> Pair (Array Number) (Array Number)
              // (S.take (x) (xs))    // Maybe (Array Number)
              // (S.drop (x) (xs)))   // Maybe (Array Number)

// The remaining lift2 in the unencoded version lifts Pair into the context of the Maybe. The Maybes are created by take and drop, and unfoldr happens to want a Maybe of a Pair.

// The other two lift2 calls are just extra layers of "apply-2-way" to get rid of the lambda wrappers.

// S.unfoldr :: (b -> Maybe (Pair a b)) -> b -> Array a

// S.show (S.Pair ([1,2]) ([3, 4]))
// 'Pair ([1, 2]) ([3, 4])'

// S.show (S.take (1) ([3, 4]))
// 'Just ([3])'
// S.show (S.drop (1) ([3, 4])) 
// 'Just ([4])'

  const pairs3 = 
    [
      f2 (2) ([1, 2, 3, 4, 5, 6]),
      f2 (3) ([1, 2, 3, 4, 5, 6])
    ]

  console.log (`pairs3: ${S.show (pairs3)}`)
  // [
  //    [[1, 2], [3, 4], [5, 6]]
  // ,  [[1, 2, 3], [4, 5, 6]]
  // ]

  // S.unfoldr :: (b -> Maybe (Pair a b)) -> b -> Array a
  // S.unfoldr :: (Array Number -> Maybe (Pair (Array Number) (Array Number))) -> Array Number -> Array (Array Number)

  // a :: Array Number
  // b :: Array Number

  //    f3PairPlusListRemainder :: Number -> Array Number -> Maybe (Pair (Array Number) (Array Number))
  const f3PairPlusListRemainder =   
      x => 
      xs => 
            S.lift2                 // (a -> b -> c) -> 
                                    //   f a -> f b -> f c
                                    
                                    // f   :: Maybe
                                    // a,b :: Array Number
                                    // c   :: Pair (Array Number) (Array Number)

                                    // Maybe (Array Number) -> Maybe (Array Number) -> 
                                    //   Maybe (Pair (Array Number) (Array Number))

              (S.Pair)              // a -> b -> Pair a b
                                    // Maybe (Array Number) -> Maybe (Array Number) -> 
                                    //   Pair (Maybe (Array Number)) (Maybe (Array Number))

              (S.take (x) (xs))     // Maybe (Array Number)
              (S.drop (x) (xs))     // Maybe (Array Number)

  // S.show (f3PairPlusListRemainder (2) ([3,4]))     
  // 'Just (Pair ([3, 4]) ([]))'              

  //    f3 :: Number -> Array Number -> Array (Array Number)
  const f3 = 
  // xs =>
  x => 
    S.unfoldr (f3PairPlusListRemainder (x))

  const pairs4 = 
    f3 (2) 
    // f3a ([1, 2, 3, 4, 5, 6])
    //  (2) 
    ([1, 2, 3, 4, 5, 6])
          
  console.log (`pairs4: ${S.show (pairs4)}`)

  console.log ()

  //    f3aPairPlusListRemainder :: Number -> Array Number -> Maybe (Pair (Array Number) (Array Number))
  const f3aPairPlusListRemainder =   
      x => 
      // xs => 
            (S.lift2                // (a -> b -> c) -> f a -> f b -> f c

                                    // (a -> b -> c) :: fn -> fn -> (fn -> Pair)
                                    
                                    // f   :: Array Number -> Maybe 
                                    // a,b :: Array Number
                                    // c   :: Pair (Array Number) (Array Number)

                                    // f a -> f b -> f c :: Array Number -> Maybe (Array Number) -> 
                                    //                      Array Number -> Maybe (Array Number) -> 
                                    //                        Array Number -> Maybe Pair
                                    //                                                (Array Number) 
                                    //                                                (Array Number)

            (S.lift2                // (a -> b -> c) -> f a -> f b -> f c

                                    // (a -> b -> c) :: (fn -> Maybe) -> (fn -> Maybe) -> 
                                    //                    Pair (fn -> Maybe) (fn -> Maybe)

                                    // (a -> b -> c) :: fn -> fn -> Pair fn fn
                                    
                                    // f   :: Array Number -> 
                                    // a,b :: Maybe (Array Number)
                                    // c   :: Pair (Maybe (Array Number)) (Maybe (Array Number))

                                    // f a -> f b -> f c :: Array Number -> Maybe (Array Number) -> 
                                    //                      Array Number -> Maybe (Array Number) -> 
                                    //                        Array Number -> 
                                    //                           Pair (Maybe (Array Number)) 
                                    //                                (Maybe (Array Number))

              (S.Pair)))            // a -> b -> Pair a b

                                    // (Array Number -> Maybe (Array Number)) -> 
                                    // (Array Number -> Maybe (Array Number)) -> 
                                    //    Pair 
                                    //      (Array Number -> Maybe (Array Number)) 
                                    //      (Array Number -> Maybe (Array Number))
                                    // or
                                    // 
                                    // (fn -> Maybe) -> (fn -> Maybe) -> 
                                    //   Pair (fn -> Maybe) (fn -> Maybe)
                                    
              (S.take (x))          // Array Number -> Maybe (Array Number)
              (S.drop (x))          // Array Number -> Maybe (Array Number)

  // S.show (f3aPairPlusListRemainder (2) ([3,4]))   
  // 'Just (Pair ([3, 4]) ([]))'

  //    f3bPairPlusListRemainder :: Number -> Array Number -> Maybe (Pair (Array Number) (Array Number))
  const f3bPairPlusListRemainder =   
      // x => 
      // xs => 

          // (S.lift2 (as an example, not used - after this, no more lifts are possible)
          // 
                                    // NOTE: a fourth lift would create this:

                                    // (a -> b -> c) :: fn -> fn -> fn -> Maybe Pair
                                    
                                    // f   :: Number -> Array Number -> Maybe Array 
                                    // a,b :: Number
                                    // c   :: Maybe Array (Pair Number Number)

                                    // f a -> f b -> f c :: Number -> Array Number -> Maybe (Array Number) -> 
                                    //                      Number -> Array Number -> Maybe (Array Number) -> 
                                    //                        Number -> Array Number -> Maybe Array
                                    //                           Pair Number Number

                                    // S.show (((S.lift2 (S.lift2 (S.lift2 ((S.lift2 (S.Pair)))))) 
                                    //            (S.take) (S.take) ) (2) ([1,2]) )  
                                    // 'Just ([Pair (1) (1), Pair (1) (2), Pair (2) (1), Pair (2) (2)])'

            (S.lift2                // (a -> b -> c) -> f a -> f b -> f c

                                    // (a -> b -> c) :: fn -> fn -> fn -> Pair Maybe Maybe
                                    
                                    // f   :: Number -> Array Number -> Maybe
                                    // a,b :: Array Number
                                    // c   :: Maybe Pair Array Number
                                    //                   Array Number

                                    // f a -> f b -> f c :: Number -> Array Number -> Maybe (Array Number) -> 
                                    //                      Number -> Array Number -> Maybe (Array Number) -> 
                                    //                        Number -> Array Number -> Maybe
                                    //                           Pair Array Number
                                    //                                Array Number

                                    // S.show (((S.lift2 (S.lift2 ((S.lift2 (S.Pair))))) 
                                    //            (S.take) (S.take) ) (2) ([1,2]) ) 
                                    // 'Just (Pair ([1, 2]) ([1, 2]))'

            (S.lift2                // (a -> b -> c) -> f a -> f b -> f c
            
                                    // (a -> b -> c) :: fn -> fn -> (fn -> Pair fn fn)
                                    
                                    // f   :: Number -> Array Number ->  
                                    // a,b :: Maybe (Array Number)
                                    // c   :: Pair Maybe (Array Number)
                                    //             Maybe (Array Number)

                                    // f a -> f b -> f c :: Number -> Array Number -> Maybe (Array Number) -> 
                                    //                      Number -> Array Number -> Maybe (Array Number) -> 
                                    //                        Number -> Array Number -> 
                                    //                           Pair Maybe (Array Number)
                                    //                                Maybe (Array Number)

                                    // S.show (((S.lift2 ((S.lift2 (S.Pair)))) 
                                    //            (S.take) (S.take) (2) ([1,2])))  
                                    // 'Pair (Just ([1, 2])) (Just ([1, 2]))'

            (S.lift2                // (a -> b -> c) -> f a -> f b -> f c

                                    // (a -> b -> c) :: fn -> fn -> Pair fn fn
                                    
                                    // f   :: Number ->  
                                    // a,b :: Array Number -> Maybe (Array Number)
                                    // c   :: Pair (Array Number -> Maybe (Array Number)) 
                                    //             (Array Number -> Maybe (Array Number))

                                    // f a -> f b -> f c :: Number -> Array Number -> Maybe (Array Number) -> 
                                    //                      Number -> Array Number -> Maybe (Array Number) -> 
                                    //                        Number -> 
                                    //                           Pair (Array Number -> Maybe (Array Number)) 
                                    //                                (Array Number -> Maybe (Array Number))


              (S.Pair))))           // a -> b -> Pair a b

                                    // (Number -> Array Number -> Maybe (Array Number)) -> 
                                    // (Number -> Array Number -> Maybe (Array Number)) -> 
                                    //    Pair 
                                    //      (Number -> Array Number -> Maybe (Array Number)) 
                                    //      (Number -> Array Number -> Maybe (Array Number))

              (S.take)              // Number -> Array Number -> Maybe (Array Number)
              (S.drop)              // Number -> Array Number -> Maybe (Array Number)

  // S.show (f3bPairPlusListRemainder (2) ([3,4]))   
  // 'Just (Pair ([3, 4]) ([]))'

  console.log()

  //    liftTest :: Number -> Array Number -> Maybe (Array Number)
  const liftTest =   
      x => 
      xs => 
            S.lift2                 // (a -> b -> c) -> 
                                    //   f a -> f b -> f c
                                    
                                    // f   :: Maybe
                                    // a,b :: Array Number
                                    // c   :: Array Number

                                    // Maybe (Array Number) -> Maybe (Array Number) -> 
                                    //   Maybe (Array Number)

              (S.K)                 // a -> b -> a
                                    // Maybe (Array Number) -> Maybe (Array Number) -> Maybe (Array Number)

              (S.take (x) (xs))     // Maybe (Array Number)
              (S.take (x) (xs))     // Maybe (Array Number)

  console.log()

  // S.show (liftTest (2) ([3,4]))   
  // 'Just ([3, 4])'

  //    liftTest2 :: Number -> Array Number -> Maybe (Array Number)
  const liftTest2 =   
      x => 
      // xs => 
            (S.lift2
                                    // (a -> b -> c) :: fn -> fn -> fn

                                    // f   :: Maybe ->
                                    // a,b :: Array Number
                                    // c   :: Array Number

                                    // Maybe (Array Number) -> 
                                    // Maybe (Array Number) -> 
                                    //   Maybe (Array Number)

            (S.lift2                // (a -> b -> c) -> 
                                    //   f a -> f b -> f c

                                    // (a -> b -> c) :: fn -> fn -> fn
                                    
                                    // f   :: Array Number ->
                                    // a,b :: Maybe (Array Number)
                                    // c   :: Maybe (Array Number)

                                    // Array Number -> Maybe (Array Number) -> 
                                    // Array Number -> Maybe (Array Number) -> 
                                    //   Array Number -> Maybe (Array Number)

              (S.K)))               // a -> b -> a
                                    // Array Number -> Maybe (Array Number) -> 
                                    // Array Number -> Maybe (Array Number) -> 
                                    //   Array Number -> Maybe (Array Number)

              (S.take (x))          // Array Number -> Maybe (Array Number)
              (S.take (x))          // Array Number -> Maybe (Array Number)

  console.log()

  // S.show (liftTest2 (2) ([3,4]))   
  // 'Just ([3, 4])'

  //    liftTest3 :: Number -> Array Number -> Maybe (Array Number)
  const liftTest3 =   
      // x => 
      // xs => 
            // (S.lift2
            (S.lift2
                                    // (a -> b -> c) :: fn -> fn -> fn

                                    // f   :: Maybe ->
                                    // a,b :: Array Number
                                    // c   :: Array Number

                                    // Maybe (Array Number) -> 
                                    // Maybe (Array Number) -> 
                                    //   Maybe (Array Number)

            (S.lift2                // (a -> b -> c) -> 
                                    //   f a -> f b -> f c

                                    // (a -> b -> c) :: fn -> fn -> fn
                                    
                                    // f   :: Array Number ->
                                    // a,b :: Maybe (Array Number)
                                    // c   :: Maybe (Array Number)

                                    // Array Number -> Maybe (Array Number) -> 
                                    // Array Number -> Maybe (Array Number) -> 
                                    //   Array Number -> Maybe (Array Number)

              (S.Pair))
              )
              // )              // a -> b -> a
                                    // Array Number -> Maybe (Array Number) -> 
                                    // Array Number -> Maybe (Array Number) -> 
                                    //   Array Number -> Maybe (Array Number)

              (S.take)              // Array Number -> Maybe (Array Number)
              (S.take)              // Array Number -> Maybe (Array Number)

  console.log()

  // S.show (liftTest3 (2) ([3,4]))   
  // 'Just ([3, 4])'

  const take2 = S.take (2)

  console.log()

  // S.show (S.take (2))  
  // 'function(x) { ...

  // :: Pair (Array Number -> Maybe (Array Number)) 
  //         (Array Number -> Maybe (Array Number))
  // S.show (S.Pair (take2) (take2)) 
  // 'Pair (function(x) { ...

  // :: Array Number -> 
  //      Pair Maybe (Array Number) Maybe (Array Number)
  // S.show ( (S.lift2 (S.Pair)) (take2) (take2))   
  // 'function(x) { return f (x) (apply (x)); }'

  // S.show ( (S.lift2 (S.Pair)) (take2) (take2) ([1,2]))    
  // 'Pair (Just ([1, 2])) (Just ([1, 2]))'

  // :: Array Number -> 
  //      Maybe Pair (Array Number) (Array Number)
  // S.show ( (S.lift2 (S.lift2 (S.Pair))) (take2) (take2) )    
  // 'function(x) { return f (x) (apply (x)); }'

  // S.show ( (S.lift2 (S.lift2 (S.Pair))) (take2) (take2) ([1,2]))    
  // 'Just (Pair ([1, 2]) ([1, 2]))'


  // S.show (S.take)  
  // 'take :: (Applicative f, Foldable f, Monoid f) => Integer -> f a -> Maybe (f a)'

  // S.show (S.Pair (S.take) (S.take))   
  // 'Pair (take :: (Applicative f, Foldable f, Monoid f) => Integer -> f a -> Maybe (f a)) (take :: (Applicative f, Foldable f, Monoid f) => Integer -> f a -> Maybe (f a))'

  // S.show ( (S.lift2 (S.Pair)) (S.take) (S.take) (2))    
  // 'Pair (function(x) { ...

  // S.show (( (S.lift2 ((S.lift2 (S.Pair)))) (S.take) (S.take) ) (2) ([1,2]) )  
  // 'Pair (Just ([1, 2])) (Just ([1, 2]))'

  // S.show (( (S.lift2 (S.lift2 ((S.lift2 (S.Pair))))) (S.take) (S.take) ) (2) ([1,2]) )  
  // 'Just (Pair ([1, 2]) ([1, 2]))'

  // NOTE: a fourth lift creates this function:
  //                        Number -> Array Number -> Maybe Array (Pair Number Number)

  //   S.show (( (S.lift2 (S.lift2 (S.lift2 ((S.lift2 (S.Pair)))))) (S.take) (S.take) ) (2) ([1,2]) )  
  // 'Just ([Pair (1) (1), Pair (1) (2), Pair (2) (1), Pair (2) (2)])'



  // chaining example from:
  // https://gitter.im/sanctuary-js/sanctuary?at=5fdb2937cb46f45e23866af2
  // 
  // NOTE: I've amended the names slightly

  //    toUpper :: String -> Future a String
  const toUpperF = s => Future.resolve (S.toUpper (s));

  //    length :: String -> Future a Integer
  const lengthF = s => Future.resolve (s.length);

  //    repeat :: String -> Integer -> Future a String
  const repeatF = s => n => Future.resolve (s.repeat (n));

  //    stringAndLengthPairF :: String -> Future a (Pair String Integer)
  const stringAndLengthPairF = s => Future.resolve (S.Pair (s) (s.length));

  //    future :: Future a String
  const repeatedStringF = (
    S.chain (
      s => 
        S.chain (n => 
          repeatF (s) (n)
        )
        (lengthF (s)) 
    )
    (toUpperF ('foo'))
  );

  // Future.fork (console.error)
  //             (S.compose (logChainedFut) (S.show))
  //             (repeatedStringF);

  // this creates code that looks more like the Haskell >>= syntax
  const chainFlipped = S.flip (S.chain)

  //    future :: Future a String
  const repeatedStringF2 = (
    chainFlipped 
    (toUpperF ('foo'))
    (
      s => 
        chainFlipped 
        (lengthF (s)) 
        (
          n => 
            repeatF (s) (n)
        )
    )
  );

  const logChainedFut = value => {
    console.log (`${value}`)
  }

  // Future.fork (console.error)
  //             (S.compose (logChainedFut) (S.show))
  //             (repeatedStringF2);


  // NOTE: as code experiment, convert chains to map/join's
  //       then map/join's to maps
  //    repeatedStringAsMapsF :: Future a (Future a (Future a String)
  const repeatedStringAsMapsF = S.pipe ([
    S.map 
    (
      s => 
        S.pipe ([
          S.map 
          (
            n => 
              repeatF (s) (n)       // Future a String
          )                         // Future a (Future a String)

        // , S.join                    // Future a String
        ])
        (lengthF (s))             // Future a Integer
    )                             // Future a (Future a (Future a String)

    // , S.join                      // Future a (Future a String)
  ]) 
  (toUpperF ('foo'))              // Future a String

  const mapFlipped = S.flip (S.map)

  // NOTE: same as first version with maps, but remove pipes (as not 
  // using joins) then use flipped map
  //    repeatedStringAsMapsF2 :: Future a (Future a (Future a String)
  const repeatedStringAsMapsF2 = 
    mapFlipped 
    (toUpperF ('foo'))              // Future a String
    (
      s => 
        mapFlipped 
        (lengthF (s))             // Future a Integer
        (
          n => 
            repeatF (s) (n)       // Future a String
        )                         // Future a (Future a String)
    )                             // Future a (Future a (Future a String)

  // NOTE: un-nest maps
  //    repeatedStringAsMapsF3 :: Future a (Future a (Future a String)
  const repeatedStringAsMapsF3 = S.pipe ([
    S.map 
    (
      s => 
        // Future.resolve (S.Pair (s) (s.length)) 
        stringAndLengthPairF (s)
                                  // Future a (Pair Number String)
        // (lengthF (s))             // Future a Integer
    )                             // Future a (Future a (Pair Number String))
  , S.map (
      S.map 
        (
          pairStringAndLength => 
            S.pair 
            (repeatF) (pairStringAndLength)       
                                  // Future a String
        )                         // Future a (Future a String)
    )                             // Future a (Future a (Future a String)
  ]) 
  (toUpperF ('foo'))              // Future a String

  // NOTE: re-add joins, then convert map/joins to chain
  //    repeatedStringAsMapsF4 :: Future a String
  const repeatedStringAsMapsF4 = S.pipe ([
    // S.map 
    S.chain
    (
      s => 
        // Future.resolve (S.Pair (s) (s.length)) 
        stringAndLengthPairF (s)
                                  // Future a (Pair Number String)
        // (lengthF (s))             // Future a Integer
    )                             // Future a (Pair Number String)
        // )                             // Future a (Future a (Pair Number String))
  // , S.join                        // Future a (Pair Number String))
  , 
    // S.map (
    // S.map 
    S.chain 
      (
        pairStringAndLength => {
          console.log (`pair: ${S.show (pairStringAndLength)}`)
        
          return S.pair 
            (repeatF) (pairStringAndLength)       
        }                         // Future a String
      )                           // Future a String
        // )                           // Future a (Future a String)
    // )                             // Future a (Future a (Future a String)
  // , S.join                        // Future a String
  ]) 
  (toUpperF ('foo'))              // Future a String

  // NOTE: tidied up version
  //    repeatedStringAsMapsF5 :: Future a String
  const repeatedStringAsMapsF5 = S.pipe ([
    S.chain (s => stringAndLengthPairF (s))               // Future a (Pair Number String)
  , S.chain (pairStringAndLength => 
              S.pair (repeatF) (pairStringAndLength))   // Future a String
  ]) 
  (toUpperF ('foo'))              // Future a String

  // NOTE: further tidied up version
  //    repeatedStringAsMapsF5a :: Future a String
  const repeatedStringAsMapsF5a = S.pipe ([
    S.chain (stringAndLengthPairF)      // Future a (Pair Number String)
  , S.chain (S.pair (repeatF))          // Future a String
  ]) 
  (toUpperF ('foo'))                    // Future a String

  // handles a nested Future, e.g. Future Error (Future Error (String -> String))
  const logFut3 = caption => resolveValue => {
    console.log (`${caption}: ${resolveValue}`)

    Future.fork (logFut ('rej')) (logChainedFut) (resolveValue)
  }

  Future.fork (console.error)
              // (S.compose (logFut3 ('res')) (S.show))
              (
                // logFut3 ('res')
                logChainedFut
                )
              (
                // repeatedStringAsMapsF
                // repeatedStringAsMapsF2
                // repeatedStringAsMapsF3
                // repeatedStringAsMapsF4
                // repeatedStringAsMapsF5
                repeatedStringAsMapsF5a
              );

  const monadExperiments = () => {

    // implementation of reader and state monads

    // reader monad - based on Haskell code in:
    // https://mjoldfield.com/atelier/2014/07/monads-fn.html



    // type Rdr r a = r -> a

    // type RdrInt a = Rdr Int a

    // returnRdr :: Enum a => a -> RdrInt a 
    // returnRdr a = \r -> a
    returnRdr  = a => r => a

    // bindRdr :: RdrInt a -> (a -> RdrInt a) -> RdrInt a
    // -- bindRdr x f = undefined
    // bindRdr x f = 
    //   \r -> f (x r) r
    bindRdr = x => f => r => {
      const a = x (r)

      const f1 = f (a)

      const f2 = f1 (r)

      return f2
    }

    // same fn as bindRdr
    bindRdrShort = x => f => r => f (x (r)) (r)

    // incR :: Enum a => a -> RdrInt a 
    // incR c r = toEnum $ r + fromEnum c 
    const incR = c => r => {
      const numFromChar = c.charCodeAt(0)

      const newChar = String.fromCharCode(numFromChar + r)

      return newChar
    }

    const env = 1

    const x = returnRdr ('c')

    console.log (`x: ${x}`)
    console.log ()

    const y = incR ('c') (env)

    console.log (`y: ${y}`)
    console.log ()

    const z = bindRdr (incR ('c')) (incR) (env)

    console.log (`z: ${z}`)
    console.log ()


    // incsRB :: Char -> RdrInt Char
    // incsRB initChar env = (incR initChar `bindRdr` inc2R `bindRdr` decR) env

    const incsRdr = initChar => env => {
      const incsPart = bindRdr (incR (initChar)) (incR) 

      bindRdr (incsPart) (incR) (env)
    }

    const z1 = incsRdr ('c') (env)

    console.log (`z1: ${z1}`)
    console.log ()


    const zc = S.chain (incR) (incR ('c'))

    const zc1 = zc (env)

    console.log (`zc1: ${zc1}`)
    console.log ()

    const zcf = chainFlipped (incR ('c')) (incR)

    const zcf1 = zcf (env)

    console.log (`zcf1: ${zcf1}`)
    console.log ()

    const incsChain = initChar => env => {
      const chainPart = chainFlipped (incR (initChar)) (incR)

      const incs = chainFlipped (chainPart) (incR)

      const incs1 = incs (env)
  
      console.log (`incs1: ${incs1}`)
      console.log ()
    }

    incsChain ('c') (env)

    // reformatted version of incsChain
    const incsChain2 = initChar => env => {
      const incs = 
        chainFlipped 
          (chainFlipped 
            (incR (initChar)) 
            (incR)) 
          (incR)

      const incs2 = incs (env)
  
      console.log (`incs2: ${incs2}`)
      console.log ()
    }

    incsChain2 ('c') (env)

    // reformatted version of incsChain2
    const incsPipeChain = initChar => env => {

      // incsStategPart :: Enum a2 => a2 -> StateInt a2
      const incsStategPart = initChar => 
        chainFlipped (incR (initChar)) (incR)
      
      const incs = S.pipe ([
        incsStategPart
      , chainFlipped
      // , f => f (incR)
      , S.T (incR)
      ]) (initChar);

    // incsStategCompose :: Enum a => a -> StateInt a
    // incsStategCompose = (\f -> f decStateg) . bindState . incsStategPart

      const incs2 = incs (env)
  
      console.log (`incsPipe: ${incs2}`)
      console.log ()
    }

    incsPipeChain ('c') (env)

    // reformatted version of incsChain
    const incsPipeChain2 = initChar => env => {

      const incs = S.pipe ([
        incR
      , chainFlipped
      , S.T (incR)              // same as f => f (incR)
      , chainFlipped
      , S.T (incR)    
      ]) (initChar);

    // incsStategCompose :: Enum a => a -> StateInt a
    // incsStategCompose = (\f -> f decStateg) . bindState . incsStategPart

      const incs2 = incs (env)
  
      console.log (`incsPipe2: ${incs2}`)
      console.log ()
    }

    incsPipeChain2 ('c') (env)

    // reformatted version of incsChain
    const incsPipeChain3 = initChar => env => {

      const incs = S.pipe ([
        incR
      , bindRdrShort            // same as chainFlipped
      , S.T (incR)              // same as f => f (incR)
      , bindRdrShort
      , S.T (incR)    
      ]) (initChar);

    // incsStategCompose :: Enum a => a -> StateInt a
    // incsStategCompose = (\f -> f decStateg) . bindState . incsStategPart

      const incs2 = incs (env)
  
      console.log (`incsPipe3: ${incs2}`)
      console.log ()
    }

    incsPipeChain3 ('c') (env)



    
    // -- NOTE: experiments mixing bind with compose.
    // --       Related to JS implemenatation that are more readable
    // incsStategComposeBit :: Enum a => a -> (a -> StateInt a) -> StateInt a
    // incsStategComposeBit = bindState . incsStategPart
    
    // incsStategCompose :: Enum a => a -> StateInt a
    // incsStategCompose = (\f -> f decStateg) . bindState . incsStategPart
    
    // incsStategCompose' :: Enum a => a -> StateInt a
    // incsStategCompose' = (&) decStateg . bindState . incsStategPart
    
    // incsStategCompose'' :: Enum a => a -> StateInt a
    // incsStategCompose'' = (\x -> bindState x decStateg) . incsStategPart
        



    // Reader implemenation using:
    // https://crocks.dev/docs/crocks/Reader.html
    // 
    // It was mentioned (indirectly) in this Sanctuary gitter chat:
    // https://gitter.im/sanctuary-js/sanctuary?at=600f893c004fab474165f75d
    // (the AWS examples use Crocks ReaderT)

        // type Rdr r a = r -> a

    // type RdrInt a = Rdr Int a

    // returnRdr :: Enum a => a -> RdrInt a 
    // returnRdr a = \r -> a
    // returnRdr  = a => r => a

    // bindRdr :: RdrInt a -> (a -> RdrInt a) -> RdrInt a
    // -- bindRdr x f = undefined
    // bindRdr x f = 
    //   \r -> f (x r) r
    // bindRdr = x => f => r => {
    //   const a = x (r)

    //   const f1 = f (a)

    //   const f2 = f1 (r)

    //   return f2
    // }

    // NOTE: wrapper to allow Crocks Reader.chain to work in pipe
    bindReader = fRdr => xRdr => xRdr.chain (fRdr)

    // NOTE: Sanctuary pipe doesn't like Reader (or something like that)
    const pipe = (...pips) => x => pips.reduce((prev, fn) => fn(prev), x)

    // same fn as bindRdr
    // bindRdrShort = x => f => r => f (x (r)) (r)

    // incR :: Enum a => a -> RdrInt a 
    // incR c r = toEnum $ r + fromEnum c 
    // const incRC = c => r => {
    //   const numFromChar = c.charCodeAt(0)

    //   const newChar = String.fromCharCode(numFromChar + r)

    //   return newChar
    // }

    // const env = 1

    // const x = returnRdr ('c')

    // console.log (`x: ${x}`)
    // console.log ()

    // const y = incR ('c') (env)

    // console.log (`y: ${y}`)
    // console.log ()

    // const z = bindRdr (incR ('c')) (incR) (env)

    // console.log (`z: ${z}`)
    // console.log ()


    const rdrIncR = c => {
      const partialIncR = incR (c)

      const rdr = Reader (partialIncR)

      return rdr
    }

    const incsPipeChain4 = initChar => env => {

      // const rdrIncOnce = Reader (incR (initChar))

      const rdrIncs = rdrIncR (initChar)
      .chain (rdrIncR)
      .chain (rdrIncR)

      const incs = rdrIncs.runWith (env)
  
      console.log (`incsPipe4: ${incs}`)
      console.log ()
    }

    incsPipeChain4 ('c') (env)


    const incsPipeChain5 = initChar => env => {

      const rdrIncs = pipe (
        rdrIncR
      , bindReader (rdrIncR)
      , bindReader (rdrIncR)
      )(initChar)

      const incs = rdrIncs.runWith (env)
  
      console.log (`incsPipe5: ${incs}`)
      console.log ()
    }

    incsPipeChain5 ('c') (env)







    // -- simple version of State monad
    // -- roughly similar to:
    // -- p244 Real World Haskell (==>)
    
    // type Ste s a = s -> (a, s)
    
    // type SteInt a = Ste Int a 
    
    // returnSte :: Enum a => a -> SteInt a
    // returnSte a = \s -> (a, s)

    const tupleStateCreate = a => s => ({ fst: a, snd: s })

    const returnState = a => s => tupleStateCreate (a) (s)
    
    // bindSte :: (Enum a, Enum b) => SteInt a -> (a -> SteInt b) -> SteInt b
    // bindSte x f = 
    //   \s -> 
    //         let 
    //           (a, s') = x s
    //           (a', s'') = f a s'
    //         in 
    //           (a', s'')            

    // bindRdrShort = x => f => r => f (x (r)) (r)

    bindState = x => f => s => {
      const {fst: a, snd: s1} = x (s) 

      const {fst: a1, snd: s2} = f (a) (s1)

      return tupleStateCreate (a1) (s2)
    }
    
    // incSte :: Enum a => a -> SteInt a 
    // incSte c =  \s -> 
    //               let a = toEnum $ s + fromEnum c 
    //               in
    //                 (a, s) 

    const incState = c => s => {
      const numFromChar = c.charCodeAt(0)

      const newChar = String.fromCharCode(numFromChar + s)

      return tupleStateCreate (newChar) (s)
    }

    // incsSte :: Char -> SteInt Char
    // incsSte initChar s = (incSte initChar `bindSte` inc2Ste `bindSte` decSte) s
    
    const incsState = initChar => s => {
      const bindPart1 = bindState (incState (initChar)) (incState)

      const bindx = bindState (bindPart1) (incState)

      const incsState1 = bindx (s)

      // const incsState1 = incs (env)
  
      console.log (`incsState1: ${S.show (incsState1)}`)
      console.log ()

      // return 

    }

    incsState ('c') (1)



    // TODO 
    // above with S.chain, bindStateShort
    // then
    // getState, putState, incStateg 
    
    // some example that updates state, maybe a count of increments


    // NOTE: Sanctuary needs a State type for S.chain to work.
    // This version uses State from:
    // https://github.com/dicearr/monastic
    // NOTE: However, only Sanctuary type classes, Z.chain,
    //       can be used.

    // const tupleStateCreate = a => s => ({ fst: a, snd: s })

    // const returnState = a => s => tupleStateCreate (a) (s)

    const returnS = a => Z.of (State, a)
    // const returnS = a => S.of (State) (a)

    // NOTE: wrapper for easy use of State.chain
    // const bindS = x => f => x.chain (f)
    const bindS = x => f => x["fantasy-land/chain"] (f)
          // (incS (initChar))["fantasy-land/chain"](incS).run (1)

    // NOTE: wrapper to allow State.chain to work in pipe
    const bindSFlip = S.flip (bindS)

    // equivalent to (>>)
    const bindSNoValue = x => f => x["fantasy-land/chain"] (() => f)
    
    // bindSte :: (Enum a, Enum b) => SteInt a -> (a -> SteInt b) -> SteInt b
    // bindSte x f = 
    //   \s -> 
    //         let 
    //           (a, s') = x s
    //           (a', s'') = f a s'
    //         in 
    //           (a', s'')            

    // bindRdrShort = x => f => r => f (x (r)) (r)

    // bindState = x => f => s => {
    //   const {fst: a, snd: s1} = x (s) 

    //   const {fst: a1, snd: s2} = f (a) (s1)

    //   return tupleStateCreate (a1) (s2)
    // }

    // const bindS = x => f => s => {
    //   chainS (f, x)
    // }

    // NOTE: this matches Haskell runState - given a state, it 
    //       provides the function that produces the result, newState pair.
    const runFlip = S.flip (runS)
    // or
    // const runFlip = aState => s => runS (s) (aState)

    // 
    // NOTE: State type is Int
    // 

    const incSimpleState = c => s => {
      const numFromChar = c.charCodeAt(0)

      const newChar = String.fromCharCode(numFromChar + s)

      return { state: s, value: newChar }
    }

    const incS = c => {      
      const stS = State (incSimpleState (c))

      return stS
    }

    const incSAlt = c => {
      const g = getS

      const f = c => s => {
        return incS (c)
      }

      // NOTE: this fn works like this, but it's more like \_ -> incS (c)
      //       as s param isn't used. 
      //       Probably want something like:

//       decStateg :: Enum a => a -> StateInt a
// decStateg c = getState `bindState` \s -> 
//   let (a, _) = runState (incState c) (-s)
//   in  
//     returnState a

      const i = bindS (g) (f (c))

      return i
    }

    const decS = c => {
      const r = bindS (getS) 
        (s => {
          const { state, value } = runFlip (incS (c)) (-s)

          // NOTE: this works whether it ignores param, as (),
          //       or uses param, as s. Not sure if one use
          //       is more idiomatic. Ignoring param is a little
          //       like putS, so maybe should use that explicitly.
          // 
          // NOTE: With this state/fns, the state is unchanged, so
          //       perhaps no need for putS (this doesn't answer whether 
          //       to ignore param). 
          //       However, for state/fns below, which maintain a count of
          //       changes, putS is needed and feels idiomatic.
          return State (
            // () 
            s => {          
            return { state: s, value }
          })
        })

      //   decStateg :: Enum a => a -> StateInt a
      //   decStateg c = getState `bindState` \s -> 
      //   let (a, _) = runState (incState c) (-s)
      //   in  
      //     returnState a

      return r
    }
    
    const decSAltReturn = c => {
      const r = bindS (getS) 
        (s => {
          const { state, value } = runFlip (incS (c)) (-s)

          const r = returnS (value)

          // NOTE: This works, but not sure if it's idiomatic
          //       not to call putS. Still, uses the second s from getS,
          //       and here the state is meant to remain unchanged,
          //       so maybe it is idiomatic.
          return r 
      })

      //   decStateg :: Enum a => a -> StateInt a
      //   decStateg c = getState `bindState` \s -> 
      //   let (a, _) = runState (incState c) (-s)
      //   in  
      //     returnState a

      return r
    }
    
    const decSAltPut = c => {
      const r = bindS (getS) 
        (s => {
          const { state, value } = runFlip (incS (c)) (-s)

          // NOTE: This works, but not sure if it's over-working
          //       things just to call putS. 
          //       Perhaps it'll be clearer when working with a
          //       state that is changed.
          const r = bindS (putS (s)) (() => {
            const r1 = returnS (value)

            // for debugging, use this rather than returnS
            // const r1 = State (s => {          
            //   return { state: s, value }
            // })
  
            return r1
          })
    
          return r
      })

      //   decStateg :: Enum a => a -> StateInt a
      //   decStateg c = getState `bindState` \s -> 
      //   let (a, _) = runState (incState c) (-s)
      //   in  
      //     returnState a

      return r
    }
    
    // NOTE: this ended up being a useful mix of code samples rather
    //       than a fn that returns a State itself.
    const incsS = initChar => s => {

      const basicState = returnS (initChar)

      // runFlip (basicState) (1)
      // {state: 1, value: 'c'}


      // simple state fn
      const st = a => s => ({state: s, value: a})

      const simple1 = State (st ('c'))   // this works with run (1)
                                    // and seems valid
                                    // (type has correct, single, param)

      // runFlip (simple1) (1) 
      // {state: 1, value: 'c'}

      const simple2 = State (st)        // this works with run ('c') (1)
                                    // doesn't feel valid, though
                                    // (type doesn't seem right with 
                                    // extra param)
      // runFlip (simple2) ('c') 
      // s => ({state: s, value: a})

      // runFlip (simple2) ('c') (1)
      // {state: 1, value: 'c'}
                              
      const incState1 = incS (initChar)     // works
      // const incState1 = runS (initChar) (getS)

      const incResult = runS (s) (incState1)        // works

      // runS (s) (incState1)
      // {state: 1, value: 'd'}

      const incResult1 = runFlip (incState1) (s)

      // runFlip (incState1) (s)
      // {state: 1, value: 'd'}

      // const a1 = runFlip (getS) (initChar)
      const a1 = runFlip (getS) (s)

      const a2 = runFlip (incSAlt (initChar)) (1)

      // runFlip (incSAlt (initChar)) (1)
      // {state: 1, value: 'd'}

      // runFlip (getS) (s)
      // {state: 1, value: 1}

      // incsSte :: Char -> SteInt Char
// incsSte initChar s = (incSte initChar `bindSte` inc2Ste `bindSte` decSte) s

      // State.prototype.fantasy-land/chain :: State s a ~> (a -⁠> State s b) -⁠> State s b

      const zc = Z.chain

      const n = Z.chain (incS, incS (initChar)) 
      const n1 = zc (incS, incS (initChar)) 

      // Z.chain (incS, incS (initChar)) 
      // State {run: ƒ}
      // zc (incS, incS (initChar)) 
      // State {run: ƒ}

      const nRes = n.run (1)
      const nRes1 = n1.run (1)

      // n.run (1)
      // {state: 1, value: 'e'}

      // n1.run (1) 
      // {state: 1, value: 'e'}


      // NOTE: S.chain (and so, chainFlipped) fails (with .run (1))
      //       as the types are rejected
      // const p1 = chainFlipped (incS (initChar)) (incS)   // fails

      // const x = p1 (s)

      // const incs = S.chain (incState) (p1)

      // const incs2 = incs (s)

      const p1a = bindS (incS (initChar)) (incS) 

      const p1b = (incS (initChar))["fantasy-land/chain"](incS)

      const res1a = p1a.run (1)
      const res1b = p1b.run (1)

      // p1a.run (1)
      // {state: 1, value: 'e'}

      // (incS (initChar))["fantasy-land/chain"](incS).run (1)
      // {state: 1, value: 'e'}

      const incsS = bindS (p1a) (incS)

      // runFlip (incsS) (1) 
      // {state: 1, value: 'f'}

      const y = runS (s) (incsS)
      const y1 = runFlip (incsS) (s)

      console.log (`incsState2 y: ${S.show (y1)}`)
      console.log ()

      // const p2 = pipe (
      const p2 = S.pipe ([
        incS
        // () => getS
      , bindSFlip (incS)
      , bindSFlip (incS)
      // , bindSFlip (decS)
      // , bindSFlip (decSAltReturn)
      , bindSFlip (decSAltPut)
      ]) (initChar)

      const p2Res = runFlip (p2) (s)

      console.log (`incsState2 p2: ${S.show (p2Res)}`)
      console.log ()


    }

    incsS ('c') (1)

    // 
    // NOTE: State type is { count: Int, increment: Int }
    // 

    const incCountedStateS = c => bindS (getS) (s => {
        const { count, increment } = s
        const newState = { count: count + 1, increment }

        const numFromChar = c.charCodeAt(0)
        const newChar = String.fromCharCode(numFromChar + increment)

        // NOTE: bindSNoValue is equivalent to (>>), which simplifies
        //       second param, which otherwise would be () => returnS (newChar).
        return bindSNoValue (putS (newState)) (returnS (newChar))
      })

    const decCountedStateS = c => bindS (getS) (s => {
        const { count, increment } = s
        const newState = { count: count + 1, increment }
        const { state, value } = runFlip (incCountedStateS (c)) ({ count, increment: -increment })

        return bindSNoValue (putS (newState)) (returnS (value))
    })
    
    const incCountedStateSAnnotated = c => {
      const r = bindS (getS) (s => {
        const { count, increment } = s
        const newState = { count: count + 1, increment }

        const numFromChar = c.charCodeAt(0)
        const newChar = String.fromCharCode(numFromChar + increment)

        const r1 = bindSNoValue (putS (newState)) (() => {
          const r2 = returnS (newChar)

          return r2
        })

        return r1
      })

      return r
    }

    const decCountedStateSAnnotated = c => {
      const r = bindS (getS) 
        (s => {
          const { count, increment } = s
          const newState = { count: count + 1, increment }
          const { state, value } = runFlip (incCountedStateS (c)) ({ count, increment: -increment })

          // NOTE: This state/fns change the state, so use of putS is 
          //       necessary and feels idiomatic (contrary to comments for other
          //       state/fns above).
          const r1 = bindS (putS (newState)) (() => {
            const r2 = returnS (value)

            // for debugging, use this rather than returnS
            // const r1 = State (s => {          
            //   return { state: s, value }
            // })
  
            return r2
          })
    
          return r1
      })

      //   decStateg :: Enum a => a -> StateInt a
      //   decStateg c = getState `bindState` \s -> 
      //   let (a, _) = runState (incState c) (-s)
      //   in  
      //     returnState a

      return r
    }
    
    // NOTE: this ended up being a useful mix of code samples rather
    //       than a fn that returns a State itself.
    const incsCountedStateS = initChar => s => {
      const p = S.pipe ([ 
        incCountedStateS
      , bindSFlip (incCountedStateS)
      , bindSFlip (decCountedStateS)
      ]) 
      (initChar)

      const pRes = runFlip (p) (s)

      console.log (`incsCountedStateS p: ${S.show (pRes)}`)
      console.log ()

    }

    incsCountedStateS ('c') ({ count: 0, increment: 1 })

    // TODO return State from incsCountedStateS and run it there
    // NOTE: although don't seem to have done this above at all.
    //       But it should be chainable, like other fns? Probably

  }

  monadExperiments()



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

  // this works
  // const result = from(Future.promise (cf));

// result.subscribe(x => console.log(x), e => console.error(e));
  // result.subscribe(exit0, exit1);

// console.log('pp1a: ', pp1a)

};

main()
