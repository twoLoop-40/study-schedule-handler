//탭 네임 만들기
const makeSheetName = nameTemplate("-");

// 사용자 시트가 있는지 확인하기
const checkSheet = function (userInfo = {}) {
  const ss = SpreadsheetApp.openById(location.scheduleSheet);
  if (
    ss
      .getSheets()
      .map((sheet) => sheet.getSheetName())
      .some((sheetName) => sheetName === makeSheetName(userInfo))
  ) {
    return null;
  } else {
    console.log(makeSheetName(userInfo));
    return userInfo;
  }
};

// 사용자 이름과 사용자 코드 -> 새로운 사용자 시트 만들기
const makeUserSheet = function (userInfo = {}) {
  if (!userInfo) {
    console.log("No information!");
    return "이미 시트가 만들어져 있습니다.";
  }
  const ss = SpreadsheetApp.openById(location.scheduleSheet);
  const dbSheet = ss.getSheetByName(sheets.dbSheet);

  ss.insertSheet(makeSheetName(userInfo), 1, { template: dbSheet });
  return `${userInfo.userName}을 위한 시트를 생성했습니다.`;
};
// 두 함수 합치기
const userSheet = pipe(checkSheet, makeUserSheet, (msg) => {
  if (msg) return msg;
});

// 사용자 이름과 사용자 코드 받아서 사용자 시트 지우는 함수
const deleteUserSheet = function ({ userName = "", userCode = "" } = {}) {
  const ss = SpreadsheetApp.openById(location.scheduleSheet);
  const target = ss.getSheetByName(makeSheetName({ userName, userCode }));
  ss.deleteSheet(target);
};

const testSheet = function () {
  const userInfo = { userName: "박성은", userCode: "81013" };

  //makeUserSheet(userInfo)
  //deleteUserSheet(userInfo)
  userSheet(userInfo);
};
