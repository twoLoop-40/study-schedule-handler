// 폴더 이름 만들기
const makeUserFolderName = nameTemplate("_");

// 시작 폴더 찾기
const getRootFolder = function () {
  return DriveApp.getFolderById(location.focusRoot);
};
// 사용자 폴더가 있는지 확인하기
// root폴더의 파일 이터레이터를 받아서 이름이 있는 지 체크하는 함수
const checkFolder = function ({ userName = "", userCode = "" } = {}) {
  // folderName을 받고 폴더 이터레이터를 받아서 이름이 있는지 검사하는 함수
  const checkName = (folderName) => (folderIter) => {
    while (folderIter.hasNext()) {
      const folder = folderIter.next();
      if (folder.getName() === folderName) {
        return true;
      }
    }
    return false;
  };
  if (
    checkName(makeUserFolderName({ userName, userCode }))(
      getRootFolder().getFolders()
    )
  ) {
    return null;
  } else {
    return { userName, userCode };
  }
};
// 시작 폴더 아래 사용자 폴더 만들기
// 사용자 코드와 사용자 이름을 변수로 받아서 폴더를 만들고 그 폴더를 리턴
const makeUserFolder = function (userInfo = {}) {
  if (!userInfo) return "이미 폴더가 있습니다.";
  const { userName, userCode } = userInfo;
  const userFolderName = makeUserFolderName({ userName, userCode });
  getRootFolder().createFolder(userFolderName);
  return `${userInfo.userName}의 폴더를 생성하였습니다.`;
};
// 두 함수 합치기, 체크하고 만들기
const userFolder = pipe(checkFolder, makeUserFolder);

/********* 진단문제를 골라서 원하는 학생의 폴더로 카피하는 함수 ***********/
// { userInfo, round } 에서 examCodes 뽑기
const dateToStr = function (date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
};
// { userInfo, round } -> generatingDate
const dateAtGenerate = function (userData = {}) {
  return pipe(
    (data) => {
      // 스케줄 매니저 불러오기
      const { userInfo } = data;
      const sms = new ScheduleManagerServer(userInfo);
      return { ...data, sms };
    },
    (data) => {
      // 스케줄 매니저 이용해서 시트 부르고 라운드 인수 사용해서 generatingData 리턴
      const { sms, round } = data;
      const sheet = sms.getScheduleSheet();
      const roundRow = sms.scheduleRowNumber(round);
      const date = sheet
        .getRange(roundRow, columunNumbers.GENERATING_DATE, 1, 1)
        .getValue();
      const generatingDate = dateToStr(date).join("-");
      return generatingDate;
    }
  )(userData);
};

