// const U = {
//   // 함수 연결하기
//   pipe(...fns) {
//     return (arg) => fns.reduce((acc, f) => f(acc), arg);
//   },
//   // 파일이나 탭의 이름을 만드는 함수
//   nameTemplate(sep = "") {
//     return ({ userName = "", userCode = "" } = {}) =>
//       `${userCode}${sep}${userName}`;
//   },
// };

function pipe<T>(...fns: Function[]) {
  return (arg: T) => fns.reduce((acc, f) => f(acc), arg);
}

/**
 * @type {(sep: string) => (userInfo: {userName: string, userCode: string}) => string }
 */

function nameTemplate(sep: string) {
  return ({ userName, userCode }: {userName: string, userCode: string }) => `${userCode}${sep}${userName}`;
}
