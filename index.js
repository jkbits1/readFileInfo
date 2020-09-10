const fs = require('fs').promises;
const path = require('path');
const S = require('sanctuary')

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

  // try {
  const files = await fs.readdir(folder).catch(() => {
    // console.error(err);
    console.error('files not found');

    return callback(undefined);
  })
    // }

  const hmtFiles = files.filter(function (file) {
    if (path.extname(file) === filterExtension) {
      return true;
    }
    else {
      return false;
    }
  });

  const videoList = await Promise.all(hmtFiles.map (async function (fileName) {
    const textSegmentRegex    = /(?<=\u0010i7)(.*?)(?=\u0000)/g;
    const seasonSegmentRegex  = /(?<=[(]S)(.*?)(?=[)])/g;
    const seasonNumberRegex  = /([0-9]+)(?=\s)/g;
    // const episodeNumberRegex  = /(?<=Ep\s)([0-9]*)/g; 
    const episodeNumberRegex  = /(?<=(Ep))(?:\s*)([0-9]*)/g; 
    // (S6 Ep7/22)

    const regexFileName       = /[a-zA-Z\s\-]*/;
    const regexDate           = /_[0-9]*_/; // date plus underscores
    // const regexTime           = /[0-9]*[.]/; 
    const regexTime           = /[0-9]*(?=[.])/; 
    // var fileName      = undefined;

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

    console.log(`${fileName}\n`)
    // console.log("\ntext segments")
    // for (const segment of textSegments) {
    //     console.log(segment)
    // }

    const guidanceIndex = 0, summaryIndex = 2

    const guidance = !!(textSegments[guidanceIndex]) ? textSegments[guidanceIndex] : ''
    const summary = !!(textSegments[summaryIndex]) ? textSegments[summaryIndex] : ''

    console.log(`Guidance: ${guidance}\n`)    
    console.log(`Summary: ${summary}`)

    const searchSegmentForSeasonInfo = segment => {
      const seasonSegments = segment.match(seasonSegmentRegex) || []

      const seasonInfoFound = seasonSegments.length > 0

      return {
        seasonInfoFound,
        seasonSegments
      }
    }

    const pipe = (...pips) => x => pips.reduceRight((prev, fn) => fn(prev), x)

    const pipeLine = pipe(
      ts => ts.filter(item => item.seasonInfoFound), 
      ts => ts.map(searchSegmentForSeasonInfo))

    const p1 = pipeLine(textSegments)
    
    const textSegmentWithSeasonInfoItems = textSegments.map(searchSegmentForSeasonInfo)

    const seasonInfoItems = textSegmentWithSeasonInfoItems.filter(item => item.seasonInfoFound)

    console.log("\nSeason info")

    const seasonDetails = seasonInfoItems => {
      const seasonInfoFound = seasonInfoItems.length > 0;
      let seasonNumber = 0, episodeNumber = 0;

      if (seasonInfoFound) {
        const seasonSegment = seasonInfoItems[0].seasonSegments[0];

        seasonNumber  = +(seasonSegment.match(seasonNumberRegex)[0])  || 0 
        episodeNumber = +(seasonSegment.match(episodeNumberRegex)[0]) || 0
      }

      // const aa = S.parseInt (10) (seasonNumber)

      return { seasonNumber, episodeNumber }
    }

    const {seasonNumber, episodeNumber} = seasonDetails(seasonInfoItems)

    console.log(`S: ${seasonNumber} E: ${episodeNumber}\n\n`)

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

const folderIndex = 2;

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


