const fs    = require('fs');
// const { await } = require('most');
const path  = require ('path');

const { bindNodeCallback, from, of, Subject } = require('rxjs')
const { filter, flatMap, map, mergeAll, reduce, scan } = require('rxjs/operators')

// const bluebird = require('bluebird')

// const S     = require('sanctuary')
const {create, env, lines} = require ('sanctuary');
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

// const join          = require ('./common/join');

const { ArrayQueue, AsyncQueue } = require ('./ArrayQueue');
const { buffer } = require('rxjs/operators');
const { await } = require('most');

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

const readFileAsObservable = bindNodeCallback(fs.readFile)
const readFileUtf8 = fileName => readFileAsObservable (fileName, 'utf8')

const getFile = fileName => {
  return readFileP(fileName).then(data => data)
}
  
const main = async () => {
  const path = commonJoin (process.argv[2]);

  const q = new ArrayQueue()

  q.enqueue ('a')

  const mergeValues = async () => {
    // NOTE: a failure here causes an unhandled rejection error for the later 
    //       await calls
    const data = await readFileP (path('testFiles.txt'))
    // const data = await readFileP2 (path('testFiles.txt'))

    console.log("co data:", data)
    console.log()

    // return data

    const filePromises = S.pipe ([
      S.lines
    , S.map (path)
    , S.map (readFileP)
    // , yield Promise.all.bind(Promise)
    ])
    (data)

    const results = await Promise.all(filePromises)

    return S.joinWith ('') (results)
  }

  // various examples, inc. file stream lines 
  //    very good but almost too in-depth
  // 
  // https://2ality.com/2016/10/asynchronous-iteration.html
  // 
  // implemented


  // clear examples for creating async iterable
  //     can re-purpose these for this example
  //           also for simpler version of file stream lines
  // 
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of

  // kind of the reverse use of for await of - short and clear
  //      promise.all example seems very relevant for this example
  // 
  // https://2ality.com/2017/12/for-await-of-sync-iterables.html

  // NOTE: fn enhanced to populate Rx Subject if one is provided
  // 
  // :: String -> async iterable
  const readFileStream = subject => fileName => {
    const queue = new AsyncQueue()

    const readStream = fs.createReadStream(fileName, {encoding: 'utf8', bufferSize: 256})

    readStream.on('data', str => {
      // break up str so that the queue contains multiple chunks
      // then re-add newlines
      const lines2 = S.pipe ([S.lines, S.map (s => s + '\n')]) 
      (str)

      if (subject) {
        lines2.forEach (line => subject.next(line))
      }
      else{
        lines2.forEach (line => queue.enqueue(line))
      }
      // queue.enqueue(str)
    })

    readStream.on('end', () => {
      if (subject) {
        subject.complete()
      }

      queue.close()
    })

    readStream.on('error', (err) => {
      console.log (err)
  
      exit1 (err)
    })

    return queue
  }

  const linesInfo = s => {
    const lines = S.lines (s)

    const lineBreakAtEndOfChunk = /[\r\n]$/.test(s)
    const newTextSoFar = lineBreakAtEndOfChunk ? '' : 
      S.pipe ([S.last , S.fromMaybe ('')]) (lines)
    const indexAdjustment = lineBreakAtEndOfChunk ? 0 : 1;
    
    return {
      lines
    // , lineBreakAtEndOfChunk
    , newTextSoFar
    , indexAdjustment
    }
  }

  function textTransformAsyncIterable (textAsyncIterable) {
    // NOTE: the code from slides is refactored to work with an 
    //       async iterable (not an async iterator) as for await for
    //       works with an iterable. 
    //       It seems possible to use an async iterator (as slides suggest)
    //       if the loop worked by yield'ing values from .next() instead.
    // 
    // Use slides Async Map to lowercase chunks 
    // https://docs.google.com/presentation/d/1r2V1sLG8JSSk8txiLh4wfTkom-BoOsk52FgPBy8o3RM/edit#slide=id.g1236b1e2d6_0_234
    // 
    // Slide 38 (map, filter, flatMap)

    // standard js fn version
    // asyncIteratorMap :: (async iterable, fn) -> async iterable
    async function* asyncIteratorMap (asyncIterable, fn) {
      for await (const item of asyncIterable) {
        yield fn (item)
      }
    }

    // curried version
    // asyncIteratorMap2 :: async iterable -> fn -> async iterable
    const asyncIteratorMap2 = asyncIterable => async function* (fn) {
      for await (const item of asyncIterable) {
        yield fn (item)
      }
    }

    // flipped version works elegantly with pipe below
    const asyncIteratorMap2Flipped = S.flip (asyncIteratorMap2)

    const p = Object.getPrototypeOf(textAsyncIterable)

    // textAsyncIterable.map = // the non-prototype version works, too
    p.map = 
      // :: fn -> async iterable
      async function* (fn) {
        for await (const item of this) {
          yield fn (item)
        }
      }

    //       upperCaseChunks :: asyncIterable
    // const upperCaseChunks = textAsyncIterable.map (S.toUpper)

    //       lowerCaseChunks :: asyncIterable
    // const lowerCaseChunks = asyncIteratorMap2 (upperCaseChunks) (S.toLower)
    // const lowerCaseChunks = asyncIteratorMap (upperCaseChunks, S.toLower) // works

    const pipe = (...pips) => x => pips.reduce((prev, fn) => fn(prev), x)

    // doesn't work, not exactly sure why
    // const xChunks1 = pipe (
    //   textAsyncIterable.map
    // // , S.flip (asyncIteratorMap2) (S.toLower)
    // )
    // (S.toUpper)

    //    mappedChunks :: asyncIterable
    const mappedChunks = pipe (
    //   S.flip (asyncIteratorMap2) (S.toUpper)
    // , S.flip (asyncIteratorMap2) (S.toLower)
      asyncIteratorMap2Flipped (S.toUpper)
    , asyncIteratorMap2Flipped (S.toLower)
    )
    (textAsyncIterable)

    return mappedChunks
  }

  // NOTE: as text transformation is performed in another
  //       fn, this fn no longer needs to be a generator fn.
  //       Although, it may be useful to catch stream/file errors.
  // 
  // splitLines :: async iterable -> async iterable
  // async function* splitLinesForRx (chunksAsync) {
  function splitLinesForRx (chunksAsync) {
    const mappedChunks = textTransformAsyncIterable (chunksAsync)

    return mappedChunks

    // try {
    //   // :: async iterable
    //   for await (const chunk of 
    //     // chunksAsync
    //     mappedChunks
    //     ) {
    //     yield chunk
    //   }
    // }
    // catch (err) {
    //   console.log (err)
  
    //   exit1 (err)
    // }
  }


// splitLines :: async iterable -> async iterable
  async function* splitLines (chunksAsync) {
    let textSoFar = ''

    try {
      for await (const chunk of chunksAsync) {
        // build up text until line break found or no more text
        textSoFar += chunk

        // handle any line breaks in new chunk
        if (textSoFar.indexOf('\n') >= 0) {
          // S.lines
          // 
          // '\r\n'   ['']          yield all
          // 'x\r\n'  ['x']         yield all
          // '\r\ny'  ['', 'y']     yield excl. last line

          const {
            lines
          , newTextSoFar
          , indexAdjustment
          } = linesInfo(textSoFar)

          for (let count = 0; count < (lines.length - indexAdjustment); count++) {
            // NOTE: as with promises usually, it isn't possible to 
            // return a promise of a promise
            // So, any created promises are evaluated upon creation and the 
            // next step receives the actual result.
            // 
            // NOTE: the above isn't the case for Observables.
            // 
            yield lines[count] // :: String
            // yield of (lines[count], lines[count]) // :: String
            // yield of (lines[count]) // :: String

            // 
            // const filePromise = 
            //   readFileP (lines[count]) // :: Promise String
            // yield filePromise

            // const fileObservable = 
            //   readFileUtf8 (lines[count]) // :: Observable String
            // yield fileObservable
          }

          textSoFar = newTextSoFar
        }
      }
    }
    catch (err) {
      console.log (err)
  
      exit1 (err)
    }

    if (textSoFar.length > 0) {
      // NOTE: if yield'ing promise, observable etc. above, do so here, too.
      yield textSoFar
    }
  }

  // :: String -> async iterable
  const readLines = subject => fileName => {
    const queue // :: async iterable
      = readFileStream(subject) (fileName)

    // NOTE: skip this step as working towards stream
    //       populating Rx pipe directly
    // 
    // const linesAsyncIterable // :: async iterable      
    //   = // splitLines
    //     splitLinesForRx
    //       (queue) // async gen fn returns async iterable

    // return linesAsyncIterable
    return queue
  }

  const subject = new Subject()

  const linesAsyncIterable = readLines (subject)
    // ('./asyncForAwaitOf.js')
    ('./testFiles.txt')

  // alternative to for await of
  // const linesAsyncIterator = linesAsyncIterable[Symbol.asyncIterator]()

  // test of iterator
  // 
  // linesAsyncIterator.next().then(iteratorResult => {
  //   console.log ('first line:', iteratorResult.value)
  // })

  // const results = []
  // let done = false

    // async iterable - code without syntactic sugar
    // do {
    //   const iteratorResult = await linesAsyncIterator.next().catch (err => {
    //     console.log (err)
    
    //     exit1 (err)
    //   })

    //   const { value: line } = iteratorResult

    //   done = iteratorResult.done

    //   if (done === false){
    //     results.push (line)

    //     console.log('line:', line)
    //   }
    // } while (done === false)

  // const result = S.joinWith ('') (results)

  // console.log('result:', result)


  // const linesAsyncIterable2 = readLines
  // // ('./asyncForAwaitOf.js')
  // ('./testFiles.txt')

  // const resultRx = from(linesAsyncIterator)
  // .pipe(reduce((prev, current) => {
  //   const newPrev = prev + current

  //   return newPrev
  // }, ''))

  const tap = map (s => {
    return s
  })

  const subscribeSuccessHandler = x => {
    console.log(x)
  }

  const subscribeErrorHandler = e => {
    console.error(e)

    exit1 (e)
  }

  const subscribePlus = x => {
    console.log("subscribe:", x)

    if (x.subscribe) {
      x.subscribe(
        subscribeSuccessHandler, 
        subscribeErrorHandler)
    }
    else if (Array.isArray(x)) {
      x.forEach(obs => 
        obs.subscribe(
          subscribeSuccessHandler, 
          subscribeErrorHandler)
      )
    }
  }

  const o1 = subject.asObservable()

  const x = o1.pipe(
    // NOTE: for Rx version of behaviour, merge stream chunks
    //       into lines this scan()
    scan ((prev, currentChunk) => {
      // NOTE: see splitLines() above for notes on this fn
      const textSoFar       = prev.textSoFar + currentChunk
      const lineBreakInText = textSoFar.indexOf('\n') >= 0

      if (lineBreakInText) {
        const { lines, newTextSoFar } = linesInfo(textSoFar)

        return { textSoFar: newTextSoFar, lines }
      }

      return { textSoFar, lines: [] }
    }, 
    { textSoFar: '', lines: [] } 
    )                                   // Observable Object
  // , filter (item => item.lines.length && item.lines.length > 0)
                                        // Observable Object
  // , map (item => item.lines)            // Observable (Array String)    
  // , filter (line => line.length > 0)    // Observable (Array String)
  // , map (lines => from (S.map (readFileUtf8) (lines)))
  // 
  // translates to:
  // 
  // NOTE: each line becomes an observable value/string
  //      (rather than an observable that has an array of strings as its value)
  , flatMap (item => {
      // NOTE: just as a thought, should an empty lines array return immediately?

      const observableOfFileObservables = S.pipe ([
        S.filter (line => line.length > 0)  // Array String                    
      , S.map (readFileUtf8)                // Array (Observable String)       
      , from                                // Observable (Observable String)
      ])
      (item.lines)                          

      return observableOfFileObservables    
    })                                      // Observable (Observable String)

  , mergeAll()                              // Observable String
  , reduce ((prev, current) => {
      const newPrev = prev + current
  
      return newPrev
    }, '')                                  // Observable String
  )

  x.subscribe(subscribePlus, subscribeErrorHandler)
  
  // subscribe to a standard Subject
  // 
  // subject.subscribe({
  //   next: value => {
  //     console.log('rx result:', value)
  //     console.log()    
  //   }
  // })

  // subject.next(1)

  // console.log('rx result:', resultRx)
  // console.log()



  // exit0 (result)

  // NOTE: Rx Subject now populated directly from stream
  // 
  // Populate Subject/Observable with async iterable results
  // 
  // for await of on async iterable
  for await (const line of linesAsyncIterable)
  {
    // NOTE: if async iterable returns a promise, can we await it here?
    //       Also, maybe refactor for await of using .next() as a form of reduce?
    //       Maybe use for await of as a form of reduce?
    console.log ('line:', line)

    // NOTE: subject now populated during stream read
    // subject.next(line)
  }

    // NOTE: subject now populated during stream read
    // subject.complete()

  // without .then(), x contains the result (not in a promise)
  // const x = await mergeValues()
  // // .then (exit0, exit1)

  // .then 
  // (data => {
  //   console.log(`wr data: ${data}`)
  //   console.log()
  // })
  // .catch(exit1)

  // const m = most.fromPromise (Promise.resolve('testFiles.txt'))

  // console.log(`results: ${results}`)
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
  // .then (exit0, exit1)
  // // .then (exit0)
  // (data => {
  //   console.log(`wr data: ${data}`)
  //   console.log()
  // })
  // .catch(exit1)
