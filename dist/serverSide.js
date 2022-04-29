// 학생 초기화 함수
// 시트에 학생의 시작 시트, 드라이브에 폴더, 클래스룸에 시작 지점을 차례대로 만드는 함수
function initializeStudent(userInfo = {}) {
  const msgSheet = userSheet(userInfo);
  const msgFolder = userFolder(userInfo);
  const msgClassRoom = makeCourseWork(userInfo);
  // 성공 또는 실패 메세지 반환
  return { msgSheet, msgFolder, msgClassRoom };
}

// 학생들의 정보를 시트 탭에서 뽑는 함수
// 시트에서 시트이름을 모두 모음
const getSheetNames = function () {
  const ss = SpreadsheetApp.openById(location.scheduleSheet);
  return ss.getSheets().map((sheet) => sheet.getSheetName());
};
// 필요 없는 시트 이름을 빼고
const takeOut = function (nameForOut) {
  return (array) => array.filter((item) => nameForOut !== item);
};

// 시트 이름을 { userName, userCode } 정리해서 리턴
const makeNameObject = function (spliter) {
  return (nameString) => {
    const data = nameString.split(spliter);
    const result = {};
    result.userCode = data[0];
    result.userName = data[1];
    return result;
  };
};

// 학생들의 이름과 학생 코드를 하나씩 객체로 만들어서 반환하는 함수
// 위의 세 함수를 합쳐서 만듦
const getStudentBasicInfo = function () {
  const spliter = "-";
  return pipe(
    getSheetNames,
    takeOut("DB form"),
    (nameStrings) =>
      nameStrings.map((nameString) => makeNameObject(spliter)(nameString))
    //console.log
  )();
};

