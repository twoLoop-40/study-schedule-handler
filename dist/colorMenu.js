/*
 * 메뉴 만들기
 * 메뉴 이름: 상태표시
 * 메뉴의 종류: [포기, 대기, 배부, 제출, 성적표 발송]
 * 색깔 대기: #46bdc6, 배부: #00ff00, 포기: #fbbc04, 제출: #6d9eeb, 성적표 발송: #f4cccc
 */

const dataForMenu = [
  ["생성", "#d9d9d9"],
  ["대기", "#46bdc6"],
  ["배부", "#00ff00"],
  ["제출", "#6d9eeb"],
  ["발송", "#f4cccc"],
  ["포기", "#fbbc04"],
  ["", "#ffffff"],
];
// 색깔을 상태로 상태를 색깔로 바꾸는 함수
const shiftFromColorToStatus = function (color = "") {
  const filtered = dataForMenu
    .filter((colorInfo) => colorInfo[1] === color)
    .flat();
  // console.log(filtered[0])
  if (filtered) return filtered[0];
  else return "";
};
const shiftFromStatusToColor = function (status = "") {
  const filtered = dataForMenu
    .filter((statusInfo) => statusInfo[0] === status)
    .flat();
  // console.log(filtered[1]) 테스트
  if (filtered) return filtered[1];
  else return "";
};
// 키를 이용해서 메뉴에 해당하는 함수를 만듦

function makeActionForMenu([actionName = "", color = ""] = []) {
  SpreadsheetApp.getActiveRangeList().setBackground(color);
}

// 각 메뉴 함수를 만듦
const generate = () => makeActionForMenu(dataForMenu[0]);
const wait = () => makeActionForMenu(dataForMenu[1]);
const handOut = () => makeActionForMenu(dataForMenu[2]);
const submit = () => makeActionForMenu(dataForMenu[3]);
const sendGrade = () => makeActionForMenu(dataForMenu[4]);
const throwAway = () => makeActionForMenu(dataForMenu[5]);

// 함수를 순서대로 배열하기
const actionsForMenu = [
  "generate",
  "wait",
  "handOut",
  "submit",
  "sendGrade",
  "throwAway",
];

// 색칠하는 메뉴 만드는 함수
const loadColorMenu = function () {
  const menu = SpreadsheetApp.getUi().createMenu("Status");
  for (const [key, action] of actionsForMenu.entries()) {
    menu.addItem(dataForMenu[key][0], action);
  }
  menu.addToUi();
};
