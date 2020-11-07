const fs    = require('fs')
const path  = require ('path');
const righto = require('righto');
const async = require('righto')

const S     = require('sanctuary')

const exit0 = require ('./exit0');
const exit1 = require ('./exit1');
// const join          = require ('./common/join');

// Given a path to a directory containing an index file, index.txt, and zero or more other files, read the index file (which contains one filename per line), then read each of the files listed in the index concurrently, concat the resulting strings (in the order specified by the index), and write the result to stdout.

//  join :: String -> String -> String
const commonJoin = S.curry2 (path.join);

const readFileAsync = (filename, callback) =>
  fs.readFile (filename, {encoding: 'utf8'}, callback);

const main = () => {
  const path = commonJoin (process.argv[2]);

  // non-working example from righto readme
  // const initialFileRighto = righto (fs.readFile, 'utf8', path('testFiles.txt'))

  // working versions (used for non-reducer version)
  // 
  // const initialFileRighto = righto (readFileAsync, path('testFiles.txt'))
  // const initialFileRighto = righto (fs.readFile, path('testFiles.txt'), {encoding: 'utf8'})
  
  const readSecondaryFiles = (fileNames, cb) => {
    const fileRightos = S.pipe ([
        S.lines
      , S.map (path)
      , S.map (fileName => righto (readFileAsync, fileName))
    ]) (fileNames)

    // righto.sync is equivalent to S.pipe for rightos and normal synchronous fns
    const finalResultsRighto = righto.sync (S.joinWith (''), righto.all(fileRightos))

    // return righto
    cb (null, finalResultsRighto)

    // return resolved result
    // 
    // finalResultsRighto((err, result) => {
    //   if (err) {
    //     cb(err)
    //   }
    
    //   console.log("result:", result)

    //   cb(null, result)
    // })
  }

  // reducer version
  // 
  const reduceResultRighto = righto.reduce(
    [readFileAsync, readSecondaryFiles], 

    (result, next) => {
      return righto(next, result)
    }
    
    , path('testFiles.txt'))

  reduceResultRighto((err, result) => {
    if (err) {
      exit1(err)
    }

    result((err, result) => {
      if (err) {
        exit1(err)
      }
  
      console.log("result:", result)

      exit0(result)
    })
  })

  // non-reducer version

  // const processAllFileReads = (initialFileRighto, cb) => {
  //   const secondaryFilesRighto = righto (readSecondaryFiles, initialFileRighto)

  //   secondaryFilesRighto((err, finalResultsRighto) => {
  //     if (err) {
  //       cb(err)
  //     }
    
  //     console.log("fr:", finalResultsRighto)

  //     finalResultsRighto((err, result) => {
  //       if (err) {
  //         cb(err)
  //       }
      
  //       console.log("result:", result)
  
  //       cb(null, result)
  //     })
  //   })
  // }
  
  // const processAllFileReadsRighto = righto (processAllFileReads, initialFileRighto)

  // processAllFileReadsRighto ((err, result) => {
  //   if (err) {
  //     exit1(err)
  //   }

  //   console.log("result:", result)

  //   exit0(result)
  // })
  
  

  // test code

//   var task1 = righto(function(done){
//     setTimeout(function(){
//         done(null, 'a');
//     }, 2000);
// });
 
// var task2 = righto(function(done){
//     setTimeout(function(){
//         done(null, 'b');
//     }, 1000);
// });
 
// var task3 = righto(function(done){
//     setTimeout(function(){
//         done(null, 'c');
//     }, 5000);
// });
 
// var all = righto.all([task1, task2, task3]);
 
// all(function(error, results){
//   console.log(results)
//      // -> ['a','b','c']
//     // results; // -> ['a','b','c']
// });

};

main()
