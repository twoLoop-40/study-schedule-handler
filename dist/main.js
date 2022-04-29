// 시작 프로그램
function doGet () {
  const startHtml = getHtmlContent()
  return startHtml({ fileName: 'index'})
}

// test initializer
const testInitializer = function () {
  userInfo = { userName: '이재영', userCode: '81022' }
  initializeStudent(userInfo)
}
