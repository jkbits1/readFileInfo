const fs = require('fs').promises;
const path = require('path');
const S = require('sanctuary')
const $ = require('sanctuary-def')
const Future = require('fluture');
const { resolve } = require('path');

var filterExtension = ".hmt";

// module.exports = getFolderSortedList;

const readFileDefault = async (folderName, fileName, defaultText) => {
  let dataReadOk = true;

  const data = await fs.readFile(folderName + '/' + fileName, 'utf8').catch(() => {
      console.log('data not read')

      dataReadOk = false
  });

  const fileData = dataReadOk ? data : defaultText
  
  return fileData
}

async function getFolderSortedList (folderIndex, callback) {

  const folders = await readFileDefault('.', 'paths.txt', '')

  let folderList = folders.split(/\r?\n/)

  const folder = folderList[folderIndex]

  const files = await fs.readdir(folder).catch(() => {
    console.error('files not found');

    return callback(undefined);
  })

  const hmtFiles = files.filter(function (file) {
    if (path.extname(file) === filterExtension) {
      return true;
    }
    else {
      return false;
    }
  });

  const videoList = await Promise.all(hmtFiles.map (async function (fileName) {
    // var fileName      = undefined;

    const textSegmentRegex    = /(?<=\u0010i7)(.*?)(?=\u0000)/g;
    const seasonSegmentRegex  = /(?<=[(]S)(.*?)(?=[)])/g;
    const seasonNumberRegex  = /([0-9]+)(?=\s)/g;
    const episodeNumberRegex  = /(?<=(Ep))(?:\s*)([0-9]*)/g; 
    // (S6 Ep7/22)
    // (S6 Ep 7)

    const regexFileName       = /[a-zA-Z\s\-]*/;
    const regexDate           = /_[0-9]*_/; // date plus underscores
    // const regexTime           = /[0-9]*[.]/; 
    const regexTime           = /[0-9]*(?=[.])/;

    const regexMatchSingleItem = (text, regex, defaultText = '') => {
      const results = !!text ? (text.match(regex) || []) : []
      const itemInfo = results.length > 0 ? results[0] : defaultText

      return itemInfo;
    }

    const data = await readFileDefault(folder, fileName, '')

    // const xxx = data.replace(/[\u{0080}-\u{FFFF}]/gu,"");

    //   , (err, data) => {
    //     if (err) {
    //       return
    //     }

    //     console.log("read file")
    // });

    // const x4 = xxx.replace(/ /g,'');
    // const x4 = xxx.replace(/\s/g, '');


    // https://www.regextester.com/3269

    // grabs across multiple items, rather than excludes items
    // data.match(/(?<=\u0010i7)(.*?)[(]S(.*?)(?=\u0000)/g)[1]
    
    const allTextSegments = data.match(textSegmentRegex) || []
    const textSegments = allTextSegments.slice(0, 3)

    const guidanceIndex = 0, summaryIndex = 2

    const guidance  = textSegments[guidanceIndex] || ''
    const summary   = textSegments[summaryIndex]  || ''

    // https://gitter.im/sanctuary-js/sanctuary?at=5e5fbe5dec7f8746aab154dd

    // S.compose (h) (S.compose (g) (f))
    // S.pipe ([f, g, h])
    // S.pipe (S.reverse ([h, g, f]))

    const pipe_ = S.compose (S.pipe) (S.reverse);
    const pipe = (...pips) => x => pips.reduceRight((prev, fn) => fn(prev), x)


    const testingSanctuary = async _ => {
      //from: https://stackoverflow.com/questions/51795210/how-do-i-collapse-maybe-monads-in-sanctuary-js

      const getTag = tag => S.pipe([
        S.get (S.is ($.String)) ('Tags'),           // Just ("a=y, b=z")
        S.map (S.splitOn (',')),                    // Just (["a=y", "b=z"])
        S.map (S.map (S.stripPrefix (tag + '='))),  // Just ([Just ("y"), Nothing])
        S.map (S.head),                             // Just (Just (Just ("y")))
        S.join,                                     // Just (Just ("y"))
        S.join,                                     // Just ("y")
      ])

      const xt = getTag ('a') ({ Tags: 'a=y, b=z' })

      // console.log(`xt ${xt}`)
      // console.log(`${S.show (xt)}`)


      const getTag2 = tag => S.pipe([
        S.get (S.is ($.String)) ('Tags'),             // Just ("a=y, b=z")
        S.map (S.splitOn (',')),                      // Just (["a=y", " b=z"])
        S.map (S.map (S.stripPrefix (tag + '='))),    // Just ([Just ("y"), Nothing])
        S.map (S.justs),                              // Just (["y"])
        S.chain (S.head),                             // Just ("y")
      ])

      const a1 = S.Just (["y"])
      const m1 = S.map (S.head) (a1)            // Just (Just ("y"))
      const m1a = S.join (S.map (S.head) (a1))  // Just ("y")

      // https://gitter.im/sanctuary-js/sanctuary?at=5db1852514d55a3785690b89
      // chain :: (a -> x -> b) -> (x -> a) -> x -> b
      // 
      // We are given an x and must return a b. We feed the x into the x -> a function to produce 
      // an a, which—along with the original x—we then feed into the a -> x -> b function to 
      // produce a b, which we return.
      // 
      // The interesting thing is that the x is used twice.

      // chain :: Chain m => (a -> m b) -> m a -> m b

      // S.chain (S.head) (m a) -> m b

      // a        [c]
      // m        Maybe

      // m a      Maybe [c]
      // S.head - [c] -> Maybe c
      // m b      Maybe c


      // https://gitter.im/sanctuary-js/sanctuary?at=5db177a414d55a378568a393
      // chain :: (a -> Function x b) -> Function x a -> Function x b
      // chain :: (a -> x -> b)       -> (x -> a)     -> (x -> b)

      // S.chain (n => s => s.slice (0, n)) (s => Math.ceil (s.length / 2)) ('slice')

      // https://github.com/sanctuary-js/sanctuary-type-classes/blob/v12.1.0/index.js#L1782

          // //  Function$prototype$chain :: (a -> b) ~> (b -> a -> c) -> (a -> c)
          // function Function$prototype$chain(f) {
          //   var chain = this;
          //   return function(x) { return f (chain (x)) (x); };
          // }

      // my notes of definition
      // curried definition :: (b -> a -> c) -> (a -> b) -> (a -> c)

      // this/chain/m a                                     (a -> b)
      // f/(a -> m b)                                       (b -> a -> c)
      // m b                                                (a -> c)

      // a                                                  Number
      // m                                                  String -> c

      // (a -> m b)     (n => s => s.slice (0, n))          Number -> (String -> String)
      // m a            (s => Math.ceil (s.length / 2))     String -> Number
      // m b            s => s.slice (0, n)                 String -> String



      // S.map (S.map (S.stripPrefix (tag + '='))),         Maybe ([Maybe String])
      // S.chain (S.head),                                  Maybe (Maybe String)

      // S.head/(a -> m b)                                  [Maybe String] -> Maybe (Maybe String)
      // a                                                  [Maybe String]
      // m a                                                Maybe ([Maybe String])
      // m b                                                Maybe (Maybe String)



      // S.map (S.map (S.stripPrefix (tag + '='))),         Maybe [Maybe String]
      // S.map (S.justs),                                   Maybe [String]
      // S.chain (S.head),                                  Maybe String

      // S.head/(a -> m b)                                  [String] -> Maybe String
      // a                                                  [String]
      // m a                                                Maybe [String]
      // m b                                                Maybe String

      // chain as map
      const slice1 = n => s => s.slice (0, n)
      const ceil1 = s => Math.ceil (s.length / 2)

      // S.chain (n => s => s.slice (0, n)) (s => Math.ceil (s.length / 2)) ('slice')
      // S.chain (slice1) (ceil1) ('slice')

      // using syntax from:
      // http://learnyouahaskell.com/functors-applicative-functors-and-monoids
      // 
      // make types specific in repl
      // 
      //       ('(a -> b) -> (r -> a) -> (r -> b)'
      // ... .replace (/r/g, 'String')
      // ... .replace (/a/g, 'Integer')
      // ... .replace (/b/g, 'String -> String')
      // ... )
      // '(Integer -> String -> String) -> (String -> Integer) -> (String -> String -> String)'

      const ms1 = S.map (slice1) (ceil1)
      // console.log(`${S.show(ms1)}`)

      const ms1a = ms1 ('slice')
      // console.log(`${S.show(ms1a)}`)

      const ms1b = ms1a ('slice')
      // console.log(`${S.show(ms1b)}`)

      
      const mj1 = S.join (ms1)
      // console.log(`${S.show(mj1)}`)

      const mj1a = mj1 ('slice')
      // console.log(mj1a)



      const xt2 = getTag2 ('a') ({ Tags: 'a=y, b=z' })

      // console.log(`xt2 ${xt2}`)

      // console.log(`${S.show (xt2)}`)
      // console.log("") // for breakpoint


      // chain :: (a -> Either x b) -> Either x a -> Either x b

      const parseJson = S.encase (JSON.parse);

      const sJ = S.chain (parseJson) (S.Right ('[1,2,3]'));
      // console.log(`${S.show (sJ)}`)

      const sJ2 = S.chain (parseJson) (S.Right ('[1'));
      // console.log(`${S.show (sJ2)}`)


      // https://gitter.im/sanctuary-js/sanctuary?at=5db1858f9c3982150976e2fe
      // join :: Chain m => m (m a) -> m a
      // join :: Function x (Function x a) -> Function x a
      // join :: (x -> x -> a) -> x -> a

      // S.join (f) (x) is equivalent to f (x) (x). :)

      const sjoFn = S.join (S.concat) // ('foo')
      // console.log(`${sjoFn}`)

      const sjo = sjoFn ('foo')

      // console.log(sjo)



      // https://gitter.im/sanctuary-js/sanctuary?at=5db17dd4fb4dab784af83828
      // map :: (a -> b) -> (x -> a) -> x -> b

      const mFn = S.map ( c => d => c + d ) ( c => c * 2 ) // ( 1 )( 1 )
      // console.log(`${S.show (mFn)}`)

      // x            c 
      // a            c 
      // (a -> b)     (c => d => c + d)
      // b            (d => c + d)

      const mFn1 = mFn ( 1 )
      // console.log(`${S.show (mFn1)}`)

      const mFn1a = mFn1 (1)
      // console.log(`${S.show (mFn1a)}`)


      // https://gitter.im/sanctuary-js/sanctuary?at=5db18b66e886fb5aa2e8a9fa

      // ap :: Apply f => f (a -> b) -> f a -> f b

      // ap :: Function x (a -> b) -> Function x a -> Function x b
      // ap :: (x -> a -> b) -> (x -> a) -> x -> b
      // 
      // The only difference is that chain takes a then x whereas ap takes x then a.


      // https://gitter.im/sanctuary-js/sanctuary?at=5db18d962a6494729c2f46a9
      // chain :: Chain m =>  (a -> m b)    -> m a      -> m b
      // chain ::             (b -> a -> c) -> (a -> b) -> (a -> c)

      // S.pipe ([
      //   S.chain (x => env => x + env),
      //   S.chain (x => env => x * 2),
      //   S.chain (x => env => x * env),
      // ]) (S.K (5)) (10)

      const kFn = S.chain (x => env => x * env)
      // console.log(`${kFn}`)

      const kFn1 = kFn (S.K (5))
      // console.log(`${kFn1}`)

      const kFn1a = kFn1 (10)
      // console.log(kFn1a)

      // m b          Number => Number
      // m a          Number => Number
      // a            Number
      // a -> m b     Number => Number => Number


      const xj = S.pipe ([
        S.parseJson (_ => true)
      , S.map (S.get (_ => true) ('x'))
      , S.join
      ]) ('{ "x": { "y": { "z": ["28", "29", "2A"] }}}')

      // console.log (`parseJson: ${S.show (xj)}`)

      const xj1 = S.pipe ([
        // S.parseJson (S.is ($.Array ($.String)))
        S.parseJson (_ => true)
      , S.map (S.gets (_ => true) (['x', 'y', 'z']))
      , S.join
      // , S.map (S.map (S.sequence (S.Maybe)))
      , S.map (S.map (S.parseInt (16)))
      , S.map (S.sequence (S.Maybe))
      , S.join
      , S.map (S.sum)
      ]) ('{ "x": { "y": { "z": ["28", "29", "2A"] }}}')

      // console.log (`parseJson: ${S.show (xj1)}`)

      // console.log ("")

      const xj1a = S.pipe ([
        // S.parseJson (S.is ($.Array ($.String)))
        S.parseJson (_ => true)
      , S.chain (S.gets (S.is ($.Array ($.String))) (['x', 'y', 'z']))
      , S.map (S.map (S.parseInt (16)))
      , S.chain (S.sequence (S.Maybe))
      , S.map (S.sum)
      ]) ('{ "x": { "y": { "z": ["28", "29", "2A"] }}}')

      // console.log (`parseJson 1a: ${S.show (xj1a)}`)

      // console.log ("")


      const redSum = prev => current => prev + current  // doesn't work with reduce
      const redSum1 = (prev, current) => prev + current // works with reduce
      const redSum2 = (...args) => args[0] + args[1]    // works with reduce

      const xj2 = S.pipe ([
          S.parseJson (_ => true)
        , S.chain (S.gets (_ => true) (["x", "y", "z"]))

        // , S.map (S.map (S.parseInt (16)))  // these two lines do the same as traverse
        // , S.chain (S.sequence (S.Maybe))

        , S.chain (S.traverse (S.Maybe) (S.parseInt (16)))
        // , S.chain (S.traverse (Array) (S.parseInt (16)))

        , S.map (S.sum)
        // , S.map (xs => xs.reduce(redSum1, 0))
        // , S.map (xs => xs.reduce(redSum2, 0))
        // , S.map (S.reduce (S.add) (0))
        // , S.map (S.reduce (redSum) (0))
        // , S.map (S.reduce (S.curry2 (redSum1)) (0))
        // , S.map (S.reduce (S.curry2 (redSum2)) (0))
      ]) ('{ "x": { "y": { "z": ["28", "29", "2A"] }}}')

      // try to do some stack overflow sanctuary examples
      // traverse instaed of maps ...

      // const redSum = [1,2].reduce((prev, current) => {
      //   return prev + current
      // }, 0)

      // console.log(`sum xj2 ${S.show (xj2)}`)

      // console.log ("")


      const tags1 = tags => field => {       
        const t1 = S.pipe([
          S.get (S.is ($.String)) ('Tags')
        , S.map (S.splitOn (','))
        , S.map (S.map (S.stripPrefix (field + '=')))
        // , S.map (S.filter (S.isJust))
        , S.map (S.justs)
        , S.chain (S.head)
        // , S.join
        ]) (tags) 

        return t1 
      }

      const testTags = tags => field => {
        const t1 = tags1 (tags) (field)

        // console.log(`t1 ${S.show (t1)}`)
      }

      testTags ({Tags: 'a=y, b=z'}) ('a')
      // console.log ("")

      testTags ({Tags: 'a=y,b=z'}) ('b')
      // console.log ("")

      testTags ({Tags: 'a=y, b=z'}) ('z')
      // console.log ("")

      testTags ({Tags: null}) ('a')
      // console.log ("")

      // TODO
      // consider x.y.z example with Either instead of Maybe

      // Haskell Predicate review



      // review this SO 
      // https://stackoverflow.com/questions/62791841/wrong-answer-from-s-min-when-strings-used

      // maybe look at this
      // https://stackoverflow.com/questions/58706276/execute-fluture-task-with-sancuary-either


      // amended examples of interest from here:
      // 
      // https://stackoverflow.com/questions/47501494/using-of-constructor-on-sanctuary-maybe/47501748#47501748
      // 
      // also, refers to interesting blog:
      // https://james-forbes.com/?/posts/the-perfect-api#!/posts/the-perfect-api
      // 

      // 
      // Mixed with Haskell versions below    
      //            also, various refactorings with pipe etc.
      // 
      // 1) S.lift2 (S.add) (S.Just (3)) (S.Just (5))
      // 2) S.ap (S.map (S.add) (S.Just (3))) (S.Just (5))
      // 3) S.ap(S.ap (S.Just (S.add)) (S.Just (3))) (S.Just (5))

      // 
      // 1) S.lift2 (S.add) (S.Just (3)) (S.Just (5))

      // use S.T to create infix version
      // 
      // S.lift2 (S.add) (S.Just (3)) 
      // becomes
      // S.T (S.Just (3)) ((S.lift2) (S.add))
      // 
      // S.lift2 (S.add) (S.Just (3)) (S.Just (5))
      // becomes
      // (S.T (S.Just (3)) ((S.lift2) (S.add))) (S.Just (5))
      // 
      // const liftedAdd = (S.lift2) (S.add)
      // (S.T (S.Just (3)) (liftedAdd)) (S.Just (5))
      // 
      // with imports
      // (S.T (Just (3)) (liftedAdd)) (Just (5))

      // 
      // :t liftA2 (+) (Just 3) (Just 5)
      // :: Num c => Maybe c
      // 

      const l1 = S.pipe ([
        S.lift2 (S.add)
      // , f => f (S.Just (3))
      ]) (S.Just (3))

      const l1a = l1 (S.Just (5))

      // console.log(`l1a ${S.show (l1a)}`)
      
      // console.log()

      // just an experiment - a bit like rwh early file parser
      //                       operates on a bit of state, passes
      //                       remainder of state along to next fns
      const l2 = S.pipe ([
        S.Pair (S.compose (S.lift2 (S.add)) (S.head))
      , p => S.Pair ((S.fst (p)) (S.snd (p))) (S.tail (S.snd (p)))
      , p => (S.fst (p)) (S.chain (S.head) (S.snd (p))) 
      ]) ([3, 5])

      // console.log(`l2 ${S.show (l2)}`)
      
      // console.log()

      // 
      // S.lift2 (S.add)
      // 
      // :t liftA2 (+)
      // :: (Applicative f, Num c) => f c -> f c -> f c
      // 
      // :t liftA2 (+) (Just 3) (Just 5)
      // :: Num c => Maybe c
      // 

      // 
      // 2) (S.ap (S.map (S.add) (S.Just (3))) (S.Just (5)))
      //
      // (S.ap (S.map (S.add) (S.Just (3))) (S.Just (5)))
      // becomes
      // S.T (S.map (S.add) (S.Just (3))) (S.ap) (S.Just (5))
      // 
      // const mappedAdd = S.map (S.add)
      // S.T (mappedAdd (S.Just (3))) (S.ap) (S.Just (5))
      // 
      // with imports
      // S.T (mappedAdd (Just (3))) (ap) (Just (5))
      // 
      // infix version
      // S.T (S.map (S.add) (S.Just (3))) (S.ap) (S.Just (5))
      // becomes
      // S.T (S.T (S.Just (3)) (S.map (S.add))) (S.ap) (S.Just (5))
      // 
      // const mappedAdd = S.map (S.add)
      // S.T (S.T (S.Just (3)) (mappedAdd) (S.ap) (S.Just (5))
      // 
      // with imports
      // S.T (S.T (Just (3)) (mappedAdd) (ap) (Just (5))

      // 
      // :t fmap (+) (Just 3) <*> (Just 5)
      // :: Num b => Maybe b
      // 

      const am1 = S.pipe ([
        S.map (S.add)
      ]) (S.Just (3))

      // console.log(`am1 ${S.show (am1)}`)
      // console.log()

      const am1a = S.pipe ([
        S.ap (am1)
      ]) (S.Just (5))

      // console.log(`am1a ${S.show (am1a)}`)
      // console.log()

      // 
      // broken down:
      // S.map (S.add)
      // 
      // :t fmap (+)
      // :: (Functor f, Num a) => f a -> f (a -> a)
      // 
      // const maybeFn = S.map (S.add) (S.Just (3))
      // 
      // :t fmap (+) (Just 3)
      // :: Num a => Maybe (a -> a)

      // S.ap (maybeFn)       
      // 
      // :t (<*>) (fmap (+) (Just 3))
      // :: Num b => Maybe b -> Maybe b
      // 
      // S.ap (maybeFn) (S.Just (5))
      // 
      // :t fmap (+) (Just 3) <*> (Just 5)
      // :: Num b => Maybe b
      // 

      // 
      // 3) S.ap(S.ap (S.Just (S.add)) (S.Just (3))) (S.Just (5))
      // 
      // :t (Just (+)) <*> (Just 3) <*> (Just 5)
      // :: Num b => Maybe b

      // amended version, more like haskell
      // pseudo-code 
      //  (S.Just (S.add))  S.ap (S.Just (3))) S.ap  (S.Just (5))

      // use S.T to create haskell-style version
      // S.ap (S.Just (S.add)) (S.Just (3))
      // becomes
      // S.T (S.Just (S.add)) (S.ap) (S.Just (3))

      // S.ap ( S.T (S.Just (S.add)) (S.ap) (S.Just (3))) (S.Just (5))
      // becomes
      // S.T (S.T (S.Just (S.add)) (S.ap) (S.Just (3))) (S.ap) (S.Just (5))
      // 
      // const justAdd = S.Just (S.add)
      // S.T (S.T (justAdd) (S.ap) (S.Just (3))) (S.ap) (S.Just (5))
      // 
      // with imports
      // S.T (S.T (justAdd) (ap) (Just (3))) (ap) (Just (5))

      const aa1 = S.pipe ([
        S.ap
      ]) (S.Just (S.add))

      const aa1a = S.pipe ([
        aa1
      ]) (S.Just (3))

      const aa1b = S.pipe ([
        S.ap (aa1a)
      ]) (S.Just (5))

      // console.log(`aa1b ${S.show (aa1b)}`)
      // console.log()

      // 
      // S.ap (S.Just (S.add))
      // 
      // :t (<*>) (Just (+))
      // :: Num a => Maybe a -> Maybe (a -> a)
      // 
      // S.ap (S.Just (S.add)) (S.Just (3))
      // 
      // :t (<*>) (Just (+)) (Just 3)
      // :: Num a => Maybe (a -> a)
      // 
      // S.ap (S.ap (S.Just (S.add)) (S.Just (3)))
      // 
      // :t (<*>) ((<*>) (Just (+)) (Just 3))
      // :: Num b => Maybe b -> Maybe b
      // 

// test Sanctuary versions with S.pipe()?



      // adjusted example from Sanctuary docs      
      // S.ap (S.Just (S.add (5))) (S.Just (64))
      
      // adjusted further, becomes like final example above
      // 
      // S.ap (S.ap (S.Just (S.add)) (S.Just (64))) (S.Just (1))
      // 
      // broken up:
      // 
      // ap :: f (a -> b) -> f a -> f b
      //       f = Maybe  b = (b -> c)  a,b,c = Number
      // 
      // const maybeAdd64 :: Maybe (b -> c) = 
      //    S.ap (S.Just (S.add)) (S.Just (64)) :: Maybe (a -> (b -> c)) ->
      //                                           Maybe a -> Maybe (b -> c)
      // 
      // then:
      // 
      // Maybe (a -> b) -> Maybe a -> Maybe b
      // S.ap (maybeAdd64) (S.Just (1))

      // pasted into sanctuary.org repl
      // S.pipe ([S.get (S.is ($.String)) ('Tags'), S.map (S.splitOn (',')), S.map (S.map (S.stripPrefix ('a' + '='))), S.map (S.head)]) ({Tags: 'a=y, b=z'})
      // Just (Just (Just ("y")))



      // working through contramap
      // 
      // example from 
      // https://stackoverflow.com/questions/50774333/sanctuary-js-and-defining-a-contravariant-functor/50788909#50788909
      // 
      //      S.contramap (s => s.length) (S.even) ('Sanctuary')
      //      false
      // 
      // ('(b -> a) -> f a -> f b'
      // ... .replace (/b/g, 'String')
      // ... .replace (/a/g, 'Number')
      // ... .replace (/f/g, '(x -> Bool)')
      // ... )
      // '(String -> Number) -> (x -> Bool) Number -> (x -> Bool) String'
      // >
      // NOTE: x is value after (...)
      // so, read above as: 
      // 
      // '(String -> Number) -> (Number -> Bool) -> (String -> Bool)'


      // Prelude Data.Functor Data.Functor.Contravariant> :t contramap (\s -> length s)
      // contramap (\s -> length s)
      //   :: (Contravariant f, Foldable t) => f Int -> f (t a)

      // see listOfTen example here:
      // https://typeclasses.com/contravariance
      
      // Predicate example here:
      // https://www.schoolofhaskell.com/school/to-infinity-and-beyond/pick-of-the-week/profunctors
      // 
      // newtype Predicate a = Predicate { getPredicate :: a -> Bool }
      // 
      // instance Contravariant Predicate where contramap g (Predicate p) = 
      // Predicate (p.g)
      // 
      //  getPredicate (contramap (`div` 2) (Predicate odd)) 5

      // :t length
      // :: Foldable t => t a -> Int
      // 
      // :t Predicate odd
      // :: Integral a => Predicate a
      // 
      // :t length :: String -> Int
      // :: String -> Int
      // 
      // :t Predicate odd :: Predicate Int
      // :: Predicate Int
      // 
      // :t getPredicate (contramap length (Predicate odd))
      // :: Foldable t => t a -> Bool
      // 
      // :t getPredicate (contramap length (Predicate odd)) :: String -> Bool
      // :: String -> Bool
      // 
      // getPredicate (contramap length (Predicate odd)) "sanc"
      // False


      // S.map (S.head) (S.Just ([S.Just ("y"), S.Nothing]))

      // S.pipe ([S.map (S.head) ]) (S.Just ([S.Just ("y"), S.Nothing]))
      // Just (Just (Just ("y")))

      // S.pipe ([S.map (S.head), S.join ]) (S.Just ([S.Just ("y"), S.Nothing]))
      // Just (Just ("y"))

      
      // S.map (S.map (Math.sqrt)) (S.Just([1, 4, 9]))
      // Just ([1, 2, 3])

      // from sanctuary.org site scripts
      // https://github.com/sanctuary-js/sanctuary-site/blob/gh-pages/adt/Html.js

      const xt1 = S.isJust (xt)

      if (xt1) {
        const xt2 = S.fromMaybe ('') (xt)

        // console.log(`xt2 ${xt2}`)
      }


      // Future.fork (console.log ) (console.log) (S.encase (JSON.parse)) ('{"foo" = "bar"}')

      const logFut = caption => resolveValue => {
        console.log (`${caption}: ${resolveValue}`)
      }

      const r1 = S.I (Future.resolve)

      const answer = Future.resolve (42)
      const sluggishAnswer = Future.after (200) (43)

      const futureInstance = Future ((rej, res) => {
        // const job = setTimeout (res, 1000, 42)
        const job = setTimeout (rej, 1000, 42)
        return function cancel(){
          clearTimeout (job)
        }
      })

      // this works as async/await
      const pp1a = await Future.promise (futureInstance).then (
        s => {logFut ('pp1a resolution')
      return 1}, 
      s => {logFut ('pp1a rejection')
      return 2
    })

      console.log ('pp1a', pp1a)

      // const ff1 = Future.fork (logFut ('rejection')) (logFut ('resolutionx')) (Future.go (function*() {
      //   const thing = yield Future.after (20) ('world')
      //   const message = yield Future.after (20) ('Hello ' + thing)
      //   return message + '!'
      // }))

      const ff1 = await Future.promise (Future.go (function*() {
        const thing = yield Future.after (20) ('world')

      //   const pp3 = await Future.promise (futureInstance).then (
      //     s => {logFut ('pp3 resolution')
      //   return 1}, 
      //   s => {logFut ('pp3 rejection')
      //   return 2
      // })
  
      //   console.log ('pp3', pp3)
  


        const message = yield Future.after (20) ('Hello ' + thing)
        return message + '!'
      })).then (
        s => {logFut ('ff1 resolution')
      return 10}, 
      s => {logFut ('ff1 rejection')
      return 20
    })

      console.log ('ff1', ff1)



      const pp2 = await Future.promise (futureInstance).then (
        s => {logFut ('pp2 resolution')
      return 1}, 
      s => {logFut ('pp2 rejection')
      return 2
    })

      console.log ('pp2', pp2)



      // const fiAnswer = Future.resolve (42)

      // const ans1 = futureInstance (answer)


      // const Future = fork => ({fork});

      // Future((rej, res) => res(1)).fork(
      //   console.error, console.log
      // );

      const consume = Future.fork (reason => {
        console.error ('The Future rejected with reason:', reason)
      }) (value => {
        // console.log ('The Future resolved with value:', value)
        logFut ('The Future resolved with value:') (value)
      })

      // consume (answer)
      consume (sluggishAnswer)


      // const slowAnswer = Future.after (23668200) (42)
      // const consume2 = Future.value (logFut ('resolution'))
      // const unsubscribe = consume2 (slowAnswer)

      // setTimeout (unsubscribe, 3000)

      // const slowAnswer = Future.after (23668200) (42)
      // const consume2 = Future.value (logFut ('resolution'))
      // const unsubscribe = consume2 (slowAnswer)

      // setTimeout (unsubscribe, 3000)

      // Future.fork (logFut ('rejection')) (logFut ('resolution')) (Future.after (20) (42))

      // const pp1 = await Future.promise (Future.resolve (42)).then (logFut ('resolution'))

      // this works as async await
      // const pp1 = await Future.promise (Future.after (5000) (42)).then (logFut ('resolution1'))

      function resolveAfter2Seconds() {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve('resolved after 2 secs');
          }, 2000);
        });
      }

      // const result = await resolveAfter2Seconds();

      // const ppp = Future.encase (_ => Future.promise (Future.after (5000) (42))) ('123')
      const ppp = Future.encaseP (_ => resolveAfter2Seconds()) ('123')

      // const f1 = await Future.fork (logFut ('rejection f1')) (logFut ('resolution f1')) (ppp)
      // const f1 = await Future.fork (logFut ('rejection f1')) (logFut ('resolution f1')) (ppp)

      // console.log('f1', f1)
      
      
      
      // const f1 = await Future.fork (logFut ('rejection')) (logFut ('resolution')) (Future.go (function*() {
      //   const thing = yield Future.after (20) ('world')
      //   const message = yield Future.after (20) ('Hello ' + thing)
      //   return message + '!'
      // }))

      console.log('after fork')

    }

    const t = await testingSanctuary()


    const searchSegmentForSeasonInfo = segment => {
      const seasonSegments  = segment.match(seasonSegmentRegex) || []
      const episodeSegments = segment.match(episodeNumberRegex) || []

      const seasonInfoFound = seasonSegments.length > 0 || episodeSegments.length > 0

      return {
        seasonInfoFound,
        seasonSegments,
        episodeSegments
      }
    }

    const seasonDetails = seasonInfoItems => {
      let seasonNumber = 0, episodeNumber = 0;
      const seasonInfoFound = seasonInfoItems.length > 0;

      if (seasonInfoFound) {
        const firstSeasonInfoItem = seasonInfoItems[0]

        const seasonSegment = firstSeasonInfoItem.seasonSegments[0] || '';
        const episodeSegment = firstSeasonInfoItem.episodeSegments[0] || ''

        seasonNumberMatches  = seasonSegment.match(seasonNumberRegex) || []
        seasonNumber = +(seasonNumberMatches[0]) || 0
        episodeNumber = +(episodeSegment) || 0
      }

      // const aa = S.parseInt (10) (seasonNumber)

      return { seasonNumber, episodeNumber }
    }

    const seasonDetailsAlt = seasonInfoItems => {
      let seasonNumber = 0, episodeNumber = 0;
      const seasonInfoFound = seasonInfoItems.length > 0;

      if (seasonInfoFound) {
        const firstSeasonInfoItem = seasonInfoItems[0]

        seasonNumber =  
          
        // Sanctuary pipe
          // S.pipe([ 
          //   S.maybe ([]) (seg => seg.match(seasonNumberRegex) || []), 
          //   S.head,
          //   S.maybe (0) (mat => +(mat))
          // ])

          // reduceRight pipe
          pipe(
            S.maybe (0) (mat => +(mat)),
            S.head,
            S.maybe ([]) (seg => seg.match(seasonNumberRegex) || [])
          )
          
          // Sanctuary pipe reverse
          // pipe_([
          //   S.maybe (0) (mat => +(mat)),
          //   S.head,
          //   S.maybe ([]) (seg => seg.match(seasonNumberRegex) || [])
          // ])
          (S.head (firstSeasonInfoItem.seasonSegments))

          episodeNumber = 
            S.maybe (0) (s => +(s)) 
              (S.head (firstSeasonInfoItem.episodeSegments))
        }

      return { seasonNumber, episodeNumber }
    }

    // refactor pipeLine as S.map ...

    const pipeLine = pipe(
      infoItems    => seasonDetailsAlt(infoItems),
      segmentItems => segmentItems.filter(item => item.seasonInfoFound), 
      segments     => segments.map(searchSegmentForSeasonInfo))

    const { seasonNumber, episodeNumber } = pipeLine(textSegments)
    

    const { seasonNumber: x1, episodeNumber: y1 } =
      seasonDetails(
        textSegments
        .map(searchSegmentForSeasonInfo)
        .filter(item => item.seasonInfoFound)
      )

    const textSegmentWithSeasonInfoItems =    textSegments.map(searchSegmentForSeasonInfo)
    const seasonInfoItems = textSegmentWithSeasonInfoItems.filter(item => item.seasonInfoFound)
    // const {seasonNumber, episodeNumber} =                  seasonDetails(seasonInfoItems)
    const { seasonNumber: x, episodeNumber: y } =                  seasonDetailsAlt(seasonInfoItems)



    programmeName = regexMatchSingleItem(fileName, regexFileName, 'no file name');
    programmeDate = regexMatchSingleItem(fileName, regexDate, '_00000000_');

    var dateInfo = programmeDate.slice(1, programmeDate.length-1);
    var year = dateInfo.slice(0, 4);
    var mon = dateInfo.slice(4, 6);
    var day = dateInfo.slice(6, 8);
    //console.log("date:", year, mon, day);

    const fileTime = regexMatchSingleItem(fileName, regexTime, '0000');
    //console.log("Date:", fileDate.toDateString());
    //console.log("Prog:", fileName, fileDate.toDateString(), fileTime);
    //console.log(fileTime);

    const hours = fileTime.slice(0, 2)
    const mins = fileTime.slice(2, 4)

    const formattedTime = `${hours}:${mins}`

    const fileDate = new Date(`${mon} ${day} ${year} ${formattedTime}:00`);
    // fileDate.setFullYear(year);
    // fileDate.setMonth(mon - 1);
    // fileDate.setMonth(mon);
    // fileDate.setDate(day);

    const videoItem = {
      fileName,
      programmeName,
      date: fileDate,
      time: formattedTime,
      guidance,
      summary, 
      seasonNumber, 
      episodeNumber
    };

    return videoItem;
  }));

  videoList.sort(function (a, b) {
    if (a.seasonNumber > b.seasonNumber) {
      return 1;
    }

    if (a.seasonNumber < b.seasonNumber) {
      return -1;
    }

    if (a.episodeNumber > b.episodeNumber) {
      return 1;
    }

    if (a.episodeNumber < b.episodeNumber) {
      return -1;
    }

    if (a.date > b.date) {
      return 1;
    }
    if (a.date < b.date) {
      return -1;
    }

    if (a.time > b.time) {
      return 1;
    }

    if (a.time < b.time) {
      return -1;
    }

    return 0;
  });

  callback(null, videoList);
}

const folderIndex = 5;
// const folderIndex = 4;
// const folderIndex = 2;
// const folderIndex = 1;

getFolderSortedList(folderIndex, function (err, list) {

  if (err) {
    console.log("nn - error")

    return
  }

  // list.forEach(function (fileInfo)
  for (const fileInfo of list) {
    const {fileName, programmeName, date, time, guidance, summary, seasonNumber, episodeNumber} = fileInfo

    //console.log("file:", file);
    console.log(`\n${fileName} - ${date.toDateString()} - ${time}\n`);

    console.log(`Programme: ${programmeName}\nDate: ${date.toDateString()}\nTime: ${time}\n`);
    console.log(`Guidance: ${guidance}\nSummary: ${summary}\n`);
    console.log(`Season: ${seasonNumber}\nEpisode: ${episodeNumber}\n`);
  };

  for (const fileInfo of list) {
    const { seasonNumber, episodeNumber } = fileInfo

    console.log(`S${seasonNumber} ${episodeNumber} `)
  }
});


