const fs = require('fs')
const path          = require ('path');

const S = require('sanctuary')
const miss = require('mississippi')
const split = require('split2')

const exit0         = require ('./exit0');
const exit1         = require ('./exit1');
// const { splitOn } = require('sanctuary');

//  readFile :: String -> ((Error?, String?) -> Undefined) -> Undefined
const readFile = filename => callback =>
  fs.readFile (filename, {encoding: 'utf8'}, callback);


//  join :: String -> String -> String
const commonJoin = S.curry2 (path.join);

const main = () => {
  const path = commonJoin (process.argv[2]);

  // const s1 = fs.createReadStream(path('testFiles.txt'), {encoding: 'utf8'})
  const s1 = fs.createReadStream(path('testFiles.txt'))

  let results = ''

  const through = (line, encoding, next) => each (line, next)

  const each = (line, next) => {
    // console.log('line: ', line)

    results += line

    next()
  }

  const parThrough = (line, next) => {
    // console.log('line: ', line)

    readFile (path(line)) (next)
    //   ((err, data) => {
    //   if (err) {
    //     // exit1(err)
    //     next(err)
    //   }

    //   next(null, data)  
    // })
  }

  const done = err => {
    if (err) {
      exit1(err)
    }

    exit0 (results)
  }

  const completed = done => {
    done (null)

    exit0 (results)
  }


  miss.pipe (
      s1
    , split()
    , miss.parallel(5, parThrough)
    , miss.through(through, completed)
    )

  // const p1 = miss.pipeline (s1, split())
  
  // const x = 
  //   // miss.pipe(
  //   //   s1, split(),

  //   // TODO use miss.parallel

  //   miss.each(
  //     p1,
  //     each
  //     , done
  //   )
  // )

  // S.pipe ([path,
  //          readFile,
  //          S.lines,
  //          S.map (path),
  //          S.map (readFile),
  //          S.joinWith (''),
  //          exit0
  //         ])
  //        ('testFiles.txt');

  // console.log(`done: ${S.show (x)}`)
  console.log()
};

main()