// 클래스 정보를 이용하여 클래스 현재 학생들을 리턴하는 함수
const getClassName = function (classInfo) {
  return Promise.resolve(classInfo)
    .then((classInfo) => {
      const { classId, className, lecturer } = classInfo;
      return [classId, className, lecturer].join("-");
    })
    .catch((err) => console.error(err));
};
const getClassStudents = function (classInfo) {
  return new Promise((resolve, reject) => {
    if (!classInfo || Object.keys(classInfo).length == 0)
      reject("클래스 정보 없음");
    resolve(classInfo);
  }).then((classInfo) => {
    const ss = SpreadsheetApp.openById(location.classStudentsSheet);
    return getClassName(classInfo)
      .then((classTabName) => {
        const sheet = ss.getSheetByName(classTabName);
        if (!sheet) throw Error("클래스가 만들어지지 않았습니다.");
        return sheet;
      })
      .then((sheet) => {
        const studentsArray = sheet.getDataRange().getValues().slice(1);
        const studentsInfo = studentsArray.map(([userCode, userName]) => {
          userCode = userCode.toString();
          return { userCode, userName };
        });
        return studentsInfo;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });
};
/*********************************************
 * 학생 스케줄에 대한 템플릿을 만들고 거기에 정보 넣기
 **********************************************/
// 시트 이름 만들기
const nameLinker = nameTemplate("-");
// 시트 찾아서 리턴
const getSheetFrom = function (sheetName = "") {
  const ss = SpreadsheetApp.openById(location.scheduleSheet);
  return ss.getSheetByName(sheetName);
};
// 시트에서 values 정보와 background 정보를 리턴하기
const getOriginalData = function (sheet) {
  const values = sheet.getDataRange().getValues().slice(1);
  const backgrounds = sheet.getDataRange().getBackgrounds().slice(1);
  return { values, backgrounds };
};
// 시트데이타에서 객체를 만드는 객체를 만드는 함수
const makeExtractor = function () {
  const getLecturer = function (scheduleArray = []) {
    this.lecturer = scheduleArray[columunNumbers.LECTURER - 1];
    return this;
  };
  const getRound = function (scheduleArray = []) {
    this.round = scheduleArray[1];
    return this;
  };
  const getGeneratingDate = function (scheduleArray = []) {
    this.generatingDate = [
      scheduleArray[0].getFullYear(),
      scheduleArray[0].getMonth() + 1,
      scheduleArray[0].getDate(),
    ].join("-");
    return this;
  };
  const getSchedule = function (scheduleArray = [], statusArray = []) {
    const start = 3,
      end = 13;
    const scheduleData = [];
    for (let i = start; i < end; i++) {
      scheduleData.push([
        scheduleArray[i],
        shiftFromColorToStatus(statusArray[i]),
      ]);
    }
    //console.log(scheduleData)
    this.schedule = scheduleData;
    return this;
  };
  const getActivity = function (scheduleArray = []) {
    this.activity = scheduleArray[2];
    return this;
  };
  const getLectureDate = function (scheduleArray = []) {
    const lectureDate = scheduleArray[13];
    //console.log(lectureDate)
    if (lectureDate) {
      this.lectureDate = [
        lectureDate.getFullYear(),
        lectureDate.getMonth() + 1,
        lectureDate.getDate(),
      ].join("-");
    }
    return this;
  };
  return Object.create(
    Object.assign(Object.create(null), {
      getLecturer,
      getRound,
      getGeneratingDate,
      getSchedule,
      getActivity,
      getLectureDate,
    })
  );
};
// values와 backgrounds를 이용하여 extractor로 정보를 뽑아서 새로운 객체를 만들어서 리턴
const getScheduleData = function ({ values, backgrounds } = {}) {
  const extractors = [];
  for (let i = 0; i < values.length; i++) {
    extractors[i] = makeExtractor();
  }
  const data = extractors
    .map((extractor, idx) => {
      extractor
        .getLecturer(values[idx])
        .getRound(values[idx])
        .getActivity(values[idx])
        .getGeneratingDate(values[idx])
        .getLectureDate(values[idx])
        .getSchedule(values[idx], backgrounds[idx]);
      return extractor;
    })
    .map((extracted) => Object.assign(Object.create(null), extracted));
  return data;
};
// 학생 스케줄 정보 정리해서 받기
const getStudentSchedule = function (
  //시트에서 userInfo에 맞는 학생의 데이타 받기
  userInfo = {
    userName: "이현지",
    userCode: "80671",
  }
) {
  return pipe(
    nameLinker,
    getSheetFrom,
    getOriginalData,
    getScheduleData
    //console.log
  )(userInfo);
};
/*****************************************
 * 서버사이드 매니저
 * 스케줄 매니저, 파일 매니저, 스코어 매니저
 *****************************************/
// 시트에서 사용할 스케줄 템플릿을 생성하는 객체
const makeScheduleTemplate = function () {
  // 날짜 생성
  const generateDateString = function () {
    const today = new Date();
    this.generatingDate = [
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    ].join("-");

    return this;
  };
  const examCodesToSchedule = function (examCodes = []) {
    const exams = examCodes.map((examCode) => [examCode, "생성"]);
    this.schedule = exams;
    return this;
  };
  const activityOn = function () {
    this.activity = "n";
    return this;
  };
  const extractData = function () {
    return { ...this };
  };
  const ProtoType = Object.assign(Object.create(null), {
    generateDateString,
    examCodesToSchedule,
    extractData,
    activityOn,
  });

  return Object.create(ProtoType); // scheduleTemplate 리턴
};

// 스프레드 시트 부르기
const spreadsheetOn = function (spreadsheetId) {
  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }
  return SpreadsheetApp.openById(location.scheduleSheet);
};
//ScheduleManagerServer
class ScheduleManagerServer {
  constructor(userInfo = {}) {
    this.userInfo = userInfo;
  }
  scheduleRowNumber(round) {
    const scheduleSheet = this.getScheduleSheet();
    const lastRow = scheduleSheet.getLastRow();
    const rowIndex = scheduleSheet
      .getRange(1, columunNumbers.ROUND_COL, lastRow, 1)
      .getValues()
      .flat()
      .findIndex((value) => value.toString() === round.toString());

    return rowIndex + 1;
  }
  getExamNumbersToCheck(round) {
    const row = this.scheduleRowNumber(round);
    const statusColors = this.getScheduleSheet()
      .getRange(
        row,
        columunNumbers.EXAM_START,
        1,
        columunNumbers.EXAM_END - columunNumbers.EXAM_START + 1
      )
      .getBackgrounds()
      .flat();
    return this.getScheduleSheet()
      .getRange(
        row,
        columunNumbers.EXAM_START,
        1,
        columunNumbers.EXAM_END - columunNumbers.EXAM_START + 1
      )
      .getValues()
      .flat()
      .filter((_, i) => {
        const status = shiftFromColorToStatus(statusColors[i]);
        return status === "포기" || status === "생성";
      });
  }

  changeActivity(round) {
    const scheduleSheet = this.getScheduleSheet();
    const lastRow = scheduleSheet.getLastRow();
    // 모든 activity를 n으로 고침
    const activityRanges = [];
    for (let r = 2; r <= lastRow; r++) {
      activityRanges.push(
        scheduleSheet.getRange(r, columunNumbers.ACTIVITY_COL, 1, 1)
      );
    }
    activityRanges.forEach((range) => range.setValue("n"));
    // 주어진 round만 y로 고침
    const row = this.scheduleRowNumber(round);
    scheduleSheet
      .getRange(row, columunNumbers.ACTIVITY_COL, 1, 1)
      .setValue("y");
    console.log("Activity Changed");
  }
  // examcode 에 대한 column number 받기
  columnNumberOfExamCodes(examInfo) {
    // examInfo = { round: string, examCodes: [examCode] }
    const { round, examCodes } = examInfo;
    const row = this.scheduleRowNumber(round);
    const scheduleSheet = this.getScheduleSheet();
    const lastCol = scheduleSheet.getLastColumn();
    return {
      row,
      examColumns: examCodes
        .map((examCode) =>
          scheduleSheet
            .getRange(row, 1, 1, lastCol)
            .getValues()
            .flat()
            .findIndex((value) => value == examCode)
        )
        .map((index) => index + 1), // indexNumber start from 0
    };
  }
  // 파일 상태 변화 하고 결과 홈페이지에 돌려주기
  changeFileStatus(locationInfo = {}) {
    // locationInfo = { row: number, examColumns: [columnOfExamCode]}
    const scheduleSheet = this.getScheduleSheet();
    return (status) => {
      const { row, examColumns } = locationInfo;
      // status가 string이면 한색깔만 칠하고 status가 여러 색깔이면 각각에 맞게 칠하기
      if (Array.isArray(status)) {
        examColumns
          .map((col) => `R${row}C${col}`)
          .map((R1C1) => scheduleSheet.getRange(R1C1))
          .forEach((range, idx) =>
            range.setBackground(shiftFromStatusToColor(status[idx]))
          );
      } else {
        scheduleSheet
          .getRangeList(examColumns.map((col) => `R${row}C${col}`))
          .setBackground(shiftFromStatusToColor(status)); // status에 맞게 바꾸기
        console.log("status to changed");
      }
    };
  }
  // lectureDate와 examCode로 기본적인 스케줄 만들기
  makeBasicSchedule({ lectureDate = "", examCodes = [], lecturer = "" } = {}) {
    const scheduleTemplate = makeScheduleTemplate();
    const takeZeroAway = function (dateStr = "") {
      return dateStr.replace(/(-)(0)/g, "-");
    };
    // lecture date 넣기
    !lectureDate
      ? (scheduleTemplate.lectureDate = "")
      : (scheduleTemplate.lectureDate = takeZeroAway(lectureDate));
    // lecturer 넣기
    !lecturer
      ? (scheduleTemplate.lecturer = "")
      : (scheduleTemplate.lecturer = lecturer);
    scheduleTemplate
      .generateDateString()
      .examCodesToSchedule(examCodes)
      .activityOn();

    scheduleTemplate.round = this.getLastRound() + 1;

    return scheduleTemplate.extractData();
  }
  // 스케줄 시트에 업데이트 하기
  updateUserScheduleSheet(userSchedule) {
    const padToRight = function (rightEnd, str = "") {
      return (array = []) => {
        const length = array.length;
        if (length >= rightEnd) return array;
        const leftPlaceNumber = rightEnd - length;
        const addOn = Array.from({ length: leftPlaceNumber }, () => str);
        return array.concat(addOn);
      };
    };
    const { generatingDate, activity, round, lectureDate, schedule, lecturer } =
      userSchedule;
    const padBlank = padToRight(10);

    const rowData = [
      generatingDate,
      round,
      activity,
      ...padBlank(schedule.map((examData) => examData[0])),
      lectureDate,
      lecturer,
    ];
    const lastRound = this.getLastRound();
    if (round > lastRound) {
      this.getScheduleSheet().appendRow(rowData);
      console.log("시트 업데이트 되었습니다.");
    } else {
      const columnLength = rowData.length;
      const row = Number(round) + 1;

      this.getScheduleSheet()
        .getRange(row, 1, 1, columnLength)
        .setValues([rowData]);
      console.log("시트 수정되었습니다.");
    }
  }

  // userInfo에 맞는 sheet 리턴
  getScheduleSheet() {
    return spreadsheetOn().getSheetByName(nameLinker(this.userInfo));
  }
  // 마지막 라운드
  getLastRound() {
    const scheduleData = this.getScheduleSheet()
      .getDataRange()
      .getValues()
      .slice(1); // 제목 부분 떼내기
    return scheduleData
      .map((schedule) => schedule[1])
      .reduce((max, number) => (max >= number ? max : number), 0); // round만 추출해서 그 중에 최대값뽑기
  }
}
// 신규 스케줄 등록하는 함수
const addNewSchedule = function (userInfo = {}, addedSchedule = {}) {
  const { userName, userCode } = userInfo;
  const { lectureDate, examCodes, lecturer } = addedSchedule;
  if (!examCodes || examCodes.length == 0) {
    console.log("시험코드가 없습니다.");
    return;
  }
  const sm = new ScheduleManagerServer({ userName, userCode });
  const schedule = sm.makeBasicSchedule({ lectureDate, examCodes, lecturer });
  // 스케줄을 업데이트 하기
  sm.updateUserScheduleSheet(schedule);
  // 스케줄 상태 표시 하기
  const round = sm.getLastRound();

  const changeToGenerated = pipe(
    sm.columnNumberOfExamCodes.bind(sm),
    sm.changeFileStatus.bind(sm)
  )({ round, examCodes });
  changeToGenerated("생성");
  console.log(schedule);
  // 새 폴더 만들기
  makeScheduleFolder({ userInfo, round });
  return schedule;
};
// 수정 스케줄 저장하기
const modifySchedules = function (
  userInfo = {},
  schedulesForModification = []
) {
  const sm = new ScheduleManagerServer(userInfo);
  try {
    schedulesForModification.forEach((changedSchedule) => {
      sm.updateUserScheduleSheet(changedSchedule);
      const examCodes = [],
        status = [];
      changedSchedule.schedule.forEach((track, idx) => {
        examCodes[idx] = track[0];
        status[idx] = track[1];
      });
      const round = changedSchedule.round;
      // 시험지 상태 색깔 바꿔주는 코드
      pipe(
        sm.columnNumberOfExamCodes.bind(sm),
        sm.changeFileStatus.bind(sm)
      )({ round, examCodes })(status);
    });
    const roundsString = schedulesForModification
      .map((changedSchedule) => changedSchedule.round)
      .map((round) => `${round}회`)
      .join(" ");
    return `${roundsString} 스케줄이 수정되었습니다.`;
  } catch (err) {
    console.error(err);
    return err;
  }
};

const activate = function (userInfo, round) {
  const scheduleManager = new ScheduleManagerServer(userInfo);
  scheduleManager.changeActivity(round);
  return { userInfo, round };
};
// 파일 매니저 서버
class FileManagerServer {
  constructor(userInfo = {}) {
    this.userInfo = userInfo;
    this.scheduleManager = new ScheduleManagerServer(userInfo);
  }
  // 해당 폴더 찾거나 만들어서 리턴
  getFolderOf(round) {
    //console.log(this.userInfo)
    const userFolderName = nameTemplate("_")(this.userInfo);
    const dateFolderName = getStudentSchedule(this.userInfo).filter(
      (schedule) => schedule.round == round
    )[0].generatingDate;

    const userFolders = DriveApp.getFolderById(location.focusRoot).getFolders();
    let userFolder;
    while (userFolders.hasNext()) {
      const folder = userFolders.next();
      if (folder.getName() == userFolderName) {
        userFolder = folder;
      }
    }

    let examfolder;
    if (userFolder) {
      const examFolders = userFolder.getFolders();
      while (examFolders.hasNext()) {
        const folder = examFolders.next();
        if (folder.getName() == dateFolderName) {
          examfolder = folder;
        }
      }
    } else {
      console.error(`folder ${userFolderName} hasn't been made`);
      return;
    }
    if (examfolder) {
      console.log(`Folder ${dateFolderName} exist.`);
      return examfolder;
    } else {
      console.log(
        `Folder ${dateFolderName} doesn't exist. So we create new one`
      );
      return userFolder.createFolder(dateFolderName);
    }
  }
  // 파일 데이터를 받아서 파일 블롭을 만듦
  makeFileBlob(filesInformation) {
    const { fileData, fileName, fileType } = filesInformation;
    const transFormed = Utilities.base64Decode(fileData);
    // return blob
    return Utilities.newBlob(transFormed, fileType, fileName);
  }
}
// 업로드한 시험지 번호 업데이트
// FileManager 이용하여 파일을 만들어서 원하는 장소에 집어 넣고 시트에 상태 표시하기
const filesUpload = function (
  { userInfo, filesInformation, round },
  count = 2
) {
  const fileManager = new FileManagerServer(userInfo);
  const folder = fileManager.getFolderOf(round);
  const failure = [];
  filesInformation
    .map((fileInformation) => fileManager.makeFileBlob(fileInformation))
    .forEach((blob, i) => {
      try {
        folder.createFile(blob);
      } catch (err) {
        console.error(err);
        failure.push(filesInformation[i]);
      }
    });
  //console.log(`faiure count: ${failure.length}`)
  if (failure.length === 0 || count === 0) {
    // 시트 기록 작업하고 client에 databack
    const sm = fileManager.scheduleManager; // schedule manager
    const allExamCodes = sm.getExamNumbersToCheck(round); // 모든 시험숫자
    const checkers = allExamCodes.map(
      (
        examCode // 체커 만들기 '시험'과 그냥 두개를 만듦
      ) => [
        makeRegExCheckerForExamCode(examCode.toString(), "진단"),
        makeRegExCheckerForExamCode(examCode.toString(), "해설"),
      ]
    );

    let examCodes = checkers.map((checkerPair, i) => {
      // 각 시험코드에 대하여 업데이트 할 수 있는게 있는 지 체크
      let count = 0;
      checkerPair.forEach((checker) => {
        const files = folder.getFiles();
        while (files.hasNext()) {
          const file = files.next();
          const fileName = file.getName();
          if (checker(fileName)) {
            count++;
            break;
          }
        }
      });

      if (count >= 2) return allExamCodes[i];
    });

    examCodes = examCodes.filter((value) => value);
    // console.log(`전체 코드: ${allExamCodes}`, `남은 코드: ${examCodes}`)
    if (examCodes.length == 0) {
      const message =
        "해설과 문제지 중 하나가 업로드 되지 않아 상태가 변경되지 않습니다.";
      console.log(message);
      return { messaage };
    }

    const changeToWait = pipe(
      sm.columnNumberOfExamCodes.bind(sm), //색깔을 바꿔줌
      sm.changeFileStatus.bind(sm)
    )({ round, examCodes });
    changeToWait("대기");
    const message = `${examCodes.join(" ")}에 대한 업로드가 끝났습니다`;
    return { message };
  } else {
    // 실패한 것들 모아서 다시 작업
    console.log(count);
    filesUpload({ userInfo, failure, round }, count - 1);
  }
};
// 진단 문제 업로드 후에 시트 상태를 대기로 바꿔주고 학생 정보를 돌려주는 함수
const changeSheetStatus = function (userData) {
  // userData = { userInfo, round, examCodes }
  pipe(
    (userData) => {
      const { userInfo } = userData;
      const sms = new ScheduleManagerServer(userInfo);
      return { ...userData, sms };
    },
    (userData) => {
      const { sms, round, examCodes } = userData;
      const changeToWait = pipe(
        sms.columnNumberOfExamCodes.bind(sms),
        sms.changeFileStatus.bind(sms)
      )({ round, examCodes });
      return { ...userData, changeToWait };
    },
    (userData) => {
      const { changeToWait, examCodes } = userData;
      if (changeToWait) {
        console.log(examCodes);
        changeToWait("대기");
      }
    }
  )(userData);

  return userData;
};
// Class Schedule sheet 에서 클래스 목록 만드는 함수
const getListOfClass = function () {
  const ss = SpreadsheetApp.openById(location.classScheduleSheet);
  return Promise.resolve(ss)
    .then((ss) => {
      const sheetNames = ss
        .getSheets()
        .slice(1)
        .map((sheet) => sheet.getSheetName());
      return { sheetNames };
    })
    .then((data) => {
      const { sheetNames } = data;
      if (!sheetNames || sheetNames.length == 0) {
        throw Error("No Class");
      }
      const classInfo = sheetNames
        .map((sheetName) => sheetName.split("-"))
        .map(([classId, className, lecturer]) => ({
          classId,
          className,
          lecturer,
        }));
      return classInfo;
    })
    .catch((err) => {
      console.error(err);
      return [];
    });
};
const addNewClassOnSheets = function (classInfo = {}) {
  return Promise.all(
    [
      location.classScheduleSheet,
      location.classHomeworkSheet,
      location.classStudentsSheet,
    ].map(async (ssId) => await SpreadsheetApp.openById(ssId))
  )
    .then((ssArrary) =>
      Promise.all(
        ssArrary.map(async (ss) => {
          const sheet = await ss.getSheets()[0];
          return sheet.copyTo(ss);
        })
      )
    )
    .then((copiedSheets) =>
      Promise.resolve(classInfo)
        .then((classInfo) => {
          const { classId, className, lecturer } = classInfo;
          console.log(classInfo);
          return [classId, className, lecturer].join("-");
        })
        .then((sheetName) => {
          // console.log(sheetName)
          return Promise.all(
            copiedSheets.map(async (sheet) => await sheet.setName(sheetName))
          );
        })
    )
    .then(() => "신규 클래스를 시트에 로드 하였습니다.");
};
const makeClassSheetName = function (classInfo) {
  const { classId, className, lecturer } = classInfo;
  return [classId, className, lecturer].join("-");
};
const addStudentNameOnSheet = function ({ classInfo, userInfo }) {
  return Promise.resolve({ classInfo, userInfo })
    .then((data) => {
      const { classInfo, userInfo } = data;
      console.log(classInfo);
      const sheetName = makeClassSheetName(classInfo);
      const ss = SpreadsheetApp.openById(location.classStudentsSheet);
      const sheet = ss.getSheetByName(sheetName);
      return { userInfo, sheet };
    })
    .then((data) => {
      const { userInfo, sheet } = data;
      const studentCodeList = sheet
        .getDataRange()
        .getValues()
        .slice(1)
        .map((userInfo) => userInfo[0]);
      const { userCode } = userInfo;
      if (
        studentCodeList.some(
          (studentCode) => studentCode.toString() == userCode
        )
      ) {
        throw Error("이미 등록되어 있는 학생입니다.");
      }
      return data;
    })
    .then((data) => {
      const { userInfo, sheet } = data;
      const { userCode, userName } = userInfo;
      sheet.appendRow([userCode, userName]);
      return `${userCode}-${userName}`;
    })
    .catch((err) => {
      console.error(err);
      return "Error: 이미 등록되어 있는 학생입니다.";
    });
};

const makeClassScheduleJson = function (classInfo) {
  return Promise.resolve(makeClassSheetName(classInfo))
    .then((classSheetName) => {
      const sheet = SpreadsheetApp.openById(
        location.classScheduleSheet
      ).getSheetByName(classSheetName);
      if (!sheet) throw Error("Empty sheet");
      return { classInfo, sheet };
    })
    .then((data) => {
      const { classInfo, sheet } = data;
      const classScheduleDataArray = sheet.getDataRange().getValues().slice(1);
      if (!classScheduleDataArray) throw Error("클래스 스케줄 정보 없음");
      const classScheduleData = classScheduleDataArray.map((scheduleData) => {
        const generatingDate = scheduleData[0],
          classRound = scheduleData[1].toString(),
          lectureDate = scheduleData[10];
        const examCodes = scheduleData.slice(2, 10);
        return { generatingDate, classRound, lectureDate, examCodes };
      });
      return { classInfo, classScheduleData };
    })
    .then((data) => {
      let { classScheduleData } = data;
      classScheduleData = classScheduleData.map((classData) => {
        const { generatingDate, lectureDate } = classData;
        if (generatingDate) {
          classData.generatingDate = dateToStr(generatingDate).join("-");
        }
        if (lectureDate) {
          classData.lectureDate = dateToStr(lectureDate).join("-");
        }
      });
      return data;
    })
    .then((data) => {
      const { classInfo } = data;
      const ss = SpreadsheetApp.openById(location.classHomeworkSheet);
      const sheet = ss.getSheetByName(makeClassSheetName(classInfo));
      let completeStudents = sheet.getDataRange().getValues().slice(1);
      completeStudents = completeStudents.map(
        ([classRound, examCode, totalNumber, ...students]) => {
          const studentNumber = students
            .filter((student) => student)
            .length.toString();
          return { classRound, examCode, studentNumber };
        }
      );
      return { ...data, completeStudents };
    })
    .then((data) => {
      const { classScheduleData, completeStudents } = data;
      const classScheduleDataComplete = classScheduleData.map((classData) => {
        let { classRound: round, examCodes } = classData;
        // examCode -> { examCode:string, studentNumber: number }
        const studentNumberOnExamCode = function ({
          examCodes = [],
          result = [],
        }) {
          if (examCodes.length == 0) {
            return Promise.resolve(result);
          }
          const examCode = examCodes[0];
          return Promise.resolve(examCode)
            .then(
              (code) =>
                completeStudents.filter((examData) => {
                  const { classRound, examCode } = examData;
                  return classRound == round && code == examCode;
                })[0]
            )
            .then((studentNumberData) => {
              if (studentNumberData) {
                const { examCode, studentNumber } = studentNumberData;
                result.push({ examCode, studentNumber });
                return studentNumberOnExamCode({
                  examCodes: examCodes.slice(1),
                  result,
                });
              } else {
                return studentNumberOnExamCode({
                  examCodes: examCodes.slice(1),
                  result,
                });
              }
            });
        };
        return studentNumberOnExamCode({ examCodes }).then((examCodes) => {
          //console.log({ ...classData, examCodes })
          return { ...classData, examCodes };
        });
      });
      return Promise.all(classScheduleDataComplete);
    })
    .catch((err) => console.error(err));
};

const testListOfClass = async function () {
  // getListOfClass().then(data => console.log(data))
  classInfo = {
    classId: "1",
    className: "2022_지성_재종_미적분_마스터",
    lecturer: "이준호",
  };
  await makeClassScheduleJson(classInfo).then((classScheduleData) =>
    classScheduleData.forEach((classData) => console.log(classData))
  );
};
