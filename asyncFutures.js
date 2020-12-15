const fs = require('fs')
const path          = require ('path');

// const Rx = require('rxjs')
// const {Observable} = require('rxjs')
const { from } = require('rxjs')

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
