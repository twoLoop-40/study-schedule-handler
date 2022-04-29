const sheets = {
  dbSheet: "DB form", // 스케줄 시트 폼
  scoreSheetForm: "score form", // 스코어 시트 폼
  seriesMapData: "시리즈세트", // 시리즈 데이터
};

const columunNumbers = {
  ACTIVITY_COL: 3,
  ROUND_COL: 2,
  EXAM_START: 4,
  EXAM_END: 13,
  LECTURER: 15,
  GENERATING_DATE: 1,
};

// 시트나 폴더의 아이디
const location = {
  focusRoot: "1wmofJHo6jLVqmn3KmDu1N1YE_DXSMJu9", // 슈퍼클리닉 포커스 루트 폴더
  sourceFolder: "11nGN85Bo3ZVcV6pDbSAQSzBUrlcq4KFn", // 슈퍼클리닉 진단 문제 폴더
  courseId: "450939166434", // 지성 슈퍼클리닉 courseId
  answerLink:
    "https://docs.google.com/forms/d/e/1FAIpQLSfQOHBApBKn4-HkEKYrrj3djgVAt0PfTl2bOe5E4dHYxHGw8Q/viewform", // 답안 설문 링크
  scoreSpreadsheet: "146iZVMnTPuSK4XA6gr7fozAMs_BIhMhDQ0UsbYEsj7k", // 점수 저장 스프레드 시트
  seriesMapSheet: "1RpKzx0EO2uZC6BHgJ202ExldYmNDj0mq209ktxYAXAk", // 시리즈 맵 시트
  scheduleSheet: "1pGXFRqjy26yuBocYl8Ryl2okhsbYac91msBsNOwsad4", // 개인 스케줄 시트 아이디
  classScheduleSheet: "1TrlMraLXD-5E-6kSRgmLibx7Yo-3L3gSFK-zIjn-1Lw", // 클래스 스케줄 모아 놓은 시트
  classHomeworkSheet: "1WJYHTak-xkhsTMmdoOv-RDVjEjazGWfbIyuHp5lMbgk", // 클래스 homework 시트
  classStudentsSheet: "1U8d3NAyAEMOeKJw0uiuaXqIt9xYMrd1ns0RGzS9HcsY", // 클래스 학생 모아 놓은 시트
};

const seriesMapData = function () {
  return SpreadsheetApp.openById(location.seriesMapSheet)
    .getSheetByName(sheets.seriesMapData)
    .getDataRange()
    .getValues();
};

const parseExamCode = function (examCode = "") {
  if (!examCode) {
    console.error("Code is empty");
    return;
  } else {
    examCode = examCode.toString();
  }
  const divideExamCode = function () {
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
    )(this.examCode);
    return { seriesId, setNo, trackNo };
  };
  const findRow = function () {
    const { seriesId } = this.divideExamCode(this.examCode);
    return this.seriesMapData
      .map((seriesRow) => seriesRow[1])
      .findIndex((id) => id == seriesId);
  };

  const getSeriesTitle = function () {
    return this.seriesMapData[this.findRow()][2];
  };
  const getSetName = function () {
    const { setNo } = this.divideExamCode();
    return this.seriesMapData[this.findRow()][parseInt(setNo) + 4];
  };
  const getTrackNumber = function () {
    const { trackNo } = this.divideExamCode();
    return trackNo;
  };

  const protoType = Object.assign(Object.create(null), {
    getSeriesTitle,
    getSetName,
    getTrackNumber,
    findRow,
    divideExamCode,
  });
  const result = Object.create(protoType);
  result.seriesMapData = seriesMapData();
  result.examCode = examCode;
  return result;
};
// 파서를 이용해서 파일이름이 시험코드에 맞는지를 확인하는 체커를 만드는 함수
const makeRegExCheckerForExamCode = function (examCode = "", examKind = "") {
  const trackType = (examCode) => {
    const codeDivide = (examCode = "", result = {}) => {
      if (typeof examCode !== "string")
        return codeDivide(examCode.toString(), result);
      if (result.seriesId && result.trackId && result.trackNo) return result;
      if (!result.trackNo) {
        result.trackNo = examCode.slice(-1);
        return codeDivide(examCode, result);
      }
      if (!result.trackId) {
        result.trackId = examCode.slice(-3, -1);
        return codeDivide(examCode, result);
      }
      if (!result.seriesId) {
        result.seriesId = examCode.slice(0, -3);
        return codeDivide(examCode, result);
      }
    };
    const MiddleLevelTest = [
      "05",
      "06",
      "54",
      "55",
      "56",
      "57",
      "58",
      "59",
      "60",
      "61",
      "62",
      "63",
      "64",
      "65",
      "66",
      "67",
    ];
    const isMiddleLevel = (seriesId) => {
      return MiddleLevelTest.findIndex((item) => item === seriesId) > -1;
    };
    const exam = codeDivide(examCode);
    if (exam.trackNo !== "0") {
      return "EXAM_STRING";
    }
    if (isMiddleLevel(exam.seriesId)) {
      return exam.trackId === "00" ? "EXAM_NUMBER" : "EXAM_STRING_LEVEL";
    }
    return "EXAM_NUMBER";
  };
  const addStringBack = (str) => (target) => {
    if (!str || str === "") return target;
    if (typeof target !== "string") {
      target = target.toString();
    }
    return target + str;
  };
  const parser = parseExamCode(examCode);
  const [seriesName, setName, trackNo] = [
    parser.getSeriesTitle(),
    parser.getSetName(),
    addStringBack("차")(parser.getTrackNumber()),
  ];
  //console.log(`시리즈: ${seriesName} 세트: ${setName} 트랙: ${trackNo}차`)
  const type = examKind === "해설" ? "해설" : "진단";
  if (trackType(examCode) === "EXAM_NUMBER") {
    return makeChecker([type, examCode.toString()]);
  } else if (trackType(examCode) === "EXAM_STRING") {
    return makeChecker([type, seriesName, setName, trackNo]);
  } else if (trackType(examCode) === "EXAM_STRING_LEVEL") {
    return makeChecker([type, seriesName, setName]);
  }
};

function makeChecker(checkList = []) {
  const addBackslash = (char) => (string) => {
    if (typeof string === "string") {
      return string.replaceAll(char, "\\" + char);
    }
    return string;
  };
  const addLeft = addBackslash("(");
  const addRight = addBackslash(")");
  let type, list;
  if (checkList.length > 1) {
    type = checkList[0];
    list = checkList.slice(1);
  } else {
    list = checkList;
  }
  const checkers = list
    .map((item) =>
      [addLeft, addRight].reduce((str, addChar) => addChar(str), item)
    )
    .map((item) => {
      if (typeof item === "string") return new RegExp(item);
      else return item;
    });
  return (target = "") => {
    const match = checkers.reduce(
      (prev, checker) => prev && checker.test(target),
      true
    );
    if (type === "해설") {
      return target.indexOf("해설") > -1 && match;
    } else {
      return !(target.indexOf("해설") > -1) && match;
    }
  };
}
const testchecker = function () {
  const checker = makeRegExCheckerForExamCode("56021", "해설");
  console.log(
    checker("(해설)(15개정) 마타와 기본 다지기 - 수학1 - 2.삼각함수 lv.1")
  );
};
