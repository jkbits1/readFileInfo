const fs    = require('fs')
const path  = require ('path');

const S     = require('sanctuary')

const exit0 = require ('./exit0');
const exit1 = require ('./exit1');
// const join          = require ('./common/join');

// Given a path to a directory containing an index file, index.txt, and zero or more other files, read the index file (which contains one filename per line), then read each of the files listed in the index concurrently, concat the resulting strings (in the order specified by the index), and write the result to stdout.

//  join :: String -> String -> String
const commonJoin = S.curry2 (path.join);

//  readFile :: String -> ((Error?, String?) -> Undefined) -> Undefined
const readFile = filename => callback =>
  fs.readFile (filename, {encoding: 'utf8'}, callback);

const main = () => {
  const path = commonJoin (process.argv[2]);

  const x = readFile (path('testFiles.txt')) ((err, data) => {
    if (err) throw err;

    console.log("data: ", data);

    const fileNames = S.pipe ([
      S.lines,
      S.map (path),
      ]) 
      (data)

    console.log ('filename', fileNames[0])

    console.log(`fileNames: ${S.show (fileNames)}`)
    console.log()

    const contents = []
    let filesRead = 0
    
    fileNames.forEach ((fileName, fileIndex) => {
        readFile (path(fileName)) ((err, data) => {
        filesRead += 1
  
        if (err) {
          exit1(S.joinWith('') (contents))

          throw err
        };
  
        contents[fileIndex] = data

        console.log("contents: ", contents, fileIndex);

        if (filesRead === 3) {
          exit0 (S.joinWith('') (contents))
        }
      })
    })

    // do {
    //   const f = () => {
    //     if (filesRead >= 1) {
    //       console.log("contents so far: ", contents);
    //     }
    //   }

    //   setTimeout(f, 1500, 'no data');
    // } while (filesRead <= 1) 


  })

};

main()
