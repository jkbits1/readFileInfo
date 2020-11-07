const fs = require('fs')
const path          = require ('path');

const S = require('sanctuary')

const exit0         = require ('./exit0');
const exit1         = require ('./exit1');
// const join          = require ('./common/join');


//  join :: String -> String -> String
const commonJoin = S.curry2 (path.join);

const readFile = filename => {
  try {    
    const contents = fs.readFileSync (filename, {encoding: 'utf8'});

    return contents
  } catch (err) {
    exit1 (err);
  }
};

const main = () => {
  // const path = join (process.argv[2]);
  const path = commonJoin (process.argv[2]);
  const x = S.pipe ([path,
           readFile,
           S.lines,
           S.map (path),
           S.map (readFile),
           S.joinWith (''),
           exit0
          ])
         ('testFiles.txt');

  console.log(`done: ${S.show (x)}`)
  console.log()
};

main()