const getExamCodes = function ({ userInfo, round }) {
  // 시트 만들기
  const sms = new ScheduleManagerServer(userInfo);
  const sheet = sms.getScheduleSheet();
  const roundRow = sms.scheduleRowNumber(round);
  // 끝이 0으로 끝나는 exam codes 뽑기
  const examRange = sheet.getRange(
    roundRow,
    columunNumbers.EXAM_START,
    1,
    columunNumbers.EXAM_END - columunNumbers.EXAM_START + 1
  );
  return pipe(
    (examRange) => {
      const codes = examRange.getValues()[0]; // [][] 이므로 하나만 뽑기
      const status = examRange.getBackgrounds()[0]; // [][] 이므로 하나만 뽑기
      return { codes, status };
    },
    (examData) => {
      const { codes, status } = examData;
      const statusStrs = status.map((colorStr) =>
        shiftFromColorToStatus(colorStr)
      ); // status를 문자로 바꿈
      //console.log(codes, status)
      return codes
        .filter((examCode, idx) => statusStrs[idx] === "생성")
        .map((examCode) => examCode.toString())
        .filter((examCode) => examCode.slice(-1) == "0");
    }
  )(examRange);
};
// examcodes 를 폴더 넘버와 파일 넘버로 분해
const divideExamCode = function (examCode) {
  // set up number of exam code
  let trackNo, setNo, seriesId;
  pipe(
    (code) => {
      trackNo = code.slice(-1);
      return code.slice(0, -1);
    },
    (code) => {
      setNo = code.slice(-2);
      return code.slice(0, -2);
    },
    (code) => (seriesId = code)
  )(examCode);
  return { seriesId, setNo, trackNo };
};
// examCodes 를 시리즈 네임과 그 시리즈에 해당하는 examcode로 정리하기
const classifyExamCodes = function ({ examCodes = [] } = {}) {
  console.log(examCodes);
  if (examCodes.length == 0) return;

  const classifiedExamCodes = examCodes
    .map((examCode) => {
      const { seriesId } = divideExamCode(examCode.toString());
      return { seriesId, examCode };
    })
    .reduce((results, { seriesId, examCode }) => {
      !results[seriesId]
        ? (results[seriesId] = [].concat([examCode]))
        : results[seriesId].push(examCode);
      return results;
    }, {});
  return Object.entries(classifiedExamCodes).map(([seriesId, examCodes]) => ({
    seriesId,
    examCodes,
  }));
};
// 주어진 폴더에서 시작해서 폴더이름이 끝날 때까지 차례대로 찾는 함수
const findFolder = function (currentFolder, folderNames = []) {
  if (folderNames.length == 0) return currentFolder;
  let resultFolder = currentFolder;
  const folders = currentFolder.getFolders();
  while (folders.hasNext()) {
    const folder = folders.next();
    if (folder.getName().indexOf(folderNames[0]) > -1) {
      console.log(folder.getName());
      resultFolder = folder;
      break;
    }
  }
  return findFolder(resultFolder, folderNames.slice(1));
};
const findFiles = function (currentFolder: GoogleAppsScript.Drive.Folder, fileNames: string[]) {
  //console.log(fileNames.forEach(fileName => typeof fileName))
  const findFile = function (fileName: string) {
    const files = currentFolder.getFiles();
    const result:GoogleAppsScript.Drive.File[] = [];
    while (files.hasNext() && result.length < 2) {
      const file = files.next();
      if (file.getName().indexOf(fileName) > -1) {
        console.log(file.getName());
        result.push(file);
      }
    }
    return result;
  };
  return fileNames
    .map((fileName) => findFile(fileName))
    .flat()
    .filter((file) => file);
};
const findFileRegs = function (currentFolder: GoogleAppsScript.Drive.Folder, fileNameRegs = []) {
  const findFile = function (fileNameReg: RegExp) {
    const files = currentFolder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      if (file.getName().search(fileNameReg) > -1) {
        console.log(file.getName());
        return file;
      }
    }
  };
  return fileNameRegs
    .map((fileNameReg) => findFile(fileNameReg))
    .filter((file) => file);
};
const targetToCopy = function () {
  const getfolderName = function (userInfo = {}) {
    return nameTemplate("_")(userInfo);
  };
  return ({ userInfo, generatingDate } = {}) => {
    const rootFolder = getRootFolder();
    return findFolder(rootFolder, [getfolderName(userInfo), generatingDate]);
  };
};
const copyFilesTo = function ({ seriesId, examCodes = [] } = {}) {
  const getSourceFolder = function () {
    return DriveApp.getFolderById(location.sourceFolder);
  };
  const sourceFolder = findFolder(getSourceFolder(), [seriesId]);
  const filesToCopy = findFiles(sourceFolder, examCodes);
  return (destinationFolder) => {
    filesToCopy.forEach((file) => file.makeCopy(destinationFolder));
  };
};
/*********************** 보조함수들 여기까지 ********************************/
/*********************** 진단문제만 카피해서 유저 폴더에 넣는 함수 ********/
const copyExamsToUserFolder = function (userData = {}) {
  // userData = { userInfo = {}, round }

  return pipe(
    (data) => {
      const { userInfo, round } = data;
      const generatingDate = dateAtGenerate({ userInfo, round });
      return { ...data, generatingDate };
    },
    (data) => {
      const examCodes = getExamCodes(data);
      return { ...data, examCodes };
    },
    (data) => {
      let examCodes = classifyExamCodes(data);
      return Object.assign(data, { examCodes });
    }, // 결과는 { userInfo, generatingDate, examCodes = [{seriesId, examCodes}]}
    (data) => {
      const getDestination = targetToCopy();
      return Object.assign(data, { getDestination });
    }, // 결과는 { userInfo, generatingDate, examCodes = [{seriesId, examCodes}], getDestination = [function]}
    (data) => {
      const { examCodes } = data;
      let copyFilers = [];
      if (examCodes) {
        copyFilers = examCodes.map((examsClassified) =>
          copyFilesTo(examsClassified)
        );
      }

      return { ...data, copyFilers };
    },
    (data) => {
      const { getDestination, copyFilers, examCodes, userInfo, round } = data;
      try {
        const destinationFolder = getDestination(data);
        copyFilers.forEach((copyFiler) => copyFiler(destinationFolder));
        let codes = [];
        if (examCodes) {
          codes = examCodes
            .map((examData) => examData.examCodes)
            .reduce(
              (examCodes, classified) => examCodes.concat(classified),
              []
            );
          //console.log(codes)
        } else {
          throw Error("업로드 할 수 있는 진단 시험이 없습니다.");
        }
        return { userInfo, round, examCodes: codes };
      } catch (err) {
        throw err;
      }
    }
  )(userData);
};

/************ 스케줄 만들 때 폴더 있는지 검사해서 없으면 만드는 함수 ******************/
const makeScheduleFolder = function (userData = {}) {
  // userData = { userInfo:{ userName:<str>, userCode:<str> }, round}
  return pipe(
    (data) => {
      const generatingDate = dateAtGenerate(data);
      return { ...data, generatingDate };
    },
    (data) => {
      const { userInfo, generatingDate } = data;
      const folderNameMaker = nameTemplate("_");
      const folderNames = [folderNameMaker(userInfo), generatingDate];
      return { ...data, folderNames };
    },
    (data) => {
      const { folderNames } = data;
      const startingFolder = getRootFolder();
      let targetFolder = findFolder(startingFolder, folderNames);
      const targetFolderName = folderNames.pop();
      if (targetFolder.getName() === targetFolderName) {
        return `${targetFolderName} 이 있습니다`;
      } else {
        // 마지막 폴더 없으면 하나 위에서 만들기
        const parentFolder = findFolder(startingFolder, folderNames);
        parentFolder.createFolder(targetFolderName);
        return `${targetFolderName} 을 만들었습니다`;
      }
    }
  )(userData);
};
/***************************
 * 다운로드 파일
 **************************/
const getFileURLData = async function (userData = {}) {
  // userData = { userInfo, examData = [{ round, examCodes }] }
  return Promise.resolve(userData)
    .then((data) => {
      // { userInfo, examData, userFolder }
      const { userInfo } = data;
      const userFolderName = nameTemplate("_")(userInfo);
      const userFolder = findFolder(getRootFolder(), [userFolderName]);
      return { ...data, userFolder };
    })
    .then((data) => {
      // round -> folderName change
      const { userInfo, examData } = data;
      const folderAndCodes = examData.map((exams) => {
        const { round, examCodes } = exams;
        return {
          folderName: dateAtGenerate({ userInfo, round }),
          examCodes,
        };
      });
      return { ...data, folderAndCodes };
    })
    .then((data) => {
      // 각 examCode -> regExp로 바꿈
      const { folderAndCodes } = data;
      const folderAndCodeRegs = folderAndCodes.map((examData) => {
        const { folderName, examCodes } = examData;
        const fileCheckers = examCodes
          .map((code) => [
            makeRegExCheckerForExamCode(code),
            makeRegExCheckerForExamCode(code, "해설"),
          ])
          .flat();
        return { folderName, fileCheckers };
      });
      return { ...data, folderAndCodes: folderAndCodeRegs };
    })
    .then((data) => {
      // 각 regExp -> file로 바꿈
      const { userInfo, examData, folderAndCodes, userFolder } = data;
      const folderAndFiles = folderAndCodes.map((folderData) => {
        const { folderName, fileCheckers } = folderData;
        const examFolder = findFolder(userFolder, [folderName]);
        const files = examFolder.getFiles();
        const examFiles = [];
        while (files.hasNext()) {
          const file = files.next();
          if (fileCheckers.some((fileChecker) => fileChecker(file.getName()))) {
            examFiles.push({ fileName: file.getName(), fileData: file });
            console.log(file.getName());
          }
        }
        return { folderName, examFiles };
      });
      return { userInfo, examData, folderAndFiles };
    })
    .then(async (data) => {
      const { userInfo, folderAndFiles } = data;
      const filesURLData = folderAndFiles.map(({ examFiles }) =>
        examFiles.map(({ fileName, fileData }) => {
          fileData = fileDataToClient(fileData);
          return { fileName, fileData };
        })
      );
      return { userInfo, filesURLData };
    })
    .catch((err) => console.error(err));
};
// 테스트
const testFolder = async function () {
  //const rootFolder = getRootFolder()
  //console.log(rootFolder.getName(), rootFolder.getOwner())
  const userInfo = { userName: "이요셉", userCode: "80672" };
  const examData = [
    { round: 8, examCodes: ["39010", "34152"] },
    { round: 9, examCodes: ["39040", "39031"] },
  ];
  await getFileURLData({ userInfo, examData });
};
